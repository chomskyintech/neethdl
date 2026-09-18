import React,{lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react'
import {ChevronRight,Filter,Flame,Sparkles,Search,Target,UserCircle,Zap}from'lucide-react'
import {createRoot} from 'react-dom/client'
import './styles.css'
import './language-ui.css'
import './waveform-discussion.css'
import './account-tracks.css'
import './home-projects.css'
import './lockedEditor.js'
import problems from './data/activeProblems'
import {riscvProject} from './data/riscvProject'
import tracks from './data/tracks'
import LandingHub from './LandingHub'
import {addActivityDay,calculatePoints,calculateStreak} from './progressTracking'

const ProblemIDE=lazy(()=>import('./ProblemIDE'))
const AccountModal=lazy(()=>import('./AccountModal'))
const Projects=lazy(()=>import('./Projects'))

const categories=['All','RTL Design','SystemVerilog','SVA','UVM','Protocols','FPGA','Accelerators']
const difficulties=['All','Easy','Medium','Hard']
const companyTrackIds=['jane-street','amd','arm','nvidia','qualcomm','apple']
const careerRoadmaps=[
 {id:'rtl-digital',label:'RTL Design Engineer'},
 {id:'verification',label:'Design Verification'},
 {id:'hft-fpga',label:'FPGA Engineer'},
 {id:'cpu-gpu',label:'CPU / GPU Hardware'},
 {id:'accelerators',label:'Hardware Accelerator'}
]
const trackLabel=track=>careerRoadmaps.find(item=>item.id===track?.id)?.label||track?.name||''
const languages=['All','Verilog','SystemVerilog','VHDL']
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}}
const appPaths={home:'/',problems:'/app/problems/',projects:'/app/projects/'}
const pageTitles={home:'HDLForge — Hardware Design Interview Practice',problems:'Problems | HDLForge',projects:'Projects | HDLForge'}

function problemLanguages(p){
 if(p.languages?.length)return p.languages
 if(p.category==='RTL Design'||p.category==='Protocols'||p.category==='FPGA')return ['Verilog','SystemVerilog','VHDL']
 if(p.category==='Accelerators')return ['Verilog','SystemVerilog']
 if(p.category==='SystemVerilog'||p.category==='SVA'||p.category==='UVM')return ['SystemVerilog']
 return []
}
function problemLanguageLabel(p){const ls=problemLanguages(p);return ls.length?ls.join(' / '):'Conceptual'}
function normalizePath(path){return path==='/'?'/':path.replace(/\/+$/,'')}
function appPath(page,problem,projectId=null,trackId=null){
 if(page==='problems'&&trackId)return `/app/problems/company/${encodeURIComponent(trackId)}/`
 if(page==='problem'&&problem){
  if(projectId===riscvProject.id)return `/app/projects/${riscvProject.slug}/${encodeURIComponent(problem.id)}/`
  if(trackId)return `/app/problems/company/${encodeURIComponent(trackId)}/${encodeURIComponent(problem.id)}/`
  return `/app/problems/${encodeURIComponent(problem.id)}/`
 }
 return appPaths[page]||'/'
}
function routeFromLocation(){
 const path=normalizePath(window.location.pathname)
 if(path==='/app/tracks'||path==='/app/progress'||path==='/app/courses')return {page:'problems',problem:null,projectId:null,trackId:null,legacySection:true}
 const companyMatch=path.match(/^\/app\/problems\/company\/([^/]+)\/([^/]+)$/)
 if(companyMatch){
  const trackId=decodeURIComponent(companyMatch[1]),id=decodeURIComponent(companyMatch[2])
  const track=tracks.find(item=>item.id===trackId)
  const problem=problems.find(item=>item.id===id)
  if(track&&problem&&track.problemIds.includes(problem.id))return {page:'problem',problem,projectId:null,trackId:track.id}
 }
 const companyOverviewMatch=path.match(/^\/app\/problems\/company\/([^/]+)$/)
 if(companyOverviewMatch){
  const trackId=decodeURIComponent(companyOverviewMatch[1])
  const track=tracks.find(item=>item.id===trackId)
  if(track)return {page:'problems',problem:null,projectId:null,trackId:track.id}
 }
 const projectMatch=path.match(/^\/app\/projects\/riscv-core\/([^/]+)$/)
 if(projectMatch){
  const id=decodeURIComponent(projectMatch[1])
  const problem=problems.find(p=>p.id===id&&riscvProject.problemIds.includes(p.id))
  if(problem)return {page:'problem',problem,projectId:riscvProject.id,trackId:null}
 }
 const problemMatch=path.match(/^\/app\/problems\/([^/]+)$/)
 if(problemMatch){
  const id=decodeURIComponent(problemMatch[1])
  const problem=problems.find(p=>p.id===id)
  if(problem)return {page:'problem',problem,projectId:null,trackId:null}
 }
 const legacyId=new URLSearchParams(window.location.search).get('problem')
 if(legacyId){const problem=problems.find(p=>p.id===legacyId);if(problem)return {page:'problem',problem,legacy:true,projectId:null,trackId:null}}
 for(const [page,target] of Object.entries(appPaths))if(normalizePath(target)===path)return {page,problem:null,projectId:null,trackId:null}
 return {page:'home',problem:null,projectId:null,trackId:null}
}
function RouteLoading(){return <div role="status" aria-live="polite" style={{padding:'48px 24px',color:'var(--muted)'}}>Loading HDLForge…</div>}

function App(){
 const initialRoute=useRef(routeFromLocation()).current
 const [page,setPage]=useState(initialRoute.page),[selected,setSelected]=useState(initialRoute.problem||problems[0]||null),[projectId,setProjectId]=useState(initialRoute.projectId||null),[trackId,setTrackId]=useState(initialRoute.trackId||null),[query,setQuery]=useState(''),[category,setCategory]=useState('All'),[difficulty,setDifficulty]=useState('All'),[language,setLanguage]=useState('All'),[status,setStatus]=useState('All'),[solved,setSolved]=useState(()=>load('hdlforge-solved',[])),[drafts,setDrafts]=useState(()=>load('hdlforge-drafts',{})),[draftUpdatedAt,setDraftUpdatedAt]=useState(()=>load('hdlforge-draft-updated-at',{})),[activityDays,setActivityDays]=useState(()=>load('hdlforge-activity-days',[])),[user,setUser]=useState(null),[accountOpen,setAccountOpen]=useState(false),[cloudReady,setCloudReady]=useState(false),[syncStatus,setSyncStatus]=useState('Local only')
 const syncTimer=useRef(null)
 const markSolved=id=>{if(solved.includes(id))return;const n=[...solved,id];setSolved(n);localStorage.setItem('hdlforge-solved',JSON.stringify(n));const days=addActivityDay(activityDays);setActivityDays(days);localStorage.setItem('hdlforge-activity-days',JSON.stringify(days))}
 const saveDraft=(id,code)=>{const n={...drafts,[id]:code},updated={...draftUpdatedAt,[id]:new Date().toISOString()};setDrafts(n);setDraftUpdatedAt(updated);localStorage.setItem('hdlforge-drafts',JSON.stringify(n));localStorage.setItem('hdlforge-draft-updated-at',JSON.stringify(updated))}
 const activeTrack=useMemo(()=>tracks.find(track=>track.id===trackId)||null,[trackId])
 const filtered=useMemo(()=>{
  const source=activeTrack?activeTrack.problemIds.map(id=>problems.find(problem=>problem.id===id)).filter(Boolean):problems
  return source.filter(p=>{const ls=problemLanguages(p);return (category==='All'||p.category===category)&&(difficulty==='All'||p.difficulty===difficulty)&&(language==='All'||ls.includes(language))&&(status==='All'||(status==='Solved'?solved.includes(p.id):!solved.includes(p.id)))&&(!query||`${p.title} ${p.category} ${problemLanguageLabel(p)} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))})
 },[activeTrack,category,difficulty,language,status,query,solved])
 const points=useMemo(()=>calculatePoints(problems,solved),[solved]),streak=useMemo(()=>calculateStreak(activityDays),[activityDays])
 const navigate=(nextPage,problem=null,{replace=false,project=null,track=null}={})=>{
  const nextProject=nextPage==='problem'?project:null
  const nextTrack=nextPage==='problem'?track:(nextPage==='problems'?trackId:null)
  if(nextPage==='problem'&&problem)setSelected(problem)
  setProjectId(nextProject)
  setTrackId(nextTrack)
  setPage(nextPage)
  const target=appPath(nextPage,problem,nextProject,nextTrack)
  const current=`${window.location.pathname}${window.location.search}`
  if(current!==target)window.history[replace?'replaceState':'pushState']({page:nextPage,problemId:problem?.id||null,projectId:nextProject,trackId:nextTrack},'',target)
  window.scrollTo({top:0,behavior:'auto'})
 }
 const openProblem=p=>navigate('problem',p,{track:trackId})
 const go=p=>navigate(p)
 const selectTrack=id=>{
  const next=id||null
  setTrackId(next);setCategory('All');setDifficulty('All');setLanguage('All');setStatus('All');setQuery('')
  const target=appPath('problems',null,null,next),current=`${window.location.pathname}${window.location.search}`
  if(current!==target)window.history.pushState({page:'problems',problemId:null,projectId:null,trackId:next},'',target)
 }
 const projectProblems=useMemo(()=>riscvProject.problemIds.map(id=>problems.find(p=>p.id===id)).filter(Boolean),[])
 const trackProblems=useMemo(()=>activeTrack?activeTrack.problemIds.map(id=>problems.find(p=>p.id===id)).filter(Boolean):[],[activeTrack])
 const startRiscvProject=()=>{
  const next=projectProblems.find(problem=>!solved.includes(problem.id))||projectProblems[0]
  if(next)navigate('problem',next,{project:riscvProject.id})
 }
 const selectedIndex=selected?problems.findIndex(p=>p.id===selected.id):-1
 const projectIndex=projectId===riscvProject.id&&selected?riscvProject.problemIds.indexOf(selected.id):-1
 const trackIndex=trackId&&activeTrack&&selected?activeTrack.problemIds.indexOf(selected.id):-1
 const previousProblem=projectIndex>=0?(projectIndex>0?projectProblems[projectIndex-1]:null):trackIndex>=0?(trackIndex>0?trackProblems[trackIndex-1]:null):(selectedIndex>0?problems[selectedIndex-1]:null)
 const nextProblem=projectIndex>=0?(projectIndex<projectProblems.length-1?projectProblems[projectIndex+1]:null):trackIndex>=0?(trackIndex<trackProblems.length-1?trackProblems[trackIndex+1]:null):(selectedIndex>=0&&selectedIndex<problems.length-1?problems[selectedIndex+1]:null)
 const openPrevious=()=>previousProblem&&navigate('problem',previousProblem,{project:projectId,track:projectId?null:trackId})
 const openNext=()=>nextProblem&&navigate('problem',nextProblem,{project:projectId,track:projectId?null:trackId})

 useEffect(()=>{
  if(initialRoute.legacy&&initialRoute.problem)window.history.replaceState({page:'problem',problemId:initialRoute.problem.id,projectId:null,trackId:null},'',appPath('problem',initialRoute.problem))
  if(initialRoute.legacySection)window.history.replaceState({page:'problems',problemId:null,projectId:null,trackId:null},'',appPaths.problems)
  const onPopState=()=>{const route=routeFromLocation();setPage(route.page);setProjectId(route.projectId||null);setTrackId(route.trackId||null);if(route.problem)setSelected(route.problem)}
  window.addEventListener('popstate',onPopState)
  return()=>window.removeEventListener('popstate',onPopState)
 },[])

 useEffect(()=>{
  document.title=page==='problem'&&selected?`${selected.title} | HDLForge`:(pageTitles[page]||pageTitles.home)
 },[page,selected?.id])

 useEffect(()=>{
  let active=true,stop=()=>{}
  import('./cloudProfile').then(({initializeAuth,watchAuth})=>{
   if(!active)return
   initializeAuth().then(current=>{if(active)setUser(current)})
   stop=watchAuth(current=>{if(!active)return;setUser(current);setCloudReady(false);if(!current)setSyncStatus('Local only')})
  }).catch(()=>{if(active)setSyncStatus('Local only')})
  return()=>{active=false;stop?.()}
 },[])

 useEffect(()=>{
  if(!user){setCloudReady(false);return}
  let cancelled=false
  setSyncStatus('Syncing…')
  import('./cloudProfile').then(({loadCloudProfile,mergeProfiles})=>loadCloudProfile().then(cloud=>{
   if(cancelled)return
   const merged=mergeProfiles({solved,drafts,draftUpdatedAt,activityDays},cloud)
   setSolved(merged.solved);setDrafts(merged.drafts);setDraftUpdatedAt(merged.draftUpdatedAt);setActivityDays(merged.activityDays)
   localStorage.setItem('hdlforge-solved',JSON.stringify(merged.solved));localStorage.setItem('hdlforge-drafts',JSON.stringify(merged.drafts));localStorage.setItem('hdlforge-draft-updated-at',JSON.stringify(merged.draftUpdatedAt));localStorage.setItem('hdlforge-activity-days',JSON.stringify(merged.activityDays));localStorage.setItem('hdlforge-cloud-user',user.id)
   setCloudReady(true);setSyncStatus('Synced')
  })).catch(()=>{if(!cancelled){setCloudReady(false);setSyncStatus('Offline · saved locally')}})
  return()=>{cancelled=true}
 },[user?.id])

 useEffect(()=>{
  if(!user||!cloudReady)return
  clearTimeout(syncTimer.current)
  syncTimer.current=setTimeout(()=>{
   setSyncStatus('Syncing…')
   import('./cloudProfile').then(({saveCloudProfile})=>saveCloudProfile({solved,drafts,draftUpdatedAt,activityDays})).then(()=>setSyncStatus('Synced')).catch(()=>setSyncStatus('Offline · saved locally'))
  },700)
  return()=>clearTimeout(syncTimer.current)
 },[user?.id,cloudReady,solved,drafts,draftUpdatedAt,activityDays])

 return <div className="app">{page==='home'?<header className="nav"><div className="nav-inner"><button className="brand" onClick={()=>go('home')}><span className="brand-icon"><Zap size={17}/></span><span>HDL<span className="brand-accent">Forge</span></span></button><nav className="desktop-nav"><button className="active" onClick={()=>go('home')}>Home</button><button onClick={()=>go('problems')}>Problems</button><button onClick={()=>go('projects')}>Projects</button></nav><div className="nav-spacer"/><div className="nav-stat"><Flame size={15}/><strong>{streak}</strong><span>streak</span></div><div className="nav-stat"><Sparkles size={15}/><strong>{points}</strong><span>points</span></div><button className="profile" onClick={()=>setAccountOpen(true)} title={user?syncStatus:'Sign in to sync progress'} aria-label={user?'Open account':'Sign in'}><UserCircle size={20}/></button></div></header>:<header className="nav app-section-nav"><div className="nav-inner"><button className="brand" onClick={()=>go('home')} aria-label="HDLForge home"><span className="brand-icon"><Zap size={17}/></span><span>HDL<span className="brand-accent">Forge</span></span></button><nav className="desktop-nav"><button className={page==='problems'||(page==='problem'&&!projectId)?'active':''} onClick={()=>go('problems')}>Problems</button><button className={page==='projects'||projectId===riscvProject.id?'active':''} onClick={()=>go('projects')}>Projects</button></nav><div className="nav-spacer"/><button className="top-signin" onClick={()=>setAccountOpen(true)} title={user?syncStatus:'Sign in to sync progress'} aria-label={user?'Open account':'Sign in'}><UserCircle size={20}/></button></div></header>}<div className="layout"><main className="main"><Suspense fallback={<RouteLoading/>}>
 {page==='home'&&<LandingHub go={go} problemCount={problems.length} solvedCount={solved.length}/>} 
 {page==='problems'&&<Problems problems={filtered} allProblems={problems} solved={solved} query={query} setQuery={setQuery} category={category} setCategory={setCategory} difficulty={difficulty} setDifficulty={setDifficulty} language={language} setLanguage={setLanguage} status={status} setStatus={setStatus} onOpen={openProblem} tracks={tracks} activeTrack={activeTrack} onSelectTrack={selectTrack}/>} 
 {page==='problem'&&selected&&<ProblemIDE key={(projectId||trackId||'problem')+'-'+selected.id} problem={selected} solved={solved.includes(selected.id)} draft={drafts[selected.id] || undefined} onBack={()=>go(projectId?'projects':'problems')} onSolved={markSolved} onSave={saveDraft} onPrevious={openPrevious} onNext={openNext} hasPrevious={Boolean(previousProblem)} hasNext={Boolean(nextProblem)&&(!(projectId||trackId)||solved.includes(selected.id))} navigationLabel={projectId?riscvProject.name:activeTrack?trackLabel(activeTrack)+' Track':selected.category}/>} 
 {page==='projects'&&<Projects onStartRiscv={startRiscvProject} solved={solved} drafts={drafts}/>} 
 </Suspense></main></div>{accountOpen&&<Suspense fallback={null}><AccountModal open user={user} onClose={()=>setAccountOpen(false)} syncStatus={syncStatus}/></Suspense>}</div>
}

function Problems({problems,allProblems,solved,query,setQuery,category,setCategory,difficulty,setDifficulty,language,setLanguage,status,setStatus,onOpen,tracks,activeTrack,onSelectTrack}){
 const companyTracks=tracks.filter(track=>companyTrackIds.includes(track.id))
 const solvedInTrack=activeTrack?activeTrack.problemIds.filter(id=>solved.includes(id)).length:0
 const difficultyStats=['Easy','Medium','Hard'].map(name=>{
  const items=allProblems.filter(problem=>problem.difficulty===name)
  return {name,total:items.length,solved:items.filter(problem=>solved.includes(problem.id)).length}
 })
 return <div className="problems-workspace">
  <aside className="guided-roadmap" aria-label="Guided Roadmap">
   <section className="guided-roadmap-card">
    <h2>Guided Roadmap</h2>
    <div className="guided-roadmap-list">{careerRoadmaps.map(item=><button key={item.id} className={activeTrack?.id===item.id?'guided-roadmap-item active':'guided-roadmap-item'} onClick={()=>onSelectTrack(item.id)}>{item.label}<ChevronRight size={15}/></button>)}</div>
   </section>
  </aside>

  <section className="problems-content">
   <div className="page-head problems-page-head"><h1>Problems</h1><p>Build the skills that hardware interviews actually test. Choose a section, company track or use the filters below.</p></div>
   <div className="problem-sections"><button className={category==='All'?'problem-section-btn active':'problem-section-btn'} onClick={()=>setCategory('All')}>All · {allProblems.length}</button>{categories.slice(1).map(c=><button key={c} className={category===c?'problem-section-btn active':'problem-section-btn'} onClick={()=>setCategory(c)}>{c} · {allProblems.filter(p=>p.category===c).length}</button>)}</div>
   {activeTrack&&<div className="company-track-banner"><div><strong>{trackLabel(activeTrack)} Track</strong><span>{activeTrack.description}</span></div><div className="company-track-progress"><strong>{solvedInTrack}/{activeTrack.problemIds.length}</strong><span>solved</span></div><button className="company-track-exit" onClick={()=>onSelectTrack(null)}>Exit track</button></div>}
   <div className="toolbar"><div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search problems..."/></div><div className="filters"><select value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Language"><option>All</option>{languages.slice(1).map(l=><option key={l}>{l}</option>)}</select><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Topic"><option>All</option>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select><select value={difficulty} onChange={e=>setDifficulty(e.target.value)} aria-label="Difficulty"><option>All</option>{difficulties.slice(1).map(d=><option key={d}>{d}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)} aria-label="Status"><option>All</option><option>Unsolved</option><option>Solved</option></select></div></div>
   <div className={activeTrack?'problem-list company-track-mode':'problem-list'}>{problems.map((p,i)=><ProblemRow key={p.id} p={p} index={i} solved={solved.includes(p.id)} onOpen={onOpen} trackMode={Boolean(activeTrack)} trackTotal={activeTrack?.problemIds.length||0}/>)}{!problems.length&&<div className="empty"><Filter size={28}/><h3>No problems found</h3><p>Try changing your filters or search.</p></div>}</div>
  </section>

  <aside className="problems-side-rail">
   <section className="problem-progress-panel" aria-label="Problem progress">
    <div className="problem-progress-title"><strong>HDLForge {allProblems.length}</strong></div>
    <div className="problem-progress-body">
     <div className="problem-progress-difficulty-list">{difficultyStats.map(stat=><div className={'problem-progress-difficulty '+stat.name.toLowerCase()} key={stat.name}><span>{stat.name}</span><strong>{stat.solved} / {stat.total}</strong></div>)}</div>
     <div className="problem-progress-donut-wrap"><div className="problem-progress-donut"><div><strong>{solved.length}</strong><span>/ {allProblems.length}</span><small>Solved</small></div></div></div>
    </div>
   </section>

   <section className="company-tracks sidebar-company-tracks" aria-label="Company tracks">
    <div className="company-tracks-head"><div className="company-tracks-title"><span className="company-tracks-icon"><Target size={17}/></span><span><strong>Company Tracks</strong><small>Practice company-focused problem sequences.</small></span></div></div>
    <div className="sidebar-company-list">{companyTracks.map(track=><button key={track.id} className={activeTrack?.id===track.id?'company-track-chip active':'company-track-chip'} onClick={()=>onSelectTrack(track.id)}><span>{track.name}</span><em>{track.problemIds.length}</em></button>)}</div>
   </section>
  </aside>
 </div>
}
function ProblemRow({p,index,solved,onOpen,trackMode=false,trackTotal=0}){return <button className="problem-row" onClick={()=>onOpen(p)}><span className={solved?'check done':'check'} aria-label={solved?'Solved':'Unsolved'}>{solved&&<span>✓</span>}</span><span className="problem-main"><span className="problem-index">{String(index+1).padStart(2,'0')}</span><span>{trackMode&&<span className="company-track-step">Step {index+1} of {trackTotal}</span>}<strong>{p.title}</strong><small>{p.category} · {problemLanguageLabel(p)} · {p.tags.slice(0,2).join(' · ')}</small></span></span><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><ChevronRight className="row-chevron" size={17}/></button>}
createRoot(document.getElementById('root')).render(<App/>)