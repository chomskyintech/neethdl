import React,{lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react'
import {ChevronDown,ChevronRight,Filter,Flame,Sparkles,Search,Target,UserCircle,Zap}from'lucide-react'
import {createRoot} from 'react-dom/client'
import './styles.css'
import './language-ui.css'
import './waveform-discussion.css'
import './account-tracks.css'
import './home-projects.css'
import './neutral-accent.css'
import './topic-browser.css'
import './neetcode-palette.css'
import './lockedEditor.js'
import problems,{problemTopics} from './data/activeProblems'
import {buildTopicOrderedProblems} from './problemNavigation'
import {guidedProjectById,guidedProjectBySlug} from './data/guidedProjects'
import tracks from './data/tracks'
import {careerPaths,careerPathBySlug} from './data/careerPaths'
import LandingHub from './LandingHub'
import {addActivityDay,calculatePoints,calculateStreak} from './progressTracking'

const ProblemIDE=lazy(()=>import('./ProblemIDE'))
const AccountModal=lazy(()=>import('./AccountModal'))
const Projects=lazy(()=>import('./Projects'))
const CareerPath=lazy(()=>import('./CareerPath'))

const categories=['All',...problemTopics]
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
const pageTitles={home:'HDLForge — Hardware Design Interview Practice',problems:'Problems | HDLForge',projects:'Projects | HDLForge',career:'Career Roadmap | HDLForge'}

function problemLanguages(p){
 if(p.languages?.length)return p.languages
 if(p.category==='RTL Design'||p.category==='Protocols'||p.category==='FPGA')return ['Verilog','SystemVerilog','VHDL']
 if(p.category==='Accelerators')return ['Verilog','SystemVerilog']
 if(p.category==='SystemVerilog'||p.category==='SVA'||p.category==='UVM')return ['SystemVerilog']
 return []
}
function problemLanguageLabel(p){const ls=problemLanguages(p);return ls.length?ls.join(' / '):'Conceptual'}
function normalizePath(path){return path==='/'?'/':path.replace(/\/+$/,'')}
function appPath(page,problem,projectId=null,trackId=null,careerId=null){
 if(page==='career'&&careerId){const career=careerPaths[careerId];return career?`/app/roadmaps/${career.slug}/`:'/app/problems/'}
 if(page==='problems'&&trackId)return `/app/problems/company/${encodeURIComponent(trackId)}/`
 if(page==='problem'&&problem){
  const project=projectId?guidedProjectById[projectId]:null
  if(project)return `/app/projects/${project.slug}/${encodeURIComponent(problem.id)}/`
  if(trackId)return `/app/problems/company/${encodeURIComponent(trackId)}/${encodeURIComponent(problem.id)}/`
  return `/app/problems/${encodeURIComponent(problem.id)}/`
 }
 return appPaths[page]||'/'
}
function routeFromLocation(){
 const path=normalizePath(window.location.pathname)
 const careerMatch=path.match(/^\/app\/roadmaps\/([^/]+)$/)
 if(careerMatch){const career=careerPathBySlug[decodeURIComponent(careerMatch[1])];if(career)return {page:'career',problem:null,projectId:null,trackId:null,careerId:career.id}}
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
 const projectMatch=path.match(/^\/app\/projects\/([^/]+)\/([^/]+)$/)
 if(projectMatch){
  const project=guidedProjectBySlug[decodeURIComponent(projectMatch[1])]
  const id=decodeURIComponent(projectMatch[2])
  const problem=project?problems.find(p=>p.id===id&&project.problemIds.includes(p.id)):null
  if(problem)return {page:'problem',problem,projectId:project.id,trackId:null}
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
 const [page,setPage]=useState(initialRoute.page),[selected,setSelected]=useState(initialRoute.problem||problems[0]||null),[projectId,setProjectId]=useState(initialRoute.projectId||null),[trackId,setTrackId]=useState(initialRoute.trackId||null),[careerId,setCareerId]=useState(initialRoute.careerId||null),[query,setQuery]=useState(''),[category,setCategory]=useState('All'),[difficulty,setDifficulty]=useState('All'),[language,setLanguage]=useState('All'),[status,setStatus]=useState('All'),[solved,setSolved]=useState(()=>load('hdlforge-solved',[])),[drafts,setDrafts]=useState(()=>load('hdlforge-drafts',{})),[draftUpdatedAt,setDraftUpdatedAt]=useState(()=>load('hdlforge-draft-updated-at',{})),[activityDays,setActivityDays]=useState(()=>load('hdlforge-activity-days',[])),[user,setUser]=useState(null),[accountOpen,setAccountOpen]=useState(false),[cloudReady,setCloudReady]=useState(false),[syncStatus,setSyncStatus]=useState('Local only')
 const syncTimer=useRef(null)
 const markSolved=id=>{if(solved.includes(id))return;const n=[...solved,id];setSolved(n);localStorage.setItem('hdlforge-solved',JSON.stringify(n));const days=addActivityDay(activityDays);setActivityDays(days);localStorage.setItem('hdlforge-activity-days',JSON.stringify(days))}
 const saveDraft=(id,code)=>{const n={...drafts,[id]:code},updated={...draftUpdatedAt,[id]:new Date().toISOString()};setDrafts(n);setDraftUpdatedAt(updated);localStorage.setItem('hdlforge-drafts',JSON.stringify(n));localStorage.setItem('hdlforge-draft-updated-at',JSON.stringify(updated))}
 const activeTrack=useMemo(()=>tracks.find(track=>track.id===trackId)||null,[trackId])
 const filtered=useMemo(()=>{
  const source=activeTrack?activeTrack.problemIds.map(id=>problems.find(problem=>problem.id===id)).filter(Boolean):problems
  return source.filter(p=>{const ls=problemLanguages(p);return (category==='All'||p.topic===category)&&(difficulty==='All'||p.difficulty===difficulty)&&(language==='All'||ls.includes(language))&&(status==='All'||(status==='Solved'?solved.includes(p.id):!solved.includes(p.id)))&&(!query||`${p.title} ${p.topic} ${p.category} ${problemLanguageLabel(p)} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))})
 },[activeTrack,category,difficulty,language,status,query,solved])
 const points=useMemo(()=>calculatePoints(problems,solved),[solved]),streak=useMemo(()=>calculateStreak(activityDays),[activityDays])
 const navigate=(nextPage,problem=null,{replace=false,project=null,track=null,career=null}={})=>{
  const nextProject=nextPage==='problem'?project:null
  const nextTrack=nextPage==='problem'?track:(nextPage==='problems'?trackId:null)
  const nextCareer=nextPage==='career'?career:(nextPage==='problem'?careerId:null)
  if(nextPage==='problem'&&problem)setSelected(problem)
  setProjectId(nextProject)
  setTrackId(nextTrack)
  setCareerId(nextCareer)
  setPage(nextPage)
  const target=appPath(nextPage,problem,nextProject,nextTrack,nextCareer)
  const current=`${window.location.pathname}${window.location.search}`
  if(current!==target)window.history[replace?'replaceState':'pushState']({page:nextPage,problemId:problem?.id||null,projectId:nextProject,trackId:nextTrack,careerId:nextCareer},'',target)
  window.scrollTo({top:0,behavior:'auto'})
 }
 const openProblem=p=>navigate('problem',p,{track:trackId})
 const go=p=>navigate(p)
 const openCareer=id=>{const career=careerPaths[id];if(career)navigate('career',null,{career:id})}
 const selectTrack=id=>{
  const next=id||null
  setTrackId(next);setCategory('All');setDifficulty('All');setLanguage('All');setStatus('All');setQuery('')
  const target=appPath('problems',null,null,next),current=`${window.location.pathname}${window.location.search}`
  if(current!==target)window.history.pushState({page:'problems',problemId:null,projectId:null,trackId:next},'',target)
 }
 const activeProject=useMemo(()=>guidedProjectById[projectId]||null,[projectId])
 const projectProblems=useMemo(()=>activeProject?activeProject.problemIds.map(id=>problems.find(p=>p.id===id)).filter(Boolean):[],[activeProject])
 const trackProblems=useMemo(()=>activeTrack?activeTrack.problemIds.map(id=>problems.find(p=>p.id===id)).filter(Boolean):[],[activeTrack])
 const startProject=id=>{
  const project=guidedProjectById[id]
  if(!project)return
  const items=project.problemIds.map(problemId=>problems.find(problem=>problem.id===problemId)).filter(Boolean)
  const next=items.find(problem=>!solved.includes(problem.id))||items[0]
  if(next)navigate('problem',next,{project:project.id})
 }
 const topicNavigationProblems=useMemo(()=>buildTopicOrderedProblems(problems,problemTopics),[])
 const selectedIndex=selected?topicNavigationProblems.findIndex(p=>p.id===selected.id):-1
 const projectIndex=activeProject&&selected?activeProject.problemIds.indexOf(selected.id):-1
 const trackIndex=trackId&&activeTrack&&selected?activeTrack.problemIds.indexOf(selected.id):-1
 const previousProblem=projectIndex>=0?(projectIndex>0?projectProblems[projectIndex-1]:null):trackIndex>=0?(trackIndex>0?trackProblems[trackIndex-1]:null):(selectedIndex>0?topicNavigationProblems[selectedIndex-1]:null)
 const nextProblem=projectIndex>=0?(projectIndex<projectProblems.length-1?projectProblems[projectIndex+1]:null):trackIndex>=0?(trackIndex<trackProblems.length-1?trackProblems[trackIndex+1]:null):(selectedIndex>=0&&selectedIndex<topicNavigationProblems.length-1?topicNavigationProblems[selectedIndex+1]:null)
 const openPrevious=()=>previousProblem&&navigate('problem',previousProblem,{project:projectId,track:projectId?null:trackId})
 const openNext=()=>nextProblem&&navigate('problem',nextProblem,{project:projectId,track:projectId?null:trackId})

 useEffect(()=>{
  if(initialRoute.legacy&&initialRoute.problem)window.history.replaceState({page:'problem',problemId:initialRoute.problem.id,projectId:null,trackId:null},'',appPath('problem',initialRoute.problem))
  if(initialRoute.legacySection)window.history.replaceState({page:'problems',problemId:null,projectId:null,trackId:null},'',appPaths.problems)
  const onPopState=()=>{const route=routeFromLocation();setPage(route.page);setProjectId(route.projectId||null);setTrackId(route.trackId||null);setCareerId(route.careerId||null);if(route.problem)setSelected(route.problem)}
  window.addEventListener('popstate',onPopState)
  return()=>window.removeEventListener('popstate',onPopState)
 },[])

 useEffect(()=>{
  document.title=page==='problem'&&selected?`${selected.title} | HDLForge`:page==='career'&&careerId?`${careerPaths[careerId]?.label||'Career Roadmap'} | HDLForge`:(pageTitles[page]||pageTitles.home)
 },[page,selected?.id,careerId])

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

 return <div className="app">{page==='home'?<header className="nav"><div className="nav-inner"><button className="brand" onClick={()=>go('home')}><span className="brand-icon"><Zap size={17}/></span><span>HDL<span className="brand-accent">Forge</span></span></button><nav className="desktop-nav"><button className="active" onClick={()=>go('home')}>Home</button><button onClick={()=>go('problems')}>Problems</button><button onClick={()=>go('projects')}>Projects</button></nav><div className="nav-spacer"/><div className="nav-stat"><Flame size={15}/><strong>{streak}</strong><span>streak</span></div><div className="nav-stat"><Sparkles size={15}/><strong>{points}</strong><span>points</span></div><button className="profile" onClick={()=>setAccountOpen(true)} title={user?syncStatus:'Sign in to sync progress'} aria-label={user?'Open account':'Sign in'}><UserCircle size={20}/></button></div></header>:<header className="nav app-section-nav"><div className="nav-inner"><button className="brand" onClick={()=>go('home')} aria-label="HDLForge home"><span className="brand-icon"><Zap size={17}/></span><span>HDL<span className="brand-accent">Forge</span></span></button><nav className="desktop-nav"><button className={page==='problems'||(page==='problem'&&!projectId)?'active':''} onClick={()=>go('problems')}>Problems</button><button className={page==='projects'||Boolean(projectId)?'active':''} onClick={()=>go('projects')}>Projects</button></nav><div className="nav-spacer"/><button className="top-signin" onClick={()=>setAccountOpen(true)} title={user?syncStatus:'Sign in to sync progress'} aria-label={user?'Open account':'Sign in'}><UserCircle size={20}/></button></div></header>}<div className="layout"><main className="main"><Suspense fallback={<RouteLoading/>}>
 {page==='home'&&<LandingHub go={go} problemCount={problems.length} solvedCount={solved.length}/>} 
 {page==='problems'&&<Problems problems={filtered} allProblems={problems} solved={solved} query={query} setQuery={setQuery} category={category} setCategory={setCategory} difficulty={difficulty} setDifficulty={setDifficulty} language={language} setLanguage={setLanguage} status={status} setStatus={setStatus} onOpen={openProblem} tracks={tracks} activeTrack={activeTrack} onSelectTrack={selectTrack} onSelectCareer={openCareer}/>} 
 {page==='problem'&&selected&&<ProblemIDE key={(projectId||trackId||'problem')+'-'+selected.id} problem={selected} solved={solved.includes(selected.id)} draft={drafts[selected.id] || undefined} onBack={()=>careerId?openCareer(careerId):go(projectId?'projects':'problems')} onSolved={markSolved} onSave={saveDraft} onPrevious={openPrevious} onNext={openNext} hasPrevious={Boolean(previousProblem)} hasNext={Boolean(nextProblem)&&(!trackId||solved.includes(selected.id))} navigationLabel={activeProject?.title||(careerId?careerPaths[careerId]?.label:activeTrack?trackLabel(activeTrack)+' Track':selected.topic)}/>} 
 {page==='projects'&&<Projects onStartProject={startProject} solved={solved} drafts={drafts} onSelectCareer={openCareer}/>} 
 {page==='career'&&careerId&&careerPaths[careerId]&&<CareerPath career={careerPaths[careerId]} allProblems={problems} solved={solved} onOpenProblem={openProblem} onStartProject={startProject} onSelectCareer={openCareer}/>} 
 </Suspense></main></div>{accountOpen&&<Suspense fallback={null}><AccountModal open user={user} onClose={()=>setAccountOpen(false)} syncStatus={syncStatus}/></Suspense>}</div>
}

function Problems({problems,allProblems,solved,query,setQuery,category,setCategory,difficulty,setDifficulty,language,setLanguage,status,setStatus,onOpen,tracks,activeTrack,onSelectTrack,onSelectCareer}){
 const companyTracks=tracks.filter(track=>companyTrackIds.includes(track.id))
 const solvedInTrack=activeTrack?activeTrack.problemIds.filter(id=>solved.includes(id)).length:0
 const [expandedTopics,setExpandedTopics]=useState(['Combinational Logic'])
 const [topicsExpanded,setTopicsExpanded]=useState(false)
 const difficultyStats=['Easy','Medium','Hard'].map(name=>{
  const items=allProblems.filter(problem=>problem.difficulty===name)
  return {name,total:items.length,solved:items.filter(problem=>solved.includes(problem.id)).length}
 })
 const topicStats=useMemo(()=>problemTopics.map(name=>{
  const items=allProblems.filter(problem=>problem.topic===name)
  return {name,total:items.length,solved:items.filter(problem=>solved.includes(problem.id)).length}
 }),[allProblems,solved])
 const compactTopicStats=topicsExpanded?topicStats:topicStats.slice(0,3)
 const visibleTopicNames=category==='All'?problemTopics:problemTopics.filter(name=>name===category)
 const groupedProblems=visibleTopicNames.map(name=>({
  name,
  problems:problems.filter(problem=>problem.topic===name),
 })).filter(group=>!query||group.problems.length>0)
 const revealFiltered=Boolean(query)||difficulty!=='All'||language!=='All'||status!=='All'
 const toggleTopic=name=>setExpandedTopics(current=>current.includes(name)?current.filter(item=>item!==name):[...current,name])
 const chooseTopic=name=>{
  setCategory(name)
  if(name!=='All'){
   setExpandedTopics(current=>current.includes(name)?current:[...current,name])
   if(problemTopics.indexOf(name)>=3)setTopicsExpanded(true)
  }
 }
 return <div className="problems-workspace">
  <aside className="guided-roadmap" aria-label="Guided Roadmap">
   <section className="guided-roadmap-card">
    <h2>Guided Roadmap</h2>
    <div className="guided-roadmap-list">{careerRoadmaps.map(item=><button key={item.id} className={activeTrack?.id===item.id?'guided-roadmap-item active':'guided-roadmap-item'} onClick={()=>onSelectCareer(item.id)}>{item.label}<ChevronRight size={15}/></button>)}</div>
   </section>
  </aside>

  <section className="problems-content">
   <div className="page-head problems-page-head"><h1>Problems</h1><p>Build the skills that hardware interviews actually test. Browse by topic, company track or search below.</p></div>

   {activeTrack&&<div className="company-track-banner"><div><strong>{trackLabel(activeTrack)} Track</strong><span>{activeTrack.description}</span></div><div className="company-track-progress"><strong>{solvedInTrack}/{activeTrack.problemIds.length}</strong><span>solved</span></div><button className="company-track-exit" onClick={()=>onSelectTrack(null)}>Exit track</button></div>}

   <div className="toolbar"><div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search problems..."/></div></div>

   {!activeTrack&&<div className={topicsExpanded?'topic-cloud-shell expanded':'topic-cloud-shell'}>
    <div className="topic-cloud" aria-label="Problem topics">
     <button className={category==='All'?'topic-cloud-item active':'topic-cloud-item'} onClick={()=>chooseTopic('All')}><span>All</span><em>{allProblems.length}</em></button>
     {compactTopicStats.map(topic=><button key={topic.name} className={category===topic.name?'topic-cloud-item active':'topic-cloud-item'} onClick={()=>chooseTopic(topic.name)}><span>{topic.name}</span><em>{topic.total}</em></button>)}
    </div>
    <button className={topicsExpanded?'topic-cloud-toggle expanded':'topic-cloud-toggle'} onClick={()=>setTopicsExpanded(value=>!value)} aria-expanded={topicsExpanded}>{topicsExpanded?'Collapse':'Expand'}<ChevronDown size={18}/></button>
   </div>}

   {activeTrack?
    <div className="problem-list company-track-mode">{problems.map((p,i)=><ProblemRow key={p.id} p={p} index={i} solved={solved.includes(p.id)} onOpen={onOpen} trackMode trackTotal={activeTrack.problemIds.length}/>)}{!problems.length&&<div className="empty"><Filter size={28}/><h3>No problems found</h3><p>Try changing your filters or search.</p></div>}</div>
    :
    <div className="topic-groups">
     {groupedProblems.map(group=>{
      const stat=topicStats.find(item=>item.name===group.name)
      const expanded=revealFiltered||expandedTopics.includes(group.name)
      const percent=stat?.total?Math.round((stat.solved/stat.total)*100):0
      return <section key={group.name} className={expanded?'topic-group expanded':'topic-group'}>
       <button className="topic-group-head" onClick={()=>toggleTopic(group.name)} aria-expanded={expanded}>
        <ChevronRight className="topic-group-chevron" size={18}/>
        <strong>{group.name}</strong>
        <span className="topic-group-count">{stat?.solved||0}/{stat?.total||0}</span>
        <span className="topic-group-progress" aria-label={`${stat?.solved||0} of ${stat?.total||0} solved`}><i style={{width:`${percent}%`}}/></span>
       </button>
       {expanded&&<div className="topic-group-body">
        <div className="topic-group-problems">{group.problems.map((p,i)=><ProblemRow key={p.id} p={p} index={i} solved={solved.includes(p.id)} onOpen={onOpen}/>)}
         {!group.problems.length&&<div className="topic-empty">No problems in this topic yet.</div>}
        </div>
       </div>}
      </section>
     })}
     {!groupedProblems.length&&<div className="empty"><Filter size={28}/><h3>No problems found</h3><p>Try changing your filters or search.</p></div>}
    </div>
   }
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
function ProblemRow({p,index,solved,onOpen,trackMode=false,trackTotal=0}){return <button className="problem-row" onClick={()=>onOpen(p)}><span className={solved?'check done':'check'} aria-label={solved?'Solved':'Unsolved'}>{solved&&<span>✓</span>}</span><span className="problem-main"><span className="problem-index">{String(index+1).padStart(2,'0')}</span><span>{trackMode&&<span className="company-track-step">Step {index+1} of {trackTotal}</span>}<strong>{p.title}</strong><small>{p.topic} · {problemLanguageLabel(p)} · {p.tags.slice(0,2).join(' · ')}</small></span></span><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><ChevronRight className="row-chevron" size={17}/></button>}
createRoot(document.getElementById('root')).render(<App/>)