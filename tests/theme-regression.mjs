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
  '--nc-text':'#c2c2c4',
  '--nc-text-strong':'#ececec',
  '--nc-active':'#d7d7d9',
  '--nc-muted':'#76767a',
  '--nc-dim':'#66666b',
  '--nc-blue':'#4b82ac',
  '--nc-teal':'#397e73',
  '--nc-yellow':'#aaa672',
  '--nc-orange':'#a37261',
  '--nc-comment':'#526f49',
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
  '#0d0d0d','#569cd6','#4ec9b0','#4cc8b0','#4ab8a5','#419789','#549cd4','#dcdca8','#cdc98f','#ce9178','#c58c74','#6a9955','#628a55','#c586c0','#ffd700','#da70d6','#179fff'
]
for (const colour of banned) {
  for (const [name,source] of [['palette',palette],['Monaco',monaco],['waveform launcher',launcher]]) {
    assert.ok(!source.toLowerCase().includes(colour), name+' still contains legacy/vivid colour '+colour)
  }
}

const monacoChecks = [
  ['keyword.control','4B82AC'],
  ['keyword.declaration','397E73'],
  ['type.identifier','397E73'],
  ['entity.name.module','AAA672'],
  ['comment','526F49'],
  ['string','A37261'],
  ['editor.background',"'#262527'"],
  ['editor.foreground',"'#C2C2C4'"],
]
for (const [token,colour] of monacoChecks) {
  assert.ok(monaco.includes(token) && monaco.includes(colour), 'Monaco NeetCode token missing: '+token+' / '+colour)
}
assert.ok(!/entity\.name\.module[^\n]*fontStyle:\s*'bold'/.test(monaco), 'module/entity names must not be bold')
assert.ok(monaco.includes("{ token: 'operator', foreground: '9A9A9C' }"), 'operators must stay neutral')
for (const key of ['editorBracketHighlight.foreground1','editorBracketHighlight.foreground2','editorBracketHighlight.foreground3']) {
  assert.ok(monaco.includes(key) && monaco.includes("'#9A9A9C'"), 'brackets must stay neutral')
}

console.log('NeetCode theme regression passed: canonical site and Monaco colours are locked.')
