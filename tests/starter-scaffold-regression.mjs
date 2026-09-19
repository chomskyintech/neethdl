#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { languageStarter, resolveInitialStarterDraft, vhdlStarters, legacyStarterCodeById } from '../src/data/starterScaffolds.js'

const datasets=[
  'src/data/problems.json',
  'src/data/acceleratorProblems.json',
  'src/data/expansionProblems.json',
]

const all=[]
for(const file of datasets){
  const rows=JSON.parse(await readFile(file,'utf8'))
  all.push(...rows)
  for(const problem of rows){
    if(!problem.starterCode) continue
    const lines=problem.starterCode.split('\n')
    const longest=Math.max(...lines.map(line=>line.length))
    assert.ok(longest<=72,`${problem.id}: starterCode line is ${longest} chars (max 72)`)
  }
}

for(const [id,source] of Object.entries(vhdlStarters)){
  const longest=Math.max(...source.split('\n').map(line=>line.length))
  assert.ok(longest<=72,`${id}: VHDL starter line is ${longest} chars (max 72)`)
}

const shift=all.find(problem=>problem.id==='rtl-shift-register')
assert.ok(shift,'rtl-shift-register problem missing')
assert.match(shift.starterCode,/module shift_reg #\(\n/)
assert.match(shift.starterCode,/\n  input logic clk,\n/)
assert.match(shift.starterCode,/\n  output logic \[WIDTH-1:0\] dout\n/)

const oldShift=legacyStarterCodeById['rtl-shift-register']
const migrated=resolveInitialStarterDraft(shift,oldShift,'SystemVerilog')
assert.equal(migrated.isStarter,true)
assert.equal(migrated.migrated,true)
assert.equal(migrated.language,'SystemVerilog')
assert.equal(migrated.code,shift.starterCode)

const formattedOld=oldShift.replace(/=/g,' = ').replace(/\s+/g,' ')
const whitespaceMigration=resolveInitialStarterDraft(shift,formattedOld,'SystemVerilog')
assert.equal(whitespaceMigration.isStarter,true,'whitespace-only old scaffold should still migrate')

const userEdit=`${oldShift}\n// user-added logic`
const preserved=resolveInitialStarterDraft(shift,userEdit,'SystemVerilog')
assert.equal(preserved.isStarter,false)
assert.equal(preserved.migrated,false)
assert.equal(preserved.code,userEdit)

const vhdl=languageStarter(shift,'VHDL')
assert.match(vhdl,/generic \(\n/)
assert.match(vhdl,/shift_en : in std_logic;/)

console.log(`Starter scaffold regression passed for ${all.filter(p=>p.starterCode).length} problem templates and ${Object.keys(vhdlStarters).length} VHDL templates.`)
