#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/ProblemIDE.jsx', import.meta.url), 'utf8')

// Verilog and SystemVerilog both use module/endmodule, so source-text
// heuristics must not silently override the language selected by the user.
assert.doesNotMatch(
  source,
  /detectStrongSourceLanguage/,
  'the IDE must not use ambiguous source-text detection to switch HDL languages'
)

const updateMatch = source.match(/const update = value => \{([\s\S]*?)\n  \}/)
assert.ok(updateMatch, 'could not find the editor update handler')
assert.doesNotMatch(
  updateMatch[1],
  /setEditorLanguage\s*\(/,
  'typing or pasting code must not change the selected language'
)

const selectorMatch = source.match(/<select value=\{editorLanguage\} onChange=\{e => changeLanguage\(e\.target\.value\)\}/)
assert.ok(
  selectorMatch,
  'the language selector must reflect the selected language and change only on explicit user selection'
)

const changeMatch = source.match(/const changeLanguage = language => \{([\s\S]*?)\n  \}/)
assert.ok(changeMatch, 'could not find the explicit language-change handler')
assert.match(
  changeMatch[1],
  /setEditorLanguage\(language\)/,
  'explicitly selecting a language must still update the editor language'
)

console.log('Editor language stability regression passed: typing code keeps the selected HDL language; manual selection remains supported.')
