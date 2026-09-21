#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import solutions from '../src/data/solutions.js'
import { guidedProjectProblems } from '../src/data/guidedProjects.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), 'utf8'))
}

const [base, accelerators, expansion] = await Promise.all([
  readJson('src/data/problems.json'),
  readJson('src/data/acceleratorProblems.json'),
  readJson('src/data/expansionProblems.json'),
])

const catalog = [
  ...base.filter(problem => problem.evaluation?.type !== 'answer'),
  ...accelerators,
  ...expansion,
  ...guidedProjectProblems,
]

const failures = []
let pairs = 0

for (const problem of catalog) {
  for (const language of problem.languages || []) {
    pairs++
    const central = solutions[problem.id]?.[language]
    const inline = (problem.languages?.length === 1 || language === 'SystemVerilog') ? problem.solution : null
    const reference =
      typeof central === 'string' && central.trim() ? central :
      typeof inline === 'string' && inline.trim() ? inline :
      null

    if (!reference) {
      failures.push(`${problem.id} / ${language}: missing reference solution`)
      continue
    }

    if (problem.evaluation?.type === 'pattern') {
      const checks = Array.isArray(problem.checks) ? problem.checks : []
      if (!checks.length) {
        failures.push(`${problem.id} / ${language}: no guided checks`)
        continue
      }
      for (const [index, check] of checks.entries()) {
        const label = Array.isArray(check) ? check[0] : (check.label || `Check ${index + 1}`)
        const raw = Array.isArray(check) ? check[1] : check.pattern
        const flags = Array.isArray(check) ? 'i' : (check.flags || 'i')
        try {
          const expression = raw instanceof RegExp ? raw : new RegExp(raw, flags)
          if (!expression.test(reference)) failures.push(`${problem.id} / ${language}: reference fails ${label}`)
        } catch (error) {
          failures.push(`${problem.id} / ${language}: invalid check ${label}: ${error.message}`)
        }
      }
    }
  }
}

if (failures.length) {
  console.error('Reference solution coverage failures:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(
  `Reference solution coverage passed: ${catalog.length} active problems and ${pairs} advertised language variants are covered.`
)
