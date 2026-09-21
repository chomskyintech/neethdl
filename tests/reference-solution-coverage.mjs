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
    const inline = language === 'SystemVerilog' ? problem.solution : null
    if (!(typeof central === 'string' && central.trim()) &&
        !(typeof inline === 'string' && inline.trim())) {
      failures.push(`${problem.id} / ${language}`)
    }
  }
}

if (failures.length) {
  console.error('Missing reference solutions:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(
  `Reference solution coverage passed: ${catalog.length} active problems and ${pairs} advertised language variants are covered.`
)
