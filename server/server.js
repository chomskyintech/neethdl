import express from 'express'
import { execFile } from 'node:child_process'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import standaloneBenches from './standalone-benches.js'

const execFileAsync = promisify(execFile)
const app = express()
const PORT = process.env.PORT || 8787
const MAX_SOURCE = 20000
const TIMEOUT_MS = 5000
const dangerous = /\$(system|popen|fopen|fwrite|fread|fclose|fseek|rewind)\b|`include\b|`system\b/i

app.use(express.json({ limit: '32kb' }))
app.use((req,res,next)=>{ res.setHeader('Access-Control-Allow-Origin',process.env.ALLOWED_ORIGIN||'*'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS'); if(req.method==='OPTIONS') return res.sendStatus(204); next() })

const benches = standaloneBenches

const allowed=new Set(Object.keys(benches))
app.get('/health',(_req,res)=>res.json({ok:true,simulator:'verilator'}))

async function runSimulation(source, bench) {
  let dir
  try {
    dir=await mkdtemp(join(tmpdir(),'hdlforge-'))
    const top=join(dir,'tb.sv')
    await writeFile(top,`${source}\n\n${bench}\n`,'utf8')
    const {stdout,stderr}=await execFileAsync('verilator',['--binary','--sv','--timing','--top-module','tb',top],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:1024*1024})
    const run=await execFileAsync(join(dir,'obj_dir','Vtb'),[],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:1024*1024})
    const output=`${stdout}${stderr}${run.stdout}${run.stderr}`
    return {passed:output.includes('HDLFORGE_PASS'),output}
  } catch(err) {
    return {passed:false,output:`${err.stdout||''}${err.stderr||''}${err.message||''}`}
  } finally { if(dir) await rm(dir,{recursive:true,force:true}).catch(()=>{}) }
}

app.post('/run',async(req,res)=>{
  const {problemId,source}=req.body||{}
  if(!allowed.has(problemId)) return res.status(400).json({ok:false,error:'This problem does not have a simulator testbench yet.'})
  if(typeof source!=='string'||source.length<20) return res.status(400).json({ok:false,error:'Source code is required.'})
  if(source.length>MAX_SOURCE) return res.status(413).json({ok:false,error:'Source code is too large.'})
  if(dangerous.test(source)) return res.status(400).json({ok:false,error:'This submission contains a blocked system/file operation.'})
  return res.json({ok:true,...await runSimulation(source,benches[problemId])})
})

// Hidden interview endpoint: testbenches are server-side and never returned to the browser.
app.post('/interview/run',async(req,res)=>{
  const {problemId,source}=req.body||{}
  if(!allowed.has(problemId)) return res.status(400).json({ok:false,error:'This interview problem is not an RTL question.'})
  if(typeof source!=='string'||source.length<20) return res.status(400).json({ok:false,error:'Source code is required.'})
  if(source.length>MAX_SOURCE) return res.status(413).json({ok:false,error:'Source code is too large.'})
  if(dangerous.test(source)) return res.status(400).json({ok:false,error:'This submission contains a blocked system/file operation.'})
  return res.json({ok:true,...await runSimulation(source,benches[problemId])})
})

app.listen(PORT,()=>console.log(`HDLForge runner listening on ${PORT}`))
