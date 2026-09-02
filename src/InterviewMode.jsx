import React, { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Clock3, RotateCcw, Trophy, X } from 'lucide-react'
import problems from './data/problems.json'

const QUESTIONS = [
  { id:'rtl-mux', prompt:'Implement a 2:1 multiplexer. y must select a when sel=0 and b when sel=1.', kind:'RTL' },
  { id:'rtl-counter', prompt:'Implement a synchronous active-high reset counter. Increment on each rising edge when reset is low.', kind:'RTL' },
  { id:'rtl-priority', prompt:'Design an 8-to-3 priority encoder. Bit 7 has highest priority and valid must be low for zero input.', kind:'RTL' },
  { id:'rtl-fifo', prompt:'Implement a synchronous parameterized FIFO with correct ordering, full and empty behaviour.', kind:'RTL' },
  { id:'rtl-shift-register', prompt:'Implement a parameterized shift register that inserts din at bit 0 and shifts toward the MSB.', kind:'RTL' },
  { id:'rtl-edge-detector', prompt:'Generate a one-cycle pulse on every 0-to-1 transition of signal_in using synchronous logic.', kind:'RTL' },
  { id:'rtl-arbiter', prompt:'Build a fixed-priority 4-request arbiter. Request 3 has the highest priority and the grant is one-hot or zero.', kind:'RTL' },
  { id:'rtl-regfile', prompt:'Implement a 4x8 register file with one synchronous write port and two asynchronous read ports.', kind:'RTL' },
  { id:'rtl-lfsr', prompt:'Implement the specified 8-bit LFSR using feedback state[7]^state[5]^state[4]^state[3].', kind:'RTL' },
  { id:'rtl-clock-divider', prompt:'Implement a programmable divide-by-N toggle output with synchronous reset and enable.', kind:'RTL' },
  { id:'arch-hazard', prompt:'Explain whether forwarding resolves a RAW dependency in a five-stage IF/ID/EX/MEM/WB pipeline and identify when a stall is required.', kind:'Architecture' },
  { id:'arch-cache', prompt:'For a 32-bit address, 4 KiB direct-mapped cache and 64-byte lines, derive offset, index and tag widths.', kind:'Architecture' }
]

const RTL_IDS = new Set(QUESTIONS.filter(q=>q.kind==='RTL').map(q=>q.id))
const RUNNER_URL = (import.meta.env.VITE_RUNNER_URL || '').replace(/\/$/,'')
const loadScore = () => { try { return Number(localStorage.getItem('hdlforge-interview-best') || 0) } catch { return 0 } }

function gradeArchitecture(id, answer) {
  const text=answer.toLowerCase()
  if(id==='arch-cache') {
    const hits=['6','6 bits','offset','64','64 lines','64 sets','6 offset','6 index','20 tag'].filter(x=>text.includes(x)).length
    return Math.min(10, hits>=5?10:hits>=3?7:hits>=2?5:0)
  }
  const hits=['raw','forward','forwarding','stall','load-use','mem','ex','hazard'].filter(x=>text.includes(x)).length
  return Math.min(10, hits>=6?10:hits>=4?7:hits>=2?5:0)
}

async function gradeAnswer(question, answer) {
  if(question.kind==='RTL') {
    if(!RUNNER_URL) return {score:0, passed:false, detail:'Hidden RTL grading service is not configured.'}
    const response=await fetch(`${RUNNER_URL}/interview/run`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({problemId:question.id,source:answer})})
    const data=await response.json()
    return {score:data.passed?10:0,passed:Boolean(data.passed),detail:data.passed?'Hidden tests passed.':'Hidden tests failed.'}
  }
  const score=gradeArchitecture(question.id,answer)
  return {score,passed:score>=7,detail:score>=7?'Key concepts covered.':'Answer needs stronger timing/technical justification.'}
}

export default function InterviewMode({ onExit }) {
  const [started,setStarted]=useState(false), [index,setIndex]=useState(0), [answer,setAnswer]=useState(''), [answers,setAnswers]=useState([]), [time,setTime]=useState(20*60), [finished,setFinished]=useState(false), [best,setBest]=useState(loadScore), [grading,setGrading]=useState(false), [gradeError,setGradeError]=useState('')
  const questions=useMemo(()=>[...QUESTIONS].sort(()=>Math.random()-0.5).slice(0,10),[])
  const q=questions[index]
  useEffect(()=>{ if(!started||finished) return; const id=setInterval(()=>setTime(t=>{if(t<=1){clearInterval(id);setFinished(true);return 0}return t-1}),1000); return ()=>clearInterval(id)},[started,finished])

  const submit=async()=>{
    if(!answer.trim()||grading) return
    setGrading(true); setGradeError('')
    try {
      const result=await gradeAnswer(q,answer)
      const next=[...answers,{id:q.id,answer,score:result.score,passed:result.passed,detail:result.detail}]
      setAnswers(next); setAnswer('')
      if(index===questions.length-1) finish(next)
      else setIndex(index+1)
    } catch(error) {
      setGradeError(error?.message||'Unable to grade this answer.')
    } finally { setGrading(false) }
  }

  const finish=(finalAnswers=answers)=>{ const score=Math.round(finalAnswers.reduce((sum,a)=>sum+a.score,0)/(questions.length*10)*100); setFinished(true); if(score>best){setBest(score);try{localStorage.setItem('hdlforge-interview-best',String(score))}catch{}} }
  const restart=()=>{setStarted(false);setIndex(0);setAnswer('');setAnswers([]);setTime(20*60);setFinished(false);setGradeError('')}
  const minutes=String(Math.floor(time/60)).padStart(2,'0'), seconds=String(time%60).padStart(2,'0')

  if(!started) return <div className="interview-shell"><div className="interview-card"><div className="eyebrow">INTERVIEW MODE</div><h1>Hardware interview simulation</h1><p>10 timed questions across RTL and computer architecture. RTL answers are evaluated against server-side hidden simulation tests; conceptual answers are scored against a technical rubric.</p><div className="interview-rules"><div><strong>20:00</strong><span>Total time</span></div><div><strong>10</strong><span>Questions</span></div><div><strong>100</strong><span>Maximum score</span></div></div><button className="primary" onClick={()=>setStarted(true)}>Start interview <ChevronRight size={17}/></button><button className="secondary" onClick={onExit}>Back to roadmap</button>{best>0&&<p className="best-score">Best score: {best}/100</p>}</div></div>

  if(finished){const score=Math.round(answers.reduce((sum,a)=>sum+a.score,0)/(questions.length*10)*100);return <div className="interview-shell"><div className="interview-card result-card"><Trophy size={32}/><div className="eyebrow">INTERVIEW COMPLETE</div><h1>{score}/100</h1><p>You earned {answers.reduce((sum,a)=>sum+a.score,0)} of {questions.length*10} available points.</p><div className="interview-review">{questions.map((item,i)=>{const result=answers.find(a=>a.id===item.id);return <div key={item.id}><span>{i+1}</span><strong>{item.prompt}</strong><em>{result?.passed?<Check size={16}/>:<X size={16}/>}</em><small>{result?.score??0}/10 · {result?.detail||'Not answered'}</small></div>})}</div><button className="primary" onClick={restart}>New interview <RotateCcw size={16}/></button><button className="secondary" onClick={onExit}>Back to roadmap</button></div></div>}

  return <div className="interview-shell"><div className="interview-top"><button className="secondary" onClick={()=>finish()}>Exit</button><span><Clock3 size={16}/> {minutes}:{seconds}</span><strong>{index+1}/{questions.length}</strong></div><div className="interview-card question-card"><div className="eyebrow">{q.kind} · QUESTION {index+1}</div><h1>{q.prompt}</h1><p className="interview-note">Write the answer you would give an interviewer. For RTL questions, include the complete module with the interface implied by the problem. For conceptual questions, show the timing/calculation explicitly.</p><textarea value={answer} onChange={e=>setAnswer(e.target.value)} spellCheck="false" autoFocus placeholder="Type your answer here…"/><div className="question-foot"><span>{answer.length} characters</span><button className="primary" disabled={grading||!answer.trim()} onClick={submit}>{grading?'Grading…':index===questions.length-1?'Finish':'Submit & continue'} <ChevronRight size={16}/></button></div>{gradeError&&<div className="run-result fail"><strong>× Grading failed</strong><pre>{gradeError}</pre></div>}</div></div>
}

export { problems }
