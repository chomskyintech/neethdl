import React from 'react'
import {ChevronRight} from 'lucide-react'

const stages=[
 {level:'Beginner',title:'Digital & RTL fundamentals',description:'Start with small combinational and sequential blocks before moving into larger stateful designs.',categories:['RTL Design'],limit:10,prerequisite:'Basic Boolean logic and clocked digital design'},
 {level:'Intermediate',title:'SystemVerilog for design',description:'Build fluency with modern SystemVerilog constructs used in synthesizable RTL and reusable interfaces.',categories:['SystemVerilog'],limit:7,prerequisite:'Complete the RTL fundamentals stage'},
 {level:'Intermediate',title:'Assertions & verification',description:'Learn temporal reasoning with SVA, then move into UVM testbench structure and reusable verification components.',categories:['SVA','UVM'],limit:12,prerequisite:'Comfortable reading SystemVerilog RTL'},
 {level:'Advanced',title:'Architecture & protocols',description:'Practice pipeline, cache, memory-system and protocol reasoning alongside implementation-focused exercises.',categories:['Computer Architecture','Protocols'],limit:12,prerequisite:'RTL fundamentals and timing reasoning'},
 {level:'Advanced',title:'FPGA & interview readiness',description:'Finish with FPGA implementation topics and mixed interview-style problems that combine design, verification and debugging.',categories:['FPGA'],limit:9,prerequisite:'Complete at least one earlier intermediate stage'}
]

const languageLabel=p=>p.languages?.length?p.languages.join(' / '):(p.category==='SystemVerilog'||p.category==='SVA'||p.category==='UVM'?'SystemVerilog':p.category==='Computer Architecture'?'Conceptual':'Verilog / SystemVerilog / VHDL')

export default function LearningRoadmap({problems,solved,onOpen,go}){
 const solvedSet=new Set(solved)
 const next=problems.find(p=>!solvedSet.has(p.id))||problems[0]
 const total=problems.length
 const pct=total?Math.round(solved.length/total*100):0
 return <div>
  <section className="hero"><div className="eyebrow">HARDWARE INTERVIEW ROADMAP</div><h1>Build hardware skills<br/><span>in the right order.</span></h1><p>Follow a staged path from RTL fundamentals through SystemVerilog, verification, architecture, protocols and FPGA interview preparation.</p><div className="hero-actions"><button className="primary" onClick={()=>next&&onOpen(next)}>Continue roadmap <ChevronRight size={17}/></button><button className="secondary" onClick={()=>go('problems')}>Browse all problems</button></div></section>
  <section className="stats"><div><strong>{stages.length}</strong><span>Stages</span></div><div><strong>{total}</strong><span>Problems</span></div><div><strong>{solved.length}</strong><span>Solved</span></div><div><strong>{pct}%</strong><span>Complete</span></div></section>
  <section className="roadmap-section"><div className="section-heading"><div><div className="eyebrow">RECOMMENDED PATH</div><h2>From fundamentals to interview readiness</h2></div></div>
   <div className="roadmap-path">{stages.map((stage,index)=>{const items=problems.filter(p=>stage.categories.includes(p.category)).slice(0,stage.limit);const done=items.filter(p=>solvedSet.has(p.id)).length;const stagePct=items.length?Math.round(done/items.length*100):0;return <section className="roadmap-stage" key={stage.title}>
    <div className="roadmap-stage-head"><div><span className="topic-number">{String(index+1).padStart(2,'0')}</span><div className="eyebrow">{stage.level}</div><h2>{stage.title}</h2><p>{stage.description}</p><small>Prerequisite: {stage.prerequisite}</small></div><div className="mini-progress"><div className="progress-track"><div style={{width:`${stagePct}%`}}/></div><strong>{done}/{items.length}</strong><span> complete</span></div></div>
    <div className="problem-list">{items.map((p,i)=><button className="problem-row" key={p.id} onClick={()=>onOpen(p)}><span className={solvedSet.has(p.id)?'check done':'check'}>{solvedSet.has(p.id)?'✓':''}</span><span className="problem-main"><span className="problem-index">{String(i+1).padStart(2,'0')}</span><span><strong>{p.title}</strong><small>{p.category} · {p.difficulty} · {languageLabel(p)}</small></span></span><ChevronRight className="row-chevron" size={17}/></button>)}</div>
   </section>})}</div>
  </section>
 </div>
}
