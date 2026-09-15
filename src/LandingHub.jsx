import React from 'react'
import {BookOpen,BriefcaseBusiness,Clock,Trophy,ChevronRight,GraduationCap} from 'lucide-react'

const destinations=[
 {id:'problems',title:'Problems',description:'Practice RTL, SystemVerilog, assertions, verification, architecture, protocols and FPGA topics.',icon:BookOpen},
 {id:'tracks',title:'Tracks',description:'Follow role- and company-style preparation tracks built from the HDLForge problem set.',icon:Trophy},
 {id:'interview',title:'Interview',description:'Run the current timed hardware interview simulation with scoring and RTL evaluation.',icon:Clock},
 {id:'projects',title:'Projects',description:'Build portfolio projects grouped by the hardware jobs you want to target.',icon:BriefcaseBusiness},
 {id:'courses',title:'Courses',description:'Learn hardware skills in order, then reinforce them with relevant problems and projects.',icon:GraduationCap}
]

const learningLinks=[
 {href:'/problems/',title:'Hardware design practice problems',description:'Browse the complete crawlable RTL, FPGA, verification, protocol and architecture problem library.'},
 {href:'/companies/',title:'Company interview practice',description:'Prepare with company-style tracks for Jane Street, AMD, Arm, NVIDIA, Qualcomm and Apple.'},
 {href:'/projects/',title:'Hardware design projects',description:'Build portfolio projects in RTL, verification, FPGA, RISC-V, SoC and low-latency hardware.'},
 {href:'/learn/',title:'Learning & interview guides',description:'Browse all HDLForge topic hubs and hardware interview guides.'},
 {href:'/learn/verilog-interview/',title:'Verilog & RTL interviews',description:'Review synthesizable RTL, coding style and common interview topics.'},
 {href:'/learn/uvm-interview/',title:'Verification interviews',description:'Prepare for UVM, SVA, scoreboards, monitors and verification methodology.'}
]

export default function LandingHub({go,problemCount,solvedCount}){
 return <div className="landing-hub">
  <section className="hero landing-hero">
   <div className="eyebrow">HDLFORGE</div>
   <h1>Hardware design practice for RTL, FPGA & verification roles.<br/><span>Learn, solve, interview, build.</span></h1>
   <p>Practice hardware design problems, follow company-style interview tracks, run timed interview sessions, and build RTL, verification and FPGA portfolio projects.</p>
  </section>
  <section className="stats landing-stats"><div><strong>{problemCount}</strong><span>Problems</span></div><div><strong>{solvedCount}</strong><span>Solved</span></div><div><strong>9</strong><span>Tracks</span></div><div><strong>9</strong><span>Courses</span></div><div><strong>5</strong><span>Project roles</span></div></section>
  <section><div className="section-heading"><div><div className="eyebrow">START HERE</div><h2>Choose your workspace</h2></div></div>
   <div className="destination-grid">{destinations.map(({id,title,description,icon:Icon})=><button className="destination-card" key={id} onClick={()=>go(id)}>
    <span className="destination-icon"><Icon size={22}/></span><span className="destination-copy"><strong>{title}</strong><small>{description}</small></span><ChevronRight size={18}/>
   </button>)}</div>
  </section>
  <section style={{marginTop:'54px'}}><div className="section-heading"><div><div className="eyebrow">EXPLORE</div><h2>Hardware design practice resources</h2></div></div>
   <div className="topic-grid">{learningLinks.map(link=><a className="topic-card" style={{textDecoration:'none'}} href={link.href} key={link.href}>
    <span className="topic-info"><h3>{link.title}</h3><p>{link.description}</p></span><ChevronRight className="chevron" size={18}/>
   </a>)}</div>
  </section>
 </div>
}
