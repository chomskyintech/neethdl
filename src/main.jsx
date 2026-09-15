import React,{lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react'
import {ChevronRight,Filter,Flame,Sparkles,Search,UserCircle,Zap}from'lucide-react'
import {createRoot} from 'react-dom/client'
import './styles.css'
import './language-ui.css'
import './waveform-discussion.css'
import './account-tracks.css'
import './home-projects.css'
import './courses.css'
import './riscv-lab.css'
import './lockedEditor.js'
import problems from './data/activeProblems'
import LandingHub from './LandingHub'
import {addActivityDay,calculatePoints,calculateStreak,topicProgress} from './progressTracking'

const ProblemIDE=lazy(()=>import('./ProblemIDE'))
const Tracks=lazy(()=>import('./Tracks'))
const AccountModal=lazy(()=>import('./AccountModal'))
const Projects=lazy(()=>import('./Projects'))
const Courses=lazy(()=>import('./Courses'))
const InterviewMode=lazy(()=>import('./InterviewMode'))
const RiscvCoreLab=lazy(()=>import('./RiscvCoreLab'))

const categories=['All','RTL Design','SystemVerilog','SVA','UVM','Protocols','FPGA','Accelerators']
const difficulties=['All','Easy','Medium','Hard']
const languages=['All','Verilog','SystemVerilog','VHDL']
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}}
const appPaths={home:'/',problems:'/app/problems/',tracks:'/app/tracks/',interview:'/app/interview/',projects:'/app/projects/','riscv-project':'/app/projects/riscv-core/',courses:'/app/courses/',progress:'/app/progress/'}
const pageTitles={home:'HDLForge — Hardware Design Interview Practice',problems:'Problems | HDLForge',tracks:'Tracks | HDLForge',interview:'Interview Mode | HDLForge',projects:'Projects | HDLForge','riscv-project':'RISC-V Core Project | HDLForge',courses:'Courses | HDLForge',progress:'Progress | HDLForge'}

function problemLanguages(p){
 if(p.languages?.length)return p.languages
 if(p.category==='RTL Design'||p.category==='Protocols'||p.category==='FPGA')return ['Verilog','SystemVerilog','VHDL']
 if(p.category==='Accelerators')return ['Verilog','SystemVerilog']
 if(p.category==='SystemVerilog'||p.category==='SVA'||p.category==='UVM')return ['SystemVerilog']
 return []
}
function problemLanguageLabel(p){const ls=problemLanguages(p);return ls.length?ls.join(' / '):'Conceptual'}
function normalizePath(path){return path==='/'?'/':path.replace(/\/+$/,'')}
function appPath(page,problem){return page==='problem'&&problem?`/app/problems/${encodeURIComponent(problem.id)}/`:(appPaths[page]||'/')}
function routeFromLocation(){
 const path=normalizePath(window.location.pathname)
 const problemMatch=path.match(/^\/app\/problems\/([^/]+)$/)
 if(problemMatch){
  const id=decodeURIComponent(problemMatch[1])
  const problem=problems.find(p=>p.id===id)
  if(problem)return {page:'problem',problem}
 }
 const legacyId=new URLSearchParams(window.location.search).get('problem')
 if(legacyId){const problem=problems.find(p=>p.id===legacyId);if(problem)return {page:'problem',problem,legacy:true}}
 for(const [page,target] of Object.entries(appPaths))if(normalizePath(target)===path)return {page,problem:null}
 return {page:'home',problem:null}
}
function RouteLoading(){return <div role="status" aria-live="polite" style={{padding:'48px 24px',color:'var(--muted)'}}>Loading HDLForge…</div>}

function App(){
 const initialRoute=useRef(routeFromLocation()).current
 const [page,setPage]=useState(initialRoute.page),[selected,setSelected]=useState(initialRoute.problem||problems[0]||null),[query,setQuery]=useState(''),[category,setCategory]=useState('All'),[difficulty,setDifficulty]=useState('All'),[language,setLanguage]=useState('All'),[status,setStatus]=useState('All'),[solved,setSolved]=useState(()=>load('hdlforge-solved',[])),[drafts,setDrafts]=useState(()=>load('hdlforge-drafts',{})),[draftUpdatedAt,setDraftUpdatedAt]=useState(()=>load('hdlforge-draft-updated-at',{})),[activityDays,setActivityDays]=useState(()=>load('hdlforge-activity-days',[])),[user,setUser]=useState(null),[accountOpen,setAccountOpen]=useState(false),[cloudReady,setCloudReady]=useState(false),[syncStatus,setSyncStatus]=useState('Local only')
 const syncTimer=useRef(null)
 const markSolved=id=>{if(solved.includes(id))return;const n=[...solved,id];setSolved(n);localStorage.setItem('hdlforge-solved',JSON.stringify(n));const days=addActivityDay(activityDays);setActivityDays(days);localStorage.setItem('hdlforge-activity-days',JSON.stringify(days))}
 const saveDraft=(id,code)=>{const n={...drafts,[id]:code},updated={...draftUpdatedAt,[id]:new Date().toISOString()};setDrafts(n);setDraftUpdatedAt(updated);localStorage.setItem('hdlforge-drafts',JSON.stringify(n));localStorage.setItem('hdlforge-draft-updated-at',JSON.stringify(updated))}
 const filtered=useMemo(()=>problems.filter(p=>{const ls=problemLanguages(p);return (category==='All'||p.category===category)&&(difficulty==='All'||p.difficulty===difficulty)&&(language==='All'||ls.includes(language))&&(status==='All'||(status==='Solved'?solved.includes(p.id):!solved.includes(p.id)))&&(!query||`${p.title} ${p.category} ${problemLanguageLabel(p)} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))}),[category,difficulty,language,status,query,solved])
 const points=useMemo(()=>calculatePoints(problems,solved),[solved]),streak=useMemo(()=>calculateStreak(activityDays),[activityDays]),topicStats=useMemo(()=>topicProgress(problems,solved),[solved])
 const navigate=(nextPage,problem=null,{replace=false}={})=>{
  if(nextPage==='problem'&&problem)setSelected(problem)
  setPage(nextPage)
  const target=appPath(nextPage,problem)
  const current=`${window.location.pathname}${window.location.search}`
  if(current!==target)window.history[replace?'replaceState':'pushState']({page:nextPage,problemId:problem?.id||null},'',target)
  window.scrollTo({top:0,behavior:'auto'})
 }
 const openProblem=p=>navigate('problem',p)
 const go=p=>navigate(p)
 const selectedIndex=selected?problems.findIndex(p=>p.id===selected.id):-1
 const previousProblem=selectedIndex>0?problems[selectedIndex-1]:null
 const nextProblem=selectedIndex>=0&&selectedIndex<problems.length-1?problems[selectedIndex+1]:null
 const openPrevious=()=>previousProblem&&openProblem(previousProblem)
 const openNext=()=>nextProblem&&openProblem(nextProblem)

 useEffect(()=>{
  if(initialRoute.legacy&&initialRoute.problem)window.history.replaceState({page:'problem',problemId:initialRoute.problem.id},'',appPath('problem',initialRoute.problem))
  const onPopState=()=>{const route=routeFromLocation();setPage(route.page);if(route.problem)setSelected(route.problem)}
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

 const profileLabel=user?(user.name||user.email||'Account').trim().slice(0,2).toUpperCase():'Sign in'
 return <div className="app"><header className="nav"><div className="nav-inner"><button className="brand" onClick={()=>go('home')}><span className="brand-icon"><Zap size={17}/></span><span>HDL<span className="brand-accent">Forge</span></span></button><nav className="desktop-nav"><button className={page==='home'?'active':''} onClick={()=>go('home')}>Home</button><button className={page==='problems'||page==='problem'?'active':''} onClick={()=>go('problems')}>Problems</button><button className={page==='tracks'?'active':''} onClick={()=>go('tracks')}>Tracks</button><button className={page==='interview'?'active':''} onClick={()=>go('interview')}>Interview</button><button className={page==='projects'||page==='riscv-project'?'active':''} onClick={()=>go('projects')}>Projects</button><button className={page==='courses'?'active':''} onClick={()=>go('courses')}>Courses</button><button className={page==='progress'?'active':''} onClick={()=>go('progress')}>Progress</button></nav><div className="nav-spacer"/><div className="nav-stat"><Flame size={15}/><strong>{streak}</strong><span>streak</span></div><div className="nav-stat"><Sparkles size={15}/><strong>{points}</strong><span>points</span></div><button className="profile" onClick={()=>setAccountOpen(true)} title={user?syncStatus:'Sign in to sync progress'}><UserCircle size={20}/><span>{profileLabel}</span></button></div></header><div className="layout"><main className="main"><Suspense fallback={<RouteLoading/>}>
 {page==='home'&&<LandingHub go={go} problemCount={problems.length} solvedCount={solved.length}/>} 
 {page==='problems'&&<Problems problems={filtered} allProblems={problems} solved={solved} query={query} setQuery={setQuery} category={category} setCategory={setCategory} difficulty={difficulty} setDifficulty={setDifficulty} language={language} setLanguage={setLanguage} status={status} setStatus={setStatus} onOpen={openProblem}/>} 
 {page==='problem'&&selected&&<ProblemIDE key={selected.id} problem={selected} solved={solved.includes(selected.id)} draft={drafts[selected.id] || undefined} onBack={()=>go('problems')} onSolved={markSolved} onSave={saveDraft} onPrevious={openPrevious} onNext={openNext} hasPrevious={Boolean(previousProblem)} hasNext={Boolean(nextProblem)}/>} 
 {page==='tracks'&&<Tracks problems={problems} solved={solved} onOpen={openProblem}/>} 
 {page==='interview'&&<InterviewMode onExit={()=>go('home')}/>} 
 {page==='projects'&&<Projects onStartRiscv={()=>go('riscv-project')}/>}
 {page==='riscv-project'&&<RiscvCoreLab onExit={()=>go('projects')}/>}
 {page==='courses'&&<Courses problems={problems} onOpen={openProblem} go={go}/>} 
 {page==='progress'&&<Progress problems={problems} solved={solved} onOpen={openProblem} points={points} streak={streak} topicStats={topicStats}/>} 
 </Suspense></main></div>{accountOpen&&<Suspense fallback={null}><AccountModal open user={user} onClose={()=>setAccountOpen(false)} syncStatus={syncStatus}/></Suspense>}</div>
}

function Problems({problems,allProblems,solved,query,setQuery,category,setCategory,difficulty,setDifficulty,language,setLanguage,status,setStatus,onOpen}){return <div><div className="page-head"><div className="eyebrow">PROBLEM SET</div><h1>Problems</h1><p>Build the skills that hardware interviews actually test. Choose a section or use the filters below.</p></div><div className="problem-sections"><button className={category==='All'?'problem-section-btn active':'problem-section-btn'} onClick={()=>setCategory('All')}>All · {allProblems.length}</button>{categories.slice(1).map(c=><button key={c} className={category===c?'problem-section-btn active':'problem-section-btn'} onClick={()=>setCategory(c)}>{c} · {allProblems.filter(p=>p.category===c).length}</button>)}</div><div className="toolbar"><div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search problems..."/></div><div className="filters"><select value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Language"><option>All</option>{languages.slice(1).map(l=><option key={l}>{l}</option>)}</select><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Topic"><option>All</option>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select><select value={difficulty} onChange={e=>setDifficulty(e.target.value)} aria-label="Difficulty"><option>All</option>{difficulties.slice(1).map(d=><option key={d}>{d}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)} aria-label="Status"><option>All</option><option>Unsolved</option><option>Solved</option></select></div></div><div className="problem-list">{problems.map((p,i)=><ProblemRow key={p.id} p={p} index={i} solved={solved.includes(p.id)} onOpen={onOpen}/>)}{!problems.length&&<div className="empty"><Filter size={28}/><h3>No problems found</h3><p>Try changing your filters or search.</p></div>}</div></div>}
function ProblemRow({p,index,solved,onOpen}){return <button className="problem-row" onClick={()=>onOpen(p)}><span className={solved?'check done':'check'} aria-label={solved?'Solved':'Unsolved'}>{solved&&<span>✓</span>}</span><span className="problem-main"><span className="problem-index">{String(index+1).padStart(2,'0')}</span><span><strong>{p.title}</strong><small>{p.category} · {problemLanguageLabel(p)} · {p.tags.slice(0,2).join(' · ')}</small></span></span><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><ChevronRight className="row-chevron" size={17}/></button>}
function Progress({problems,solved,onOpen,points,streak,topicStats}){const pct=problems.length?Math.round(solved.length/problems.length*100):0;return <div><div className="page-head"><div className="eyebrow">YOUR JOURNEY</div><h1>Progress</h1><p>Track your preparation across HDLForge.</p></div><div className="progress-hero"><div className="ring"><strong>{pct}%</strong><span>complete</span></div><div><h2>{solved.length} of {problems.length} problems solved</h2><div className="progress-track large"><div style={{width:`${pct}%`}}/></div><p>{points} points · {streak} day streak</p></div></div><h2 className="subhead">Topic progress</h2><div className="problem-list">{Object.entries(topicStats).map(([name,stats])=><div className="problem-row" key={name}><span className="problem-main"><span><strong>{name}</strong><small>{stats.solved} of {stats.total} solved · {stats.total?Math.round(stats.solved/stats.total*100):0}%</small></span></span></div>)}</div><h2 className="subhead" style={{marginTop:'28px'}}>Solved problems</h2><div className="problem-list">{problems.filter(p=>solved.includes(p.id)).map((p,i)=><ProblemRow key={p.id} p={p} index={i} solved onOpen={onOpen}/>)}</div></div>}
createRoot(document.getElementById('root')).render(<App/>)
