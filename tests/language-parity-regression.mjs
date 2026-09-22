#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import solutions from '../src/data/solutions.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const REQUIRED_LANGUAGES = ['Verilog', 'SystemVerilog', 'VHDL']

// These exercises intentionally teach SystemVerilog/verification constructs that
// do not have direct Verilog/VHDL equivalents.
const STRUCTURAL_CATEGORIES = new Set([
  'SystemVerilog',
  'SVA',
  'UVM',
  'Verification',
])

const STRUCTURAL_TOPICS = new Set([
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

const [base, accelerators, expansion] = await Promise.all([
  readJson('src/data/problems.json'),
  readJson('src/data/acceleratorProblems.json'),
  readJson('src/data/expansionProblems.json'),
])

const catalog = [
  ...base,
  ...accelerators,
  ...expansion,
].filter(problem => {
  if (problem.evaluation?.type === 'answer') return false
  if (problem.evaluation?.type !== 'pattern') return true
  return !STRUCTURAL_CATEGORIES.has(problem.category) &&
    !STRUCTURAL_TOPICS.has(problem.topic)
})

const failures = []
let checkedSolutions = 0

for (const problem of catalog) {
  const advertised = new Set(problem.languages || [])

  for (const language of REQUIRED_LANGUAGES) {
    if (!advertised.has(language)) {
      failures.push(`${problem.id}: missing advertised language ${language}`)
      continue
    }

    const central = solutions[problem.id]?.[language]
    const inline =
      language === 'SystemVerilog' &&
      typeof problem.solution === 'string' &&
      problem.solution.trim()
        ? problem.solution
        : null

    const reference =
      typeof central === 'string' && central.trim()
        ? central
        : inline

    if (!reference) {
      failures.push(`${problem.id} / ${language}: missing reference solution`)
      continue
    }

    checkedSolutions++
  }
}

if (failures.length) {
  console.error(
    `Three-language parity failed for ${failures.length} requirement(s) across ${catalog.length} portable HDL problems:`
  )
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(
  `Three-language parity passed: ${catalog.length} portable HDL problems advertise Verilog, SystemVerilog, and VHDL, with ${checkedSolutions} reference solutions present.`
)
