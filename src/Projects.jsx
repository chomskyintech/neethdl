import React,{useMemo,useState} from 'react'
import{ArrowRight,ChevronRight}from'lucide-react'
import {roleGroups} from './data/projects'
import {guidedProjects} from './data/guidedProjects'

const projectCategories=[
 {id:'all',label:'All'},
 {id:'dv',label:'Design Verification',role:'Design Verification'},
 {id:'rtl',label:'RTL Design',role:'RTL / Digital Design'},
 {id:'fpga',label:'FPGA',role:'FPGA'},
 {id:'soc',label:'SoC / Embedded',role:'SoC / Embedded Hardware'},
 {id:'hft',label:'Low-Latency / HFT',role:'Low-Latency / HFT Hardware'}
]

const roadmapItems=[
 {id:'rtl-digital',label:'RTL Design Engineer',category:'rtl',description:'Build synthesizable blocks, buses, CDC structures and control-heavy digital RTL.'},
 {id:'verification',label:'Design Verification',category:'dv',description:'Build reusable SystemVerilog/UVM environments with checking, assertions and coverage.'},
 {id:'hft-fpga',label:'FPGA Engineer',category:'fpga',description:'Build streaming, interface and signal-processing designs suited to FPGA implementation.'},
 {id:'cpu-gpu',label:'CPU / GPU Hardware',category:'rtl',description:'Build processor datapaths and then add real microarchitectural pipeline control.'},
 {id:'accelerators',label:'Hardware Accelerator',category:'fpga',description:'Build throughput-oriented arithmetic datapaths and small compute engines.'}
]

const replacedGuideSlugs=new Set(guidedProjects.map(project=>project.slug))

export default function Projects({onStartProject,solved=[],drafts={},onSelectCareer}){
 const [category,setCategory]=useState('all')
 const [roadmap,setRoadmap]=useState(null)

 const projectStats=useMemo(()=>guidedProjects.map(project=>{
  const completed=project.problemIds.filter(id=>solved.includes(id)).length
  const hasDraft=project.problemIds.some(id=>Boolean(drafts[id]))
  const complete=completed===project.problemIds.length
  const active=completed>0||hasDraft
  return {
   project,
   completed,
   complete,
   active,
   progress:Math.round(completed/project.problemIds.length*100),
   action:completed===0?'Start project':complete?'Review project':'Continue project',
  }
 }),[solved,drafts])

 const visibleGroups=useMemo(()=>{
  const filtered=roleGroups.map(group=>({...group,projects:group.projects.filter(project=>!replacedGuideSlugs.has(project.slug))}))
  if(category==='all')return filtered
  const selected=projectCategories.find(item=>item.id===category)
  return selected?.role?filtered.filter(group=>group.role===selected.role):filtered
 },[category])

 const guidedVisible=projectStats.filter(({project})=>category==='all'||project.categories?.includes(category))
 const guidedGroups=roadmapItems.map(item=>({
  ...item,
  stats:guidedVisible.filter(({project})=>project.roadmap===item.id),
 })).filter(group=>group.stats.length)
 const conceptualCount=roleGroups.reduce((sum,group)=>sum+group.projects.filter(project=>!replacedGuideSlugs.has(project.slug)).length,0)
 const totalProjects=guidedProjects.length+conceptualCount
 const countFor=item=>{
  if(item.id==='all')return totalProjects
  const guideCount=guidedProjects.filter(project=>project.categories?.includes(item.id)).length
  const roleCount=roleGroups.find(group=>group.role===item.role)?.projects.filter(project=>!replacedGuideSlugs.has(project.slug)).length||0
  return guideCount+roleCount
 }
 const activeStats=projectStats.filter(stat=>stat.active&&!stat.complete)
 const completeStats=projectStats.filter(stat=>stat.complete)
 const hasActivity=activeStats.length>0||completeStats.length>0
 const selectCategory=id=>{setCategory(id);setRoadmap(null)}
 const selectRoadmap=item=>{setRoadmap(item.id);if(onSelectCareer)onSelectCareer(item.id);else setCategory(item.category)}
 const openProject=project=>onStartProject?.(project.id)

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

   {guidedGroups.map(group=><section className="project-role project-role-modern guided-project-section" key={group.id}>
    <div className="project-role-head"><h2>{group.label}</h2><p>{group.description}</p></div>
    <div className="project-grid project-grid-modern guided-project-grid">
     {group.stats.map(({project,completed,action})=><article
      className="project-card project-card-modern guided-project-card guided-project-clickable"
      key={project.id}
      role="button"
      tabIndex={0}
      onClick={()=>openProject(project)}
      onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openProject(project)}}}
      aria-label={`${action}: ${project.title}`}
     >
      <div className="guided-project-card-meta"><span className="project-level">GUIDED · {project.level.toUpperCase()}</span><span>{completed}/{project.problemIds.length} modules</span></div>
      <h3>{project.title}</h3>
      <div className="project-tags">{project.skills.slice(0,4).map(skill=><span key={skill}>{skill}</span>)}</div>
      <span className="project-guide-link">{action} <ArrowRight size={14}/></span>
     </article>)}
    </div>
   </section>)}

   {visibleGroups.map(group=>group.projects.length?<section className="project-role project-role-modern" key={group.role}>
    <div className="project-role-head"><h2>{group.role}</h2><p>{group.summary}</p></div>
    <div className="project-grid project-grid-modern">{group.projects.map(project=><article className="project-card project-card-modern" key={project.slug}>
     <span className="project-level">{project.level}</span>
     <h3>{project.title}</h3>
     <div className="project-tags">{project.skills.slice(0,4).map(skill=><span key={skill}>{skill}</span>)}</div>
     <a className="project-guide-link" href={`/projects/${project.slug}/`}>Project guide <ArrowRight size={14}/></a>
    </article>)}</div>
   </section>:null)}
  </section>

  <aside className="projects-side-rail">
   <section className="project-activity-panel" aria-label="Project activity">
    <div className="project-activity-head"><h2>Project Activity</h2>{hasActivity&&<span>{completeStats.length? `${completeStats.length} completed` : `${activeStats.length} active`}</span>}</div>

    <button className="project-github-connect" type="button" aria-label="Connect to GitHub">
     <span className="project-github-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.51 2.87 8.34 6.84 9.69.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1.01.07 1.54 1.06 1.54 1.06.9 1.58 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.63a9.3 9.3 0 0 1 2.5.35c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z"/></svg></span>
     <span className="project-github-copy"><strong>Connect to GitHub</strong><small>Push projects and sync repositories</small></span>
     <ChevronRight size={15}/>
    </button>

    {!hasActivity&&<div className="project-activity-empty"><strong>No project activity yet</strong><span>Start a guided project and your progress will appear here.</span></div>}

    {activeStats.length>0&&<div className="project-activity-group">
     <span className="project-activity-label">In progress</span>
     {activeStats.map(({project,completed,progress})=><button className="project-activity-item" type="button" key={project.id} onClick={()=>openProject(project)}>
      <span><strong>{project.title}</strong><small>{completed} of {project.problemIds.length} modules complete</small></span>
      <em>{progress}%</em>
     </button>)}
    </div>}

    {completeStats.length>0&&<div className="project-activity-group">
     <span className="project-activity-label">Completed</span>
     {completeStats.map(({project})=><button className="project-activity-item" type="button" key={project.id} onClick={()=>openProject(project)}>
      <span><strong>{project.title}</strong><small>Completed</small></span>
      <em className="complete">✓</em>
     </button>)}
    </div>}
   </section>
  </aside>
 </div>
}
