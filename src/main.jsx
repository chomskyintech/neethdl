import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Check, ChevronRight, Code2, Filter, Flame, Menu, Search, X, Zap } from 'lucide-react'
import './styles.css'
import problems from './data/problems.json'

const categories = ['All', 'RTL Design', 'SystemVerilog', 'SVA', 'UVM', 'Computer Architecture', 'Protocols', 'FPGA']
const difficulties = ['All', 'Easy', 'Medium', 'Hard']

function App() {
  const [page, setPage] = useState('roadmap')
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [sidebar, setSidebar] = useState(false)
  const [solved, setSolved] = useState(() => JSON.parse(localStorage.getItem('hdlforge-solved') || '[]'))

  const toggleSolved = (id) => {
    const next = solved.includes(id) ? solved.filter(x => x !== id) : [...solved, id]
    setSolved(next)
    localStorage.setItem('hdlforge-solved', JSON.stringify(next))
  }

  const filtered = useMemo(() => problems.filter(p =>
    (category === 'All' || p.category === category) &&
    (difficulty === 'All' || p.difficulty === difficulty) &&
    (!query || `${p.title} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  ), [category, difficulty, query])

  const openProblem = (p) => { setSelected(p); setPage('problem'); setSidebar(false) }
  const go = (p) => { setPage(p); setSelected(null); setSidebar(false) }

  return <div className="app">
    <header className="nav">
      <div className="nav-inner">
        <button className="brand" onClick={() => go('roadmap')}><span className="brand-icon"><Zap size={17} /></span>HDLForge</button>
        <nav className="desktop-nav">
          <button className={page === 'roadmap' ? 'active' : ''} onClick={() => go('roadmap')}>Roadmap</button>
          <button className={page === 'problems' || page === 'problem' ? 'active' : ''} onClick={() => go('problems')}>Problems</button>
          <button className={page === 'progress' ? 'active' : ''} onClick={() => go('progress')}>Progress</button>
        </nav>
        <button className="menu-btn" onClick={() => setSidebar(!sidebar)}>{sidebar ? <X /> : <Menu />}</button>
      </div>
    </header>

    <div className="layout">
      {sidebar && <div className="mobile-backdrop" onClick={() => setSidebar(false)} />}
      <aside className={sidebar ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-title">LEARN</div>
        {categories.slice(1).map(c => <button key={c} onClick={() => { setCategory(c); setPage('problems'); setSidebar(false) }} className={category === c ? 'side-link selected' : 'side-link'}><span>{c}</span><span>{problems.filter(p => p.category === c).length}</span></button>)}
        <div className="sidebar-title spaced">YOUR PROGRESS</div>
        <div className="mini-progress"><div className="progress-track"><div style={{width: `${Math.round(solved.length / problems.length * 100)}%`}} /></div><strong>{solved.length}/{problems.length}</strong><span> solved</span></div>
      </aside>

      <main className="main">
        {page === 'roadmap' && <Roadmap solved={solved} onOpen={openProblem} go={go} />}
        {page === 'problems' && <Problems problems={filtered} solved={solved} query={query} setQuery={setQuery} category={category} setCategory={setCategory} difficulty={difficulty} setDifficulty={setDifficulty} onOpen={openProblem} onToggle={toggleSolved} />}
        {page === 'problem' && selected && <Problem problem={selected} solved={solved.includes(selected.id)} onBack={() => go('problems')} onToggle={() => toggleSolved(selected.id)} />}
        {page === 'progress' && <Progress problems={problems} solved={solved} onOpen={openProblem} />}
      </main>
    </div>
  </div>
}

function Roadmap({ solved, onOpen, go }) {
  const groups = categories.slice(1).map(category => ({ category, items: problems.filter(p => p.category === category) }))
  return <div>
    <section className="hero">
      <div className="eyebrow"><span className="dot" /> Hardware interview roadmap</div>
      <h1>Master hardware design.<br /><span>One problem at a time.</span></h1>
      <p>Practice RTL, SystemVerilog, verification, architecture and protocols with focused, interview-style problems.</p>
      <div className="hero-actions"><button className="primary" onClick={() => onOpen(problems.find(p => !solved.includes(p.id)) || problems[0])}>Continue practice <ChevronRight size={17} /></button><button className="secondary" onClick={() => go('problems')}>Browse all problems</button></div>
    </section>
    <section className="stats"><div><strong>{problems.length}</strong><span>Problems</span></div><div><strong>{categories.length - 1}</strong><span>Topics</span></div><div><strong>{solved.length}</strong><span>Solved</span></div><div><strong>{solved.length ? Math.min(99, solved.length * 3) : 0}</strong><span>Day streak</span></div></section>
    <div className="section-heading"><div><div className="eyebrow">ROADMAP</div><h2>Choose a topic</h2></div><button className="text-btn" onClick={() => go('problems')}>View all <ChevronRight size={15} /></button></div>
    <div className="topic-grid">{groups.map((g, i) => { const done = g.items.filter(p => solved.includes(p.id)).length; return <button className="topic-card" key={g.category} onClick={() => { go('problems'); }}><div className="topic-number">0{i + 1}</div><div className="topic-info"><h3>{g.category}</h3><p>{g.items[0]?.description || 'Practice core hardware concepts.'}</p><div className="topic-meta"><span>{done}/{g.items.length} solved</span><span className="chevron"><ChevronRight size={16} /></span></div><div className="progress-track"><div style={{width: `${g.items.length ? done / g.items.length * 100 : 0}%`}} /></div></div></button> })}</div>
  </div>
}

function Problems({ problems, solved, query, setQuery, category, setCategory, difficulty, setDifficulty, onOpen, onToggle }) {
  return <div><div className="page-head"><div className="eyebrow">PROBLEM SET</div><h1>Problems</h1><p>Build the skills that hardware interviews actually test.</p></div><div className="toolbar"><div className="search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search problems..." /></div><div className="filters"><select value={category} onChange={e => setCategory(e.target.value)}><option>All</option>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select><select value={difficulty} onChange={e => setDifficulty(e.target.value)}>{difficulties.map(d => <option key={d}>{d}</option>)}</select></div></div><div className="problem-list">{problems.map((p, i) => <ProblemRow key={p.id} p={p} index={i} solved={solved.includes(p.id)} onOpen={onOpen} onToggle={onToggle} />)}{!problems.length && <div className="empty"><Filter size={28}/><h3>No problems found</h3><p>Try changing your filters or search.</p></div>}</div></div>
}

function ProblemRow({p, index, solved, onOpen, onToggle}) { return <div className="problem-row"><button className={solved ? 'check done' : 'check'} onClick={() => onToggle(p.id)}>{solved && <Check size={15}/>}</button><button className="problem-main" onClick={() => onOpen(p)}><span className="problem-index">{String(index + 1).padStart(2, '0')}</span><span><strong>{p.title}</strong><small>{p.category} · {p.tags.slice(0, 2).join(' · ')}</small></span></button><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><ChevronRight className="row-chevron" size={17}/></div> }

function Problem({problem, solved, onBack, onToggle}) { return <div><button className="back" onClick={onBack}>← Back to problems</button><div className="problem-layout"><article className="statement"><div className="eyebrow">{problem.category}</div><div className="problem-title-line"><h1>{problem.title}</h1><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span></div><p className="lead">{problem.description}</p><h2>Task</h2><p>{problem.task}</p><h2>Examples</h2><div className="examples">{problem.examples.map((e, i) => <div key={i}><span>Example {i + 1}</span><pre>{e}</pre></div>)}</div><h2>Constraints</h2><ul>{problem.constraints.map(c => <li key={c}>{c}</li>)}</ul></article><aside className="editor-card"><div className="editor-head"><span><Code2 size={15}/> SystemVerilog</span><span className="unsaved">Starter code</span></div><textarea defaultValue={problem.starterCode} spellCheck="false" /><div className="editor-foot"><button className={solved ? 'success' : 'primary'} onClick={onToggle}>{solved ? <><Check size={16}/> Solved</> : <>Mark as solved</>}</button><button className="secondary">Run tests</button></div><div className="run-note">Code execution is the next platform layer. The editor and problem workflow are now in place; simulator-backed tests will be connected in the next phase.</div></aside></div></div> }

function Progress({problems, solved, onOpen}) { const pct = Math.round(solved.length / problems.length * 100); return <div><div className="page-head"><div className="eyebrow">YOUR JOURNEY</div><h1>Progress</h1><p>Track your preparation across the HDLForge roadmap.</p></div><div className="progress-hero"><div className="ring"><strong>{pct}%</strong><span>complete</span></div><div><h2>{solved.length} of {problems.length} problems solved</h2><p>Keep working through the roadmap. Your progress is saved locally in this browser.</p><div className="progress-track large"><div style={{width: `${pct}%`}} /></div></div></div><h2 className="subhead">Solved problems</h2><div className="problem-list">{problems.filter(p => solved.includes(p.id)).map((p,i) => <ProblemRow key={p.id} p={p} index={i} solved={true} onOpen={onOpen} onToggle={() => {}} />)}{!solved.length && <div className="empty"><Flame size={28}/><h3>No solved problems yet</h3><p>Open a problem and mark it solved when you are confident.</p></div>}</div></div> }

createRoot(document.getElementById('root')).render(<App />)
