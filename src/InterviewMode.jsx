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

const loadScore = () => { try { return Number(localStorage.getItem('hdlforge-interview-best') || 0) } catch { return 0 } }

export default function InterviewMode({ onExit }) {
  const [started,setStarted]=useState(false), [index,setIndex]=useState(0), [answer,setAnswer]=useState(''), [answers,setAnswers]=useState([]), [time,setTime]=useState(20*60), [finished,setFinished]=useState(false), [best,setBest]=useState(loadScore)
  const questions=useMemo(()=>[...QUESTIONS].sort(()=>Math.random()-0.5).slice(0,10),[])
  const q=questions[index]
  useEffect(()=>{ if(!started||finished) return; const id=setInterval(()=>setTime(t=>{if(t<=1){clearInterval(id);setFinished(true);return 0}return t-1}),1000); return ()=>clearInterval(id)},[started,finished])
  const submit=()=>{ if(!answer.trim()) return; const next=[...answers,{id:q.id,answer}]; setAnswers(next); setAnswer(''); if(index===questions.length-1){finish(next)}else setIndex(index+1) }
  const finish=(finalAnswers=answers)=>{ const score=Math.round(finalAnswers.length/questions.length*100); setFinished(true); if(score>best){setBest(score);try{localStorage.setItem('hdlforge-interview-best',String(score))}catch{}} }
  const restart=()=>{setStarted(false);setIndex(0);setAnswer('');setAnswers([]);setTime(20*60);setFinished(false)}
  const minutes=String(Math.floor(time/60)).padStart(2,'0'), seconds=String(time%60).padStart(2,'0')
  if(!started) return <div className="interview-shell"><div className="interview-card"><div className="eyebrow">INTERVIEW MODE</div><h1>Hardware interview simulation</h1><p>10 timed questions across RTL and computer architecture. Treat it like a real graduate hardware interview: reason first, then write concise synthesizable RTL or a precise explanation.</p><div className="interview-rules"><div><strong>20:00</strong><span>Total time</span></div><div><strong>10</strong><span>Questions</span></div><div><strong>100</strong><span>Maximum score</span></div></div><button className="primary" onClick={()=>setStarted(true)}>Start interview <ChevronRight size={17}/></button><button className="secondary" onClick={onExit}>Back to roadmap</button>{best>0&&<p className="best-score">Best score: {best}/100</p>}</div></div>
  if(finished){const score=Math.round(answers.length/questions.length*100);return <div className="interview-shell"><div className="interview-card result-card"><Trophy size={32}/><div className="eyebrow">INTERVIEW COMPLETE</div><h1>{score}/100</h1><p>You completed {answers.length} of {questions.length} questions before the timer ended.</p><div className="interview-review">{questions.map((item,i)=><div key={item.id}><span>{i+1}</span><strong>{item.prompt}</strong><em>{answers.find(a=>a.id===item.id)?<Check size={16}/>:<X size={16}/>}</em></div>)}</div><button className="primary" onClick={restart}>New interview <RotateCcw size={16}/></button><button className="secondary" onClick={onExit}>Back to roadmap</button></div></div>}
  return <div className="interview-shell"><div className="interview-top"><button className="secondary" onClick={()=>finish()}>Exit</button><span><Clock3 size={16}/> {minutes}:{seconds}</span><strong>{index+1}/{questions.length}</strong></div><div className="interview-card question-card"><div className="eyebrow">{q.kind} · QUESTION {index+1}</div><h1>{q.prompt}</h1><p className="interview-note">Write the answer you would give an interviewer. For RTL questions, include the complete module. For conceptual questions, show the timing/calculation explicitly.</p><textarea value={answer} onChange={e=>setAnswer(e.target.value)} spellCheck="false" autoFocus placeholder="Type your answer here…"/><div className="question-foot"><span>{answer.length} characters</span><button className="primary" onClick={submit}>{index===questions.length-1?'Finish':'Submit & continue'} <ChevronRight size={16}/></button></div></div></div>
}

export { problems }
