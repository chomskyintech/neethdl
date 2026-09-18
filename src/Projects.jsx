import React,{useMemo,useState} from 'react'
import{ArrowRight,ChevronRight}from'lucide-react'
import {guidedProject,roleGroups} from './data/projects'
import {riscvProject} from './data/riscvProject'

const projectCategories=[
 {id:'all',label:'All'},
 {id:'dv',label:'Design Verification',role:'Design Verification'},
 {id:'rtl',label:'RTL Design',role:'RTL / Digital Design'},
 {id:'fpga',label:'FPGA',role:'FPGA'},
 {id:'soc',label:'SoC / Embedded',role:'SoC / Embedded Hardware'},
 {id:'hft',label:'Low-Latency / HFT',role:'Low-Latency / HFT Hardware'}
]

const roadmapItems=[
 {id:'rtl',label:'RTL Design Engineer',category:'rtl'},
 {id:'verification',label:'Design Verification',category:'dv'},
 {id:'fpga',label:'FPGA Engineer',category:'fpga'},
 {id:'cpu-gpu',label:'CPU / GPU Hardware',category:'rtl'},
 {id:'accelerators',label:'Hardware Accelerator',category:'fpga'}
]

export default function Projects({onStartRiscv,solved=[],drafts={}}){
 const [category,setCategory]=useState('all')
 const [roadmap,setRoadmap]=useState(null)
 const completed=riscvProject.problemIds.filter(id=>solved.includes(id)).length
 const action=completed===0?'Start project':completed===riscvProject.problemIds.length?'Review project':'Continue project'
 const totalProjects=1+roleGroups.reduce((sum,group)=>sum+group.projects.length,0)
 const hasDraft=riscvProject.problemIds.some(id=>Boolean(drafts[id]))
 const hasActivity=completed>0||hasDraft
 const projectComplete=completed===riscvProject.problemIds.length
 const progress=Math.round(completed/riscvProject.problemIds.length*100)
 const visibleGroups=useMemo(()=>{
  if(category==='all')return roleGroups
  const selected=projectCategories.find(item=>item.id===category)
  return selected?.role?roleGroups.filter(group=>group.role===selected.role):roleGroups
 },[category])
 const guidedVisible=category==='all'||category==='rtl'
 const countFor=item=>item.id==='all'?totalProjects:(roleGroups.find(group=>group.role===item.role)?.projects.length||0)+(item.id==='rtl'?1:0)
 const selectCategory=id=>{setCategory(id);setRoadmap(null)}
 const selectRoadmap=item=>{setRoadmap(item.id);setCategory(item.category)}

 return <div className="projects-workspace">
  <aside className="project-roadmap" aria-label="Guided Roadmap">
   <section className="guided-roadmap-card">
    <h2>Guided Roadmap</h2>
    <div className="guided-roadmap-list">{roadmapItems.map(item=><button key={item.id} type="button" className={roadmap===item.id?'guided-roadmap-item active':'guided-roadmap-item'} onClick={()=>selectRoadmap(item)}><span>{item.label}</span><ChevronRight size={15}/></button>)}</div>
   </section>
  </aside>

  <section className="projects-content">
   <div className="page-head projects-page-head"><h1>Hardware design projects</h1><p>Build substantial RTL, verification, FPGA and architecture projects that give you concrete work to discuss in applications and interviews.</p></div>

   <div className="project-category-row" aria-label="Project categories">
    {projectCategories.map(item=><button key={item.id} type="button" className={category===item.id?'project-category-chip active':'project-category-chip'} onClick={()=>selectCategory(item.id)}>{item.label} · {countFor(item)}</button>)}
   </div>

   {guidedVisible&&<section className="featured-project guided-project-clickable" role="button" tabIndex={0} onClick={onStartRiscv} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onStartRiscv()}}} aria-label={`${action}: ${riscvProject.title}`}>
    <div className="featured-project-copy">
     <div className="featured-project-meta"><span className="project-level">GUIDED · {guidedProject.level.toUpperCase()}</span><span>{completed}/{riscvProject.problemIds.length} blocks complete</span></div>
     <h2>{riscvProject.title}</h2>
     <div className="project-tags">{guidedProject.skills.slice(0,4).map(skill=><span key={skill}>{skill}</span>)}</div>
    </div>
    <span className="guided-start">{action} <ArrowRight size={16}/></span>
   </section>}

   {visibleGroups.map(group=><section className="project-role project-role-modern" key={group.role}>
    <div className="project-role-head"><h2>{group.role}</h2><p>{group.summary}</p></div>
    <div className="project-grid project-grid-modern">{group.projects.map(project=><article className="project-card project-card-modern" key={project.slug}>
     <span className="project-level">{project.level}</span>
     <h3>{project.title}</h3>
     <div className="project-tags">{project.skills.slice(0,4).map(skill=><span key={skill}>{skill}</span>)}</div>
     <a className="project-guide-link" href={`/projects/${project.slug}/`}>Project guide <ArrowRight size={14}/></a>
    </article>)}</div>
   </section>)}
  </section>

  <aside className="projects-side-rail">
   <section className="project-activity-panel" aria-label="Project activity">
    <div className="project-activity-head"><h2>Project Activity</h2>{hasActivity&&<span>{projectComplete?'1 completed':'1 active'}</span>}</div>

    <button className="project-github-connect" type="button" aria-label="Connect to GitHub">
     <span className="project-github-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.51 2.87 8.34 6.84 9.69.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1.01.07 1.54 1.06 1.54 1.06.9 1.58 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.63a9.3 9.3 0 0 1 2.5.35c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z"/></svg></span>
     <span className="project-github-copy"><strong>Connect to GitHub</strong><small>Push projects and sync repositories</small></span>
     <ChevronRight size={15}/>
    </button>

    {!hasActivity&&<div className="project-activity-empty"><strong>No project activity yet</strong><span>Start a guided project and your progress will appear here.</span></div>}

    {hasActivity&&!projectComplete&&<div className="project-activity-group">
     <span className="project-activity-label">In progress</span>
     <button className="project-activity-item" type="button" onClick={onStartRiscv}>
      <span><strong>{riscvProject.title}</strong><small>{completed} of {riscvProject.problemIds.length} blocks complete</small></span>
      <em>{progress}%</em>
     </button>
    </div>}

    {projectComplete&&<div className="project-activity-group">
     <span className="project-activity-label">Completed</span>
     <button className="project-activity-item" type="button" onClick={onStartRiscv}>
      <span><strong>{riscvProject.title}</strong><small>Completed</small></span>
      <em className="complete">✓</em>
     </button>
    </div>}
   </section>
  </aside>
 </div>
}
