#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { guidedProjectProblems } from '../src/data/guidedProjects.js'
import { getBrowserSimulatorBench } from '../src/browserSimulator.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const STRUCTURAL_ONLY_TOPICS = new Set([
  'SystemVerilog',
  'Testbenches',
  'Interfaces',
  'SVA',
  'Constrained Random',
  'Functional Coverage',
  'UVM',
])

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), 'utf8'))
}

async function loadVhdlBenches() {
  const source = await readFile(join(root, 'server/ghdl-proxy.js'), 'utf8')
  const start = source.indexOf('const vhdlBenches=')
  const end = source.indexOf('\nconst allowed=', start)
  if (start < 0 || end < 0) throw new Error('Could not locate vhdlBenches in server/ghdl-proxy.js')
  const literal = source.slice(start + 'const vhdlBenches='.length, end).trim()
  return Function(`"use strict"; return (${literal});`)()
}

const [base, accelerators, expansion, vhdlBenches] = await Promise.all([
  readJson('src/data/problems.json'),
  readJson('src/data/acceleratorProblems.json'),
  readJson('src/data/expansionProblems.json'),
  loadVhdlBenches(),
])

const standaloneCatalog = [
  ...base,
  ...accelerators,
  ...expansion,
].filter(problem => problem.evaluation?.type !== 'answer')

const projectCatalog = guidedProjectProblems.filter(problem => problem.evaluation?.type !== 'answer')

const failures = []
const structuralExceptions = []
const projectPatternExceptions = []
let simulationProblems = 0

for (const problem of standaloneCatalog) {
  const evaluationType = problem.evaluation?.type || 'simulation'
  const topic = problem.topic || problem.category || ''
  const languages = Array.isArray(problem.languages) ? problem.languages : []

  if (evaluationType === 'pattern') {
    if (!STRUCTURAL_ONLY_TOPICS.has(topic)) {
      failures.push(
        `${problem.id}: implementation problem uses pattern-only grading instead of an executable testbench`
      )
    } else {
      structuralExceptions.push(problem.id)
    }
    continue
  }

  if (evaluationType !== 'simulation') {
    failures.push(`${problem.id}: unsupported evaluation type "${evaluationType}"`)
    continue
  }

  simulationProblems++

  const needsBrowserBench = languages.some(language => language === 'Verilog' || language === 'SystemVerilog')
  if (needsBrowserBench) {
    const bench = getBrowserSimulatorBench(problem.id)
    if (!bench) {
      failures.push(`${problem.id}: missing Verilog/SystemVerilog testbench`)
    } else if (!bench.includes('HDLFORGE_PASS')) {
      failures.push(`${problem.id}: browser testbench is not self-checking (missing HDLFORGE_PASS)`)
    }
  }

  if (languages.includes('VHDL')) {
    const bench = vhdlBenches[problem.id]
    if (!bench) {
      failures.push(`${problem.id}: missing VHDL testbench`)
    } else if (!bench.includes('HDLFORGE_PASS')) {
      failures.push(`${problem.id}: VHDL testbench is not self-checking (missing HDLFORGE_PASS)`)
    }
  }

  if (!languages.some(language => ['Verilog', 'SystemVerilog', 'VHDL'].includes(language))) {
    failures.push(`${problem.id}: simulation problem has no supported HDL language`)
  }
}

for (const problem of projectCatalog) {
  const evaluationType = problem.evaluation?.type || 'simulation'
  if (evaluationType === 'pattern') {
    const checks = Array.isArray(problem.checks) ? problem.checks : []
    if (!checks.length) failures.push(`${problem.id}: guided project pattern evaluator has no checks`)
    else projectPatternExceptions.push(problem.id)
    continue
  }

  if (evaluationType !== 'simulation') {
    failures.push(`${problem.id}: unsupported guided-project evaluation type "${evaluationType}"`)
    continue
  }

  simulationProblems++
  const languages = Array.isArray(problem.languages) ? problem.languages : []
  if (languages.some(language => language === 'Verilog' || language === 'SystemVerilog')) {
    const bench = getBrowserSimulatorBench(problem.id)
    if (!bench) failures.push(`${problem.id}: guided project simulation is missing its production testbench`)
    else if (!bench.includes('HDLFORGE_PASS')) failures.push(`${problem.id}: guided project bench is not self-checking`)
  }
}

if (failures.length) {
  console.error('Testbench coverage failures:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(
  `Testbench coverage passed: ${simulationProblems} simulation-graded problems have production testbenches. ` +
  `${structuralExceptions.length} standalone verification-language exercises and ` +
  `${projectPatternExceptions.length} guided-project steps remain explicitly structural/pattern-graded.`
)
