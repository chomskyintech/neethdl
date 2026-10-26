#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(path, import.meta.url), 'utf8')
const problems = JSON.parse(await read('../src/data/pythonProblems.json'))
const [catalogGenerator, buildScript, ide, runner, worker, editor, topics, packageJson] = await Promise.all([
  read('../scripts/generate-runtime-catalogs.mjs'),
  read('../scripts/build-all.mjs'),
  read('../src/ProblemIDE.jsx'),
  read('../src/pythonRunner.js'),
  read('../src/pythonWorker.js'),
  read('../src/MonacoHDLEditor.jsx'),
  read('../src/data/problemTopics.js'),
  read('../package.json').then(JSON.parse)
])

assert.equal(problems.length, 5, 'the initial Python track should contain five exercises')
assert.equal(new Set(problems.map(problem => problem.id)).size, problems.length, 'Python problem IDs must be unique')

for (const problem of problems) {
  assert.equal(problem.category, 'Python Scripting', `${problem.id} should appear in the Python Scripting category`)
  assert.deepEqual(problem.languages, ['Python'], `${problem.id} should offer only Python`)
  assert.equal(problem.evaluation?.type, 'python', `${problem.id} should use the Python runner`)
  assert.ok(problem.starterCode.includes('def '), `${problem.id} should start with a function scaffold`)
  assert.ok(Array.isArray(problem.testCases) && problem.testCases.length >= 3, `${problem.id} should have multiple regression cases`)
  for (const test of problem.testCases) {
    assert.ok(test.name && typeof test.code === 'string' && test.code.includes('assert '), `${problem.id} has an invalid test case`)
  }
}

assert.match(catalogGenerator, /pythonProblems=readJson\('src\/data\/pythonProblems\.json'\)/, 'runtime catalog generator must load Python exercises')
assert.match(catalogGenerator, /\.\.\.pythonProblems/, 'runtime catalog generator must include Python exercises')
assert.match(buildScript, /pythonProblems=JSON\.parse/, 'production build must load Python exercises')
assert.match(buildScript, /\.\.\.pythonProblems/, 'production build must include Python exercises')
assert.match(topics, /'Python Scripting'/, 'Python Scripting must be a visible problem topic')
assert.match(ide, /runPython\(problem, code\)/, 'the problem IDE must route Python submissions to the Python runner')
assert.match(ide, /editorLanguage === 'Python' \? 'py'/, 'Python problems must use the .py editor tab')
assert.match(editor, /Python: 'python'/, 'Monaco must select Python syntax highlighting')
assert.match(runner, /PYTHON_TIMEOUT_MS = 20000/, 'Python execution must have a time limit')
assert.match(worker, /pyodide\.mjs/, 'the browser worker must load Pyodide')
assert.equal(packageJson.scripts['test:python-problems'], 'node tests/python-problem-regression.mjs', 'the Python regression test must be available through npm')

console.log(`Python problem regression passed: validated ${problems.length} exercises, their test cases, catalog inclusion, editor integration, and timed Pyodide execution.`)
