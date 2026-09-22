#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import solutions from '../src/data/solutions.js'
import { guidedProjectProblems } from '../src/data/guidedProjects.js'
import { getBrowserSimulatorBench } from '../src/browserSimulator.js'

const execFileAsync=promisify(execFile)
const here=dirname(fileURLToPath(import.meta.url))
const root=resolve(here,'..')
const LANGUAGES=['Verilog','SystemVerilog','VHDL']
const NON_HDL_LANGUAGES=new Set(['C'])
const TIMEOUT_MS=15000

async function readJson(relativePath){
  return JSON.parse(await readFile(join(root,relativePath),'utf8'))
}

async function loadCatalog(){
  const [base,accelerators,expansion]=await Promise.all([
    readJson('src/data/problems.json'),
    readJson('src/data/acceleratorProblems.json'),
    readJson('src/data/expansionProblems.json'),
  ])
  return [
    ...base.filter(problem=>problem.evaluation?.type!=='answer'),
    ...accelerators,
    ...expansion,
    ...guidedProjectProblems,
  ]
}

async function loadVhdlBenches(){
  const source=await readFile(join(root,'server/ghdl-proxy.js'),'utf8')
  const start=source.indexOf('const vhdlBenches=')
  const end=source.indexOf('\nconst allowed=',start)
  if(start<0||end<0) throw new Error('Could not locate vhdlBenches in server/ghdl-proxy.js')
  const literal=source.slice(start+'const vhdlBenches='.length,end).trim()
  // This is repository-owned source, parsed here so the audit exercises the exact
  // VHDL benches used by the production GHDL proxy instead of a duplicate copy.
  return Function(`"use strict"; return (${literal});`)()
}

function referenceSource(problem,language){
  const central=solutions[problem.id]?.[language]
  if(typeof central==='string'&&central.trim()) return central
  if(language==='SystemVerilog'&&typeof problem.solution==='string'&&problem.solution.trim()) return problem.solution
  return null
}

async function runIcarus(problemId,language,source,bench){
  const dir=await mkdtemp(join(tmpdir(),'hdlforge-sol-'))
  try{
    const design=join(dir,language==='Verilog'?'design.v':'design.sv')
    const tb=join(dir,'tb.sv')
    const output=join(dir,'sim.out')
    await writeFile(design,source.endsWith('\n')?source:`${source}\n`,'utf8')
    const timedBench=`\`timescale 1ns/1ps\n${bench}`
    await writeFile(tb,timedBench.endsWith('\n')?timedBench:`${timedBench}\n`,'utf8')
    const compile=await execFileAsync('iverilog',['-g2012','-s','tb','-o',output,design,tb],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:4*1024*1024})
    const run=await execFileAsync('vvp',[output],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:4*1024*1024})
    const transcript=`${compile.stdout||''}${compile.stderr||''}${run.stdout||''}${run.stderr||''}`
    if(!transcript.includes('HDLFORGE_PASS')) throw new Error(`Simulation completed without HDLFORGE_PASS.\n${transcript}`)
    return transcript
  }finally{
    await rm(dir,{recursive:true,force:true}).catch(()=>{})
  }
}

async function runGhdl(problemId,source,benchTemplate){
  const entity=source.match(/\bentity\s+([A-Za-z_]\w*)\s+is\b/i)?.[1]
  if(!entity) throw new Error('Reference VHDL does not contain an entity declaration.')
  const dir=await mkdtemp(join(tmpdir(),'hdlforge-vhdl-sol-'))
  try{
    const bench=benchTemplate.replaceAll('{{DUT}}',entity)
    await writeFile(join(dir,'design.vhd'),source.endsWith('\n')?source:`${source}\n`,'utf8')
    await writeFile(join(dir,'tb.vhd'),bench.endsWith('\n')?bench:`${bench}\n`,'utf8')
    for(const args of [
      ['-a','--std=08','design.vhd'],
      ['-a','--std=08','tb.vhd'],
      ['-e','--std=08','tb'],
    ]){
      await execFileAsync('ghdl',args,{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:4*1024*1024})
    }
    let transcript=''
    try{
      const run=await execFileAsync('ghdl',['-r','--std=08','tb','--stop-time=100ns'],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:4*1024*1024})
      transcript=`${run.stdout||''}${run.stderr||''}`
    }catch(error){
      transcript=`${error.stdout||''}${error.stderr||''}${error.message||''}`
      throw new Error(transcript)
    }
    if(!transcript.includes('HDLFORGE_PASS')) throw new Error(`Simulation completed without HDLFORGE_PASS.\n${transcript}`)
    return transcript
  }finally{
    await rm(dir,{recursive:true,force:true}).catch(()=>{})
  }
}

function stripInstanceParameters(bench, entityName){
  const needle=new RegExp(`\\b${entityName}\\s*#\\s*\\(`,'i')
  const match=needle.exec(bench)
  if(!match) return bench

  const open=bench.indexOf('(',match.index)
  let depth=0
  let close=-1
  for(let i=open;i<bench.length;i+=1){
    if(bench[i]==='(') depth+=1
    else if(bench[i]===')'){
      depth-=1
      if(depth===0){close=i;break}
    }
  }
  if(close<0) return bench
  return bench.slice(0,match.index)+entityName+bench.slice(close+1)
}

async function runSynthesizedVhdl(problemId,source,bench){
  const entity=source.match(/\bentity\s+([A-Za-z_]\w*)\s+is\b/i)?.[1]
  if(!entity) throw new Error('Reference VHDL does not contain an entity declaration.')

  const dir=await mkdtemp(join(tmpdir(),'hdlforge-vhdl-synth-sol-'))
  try{
    await writeFile(join(dir,'design.vhd'),source.endsWith('\n')?source:`${source}\n`,'utf8')
    await execFileAsync('ghdl',['-a','--std=08','design.vhd'],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:4*1024*1024})
    const synth=await execFileAsync('ghdl',['--synth','--std=08','--out=verilog',entity],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:4*1024*1024})
    await writeFile(join(dir,'design.v'),synth.stdout,'utf8')

    const tb=stripInstanceParameters(bench,entity)
    const timedBench=`\`timescale 1ns/1ps\n${tb}\n`
    await writeFile(join(dir,'tb.sv'),timedBench,'utf8')

    const output=join(dir,'sim.out')
    const compile=await execFileAsync('iverilog',['-g2012','-s','tb','-o',output,'design.v','tb.sv'],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:4*1024*1024})
    const run=await execFileAsync('vvp',[output],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:4*1024*1024})
    const transcript=`${compile.stdout||''}${compile.stderr||''}${run.stdout||''}${run.stderr||''}`
    if(!transcript.includes('HDLFORGE_PASS')) throw new Error(`Simulation completed without HDLFORGE_PASS.\n${transcript}`)
    return transcript
  }finally{
    await rm(dir,{recursive:true,force:true}).catch(()=>{})
  }
}

function compactError(error){
  return String(error?.stderr||error?.stdout||error?.message||error)
    .replaceAll(root,'<repo>')
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(0,8)
    .join('\n')
}

const catalog=await loadCatalog()
const vhdlBenches=await loadVhdlBenches()
const ids=new Set()
const inventoryIssues=[]
const runnable=[]
let advertisedPairs=0

for(const problem of catalog){
  if(ids.has(problem.id)) inventoryIssues.push(`${problem.id}: duplicate active problem id`)
  ids.add(problem.id)

  const supported=Array.isArray(problem.languages)&&problem.languages.length?problem.languages:[]
  if(!supported.length){
    inventoryIssues.push(`${problem.id}: no supported languages declared`)
    continue
  }

  for(const language of supported){
    if(NON_HDL_LANGUAGES.has(language)) continue
    advertisedPairs++
    if(!LANGUAGES.includes(language)){
      inventoryIssues.push(`${problem.id} / ${language}: unsupported HDL language name in catalog`)
      continue
    }

    const source=referenceSource(problem,language)
    if(!source){
      inventoryIssues.push(`${problem.id} / ${language}: missing reference solution`)
      continue
    }

    if(problem.evaluation?.type==='pattern'){
      const checks=Array.isArray(problem.checks)?problem.checks:[]
      if(!checks.length){
        inventoryIssues.push(`${problem.id} / ${language}: pattern-evaluated problem has no checks`)
        continue
      }
      for(const [index,check] of checks.entries()){
        const label=Array.isArray(check)?check[0]:(check.label||`Check ${index+1}`)
        const raw=Array.isArray(check)?check[1]:check.pattern
        const flags=Array.isArray(check)?'i':(check.flags||'i')
        let expression
        try{expression=raw instanceof RegExp?raw:new RegExp(raw,flags)}
        catch(error){
          inventoryIssues.push(`${problem.id} / ${language}: invalid pattern for ${label}: ${error.message}`)
          continue
        }
        if(!expression.test(source)) inventoryIssues.push(`${problem.id} / ${language}: reference solution fails guided check: ${label}`)
      }
      continue
    }

    const nativeVhdlBench=language==='VHDL'?vhdlBenches[problem.id]:null
    const sharedBench=getBrowserSimulatorBench(problem.id)
    const bench=language==='VHDL'?(nativeVhdlBench||sharedBench):sharedBench
    if(!bench){
      inventoryIssues.push(`${problem.id} / ${language}: missing HDLForge simulator testbench`)
      continue
    }

    const runner=language==='VHDL'?(nativeVhdlBench?'ghdl':'vhdl-synth'):'icarus'
    runnable.push({problem,language,source,bench,runner})
  }
}

console.log(`HDLForge solution regression\nActive coding problems: ${catalog.length}\nAdvertised problem/language pairs: ${advertisedPairs}\nRunnable reference pairs: ${runnable.length}\n`)

if(inventoryIssues.length){
  console.log(`CATALOG GAPS (${inventoryIssues.length})`)
  for(const issue of inventoryIssues) console.log(`  - ${issue}`)
  console.log('')
}

const failures=[]
let passed=0
for(const item of runnable){
  const label=`${item.problem.id} / ${item.language}`
  try{
    if(item.runner==='ghdl') await runGhdl(item.problem.id,item.source,item.bench)
    else if(item.runner==='vhdl-synth') await runSynthesizedVhdl(item.problem.id,item.source,item.bench)
    else await runIcarus(item.problem.id,item.language,item.source,item.bench)
    passed++
    console.log(`PASS ${label}`)
  }catch(error){
    failures.push(`${label}: ${compactError(error)}`)
    console.log(`FAIL ${label}`)
  }
}

console.log(`\nSimulation result: ${passed}/${runnable.length} runnable reference solutions passed.`)
if(failures.length){
  console.log(`\nSIMULATION FAILURES (${failures.length})`)
  for(const failure of failures) console.log(`  - ${failure}\n`)
}

if(inventoryIssues.length||failures.length){
  console.error('HDLForge problem-solution regression FAILED.')
  process.exit(1)
}

console.log('HDLForge problem-solution regression PASSED: every advertised language has a reference solution, a production-equivalent testbench, and a passing simulation.')
