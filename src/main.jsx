import React, { useMemo, useState } from 'react'
import { Check, ChevronRight, Code2, Filter, Flame, Menu, RotateCcw, Search, Sparkles, X, Zap } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import problems from './data/problems.json'
import { runBrowserSimulation } from './browserSimulator'

const categories = ['All', 'RTL Design', 'SystemVerilog', 'SVA', 'UVM', 'Computer Architecture', 'Protocols', 'FPGA']
const difficulties = ['All', 'Easy', 'Medium', 'Hard']
const simulatorProblems = new Set(['rtl-mux', 'rtl-counter', 'rtl-priority', 'rtl-fifo'])

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) } catch { return fallback }
}

function App() {
  const [page, setPage] = useState('roadmap'), [selected, setSelected] = useState(null)
  const [query, setQuery] = useState(''), [category, setCategory] = useState('All'), [difficulty, setDifficulty] = useState('All')
  const [sidebar, setSidebar] = useState(false), [solved, setSolved] = useState(() => load('hdlforge-solved', []))
  const [drafts, setDrafts] = useState(() => load('hdlforge-drafts', {}))
  const toggleSolved = id => { const next = solved.includes(id) ? solved.filter(x => x !== id) : [...solved, id]; setSolved(next); localStorage.setItem('hdlforge-solved', JSON.stringify(next)) }
  const saveDraft = (id, code) => { const next = {...drafts, [id]:code}; setDrafts(next); localStorage.setItem('hdlforge-drafts', JSON.stringify(next)) }
  const filtered = useMemo(() => problems.filter(p => (category==='All'||p.category===category) && (difficulty==='All'||p.difficulty===difficulty) && (!query || `${p.title} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))), [category,difficulty,query])
  const openProblem = p => { setSelected(p); setPage('problem'); setSidebar(false) }
  const go = p => { setPage(p); setSelected(null); setSidebar(false) }
  const browseCategory = c => { setCategory(c); setPage('problems'); setSidebar(false) }

  return <div className="app"><header className="nav"><div className="nav-inner"><button className="brand" onClick={()=>go('roadmap')}><span className="brand-icon"><Zap size={17}/></span>HDLForge</button><nav className="desktop-nav"><button className={page==='roadmap'?'active':''} onClick={()=>go('roadmap')}>Roadmap</button><button className={page==='problems'||page==='problem'?'active':''} onClick={()=>go('problems')}>Problems</button><button className={page==='progress'?'active':''} onClick={()=>go('progress')}>Progress</button></nav><button className="menu-btn" onClick={()=>setSidebar(!sidebar)}>{sidebar?<X/>:<Menu/>}</button></div></header>
    <div className="layout">{sidebar&&<div className="mobile-backdrop" onClick={()=>setSidebar(false)}/>}<aside className={sidebar?'sidebar open':'sidebar'}><div className="sidebar-title">LEARN</div>{categories.slice(1).map(c=><button key={c} onClick={()=>browseCategory(c)} className={category===c?'side-link selected':'side-link'}><span>{c}</span><span>{problems.filter(p=>p.category===c).length}</span></button>)}<div className="sidebar-title spaced">YOUR PROGRESS</div><div className="mini-progress"><div className="progress-track"><div style={{width:`${Math.round(solved.length/problems.length*100)}%`}}/></div><strong>{solved.length}/{problems.length}</strong><span> solved</span></div></aside>
      <main className="main">{page==='roadmap'&&<Roadmap solved={solved} onOpen={openProblem} go={go} browseCategory={browseCategory}/>} {page==='problems'&&<Problems problems={filtered} solved={solved} query={query} setQuery={setQuery} category={category} setCategory={setCategory} difficulty={difficulty} setDifficulty={setDifficulty} onOpen={openProblem} onToggle={toggleSolved}/>} {page==='problem'&&selected&&<Problem problem={selected} solved={solved.includes(selected.id)} draft={drafts[selected.id]} onBack={()=>go('problems')} onToggle={()=>toggleSolved(selected.id)} onSave={saveDraft}/>} {page==='progress'&&<Progress problems={problems} solved={solved} onOpen={openProblem} onToggle={toggleSolved}/>}</main>
    </div></div>
}

function Roadmap({solved,onOpen,go,browseCategory}) { const groups=categories.slice(1).map(category=>({category,items:problems.filter(p=>p.category===category)})); const next=problems.find(p=>!solved.includes(p.id))||problems[0]; return <div><section className="hero"><div className="eyebrow"><span className="dot"/> HARDWARE INTERVIEW ROADMAP</div><h1>Master hardware design.<br/><span>One problem at a time.</span></h1><p>Practice RTL, SystemVerilog, verification, architecture and protocols with focused, interview-style problems.</p><div className="hero-actions"><button className="primary" onClick={()=>onOpen(next)}>Continue practice <ChevronRight size={17}/></button><button className="secondary" onClick={()=>go('problems')}>Browse all problems</button></div></section><section className="stats"><div><strong>{problems.length}</strong><span>Problems</span></div><div><strong>{categories.length-1}</strong><span>Topics</span></div><div><strong>{solved.length}</strong><span>Solved</span></div><div><strong>{solved.length?Math.min(99,solved.length*3):0}</strong><span>Practice score</span></div></section><div className="section-heading"><div><div className="eyebrow">ROADMAP</div><h2>Choose a topic</h2></div><button className="text-btn" onClick={()=>go('problems')}>View all <ChevronRight size={15}/></button></div><div className="topic-grid">{groups.map((g,i)=>{const done=g.items.filter(p=>solved.includes(p.id)).length;return <button className="topic-card" key={g.category} onClick={()=>browseCategory(g.category)}><div className="topic-number">0{i+1}</div><div className="topic-info"><h3>{g.category}</h3><p>{g.items[0]?.description||'Practice core hardware concepts.'}</p><div className="topic-meta"><span>{done}/{g.items.length} solved</span><span className="chevron"><ChevronRight size={16}/></span></div><div className="progress-track"><div style={{width:`${g.items.length?done/g.items.length*100:0}%`}}/></div></div></button>})}</div></div> }

function Problems({problems,solved,query,setQuery,category,setCategory,difficulty,setDifficulty,onOpen,onToggle}) { return <div><div className="page-head"><div className="eyebrow">PROBLEM SET</div><h1>Problems</h1><p>Build the skills that hardware interviews actually test.</p></div><div className="toolbar"><div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search problems..."/></div><div className="filters"><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={difficulty} onChange={e=>setDifficulty(e.target.value)}>{difficulties.map(d=><option key={d}>{d}</option>)}</select></div></div><div className="problem-list">{problems.map((p,i)=><ProblemRow key={p.id} p={p} index={i} solved={solved.includes(p.id)} onOpen={onOpen} onToggle={onToggle}/>)}{!problems.length&&<div className="empty"><Filter size={28}/><h3>No problems found</h3><p>Try changing your filters or search.</p></div>}</div></div> }
function ProblemRow({p,index,solved,onOpen,onToggle}) { return <div className="problem-row"><button aria-label={solved?'Unmark solved':'Mark solved'} className={solved?'check done':'check'} onClick={()=>onToggle(p.id)}>{solved&&<Check size={15}/>}</button><button className="problem-main" onClick={()=>onOpen(p)}><span className="problem-index">{String(index+1).padStart(2,'0')}</span><span><strong>{p.title}</strong><small>{p.category} · {p.tags.slice(0,2).join(' · ')}</small></span></button><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><ChevronRight className="row-chevron" size={17}/></div> }

function formatSimulationOutput(output, passed) {
  if (passed) return 'All test cases passed.'
  const fatal = output?.match(/FATAL:\s*(?:[^\n]*\/tb\.sv:\d+:\s*)?([^\n]+)/i)
  if (fatal?.[1]) return `Test failed: ${fatal[1].trim()}`
  const error = output?.split('\n').find(line => /error|fatal/i.test(line))
  return error?.trim() || 'Test failed. Check your implementation and try again.'
}

function Problem({problem,solved,draft,onBack,onToggle,onSave}) {
  const [code,setCode]=useState(draft??problem.starterCode), [tab,setTab]=useState('problem'), [result,setResult]=useState(null), [showSolution,setShowSolution]=useState(false), [running,setRunning]=useState(false)
  const update=value=>{setCode(value);onSave(problem.id,value)}, reset=()=>{setCode(problem.starterCode);onSave(problem.id,problem.starterCode);setResult(null)}
  const runChecks=async()=>{
    setRunning(true); setResult(null)
    if (simulatorProblems.has(problem.id)) {
      try {
        const data = await runBrowserSimulation(problem.id, code)
        setResult({mode:'simulation',pass:data.passed,output:formatSimulationOutput(data.output, data.passed)})
      } catch(error) {
        setResult({mode:'simulation',pass:false,output:error?.message||'Browser simulator failed to start.'})
      } finally {
        setRunning(false)
      }
      return
    }
    const checks=problem.checks||[], missing=checks.filter(c=>!c.patterns.some(pattern=>new RegExp(pattern,'i').test(code))), hasStarter=/Your RTL here|Write your|Add modports|Complete the FSM|Synchronizer \+ debounce logic|Fetch, drive/i.test(code), pass=missing.length===0&&!hasStarter&&code.trim().length>20
    setResult({mode:'static',pass,missing,output:pass?'Static structure checks passed.':'Missing or incomplete requirements: '+missing.map(x=>x.name).join(', ')})
    setRunning(false)
  }
  return <div><button className="back" onClick={onBack}>← Back to problems</button><div className="problem-layout"><article className="statement"><div className="eyebrow">{problem.category}</div><div className="problem-title-line"><h1>{problem.title}</h1><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span></div><div className="problem-tabs"><button className={tab==='problem'?'active':''} onClick={()=>setTab('problem')}>Problem</button><button className={tab==='approach'?'active':''} onClick={()=>setTab('approach')}>Approach</button><button className={tab==='solution'?'active':''} onClick={()=>setTab('solution')}>Solution</button></div>{tab==='problem'&&<><p className="lead">{problem.description}</p><h2>Task</h2><p>{problem.task}</p><h2>Examples</h2><div className="examples">{problem.examples.map((e,i)=><div key={i}><span>Example {i+1}</span><pre>{e}</pre></div>)}</div><h2>Constraints</h2><ul>{problem.constraints.map(c=><li key={c}>{c}</li>)}</ul></>}{tab==='approach'&&<div className="content-card"><h2>How to think about it</h2><p>{problem.approach||'Start by identifying the required inputs, outputs, clock/reset semantics and the state that must be remembered. Write the simplest synthesizable implementation first, then check corner cases.'}</p><h2>Interview checkpoints</h2><ul><li>Explain the timing assumptions.</li><li>Identify reset behaviour explicitly.</li><li>Consider synthesis and simulation differences.</li></ul></div>}{tab==='solution'&&<div className="content-card"><h2>Reference solution</h2><p>Try the problem first. Reveal the reference implementation when you are ready.</p>{showSolution?<pre className="solution-code">{problem.solution||'Reference solution will be added for this problem.'}</pre>:<button className="secondary" onClick={()=>setShowSolution(true)}><Sparkles size={15}/> Reveal solution</button>}</div>}</article><aside className="editor-card"><div className="editor-head"><span><Code2 size={15}/> SystemVerilog</span><button className="icon-btn" title="Reset code" onClick={reset}><RotateCcw size={14}/></button></div><textarea value={code} onChange={e=>update(e.target.value)} spellCheck="false" aria-label="SystemVerilog editor"/><div className="editor-foot"><button className={solved?'success':'secondary'} onClick={onToggle}>{solved?<><Check size={16}/> Solved</>:<>Mark as solved</>}</button><button className="primary" disabled={running} onClick={runChecks}>{running?'Running…':simulatorProblems.has(problem.id)?'Run simulation':'Run checks'}</button></div>{result&&<div className={result.pass?'run-result pass':'run-result fail'}><strong>{result.pass?'✓ '+(result.mode==='simulation'?'Test passed':'Checks passed'):'× '+(result.mode==='simulation'?'Test failed':'Checks failed')}</strong><pre>{result.output}</pre></div>}<div className="run-note">{simulatorProblems.has(problem.id)?'Runs entirely in your browser using an Icarus Verilog WebAssembly simulator. Your HDL is not sent to a server.':'This problem currently uses browser-side structural checks. Full HDL simulation will be enabled as its testbench is added.'}</div></aside></div></div>
}

function Progress({problems,solved,onOpen,onToggle}) { const pct=Math.round(solved.length/problems.length*100); return <div><div className="page-head"><div className="eyebrow">YOUR JOURNEY</div><h1>Progress</h1><p>Track your preparation across the HDLForge roadmap.</p></div><div className="progress-hero"><div className="ring"><strong>{pct}%</strong><span>complete</span></div><div><h2>{solved.length} of {problems.length} problems solved</h2><p>Your progress and code drafts are saved locally in this browser.</p><div className="progress-track large"><div style={{width:`${pct}%`}}/></div></div></div><h2 className="subhead">Solved problems</h2><div className="problem-list">{problems.filter(p=>solved.includes(p.id)).map((p,i)=><ProblemRow key={p.id} p={p} index={i} solved={true} onOpen={onOpen} onToggle={onToggle}/>)}{!solved.length&&<div className="empty"><Flame size={28}/><h3>No solved problems yet</h3><p>Open a problem and mark it solved when you are confident.</p></div>}</div></div> }

createRoot(document.getElementById('root')).render(<App />)
