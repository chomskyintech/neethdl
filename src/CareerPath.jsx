import React,{useEffect,useMemo,useState} from 'react'
import{ArrowRight,CheckCircle2,ChevronRight}from'lucide-react'
import {allProjects} from './data/projects'
import {guidedProjectBySlug} from './data/runtimeCatalog'
import {careerPathList} from './data/careerPaths'
import './career-path.css'

const projectMap={
 ...Object.fromEntries(allProjects.map(project=>[project.slug,project])),
 ...guidedProjectBySlug,
}

export default function CareerPath({career,allProblems,solved=[],onOpenProblem,onStartProject,onSelectCareer}){
 const careerProblems=useMemo(()=>career.problemIds.map(id=>allProblems.find(problem=>problem.id===id)).filter(Boolean),[career,allProblems])
 const careerProjects=useMemo(()=>career.projectSlugs.map(slug=>projectMap[slug]).filter(Boolean),[career])
 const completed=careerProblems.filter(problem=>solved.includes(problem.id)).length
 const progress=careerProblems.length?Math.round(completed/careerProblems.length*100):0
 const grouped=career.milestones?.map(milestone=>({
   ...milestone,
   problems:milestone.problemIds.map(id=>careerProblems.find(problem=>problem.id===id)).filter(Boolean),
 }))||null
 const [openMilestones,setOpenMilestones]=useState(()=>new Set([0]))

 useEffect(()=>{
   setOpenMilestones(new Set([0]))
 },[career.id])

 const toggleMilestone=index=>{
   setOpenMilestones(current=>{
     const next=new Set(current)
     if(next.has(index))next.delete(index)
     else next.add(index)
     return next
   })
 }

 return <div className="career-workspace">
  <aside className="career-roadmap" aria-label="Guided Roadmap">
   <section className="guided-roadmap-card">
    <h2>Guided Roadmap</h2>
    <div className="guided-roadmap-list">{careerPathList.map(item=><button key={item.id} type="button" className={item.id===career.id?'guided-roadmap-item active':'guided-roadmap-item'} onClick={()=>onSelectCareer(item.id)}><span>{item.label}</span><ChevronRight size={15}/></button>)}</div>
   </section>
  </aside>

  <main className="career-content">
   <header className="career-hero">
    <h1>{career.label}</h1>
    <p>{career.summary}</p>
    {career.skills?.length?<div className="career-skill-row">{career.skills.map(skill=><span key={skill}>{skill}</span>)}</div>:null}
   </header>

   <section className="career-section" aria-labelledby="career-problems-heading">
    <div className="career-section-head">
     <div><h2 id="career-problems-heading">Problems for this path</h2><p>Work through the blocks that map directly to this role.</p></div>
     <strong>{completed}/{careerProblems.length} solved</strong>
    </div>

    {grouped?<div className="career-milestones">{grouped.map((milestone,index)=>{
      const open=openMilestones.has(index)
      const panelId=`career-milestone-${career.id}-${index}`
      const solvedCount=milestone.problems.filter(problem=>solved.includes(problem.id)).length
      const milestoneProgress=milestone.problems.length?Math.round(solvedCount/milestone.problems.length*100):0
      return <section className={open?'career-milestone open':'career-milestone'} key={milestone.title}>
       <button type="button" className="career-milestone-head" aria-expanded={open} aria-controls={panelId} onClick={()=>toggleMilestone(index)}>
        <ChevronRight className="career-milestone-chevron" size={18}/>
        <h3>{milestone.title}</h3>
        <span className="career-milestone-count">{solvedCount}/{milestone.problems.length}</span>
        <span className="career-milestone-progress"><i style={{width:`${milestoneProgress}%`}}/></span>
       </button>
       <div id={panelId} className="career-problem-list" hidden={!open}>{milestone.problems.map((problem,problemIndex)=><CareerProblem key={problem.id} index={problemIndex+1} problem={problem} solved={solved.includes(problem.id)} onOpen={onOpenProblem}/>)}</div>
      </section>
     })}</div>:
     <div className="career-problem-list">{careerProblems.map(problem=><CareerProblem key={problem.id} problem={problem} solved={solved.includes(problem.id)} onOpen={onOpenProblem}/>)}</div>}
   </section>

   <section className="career-section" aria-labelledby="career-projects-heading">
    <div className="career-section-head">
     <div><h2 id="career-projects-heading">Projects for this path</h2><p>Use these projects to turn the interview topics into portfolio-level hardware work.</p></div>
     <strong>{careerProjects.length} projects</strong>
    </div>
    <div className="career-project-grid">{careerProjects.map(project=><article className="career-project-card" key={project.slug}>
      <span className="career-project-level">{project.problemIds?'Guided':project.level}</span>
      <h3>{project.title}</h3>
      <p>{project.why||project.build}</p>
      <div className="career-project-tags">{project.skills?.slice(0,4).map(skill=><span key={skill}>{skill}</span>)}</div>
      {project.problemIds
       ?<button type="button" onClick={()=>onStartProject(project.id)}>Start guided project <ArrowRight size={14}/></button>
       :<a href={`/projects/${project.slug}/`}>Open project guide <ArrowRight size={14}/></a>}
     </article>)}</div>
   </section>
  </main>

  <aside className="career-side-rail">
   <section className="career-progress-card" aria-label="Career path progress">
    <span>Roadmap progress</span>
    <div className="career-progress-number"><strong>{progress}%</strong><small>{completed} of {careerProblems.length} problems</small></div>
    <div className="career-progress-track"><i style={{width:`${progress}%`}}/></div>
    <div className="career-progress-meta"><div><span>Problems</span><strong>{careerProblems.length}</strong></div><div><span>Projects</span><strong>{careerProjects.length}</strong></div></div>
   </section>
  </aside>
 </div>
}

function CareerProblem({problem,solved,onOpen,index}){
 const languageLabel=problem.languages?.length?problem.languages.join(' / '):''
 return <button type="button" className="career-problem" onClick={()=>onOpen(problem)}>
  <span className={solved?'career-problem-check done':'career-problem-check'}>{solved?<CheckCircle2 size={15}/>:null}</span>
  <span className="career-problem-index">{String(index).padStart(2,'0')}</span>
  <span className="career-problem-copy"><strong>{problem.title}</strong><small>{problem.topic}{languageLabel?` · ${languageLabel}`:''}</small></span>
  <span className={`career-problem-difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
  <ChevronRight className="career-problem-chevron" size={16}/>
 </button>
}
