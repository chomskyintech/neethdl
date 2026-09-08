import React from 'react'
import {BookOpen,BriefcaseBusiness,Clock,Trophy,ChevronRight} from 'lucide-react'

const destinations=[
 {id:'problems',title:'Problems',description:'Practice RTL, SystemVerilog, assertions, verification, architecture, protocols and FPGA topics.',icon:BookOpen},
 {id:'tracks',title:'Tracks',description:'Follow role- and company-style preparation tracks built from the HDLForge problem set.',icon:Trophy},
 {id:'interview',title:'Interview',description:'Practice under time pressure with interview-style hardware questions and scoring.',icon:Clock},
 {id:'projects',title:'Projects',description:'Build portfolio projects grouped by the hardware jobs you want to target.',icon:BriefcaseBusiness}
]

export default function LandingHub({go,problemCount,solvedCount}){
 return <div className="landing-hub">
  <section className="hero landing-hero">
   <div className="eyebrow">HDLFORGE</div>
   <h1>Prepare for hardware roles.<br/><span>Practice, interview, build.</span></h1>
   <p>Choose how you want to prepare: solve HDL problems, follow interview tracks, run timed practice, or build portfolio projects for specific hardware roles.</p>
  </section>
  <section className="stats landing-stats"><div><strong>{problemCount}</strong><span>Problems</span></div><div><strong>{solvedCount}</strong><span>Solved</span></div><div><strong>9</strong><span>Tracks</span></div><div><strong>5</strong><span>Project roles</span></div></section>
  <section><div className="section-heading"><div><div className="eyebrow">START HERE</div><h2>Choose your workspace</h2></div></div>
   <div className="destination-grid">{destinations.map(({id,title,description,icon:Icon})=><button className="destination-card" key={id} onClick={()=>go(id)}>
    <span className="destination-icon"><Icon size={22}/></span><span className="destination-copy"><strong>{title}</strong><small>{description}</small></span><ChevronRight size={18}/>
   </button>)}</div>
  </section>
 </div>
}
