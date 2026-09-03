import React, { useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Code2,
  FileCode2,
  MessageSquare,
  Play,
  RotateCcw,
  Terminal,
} from 'lucide-react'
import { runBrowserSimulation } from './browserSimulator'
import './ide-overrides.css'

const RUNNER_URL = (import.meta.env.VITE_RUNNER_URL || '').replace(/\/$/, '')
const languages = ['Verilog', 'SystemVerilog', 'VHDL']

const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

const vhdlStarters = {
  'rtl-mux': `library ieee; use ieee.std_logic_1164.all; entity mux2 is port(a,b,sel: in std_logic; y: out std_logic); end; architecture rtl of mux2 is begin -- Your RTL here end;`,
  'rtl-counter': `library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; entity counter is generic(WIDTH: positive:=8); port(clk,reset: in std_logic; count: out std_logic_vector(WIDTH-1 downto 0)); end; architecture rtl of counter is begin -- Your RTL here end;`,
  'rtl-priority': `library ieee; use ieee.std_logic_1164.all; entity priority_encoder is port(inp: in std_logic_vector(7 downto 0); index: out std_logic_vector(2 downto 0); valid: out std_logic); end; architecture rtl of priority_encoder is begin -- Your RTL here end;`,
  'rtl-fifo': `library ieee; use ieee.std_logic_1164.all; entity fifo is generic(WIDTH: positive:=8; DEPTH: positive:=4); port(clk,reset,wr_en,rd_en: in std_logic; din: in std_logic_vector(WIDTH-1 downto 0); dout: out std_logic_vector(WIDTH-1 downto 0); full,empty: out std_logic); end; architecture rtl of fifo is begin -- Your RTL here end;`,
  'rtl-shift-register': `library ieee; use ieee.std_logic_1164.all; entity shift_reg is generic(WIDTH: positive:=8); port(clk,reset,shift_en,din: in std_logic; dout: out std_logic_vector(WIDTH-1 downto 0)); end; architecture rtl of shift_reg is begin -- Your RTL here end;`,
  'rtl-edge-detector': `library ieee; use ieee.std_logic_1164.all; entity edge_detector is port(clk,reset,signal_in: in std_logic; rise: out std_logic); end; architecture rtl of edge_detector is begin -- Your RTL here end;`,
  'rtl-arbiter': `library ieee; use ieee.std_logic_1164.all; entity arbiter4 is port(req: in std_logic_vector(3 downto 0); grant: out std_logic_vector(3 downto 0)); end; architecture rtl of arbiter4 is begin -- Your RTL here end;`,
  'rtl-regfile': `library ieee; use ieee.std_logic_1164.all; entity regfile4 is port(clk,reset,we: in std_logic; waddr,raddr1,raddr2: in std_logic_vector(1 downto 0); wdata: in std_logic_vector(7 downto 0); rdata1,rdata2: out std_logic_vector(7 downto 0)); end; architecture rtl of regfile4 is begin -- Your RTL here end;`,
  'rtl-lfsr': `library ieee; use ieee.std_logic_1164.all; entity lfsr8 is port(clk,reset,enable: in std_logic; state: out std_logic_vector(7 downto 0)); end; architecture rtl of lfsr8 is begin -- Your RTL here end;`,
  'rtl-clock-divider': `library ieee; use ieee.std_logic_1164.all; entity clk_div is generic(DIV: positive:=2); port(clk,reset,enable: in std_logic; clk_out: out std_logic); end; architecture rtl of clk_div is begin -- Your RTL here end;`,
}

function languageStarter(problem, language) {
  if (language === 'SystemVerilog') return problem.starterCode
  if (language === 'Verilog') {
    return problem.starterCode
      .replace(/\blogic\b/g, 'reg')
      .replace(/\binput reg\b/g, 'input')
      .replace(/\boutput reg\b/g, 'output')
  }
  return vhdlStarters[problem.id] || `library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all; entity ${problem.id.replace(/-/g, '_')} is end; architecture rtl of ${problem.id.replace(/-/g, '_')} is begin -- Your RTL here end;`
}

function vcdParse(vcd) {
  if (!vcd) return { signals: [], end: 0 }
  const lines = vcd.split(/\r?\n/)
  const vars = []
  const values = {}
  const times = []
  let scope = ''
  let time = 0
  let started = false

  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith('$scope')) scope = line.split(/\s+/)[2] || ''
    if (line.startsWith('$var')) {
      const parts = line.split(/\s+/)
      const code = parts[3]
      vars.push({ code, name: parts[4], width: Number(parts[2]) || 1, scope: scope || 'tb' })
      values[code] = []
    }
    if (line[0] === '#') {
      time = Number(line.slice(1))
      times.push(time)
      started = true
      continue
    }
    if (started && /^[01xXzZ][!-~]+$/.test(line)) {
      const code = line.slice(1)
      if (values[code]) values[code].push({ t: time, v: line[0].toLowerCase() })
    } else if (started && /^b[01xXzZ]+\s+[!-~]+$/.test(line)) {
      const parts = line.split(/\s+/)
      if (values[parts[1]]) values[parts[1]].push({ t: time, v: parts[0].slice(1) })
    }
  }

  const seen = new Set()
  return {
    signals: vars.filter((signal) => !seen.has(signal.code) && seen.add(signal.code)).map((signal) => ({
      ...signal,
      events: values[signal.code] || [],
    })),
    end: times.at(-1) || 0,
  }
}

function Waveform({ vcd }) {
  const [zoom, setZoom] = useState(1)
  const parsed = useMemo(() => vcdParse(vcd), [vcd])

  if (!parsed.signals.length) return <div className="waveform-empty">No waveform was produced by this simulation.</div>

  return (
    <div className="waveform">
      <div className="wave-head">
        <div><strong>Waveform</strong><span>VCD simulation trace</span></div>
        <div className="wave-tools">
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(3, zoom + 0.25))}>+</button>
        </div>
      </div>
      <div className="wave-body">
        <div className="wave-signals">
          {parsed.signals.map((signal) => <div key={signal.code}><strong>{signal.name}</strong><small>{signal.width > 1 ? `[${signal.width - 1}:0]` : '1-bit'}</small></div>)}
        </div>
        <div className="wave-canvas" style={{ '--wave-zoom': zoom }}>
          <div className="wave-axis">0 <span>{parsed.end} time units</span></div>
          {parsed.signals.map((signal) => <div className="wave-track" key={signal.code}>{signal.events.map((event, index) => <div className="wave-event" key={`${signal.code}-${index}`} style={{ left: `${parsed.end ? (event.t / parsed.end) * 100 : 0}%` }}><span>{signal.width > 1 ? `0x${parseInt(event.v, 2).toString(16).toUpperCase() || 'X'}` : event.v}</span></div>)}</div>)}
        </div>
      </div>
    </div>
  )
}

function Discussion({ problem }) {
  const key = `hdlforge-discussion-${problem.id}`
  const [posts, setPosts] = useState(() => load(key, []))
  const [draft, setDraft] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!draft.trim()) return
    const next = [...posts, { id: Date.now(), name: 'You', text: draft.trim(), time: new Date().toLocaleString() }]
    setPosts(next)
    localStorage.setItem(key, JSON.stringify(next))
    setDraft('')
  }

  return (
    <div className="discussion discussion-in-tab">
      <div className="discussion-head"><div><h2>Discussion</h2><p>Ask questions, compare implementations and discuss edge cases.</p></div><span><MessageSquare size={15} /> {posts.length} posts</span></div>
      <form className="discussion-form" onSubmit={submit}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask a question or share an approach…" /><button className="primary">Post discussion</button></form>
      <div className="discussion-list">
        {posts.length ? posts.map((post) => <article className="discussion-post" key={post.id}><div className="post-avatar">Y</div><div><strong>{post.name}</strong><small>{post.time}</small><p>{post.text}</p></div></article>) : <div className="discussion-empty"><MessageSquare size={22} /><strong>Start the discussion</strong><p>Be the first to ask a question about this problem.</p></div>}
      </div>
    </div>
  )
}

export default function ProblemIDE({ problem, solved, draft, onBack, onSave, onSolved, onToggle }) {
  const supported = problem.languages?.length ? problem.languages : languages
  const evaluationType = problem.evaluation?.type || 'simulation'
  const isConceptual = evaluationType === 'answer'
  const initialLanguage = supported.includes('SystemVerilog') ? 'SystemVerilog' : supported[0] || 'SystemVerilog'
  const [code, setCode] = useState(draft ?? languageStarter(problem, initialLanguage))
  const [editorLanguage, setEditorLanguage] = useState(initialLanguage)
  const [bottomTab, setBottomTab] = useState('console')
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [statementTab, setStatementTab] = useState('problem')

  const update = (value) => { setCode(value); onSave(problem.id, value) }

  const changeLanguage = (language) => {
    setEditorLanguage(language)
    const next = languageStarter(problem, language)
    setCode(next)
    onSave(problem.id, next)
    setResult(null)
  }

  const run = async () => {
    if (isConceptual) {
      setResult({ pass: false, output: 'Automated answer evaluation is not configured for this problem yet. Review the task and submit an answer through the discussion or interview workflow.', waveform: null })
      return
    }
    setRunning(true)
    setBottomTab('console')
    try {
      let data
      if (editorLanguage === 'VHDL') {
        if (!RUNNER_URL) throw new Error('VHDL simulator is not configured. Set VITE_RUNNER_URL to the HDLForge GHDL runner.')
        const response = await fetch(`${RUNNER_URL}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId: problem.id, source: code, language: 'VHDL' }) })
        data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.error || 'VHDL runner failed.')
      } else data = await runBrowserSimulation(problem.id, code)
      const passed = Boolean(data.passed)
      setResult({ pass: passed, output: data.output || 'Simulation completed.', waveform: data.waveform })
      if (passed && !solved) (onSolved || onToggle)?.(problem.id)
    } catch (error) {
      setResult({ pass: false, output: error?.message || 'Simulator failed.', waveform: null })
    } finally { setRunning(false) }
  }

  const renderProblem = () => (
    <div className="problem-copy">
      <section className="problem-section first"><h2>Task</h2><p>{problem.task}</p></section>
      <section className="problem-section"><h2>Examples</h2><div className="examples">{problem.examples.map((example, index) => <div key={index}><span>Example {index + 1}</span><pre>{example}</pre></div>)}</div></section>
      <section className="problem-section"><h2>Constraints</h2><ul>{problem.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul></section>
    </div>
  )

  return (
    <div className="ide-page">
      <header className="ide-topbar">
        <button className="back" onClick={onBack}>← Problems</button>
        <div className="ide-title"><span className="eyebrow">{problem.category}</span><strong>{problem.title}</strong><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span></div>
        <div className="ide-actions">
          {solved ? <div className="solve-status passed"><CheckCircle2 size={15} /> {isConceptual ? 'Evaluated · Solved' : 'Tests passed · Solved'}</div> : <div className="solve-status">{isConceptual ? 'Evaluation not configured' : 'Run tests to solve'}</div>}
          <button className="primary" disabled={running} onClick={run}>{running ? <><Activity size={15} /> Running…</> : <><Play size={15} /> {isConceptual ? 'Evaluate' : 'Run tests'}</>}</button>
        </div>
      </header>

      <div className="ide-body">
        <aside className="ide-problem">
          <nav className="problem-tabs" aria-label="Problem information">
            {['problem', 'approach', 'solution', 'discussion'].map((tab) => (
              <button key={tab} className={statementTab === tab ? 'active' : ''} onClick={() => setStatementTab(tab)}>
                {tab === 'discussion' && <MessageSquare size={13} />}{tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
          <div className="ide-problem-content">
            {statementTab === 'problem' && renderProblem()}
            {statementTab === 'approach' && <div className="content-card"><h2>How to think about it</h2><p>{problem.approach || 'Identify inputs, outputs, timing, reset semantics and required state. Implement the simplest synthesizable solution and check corner cases.'}</p></div>}
            {statementTab === 'solution' && <div className="content-card"><h2>Reference solution</h2><p>Try the problem first, then inspect the reference implementation.</p><pre className="solution-code">{problem.solution || 'Reference solution will be added for this problem.'}</pre></div>}
            {statementTab === 'discussion' && <Discussion problem={problem} />}
          </div>
        </aside>

        <section className="ide-workspace">
          <div className="file-tabs">
            <div className="file-tab active"><FileCode2 size={14} /><span>{isConceptual ? 'answer.txt' : `solution.${editorLanguage === 'VHDL' ? 'vhd' : editorLanguage === 'Verilog' ? 'v' : 'sv'}`}</span><span className="unsaved">●</span></div>
            {!isConceptual && <><div className="editor-language"><select value={editorLanguage} onChange={(event) => changeLanguage(event.target.value)}>{supported.map((language) => <option key={language}>{language}</option>)}</select></div><button className="icon-btn" title="Reset editor" onClick={() => changeLanguage(editorLanguage)}><RotateCcw size={14} /></button></>}
          </div>
          <div className="editor-shell"><div className="editor-gutter">{code.split('\n').map((_, index) => <span key={index}>{index + 1}</span>)}</div><textarea className="ide-editor" value={code} onChange={(event) => update(event.target.value)} spellCheck="false" aria-label={isConceptual ? 'Answer editor' : 'HDL source editor'} /></div>
          <div className="ide-bottom">
            <div className="bottom-tabs"><button className={bottomTab === 'console' ? 'active' : ''} onClick={() => setBottomTab('console')}><Terminal size={14} /> Console</button>{!isConceptual && <button className={bottomTab === 'waveform' ? 'active' : ''} onClick={() => setBottomTab('waveform')}><Activity size={14} /> Waveform</button>}<button className={bottomTab === 'testbench' ? 'active' : ''} onClick={() => setBottomTab('testbench')}><Code2 size={14} /> {isConceptual ? 'Evaluation' : 'Testbench'}</button></div>
            <div className="console">
              {bottomTab === 'console' && (result ? <div className={result.pass ? 'run-result pass' : 'run-result fail'}><strong>{result.pass ? '✓ All tests passed' : isConceptual ? 'Evaluation unavailable' : '× Tests failed'}</strong><pre>{result.output}</pre></div> : <div className="console-empty"><Terminal size={18} /><span>{isConceptual ? 'Evaluation is not configured for this conceptual problem.' : 'Run the tests to see compiler and test output.'}</span></div>)}
              {bottomTab === 'waveform' && !isConceptual && (result?.waveform ? <Waveform vcd={result.waveform} /> : <div className="console-empty"><Activity size={18} /><span>Run a simulation to generate a waveform.</span></div>)}
              {bottomTab === 'testbench' && <div className="testbench-info"><strong><Code2 size={15} /> {isConceptual ? 'Evaluation' : 'Testbench'}</strong><p>{isConceptual ? 'This problem is conceptual and uses answer evaluation. Automated answer evaluation will be added with Interview Mode.' : 'HDLForge runs the problem\'s testbench against your submitted design. Hidden tests will be server-side in Interview Mode.'}</p><pre>{problem.testbench || 'The evaluator is managed by the problem harness.'}</pre></div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
