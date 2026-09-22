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
const AI_TIMEOUT_MS = 30000
const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna'
const AI_RATE_WINDOW_MS = 60_000
const AI_RATE_LIMIT = Number(process.env.AI_RATE_LIMIT || 20)
const aiRequests = new Map()
const dangerous = /\$(system|popen|fopen|fwrite|fread|fclose|fseek|rewind)\b|`include\b|`system\b/i

app.use(express.json({ limit: '64kb' }))
app.use((req,res,next)=>{ res.setHeader('Access-Control-Allow-Origin',process.env.ALLOWED_ORIGIN||'*'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS'); if(req.method==='OPTIONS') return res.sendStatus(204); next() })

const benches = standaloneBenches

const allowed=new Set(Object.keys(benches))
app.get('/health',(_req,res)=>res.json({ok:true,simulator:'verilator',ai:Boolean(process.env.OPENAI_API_KEY)}))

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

function aiRateAllowed(req) {
  const key = req.ip || req.socket?.remoteAddress || 'unknown'
  const now = Date.now()
  const current = aiRequests.get(key)
  if (!current || now - current.startedAt >= AI_RATE_WINDOW_MS) {
    aiRequests.set(key, { startedAt: now, count: 1 })
    return true
  }
  if (current.count >= AI_RATE_LIMIT) return false
  current.count += 1
  return true
}

function cleanAiHistory(history) {
  if (!Array.isArray(history)) return []
  return history.slice(-6).flatMap(item => {
    const role = item?.role === 'assistant' ? 'assistant' : item?.role === 'user' ? 'user' : null
    const text = typeof item?.text === 'string' ? item.text.trim().slice(0, 3000) : ''
    return role && text ? [{ role, text }] : []
  })
}

function extractResponseText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim()
  return (data?.output || [])
    .flatMap(item => Array.isArray(item?.content) ? item.content : [])
    .filter(item => item?.type === 'output_text' && typeof item?.text === 'string')
    .map(item => item.text)
    .join('\n')
    .trim()
}

app.post('/ai',async(req,res)=>{
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({ok:false,error:'HDLForge AI is not configured on the runner.'})
  if(!aiRateAllowed(req)) return res.status(429).json({ok:false,error:'AI request limit reached. Try again in a minute.'})

  const body=req.body||{}
  const question=typeof body.question==='string'?body.question.trim().slice(0,2000):''
  const source=typeof body.source==='string'?body.source.slice(0,MAX_SOURCE):''
  const language=typeof body.language==='string'?body.language.slice(0,40):'HDL'
  const selection=body.selection||{}
  const selectedCode=typeof selection.code==='string'?selection.code.trim().slice(0,6000):''
  const simulatorOutput=typeof body.simulatorOutput==='string'?body.simulatorOutput.slice(0,5000):''
  const problem=body.problem||{}
  if(!question) return res.status(400).json({ok:false,error:'A question is required.'})
  if(!selectedCode) return res.status(400).json({ok:false,error:'Select some code before asking AI.'})

  const history=cleanAiHistory(body.history)
  const constraints=Array.isArray(problem.constraints)
    ? problem.constraints.slice(0,8).map(item=>String(item).slice(0,500)).join('\n- ')
    : ''

  const context = [
    `Problem: ${String(problem.title||problem.id||'HDL problem').slice(0,300)}`,
    `Topic: ${String(problem.topic||'').slice(0,200)}`,
    `Language: ${language}`,
    `Selected lines: ${Number(selection.startLine)||'?'}-${Number(selection.endLine)||'?'}`,
    '',
    'Problem requirement:',
    String(problem.task||'').slice(0,5000),
    constraints ? `\nConstraints:\n- ${constraints}` : '',
    '',
    'Selected code:',
    selectedCode,
    '',
    'Full current source:',
    source,
    simulatorOutput ? `\nLatest simulator/compiler output:\n${simulatorOutput}` : '',
  ].join('\n')

  const conversation = history
    .map(item=>`${item.role==='assistant'?'Assistant':'User'}: ${item.text}`)
    .join('\n\n')

  const userPrompt = `${context}\n\n${conversation ? `Recent conversation:\n${conversation}\n\n` : ''}User question: ${question}`

  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),AI_TIMEOUT_MS)
  try{
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{
        'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type':'application/json',
      },
      body:JSON.stringify({
        model:AI_MODEL,
        store:false,
        max_output_tokens:1200,
        input:[
          {
            role:'developer',
            content:'You are HDLForge AI, an expert teaching assistant for Verilog, SystemVerilog, VHDL, RTL design, FPGA, digital design, and verification. Answer the user about the selected code in its supplied problem context. Be concise but technically precise. Explain cycle timing, inferred hardware, synthesizability, width/signedness, reset behavior, latch risks, blocking versus non-blocking semantics, protocol behavior, and likely bugs when relevant. Do not claim you ran a simulation unless simulator output is provided. Prefer explaining the selected code over rewriting the entire solution unless the user explicitly asks for a rewrite.'
          },
          { role:'user', content:userPrompt }
        ]
      }),
      signal:controller.signal,
    })
    const data=await response.json().catch(()=>({}))
    if(!response.ok) {
      const detail=data?.error?.message || `AI provider returned HTTP ${response.status}.`
      return res.status(response.status===429?429:502).json({ok:false,error:detail})
    }
    const answer=extractResponseText(data)
    if(!answer) return res.status(502).json({ok:false,error:'AI returned an empty response.'})
    return res.json({ok:true,answer,model:AI_MODEL})
  }catch(error){
    const message=error?.name==='AbortError'?'AI request timed out.':(error?.message||'AI request failed.')
    return res.status(502).json({ok:false,error:message})
  }finally{
    clearTimeout(timer)
  }
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
