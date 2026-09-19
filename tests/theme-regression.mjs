#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const palette = await readFile('src/neetcode-palette.css','utf8')
const main = await readFile('src/main.jsx','utf8')
const monaco = await readFile('src/MonacoHDLEditor.jsx','utf8')
const launcher = await readFile('src/waveform-editor-launcher.js','utf8')

const expected = {
  '--nc-bg':'#1f1f20',
  '--nc-editor':'#262527',
  '--nc-surface':'#29282a',
  '--nc-surface-2':'#2e2d30',
  '--nc-surface-3':'#302f31',
  '--nc-border':'#39393b',
  '--nc-border-soft':'#302f32',
  '--nc-text':'#d4d4d4',
  '--nc-text-strong':'#ececec',
  '--nc-active':'#ececec',
  '--nc-muted':'#848484',
  '--nc-dim':'#66666b',
  '--nc-blue':'#549cd4',
  '--nc-teal':'#4ab8a5',
  '--nc-yellow':'#cdc98f',
  '--nc-orange':'#c58c74',
  '--nc-comment':'#628a55',
}

for (const [name,value] of Object.entries(expected)) {
  assert.ok(palette.toLowerCase().includes((name+':'+value).toLowerCase()), name+' changed from approved NeetCode palette')
}

const paletteImport = main.indexOf("import './neetcode-palette.css'")
const topicImport = main.indexOf("import './topic-browser.css'")
const sideEffectImport = main.indexOf("import './lockedEditor.js'")
assert.ok(paletteImport > topicImport, 'NeetCode palette must load after legacy global CSS')
assert.ok(paletteImport < sideEffectImport, 'NeetCode palette must remain in stylesheet import block')

const banned = [
  '#615fff','#4f4bcf','#7772ff','#7b76ff','#8884ff','#8e8aff','#9b97ff',
  '#0d0d0d','#569cd6','#4ec9b0','#4cc8b0','#dcdca8','#ce9178','#6a9955','#c586c0','#ffd700','#da70d6','#179fff'
]
for (const colour of banned) {
  for (const [name,source] of [['palette',palette],['Monaco',monaco],['waveform launcher',launcher]]) {
    assert.ok(!source.toLowerCase().includes(colour), name+' still contains legacy/vivid colour '+colour)
  }
}

const monacoChecks = [
  ['keyword.control','549CD4'],
  ['keyword.declaration','4AB8A5'],
  ['type.identifier','4AB8A5'],
  ['entity.name.module','CDC98F'],
  ['comment','628A55'],
  ['string','C58C74'],
  ['editor.background',"'#262527'"],
  ['editor.foreground',"'#D4D4D4'"],
]
for (const [token,colour] of monacoChecks) {
  assert.ok(monaco.includes(token) && monaco.includes(colour), 'Monaco NeetCode token missing: '+token+' / '+colour)
}

console.log('NeetCode theme regression passed: canonical site and Monaco colours are locked.')
