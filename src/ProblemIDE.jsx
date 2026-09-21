import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, CheckCircle2, Code2, Copy, FileCode2, MessageSquare, Play, RotateCcw, Terminal, ChevronDown, ChevronUp } from 'lucide-react'
import { runBrowserSimulation } from './browserSimulator'
import solutions from './data/solutions'
import { languageStarter, resolveInitialStarterDraft } from './data/starterScaffolds'
import MonacoHDLEditor, { ReadOnlyHDLViewer } from './MonacoHDLEditor'
import './ide-overrides.css'
import './waveform-window.css'

const RUNNER_URL = (import.meta.env.VITE_RUNNER_URL || '').replace(/\/$/, '')
const languages = ['Verilog', 'SystemVerilog', 'VHDL']
const referenceFormatCache = new Map()
async function requestFormattedReference(language,source,columnLimit=52){
  if(!RUNNER_URL||!source) return source
  const key=`${language}\u0000${columnLimit}\u0000${source}`
  if(referenceFormatCache.has(key)) return referenceFormatCache.get(key)
  const pending=fetch(`${RUNNER_URL}/format`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({language,source,columnLimit}),
  }).then(async response=>{
    const data=await response.json().catch(()=>({}))
    if(!response.ok||!data.ok||typeof data.formatted!=='string') throw new Error(data.error||'Formatter request failed.')
    return data.formatted
  })
  referenceFormatCache.set(key,pending)
  try{return await pending}
  catch(error){referenceFormatCache.delete(key);throw error}
}

const referenceSectionHints = {
  'rtl-mux': [
    [/^\s*(always(?:_comb)?\b|y\s*<=)/i, 'Combinational selection logic']
  ],
  'rtl-counter': [
    [/^\s*(always(?:_ff)?\b|process\s*\()/i, 'Counter state update']
  ],
  'rtl-priority': [
    [/^\s*(always(?:_comb)?\b|process\s*\()/i, 'Highest-priority request selection']
  ],
  'rtl-fifo': [
    [/^\s*(logic|reg|type|signal)\b.*\b(mem|mem_t)\b/i, 'Storage and FIFO state'],
    [/^\s*(always_ff\b|always\s*@|process\s*\()/i, 'Read, write, and occupancy updates'],
    [/^\s*(assign\s+(full|empty)\b|(full|empty)\s*<=)/i, 'Full and empty status flags']
  ],
  'rtl-shift-register': [
    [/^\s*(always(?:_ff)?\b|process\s*\()/i, 'Shift-register state update']
  ],
  'rtl-edge-detector': [
    [/^\s*(logic|reg|signal)\b.*\bprev\b/i, 'Previous sampled value'],
    [/^\s*(always(?:_ff)?\b|process\s*\()/i, 'Rising-edge detection']
  ],
  'rtl-arbiter': [
    [/^\s*(always(?:_comb)?\b|process\s*\()/i, 'Fixed-priority grant logic']
  ],
  'rtl-regfile': [
    [/^\s*(logic|reg|type|signal)\b.*\b(regs|reg_array)\b/i, 'Register storage'],
    [/^\s*(always_ff\b|always\s*@\(posedge|process\s*\()/i, 'Synchronous write path'],
    [/^\s*(assign\s+rdata|rdata\w*\s*<=|always_comb\b)/i, 'Combinational read ports']
  ],
  'rtl-lfsr': [
    [/^\s*(wire|logic|variable)\b.*\bfeedback\b/i, 'Feedback polynomial'],
    [/^\s*(always_ff\b|always\s*@\(posedge|process\s*\()/i, 'LFSR state update']
  ],
  'rtl-clock-divider': [
    [/^\s*(integer|logic|reg|signal)\b.*\b(count|q)\b/i, 'Divider state'],
    [/^\s*(always_ff\b|always\s*@\(posedge|process\s*\()/i, 'Counter and output toggle']
  ]
}

function addTeachingComments(problemId, language, source) {
  const hints = referenceSectionHints[problemId] || []
  if (!source || !hints.length) return source
  const prefix = language === 'VHDL' ? '--' : '//'
  const used = new Set()
  const output = []
  for (const line of source.split('\n')) {
    for (let index = 0; index < hints.length; index += 1) {
      if (used.has(index)) continue
      const [pattern,label] = hints[index]
      if (pattern.test(line)) {
        if (output.length && output.at(-1).trim() !== '') output.push('')
        output.push(`${prefix} ${label}`)
        used.add(index)
        break
      }
    }
    output.push(line)
  }
  return output.join('\n')
}
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) } catch { return fallback } }
function vcdParse(vcd) {
  if (!vcd) return { signals: [], end: 0 }
  const lines = vcd.split(/\r?\n/), vars = [], values = {}, times = []
  let scope = '', time = 0, started = false
  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith('$scope')) scope = line.split(/\s+/)[2] || ''
    if (line.startsWith('$var')) { const p = line.split(/\s+/), code = p[3]; vars.push({ code, name: p[4], width: Number(p[2]) || 1, scope: scope || 'tb' }); values[code] = [] }
    if (line[0] === '#') { time = Number(line.slice(1)); times.push(time); started = true; continue }
    if (started && /^[01xXzZ][!-~]+$/.test(line)) { const code = line.slice(1); if (values[code]) values[code].push({ t: time, v: line[0].toLowerCase() }) }
    else if (started && /^b[01xXzZ]+\s+[!-~]+$/.test(line)) { const p = line.split(/\s+/); if (values[p[1]]) values[p[1]].push({ t: time, v: p[0].slice(1) }) }
  }
  const seen = new Set()
  return { signals: vars.filter(s => !seen.has(s.code) && seen.add(s.code)).map(s => ({ ...s, events: values[s.code] || [] })), end: times.at(-1) || 0 }
}
function valueLabel(value, width) { if (width <= 1) return value; if (/^[01]+$/.test(value)) return `0x${parseInt(value, 2).toString(16).toUpperCase()}`; return value.toUpperCase() }
function Waveform({ vcd }) {
  const [zoom, setZoom] = useState(1), [cursor, setCursor] = useState(null), parsed = useMemo(() => vcdParse(vcd), [vcd])
  if (!parsed.signals.length) return <div className="waveform-empty">No waveform was produced by this simulation.</div>
  const left = 120, row = 42, axis = 30, width = Math.max(760, parsed.end * 2.4 + 80) * zoom, gridStep = parsed.end > 100 ? 20 : parsed.end > 40 ? 10 : 5
  const xAt = t => left + (t / Math.max(parsed.end, 1)) * (width - left - 20)
  const digitalPath = events => { if (!events.length) return ''; let d = `M ${left} 28`, previous = events[0].v; events.forEach(event => { const x = xAt(event.t), oldY = previous === '1' ? 10 : 28, newY = event.v === '1' ? 10 : 28; d += ` L ${x} ${oldY} L ${x} ${newY}`; previous = event.v }); return d + ` L ${xAt(parsed.end)} ${previous === '1' ? 10 : 28}` }
  return <div className="waveform"><div className="wave-head"><div><strong>Waveform</strong><span>Digital simulation trace · hover a transition for its timestamp</span></div><div className="wave-tools"><button title="Zoom out" onClick={() => setZoom(Math.max(.5, zoom - .25))}>−</button><span>{Math.round(zoom * 100)}%</span><button title="Zoom in" onClick={() => setZoom(Math.min(4, zoom + .25))}>+</button></div></div><div className="wave-scroll"><svg className="wave-svg" width={width} height={axis + parsed.signals.length * row} role="img" aria-label="Simulation waveform">
    {Array.from({ length: Math.floor(parsed.end / gridStep) + 1 }, (_, i) => { const t = Math.min(parsed.end, i * gridStep), x = xAt(t); return <g key={i}><line x1={x} x2={x} y1={axis} y2={axis + parsed.signals.length * row} className="wave-grid" /><text x={x + 3} y={18} className="wave-time">{t}</text></g> })}
    {parsed.signals.map((signal, index) => { const y = axis + index * row; return <g key={signal.code}><rect x="0" y={y} width={left - 1} height={row} className="wave-label-bg" /><text x="10" y={y + 19} className="wave-name">{signal.name}</text><text x="10" y={y + 33} className="wave-width">{signal.width > 1 ? `[${signal.width - 1}:0]` : '1-bit'}</text><line x1={left} x2={width} y1={y + row - 1} y2={y + row - 1} className="wave-row" />{signal.width === 1 ? <><path d={digitalPath(signal.events)} transform={`translate(0 ${y})`} className="wave-digital" />{signal.events.map((event, i) => <circle key={`c-${i}`} cx={xAt(event.t)} cy={y + (event.v === '1' ? 10 : 28)} r="3" className="wave-transition" onMouseEnter={() => setCursor({ signal: signal.name, time: event.t, value: event.v })} onMouseLeave={() => setCursor(null)} />)}</> : signal.events.map((event, i) => <g key={i}><rect x={xAt(event.t)} y={y + 9} width={Math.max(1, xAt(i + 1 < signal.events.length ? signal.events[i + 1].t : parsed.end) - xAt(event.t))} height={24} className="wave-bus" /><text x={xAt(event.t) + 6} y={y + 25} className="wave-bus-text">{valueLabel(event.v, signal.width)}</text></g>)}</g> })}<line x1={left} x2={width} y1={axis} y2={axis} className="wave-axis-line" /></svg>{cursor && <div className="wave-cursor"><strong>{cursor.signal}</strong> · t={cursor.time} · {cursor.value}</div>}</div></div>
}
function WaveformWindow({ vcd, onClose }) {
  return <div className="waveform-window" role="dialog" aria-label="Waveform window">
    <div className="waveform-window-head"><div><strong>Waveform</strong><span>Simulation trace</span></div><button type="button" className="waveform-window-close" onClick={onClose} title="Close waveform (Esc)" aria-label="Close waveform">×</button></div>
    <div className="waveform-window-body">{vcd ? <Waveform vcd={vcd} /> : <div className="waveform-window-empty"><Activity size={18} /><span>Run a simulation to generate a waveform.</span></div>}</div>
  </div>
}
function Discussion({ problem }) {
  const key = `hdlforge-discussion-${problem.id}`, [posts, setPosts] = useState(() => load(key, [])), [draft, setDraft] = useState('')
  const submit = event => { event.preventDefault(); if (!draft.trim()) return; const next = [...posts, { id: Date.now(), name: 'You', text: draft.trim(), time: new Date().toLocaleString() }]; setPosts(next); localStorage.setItem(key, JSON.stringify(next)); setDraft('') }
  return <div className="discussion discussion-in-tab"><div className="discussion-head"><div><h2>Discussion</h2><p>Ask questions, compare implementations and discuss edge cases.</p></div><span><MessageSquare size={15} /> {posts.length} posts</span></div><form className="discussion-form" onSubmit={submit}><textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Ask a question or share an approach…" /><button className="primary">Post discussion</button></form><div className="discussion-list">{posts.length ? posts.map(post => <article className="discussion-post" key={post.id}><div className="post-avatar">Y</div><div><strong>{post.name}</strong><small>{post.time}</small><p>{post.text}</p></div></article>) : <div className="discussion-empty"><MessageSquare size={22} /><strong>Start the discussion</strong><p>Be the first to ask a question about this problem.</p></div>}</div></div>
}
function approachTheory(problem) {
  const topic = problem.topic || ''
  if (problem.id === 'rtl-mux') return [
    ['Combinational logic','A combinational circuit has no memory: its outputs are a function only of the inputs at the current instant. A multiplexer therefore needs no clock or state register.'],
    ['Multiplexing','A 2:1 multiplexer selects one of two data inputs. The select signal is control, not stored state: sel=0 routes one input and sel=1 routes the other.'],
    ['Complete assignment','Every possible input condition must determine y. In procedural combinational RTL, leaving a path unassigned can infer a latch because the old value would need to be remembered.'],
    ['RTL versus hardware','A ternary operator, an if/else inside always_comb, and an equivalent case statement can all synthesize to the same mux. RTL describes behavior; synthesis chooses gates and routing.'],
  ]
  if (/FSM/.test(topic)) return [
    ['State','An FSM remembers a finite amount of history in a state register. The current state plus current inputs determine what happens next.'],
    ['Next-state logic','Combinational logic computes the next state. Clocked logic transfers that next state into the state register on the active edge.'],
    ['Moore and Mealy outputs','Moore outputs depend only on state; Mealy outputs can depend on state and current inputs. Mealy logic can react within the cycle but needs careful timing analysis.'],
    ['State encoding','Binary, one-hot and other encodings represent the same abstract machine differently. The encoding affects area, decode complexity and sometimes timing.'],
  ]
  if (/FIFO|Buffer/.test(topic)) return [
    ['FIFO ordering','A FIFO preserves arrival order: the oldest accepted item must be the next one removed. Storage alone is not enough; control must track where to write and read.'],
    ['Pointers and occupancy','Write and read pointers identify locations. Full/empty can be derived from occupancy or carefully encoded pointer relationships.'],
    ['Simultaneous transfers','A read and write may happen on the same cycle. Occupancy should usually stay unchanged when both are accepted.'],
    ['Backpressure','A full FIFO must stop accepting writes; an empty FIFO must stop reads. These conditions form part of the interface contract.'],
  ]
  if (/CDC/.test(topic)) return [
    ['Metastability','Sampling an asynchronous transition near a receiving clock edge can violate setup/hold time and leave a flip-flop temporarily metastable.'],
    ['Two-flop synchronizer','For a single-bit level signal, cascaded destination-domain flops greatly reduce the probability that metastability propagates into functional logic.'],
    ['Pulse transfer','A narrow source pulse can be missed by a slower or unrelated destination clock. Toggle, handshake or pulse-stretch techniques convert the event into something observable.'],
    ['Multi-bit crossings','Synchronizing each bit independently can create incoherent words. Multi-bit data typically uses handshakes, Gray coding, or asynchronous FIFOs.'],
  ]
  if (/Protocol|Handshake/.test(topic)) return [
    ['Handshake','A transfer occurs only when the protocol-defined acceptance condition is true, such as VALID && READY. Intent to transfer is not the same as a completed transfer.'],
    ['Backpressure','A receiver can delay acceptance. The sender must preserve any required control and payload values while stalled.'],
    ['Channel independence','Protocols such as AXI separate information into channels. Correct RTL must not assume independent channels arrive in a particular order unless the protocol guarantees it.'],
    ['Persistence','Signals such as VALID or a response often have to remain asserted until the matching READY is observed. One-cycle pulses are frequently incorrect.'],
  ]
  if (/Counter/.test(topic)) return [
    ['Stateful behavior','A counter is sequential logic because its next value depends on its previous value. The register is the state; the incrementer computes the next state.'],
    ['Clock edges','The counter changes only on the specified active edge. Inputs between edges influence what will be captured, not the stored value immediately.'],
    ['Width and wraparound','An N-bit unsigned counter naturally wraps modulo 2^N unless extra terminal-count logic changes that behavior.'],
    ['Reset semantics','Synchronous reset is sampled on the clock edge; asynchronous reset can change state independently of the clock. The specification determines which is correct.'],
  ]
  if (/Sequential|Memor/.test(topic)) return [
    ['Stored state','Sequential circuits remember information in flip-flops or memories. Their behavior depends on both current inputs and previously stored values.'],
    ['Nonblocking assignment','Clocked SystemVerilog normally uses nonblocking assignments so all state updates conceptually occur together after values are sampled at the edge.'],
    ['Reset and enable','Reset defines a known state. Enables determine when state changes versus when it must hold its previous value.'],
    ['Memory behavior','Read/write timing matters: synchronous versus asynchronous read and read-during-write behavior can change both simulation and inferred hardware.'],
  ]
  if (/Pipeline/.test(topic)) return [
    ['Latency versus throughput','Pipelining adds register stages, increasing latency in cycles while often allowing a new transaction to enter every cycle.'],
    ['Data/control alignment','Metadata such as valid, tags or destination IDs must be delayed through the same number of stages as the data they describe.'],
    ['Stage boundaries','Registers break long combinational paths. Good stage placement balances logic delay rather than merely adding registers arbitrarily.'],
    ['Stalls and bubbles','Elastic pipelines need explicit rules for when stages advance, hold, or contain invalid bubbles under backpressure.'],
  ]
  if (/Arithmetic|Datapath/.test(topic)) return [
    ['Bit growth','Addition and multiplication can require wider results than their operands. Truncating too early silently changes arithmetic behavior.'],
    ['Signedness','Two’s-complement signed values require the HDL expression to be signed. Mixing signed and unsigned operands can produce unexpected extension and comparison rules.'],
    ['Combinational depth','A mathematically correct expression may create a long critical path. Trees, pipelining and resource sharing trade area, latency and frequency.'],
    ['Saturation versus wraparound','Fixed-width arithmetic normally wraps on overflow unless saturation or explicit clipping logic is implemented.'],
  ]
  if (/CPU/.test(topic)) return [
    ['Datapath and control','Processor RTL separates data movement/computation from control decisions that select operations, sources and destinations.'],
    ['Instruction fields','Opcode and function fields are decoded into concrete control signals. Immediate fields often need format-specific extraction and sign extension.'],
    ['Architectural state','Registers, PC, CSRs and memory-visible state must change only according to the ISA rules. Internal implementation can vary as long as architectural behavior matches.'],
    ['Pipelining hazards','Dependencies, branches and memory timing can require forwarding, stalls or flushes so overlapped instructions still behave sequentially at the ISA level.'],
  ]
  if (/Testbenches/.test(topic)) return [
    ['Stimulus','A testbench controls DUT inputs over time. Useful stimulus includes nominal cases, boundaries, reset behavior and sequences that exercise state transitions.'],
    ['Sampling','Checks must observe outputs at the correct time relative to clock edges and nonblocking updates. Sampling too early can make a correct DUT look wrong.'],
    ['Self-checking tests','A strong testbench computes or stores expected behavior and reports mismatches automatically instead of relying only on waveform inspection.'],
    ['Determinism','Tests should clearly control reset, clocks and timing so a failure is reproducible. Random stimulus should preserve the seed when debugging.'],
  ]
  if (/Interfaces/.test(topic)) return [
    ['Signal bundling','A SystemVerilog interface groups related protocol signals into one reusable object, reducing long port lists and connection mistakes.'],
    ['Modports','Modports describe which signals a participant may drive or read, documenting roles such as master, slave, driver or monitor.'],
    ['Clocking blocks','Clocking blocks define sampling/driving timing relative to a clock and help testbench code avoid races with the DUT.'],
    ['Virtual interfaces','Class-based verification components use virtual interfaces to access static interface instances without hard-wiring hierarchy into the class.'],
  ]
  if (/SVA/.test(topic)) return [
    ['Sampled temporal logic','SVA reasons about values sampled on clocking events and relationships across cycles, not ordinary software execution order.'],
    ['Sequence versus property','A sequence describes a temporal pattern. A property turns temporal behavior into something that can be asserted, assumed or covered.'],
    ['Implication','Overlapped |-> starts the consequent in the same sampled cycle; non-overlapped |=> starts it on the next one. That one-cycle distinction is critical.'],
    ['Reset disabling','disable iff commonly suspends a property while reset is active so initialization behavior does not create meaningless failures.'],
  ]
  if (/Constrained Random/.test(topic)) return [
    ['Random variables','rand fields let the solver choose values; constraints define which combinations are legal or interesting.'],
    ['Constraint solving','Constrained random is not arbitrary noise. The solver generates values satisfying all active constraints, including relationships between fields.'],
    ['Distribution','Legal values are not necessarily equally useful. dist constraints can bias generation toward boundaries, rare cases or protocol conditions.'],
    ['Reproducibility','Random failures must be reproducible by seed. Preserve the failing seed before simplifying or adding debug instrumentation.'],
  ]
  if (/Functional Coverage/.test(topic)) return [
    ['Coverage intent','Functional coverage measures whether planned scenarios occurred; it does not prove the DUT was correct when they occurred.'],
    ['Coverpoints and bins','A coverpoint samples an expression and bins divide its value space into meaningful scenarios.'],
    ['Cross coverage','Crosses measure combinations of conditions, exposing gaps that individual coverpoints can hide.'],
    ['Coverage closure','High percentage alone is not the goal. Unhit bins should be classified as unreachable, missing stimulus, or evidence of a design/testbench issue.'],
  ]
  if (/UVM/.test(topic)) return [
    ['Transactions','UVM models meaningful operations as sequence items rather than manipulating every signal from the test directly.'],
    ['Separation of roles','Sequences generate intent, drivers translate transactions into pin activity, and monitors reconstruct observed transactions without driving the DUT.'],
    ['TLM communication','Analysis ports and other transaction-level interfaces decouple components so monitors, scoreboards and coverage collectors can evolve independently.'],
    ['Phases and objections','UVM phases coordinate construction, connection and runtime behavior. Objections keep the run phase alive while stimulus is still active.'],
  ]
  if (/Scoreboards/.test(topic)) return [
    ['Reference model','A scoreboard needs an independent way to predict expected behavior. Reusing DUT implementation logic weakens the check.'],
    ['Observed transactions','Monitors should send what actually happened at the interface, not what the driver intended to happen.'],
    ['Ordering','In-order designs can compare queues directly; out-of-order designs need IDs, tags or associative matching.'],
    ['Error localization','Useful scoreboard messages include transaction identity, expected value, actual value and enough context to reproduce the mismatch.'],
  ]
  if (/Formal/.test(topic)) return [
    ['Exhaustive reasoning','Formal tools explore reachable state space mathematically rather than sampling a finite set of simulation vectors.'],
    ['Assertions','Assertions define behavior that must hold for all legal traces within the proof model.'],
    ['Assumptions','Assumptions constrain the environment. Over-constraining can make a proof vacuous, so they must reflect real interface guarantees.'],
    ['Cover properties','Covers show that an interesting state or sequence is reachable and are useful for detecting impossible or over-constrained scenarios.'],
  ]
  return [
    ['RTL abstraction','RTL describes transfers and transformations of data between registers and combinational logic. Synthesis maps that behavior into hardware structures.'],
    ['Combinational versus sequential','First decide whether the problem needs memory. If previous cycles matter, state is required; otherwise the logic can be combinational.'],
    ['Timing intent','Clock, reset, enable and handshake semantics are part of the functionality. Correct Boolean logic with incorrect cycle timing is still wrong hardware.'],
    ['Corner cases','Hardware bugs often appear at reset, wraparound, simultaneous events, maximum/minimum values and backpressure boundaries.'],
  ]
}

function approachReasoning(problem) {
  const topic = problem.topic || ''
  if (problem.id === 'rtl-mux') return [
    'Write the truth table first: sel=0 means y=a and sel=1 means y=b.',
    'Notice that no previous value of y is needed, so this is combinational logic.',
    'Choose a complete combinational construct such as assign, always_comb with if/else, or case.',
    'Check both selector values and transitions of a, b and sel in simulation.',
  ]
  if (/SVA|Formal/.test(topic)) return [
    'Rewrite the requirement as a precise cycle-by-cycle statement.',
    'Identify the sampling clock, reset condition, antecedent and required consequence.',
    'Decide whether the consequence starts in the same cycle or a later cycle.',
    'Add boundary scenarios that could make the property pass vacuously or fail unexpectedly.',
  ]
  if (/Testbenches|Interfaces|Constrained Random|Functional Coverage|UVM|Scoreboards/.test(topic)) return [
    'Identify what behavior is being generated, observed and checked.',
    'Keep stimulus, protocol access and checking responsibilities separate.',
    'Define expected behavior independently from the DUT implementation.',
    'Include reset, boundaries and error-prone scenarios in the verification plan.',
  ]
  return [
    'Classify the problem as combinational, sequential, protocol-driven or verification-only.',
    'List the state elements, inputs, outputs and exact cycle in which each output may change.',
    'Translate the specification into a small set of invariants or transfer rules.',
    'Only then choose the RTL construct that expresses those rules most directly.',
  ]
}

function ApproachGuide({problem}) {
  const concepts = approachTheory(problem)
  const reasoning = approachReasoning(problem)
  return <article className="approach-guide">
    <section className="approach-guide-section approach-guide-intro">
      <h1>Approach</h1>
      <p>{problem.approach || problem.description || 'Understand the hardware behavior first, then map it to a synthesizable structure.'}</p>
    </section>
    <section className="approach-guide-section">
      <h2>Core theory</h2>
      <p>These concepts are the foundation of this problem:</p>
      <div className="approach-concepts">{concepts.map(([name,description])=><div className="approach-concept" key={name}><h3>{name}</h3><p>{description}</p></div>)}</div>
    </section>
    <section className="approach-guide-section">
      <h2>How to reason about it</h2>
      <ol className="approach-reasoning">{reasoning.map((step,index)=><li key={index}>{step}</li>)}</ol>
    </section>
    <section className="approach-guide-section">
      <h2>What the interviewer is checking</h2>
      <p>{/SVA|Formal|Testbenches|Interfaces|Constrained Random|Functional Coverage|UVM|Scoreboards/.test(problem.topic||'')
        ? 'Whether you understand verification intent, timing semantics, separation of responsibilities and how to build checks that can expose real design bugs.'
        : 'Whether you can translate a written hardware requirement into the correct state, timing and datapath structure—not just write syntactically valid HDL.'}</p>
    </section>
  </article>
}

function solutionPrerequisites(problem) {
  const topic = problem.topic || ''
  const common = []
  if (/Combinational|Arithmetic|Datapath/.test(topic)) common.push(['Combinational logic','Understand how outputs are derived directly from current inputs.'])
  if (/Sequential|Counter|FSM|FIFO|Memor|Pipeline|CDC|CPU|UVM|Scoreboard/.test(topic)) common.push(['Clocked logic','Be comfortable with edge-triggered state updates and reset behavior.'])
  if (/FSM/.test(topic)) common.push(['Finite-state machines','Know state encoding, next-state logic and output logic.'])
  if (/FIFO|Buffer/.test(topic)) common.push(['Pointers and occupancy','Understand read/write pointers plus full and empty conditions.'])
  if (/CDC/.test(topic)) common.push(['Metastability and synchronization','Know why asynchronous signals need dedicated crossing structures.'])
  if (/Protocol|Handshake/.test(topic)) common.push(['Ready/valid handshakes','Understand transfer conditions, stalls and backpressure.'])
  if (/SVA/.test(topic)) common.push(['SystemVerilog Assertions','Know sequences, properties and temporal implication.'])
  if (/Testbenches|Interfaces|Constrained Random|Functional Coverage|UVM|Scoreboards|Formal/.test(topic)) common.push(['SystemVerilog verification','Be comfortable separating stimulus, observation and checking.'])
  if (!common.length) common.push(['Synthesizable RTL','Understand combinational versus sequential hardware and basic HDL syntax.'])
  common.push(['Bit widths and signedness','Track widths carefully so truncation, overflow and sign extension are intentional.'])
  return common.slice(0,3)
}

function solutionSteps(problem) {
  const topic = problem.topic || ''
  if (problem.id === 'rtl-mux') return [
    'Treat the circuit as purely combinational; no clock or stored state is required.',
    'Use sel as the selector between input a and input b.',
    'Drive y for both selector values so no latch can be inferred.',
  ]
  if (/FSM/.test(topic)) return [
    'Define the legal states and reset state.',
    'Describe the state transitions from the inputs.',
    'Register the state on the active clock edge and keep output behavior complete.',
  ]
  if (/FIFO|Buffer/.test(topic)) return [
    'Store data in an array or register entry and track read/write position.',
    'Allow reads and writes only when the corresponding empty/full condition permits them.',
    'Update occupancy correctly for write-only, read-only and simultaneous transfers.',
  ]
  if (/Protocol|Handshake/.test(topic)) return [
    'Identify exactly when a transfer is accepted by the protocol.',
    'Hold payload and control state stable while the receiver is stalled.',
    'Advance state only after the required handshake completes.',
  ]
  if (/SVA/.test(topic)) return [
    'Translate the English requirement into a temporal relationship.',
    'Choose the correct sampling edge and implication operator.',
    'Check reset/disable behavior so the property is not evaluated in invalid cycles.',
  ]
  if (/UVM/.test(topic)) return [
    'Define the transaction-level behavior the component owns.',
    'Use the UVM phase and TLM interfaces appropriate to that component.',
    'Keep protocol driving, monitoring and checking responsibilities separated.',
  ]
  if (/Scoreboards/.test(topic)) return [
    'Maintain an independent expected-value or reference model.',
    'Receive observed transactions through analysis connections.',
    'Compare expected and actual behavior and report mismatches with useful context.',
  ]
  if (/Formal/.test(topic)) return [
    'State the design assumptions explicitly.',
    'Write assertions for the required invariant or temporal behavior.',
    'Add cover properties where useful to prove the interesting scenario is reachable.',
  ]
  if (/Sequential|Counter|Memor|Pipeline|CPU|CDC/.test(topic)) return [
    'Identify which values are state and when they are allowed to change.',
    'Implement reset and normal state updates in clocked logic.',
    'Check hold behavior, boundary conditions and cycle-to-cycle alignment.',
  ]
  return [
    'Translate the specification into input/output behavior before writing RTL.',
    'Implement the minimum synthesizable logic needed for that behavior.',
    'Check boundary cases, widths and whether every output is assigned when required.',
  ]
}

function inferredHardware(problem) {
  if (problem.id === 'rtl-mux') return ['Purely combinational','2:1 multiplexer','No registers inferred']
  const topic = problem.topic || ''
  if (/Counter/.test(topic)) return ['Registers','Adder/incrementer','Reset/control logic']
  if (/FSM/.test(topic)) return ['State register','Next-state logic','Decode/output logic']
  if (/FIFO|Buffer/.test(topic)) return ['Storage array','Read/write pointers','Full/empty control']
  if (/CDC/.test(topic)) return ['Synchronizer flops','CDC control logic','No combinational path across domains']
  if (/Protocol|Handshake/.test(topic)) return ['Control state','Handshake logic','Payload holding registers as needed']
  if (/Arithmetic|Datapath/.test(topic)) return ['Arithmetic operators','Combinational datapath','Width/sign-extension logic']
  if (/Pipeline/.test(topic)) return ['Pipeline registers','Valid/control alignment','Combinational stage logic']
  if (/SVA|Testbenches|Interfaces|Constrained Random|Functional Coverage|UVM|Scoreboards|Formal/.test(topic)) return ['Verification-only construct','No synthesizable datapath implied','Checks design behavior rather than implementing it']
  return ['Synthesizable RTL','Control/data logic from the specification','Implementation depends on target technology']
}

function commonMistakes(problem) {
  const topic = problem.topic || ''
  if (problem.id === 'rtl-mux') return [
    'Reversing which input is selected for sel=0 versus sel=1.',
    'Using clocked logic for a circuit that should be combinational.',
    'Leaving an output path unassigned inside combinational logic and inferring a latch.',
  ]
  if (/FIFO|Buffer/.test(topic)) return ['Updating occupancy incorrectly on simultaneous read/write.','Reading while empty or writing while full.','Using pointer width/wrap logic that fails at the depth boundary.']
  if (/CDC/.test(topic)) return ['Synchronizing a multi-bit bus bit-by-bit.','Using only one synchronizer stage.','Ignoring reset-domain behavior or pulse width requirements.']
  if (/Protocol|Handshake/.test(topic)) return ['Changing data while stalled.','Treating VALID alone as a transfer.','Dropping a response before READY is observed.']
  if (/SVA/.test(topic)) return ['Using the wrong implication timing.','Forgetting disable iff around reset.','Checking a value in the wrong sampled cycle.']
  if (/UVM|Scoreboards/.test(topic)) return ['Mixing driver, monitor and checking responsibilities.','Depending on DUT internals instead of observed transactions.','Failing to make transaction ordering and reset behavior explicit.']
  return ['Incorrect reset or hold behavior.','Width/sign mistakes that only appear at corner values.','Writing behavior that simulates correctly but infers unintended hardware.']
}

function SolutionGuide({ problem, referenceSolutions, initialLanguage }) {
  const available = Object.keys(referenceSolutions || {})
  const [language,setLanguage] = useState(available.includes(initialLanguage) ? initialLanguage : available[0] || initialLanguage)
  const [copied,setCopied] = useState(false)
  const code = referenceSolutions?.[language] || problem.solution || ''
  const [formattedCode,setFormattedCode] = useState(code)
  const [formatting,setFormatting] = useState(false)
  const [formatMode,setFormatMode] = useState('normal')
  const solutionShellRef = useRef(null)
  const formatColumns = { narrow: 52, normal: 68, wide: 88 }
  const formatColumn = formatColumns[formatMode]

  useEffect(()=>{ setFormattedCode(code) },[language,code])

  useEffect(()=>{
    const element=solutionShellRef.current
    if(!element||typeof ResizeObserver==='undefined') return undefined
    let timer
    const update=entries=>{
      const width=entries[0]?.contentRect?.width||element.clientWidth||0
      if(!width) return
      const next=width>=760?'wide':width>=560?'normal':'narrow'
      clearTimeout(timer)
      timer=setTimeout(()=>setFormatMode(current=>current===next?current:next),160)
    }
    const observer=new ResizeObserver(update)
    observer.observe(element)
    update([{contentRect:element.getBoundingClientRect()}])
    return ()=>{clearTimeout(timer);observer.disconnect()}
  },[])

  useEffect(()=>{
    let active=true
    if(!code||!RUNNER_URL){setFormatting(false);return ()=>{active=false}}
    setFormatting(true)
    requestFormattedReference(language,code,formatColumn)
      .then(value=>{if(active)setFormattedCode(value)})
      .catch(()=>{if(active)setFormattedCode(code)})
      .finally(()=>{if(active)setFormatting(false)})
    return ()=>{active=false}
  },[language,code,formatColumn])
  const displayCode = addTeachingComments(problem.id, language, formattedCode || code)
  const prerequisites = solutionPrerequisites(problem)
  const steps = solutionSteps(problem)
  const hardware = inferredHardware(problem)
  const mistakes = commonMistakes(problem)
  const copy = async () => {
    if (!code) return
    try { await navigator.clipboard.writeText(displayCode || code); setCopied(true); setTimeout(()=>setCopied(false),1200) } catch {}
  }
  return <article className="solution-guide">
    <section className="solution-guide-section solution-guide-intro">
      <h1>Solution</h1>
      <p>{problem.description || problem.task}</p>
    </section>

    <section className="solution-guide-section">
      <h2>Prerequisites</h2>
      <p>Before attempting this problem, you should be comfortable with:</p>
      <ul className="solution-prerequisites">{prerequisites.map(([name,description])=><li key={name}><strong>{name}</strong><span> — {description}</span></li>)}</ul>
    </section>

    <section className="solution-guide-section">
      <h2>Intuition</h2>
      <p>{problem.approach || problem.description || 'Start from the hardware behavior in the specification, then choose the smallest synthesizable structure that implements it directly.'}</p>
    </section>

    <section className="solution-guide-section">
      <h2>Implementation</h2>
      <ol className="solution-steps">{steps.map((step,index)=><li key={index}>{step}</li>)}</ol>
    </section>

    <section className="solution-guide-section">
      <h2>Hardware behavior</h2>
      <div className="solution-hardware-tags">{hardware.map(item=><span key={item}>{item}</span>)}</div>
      {problem.constraints?.length ? <ul className="solution-constraints">{problem.constraints.slice(0,4).map((item,index)=><li key={index}>{item}</li>)}</ul> : null}
    </section>

    <section className="solution-guide-section">
      <h2>Common mistakes</h2>
      <ul className="solution-mistakes">{mistakes.map((item,index)=><li key={index}>{item}</li>)}</ul>
    </section>

    <section className="solution-guide-section solution-reference">
      <div className="solution-reference-head"><div><h2>Reference implementation</h2><p>Compare this with your design after you have attempted the problem.</p></div></div>
      <div className="solution-reference-tabs-row">
        {available.length>1&&<div className="solution-language-tabs">{available.map(item=><button key={item} className={language===item?'active':''} onClick={()=>setLanguage(item)}>{item}</button>)}</div>}
        <div className="solution-reference-actions">
          <button type="button" className="solution-icon-action" onClick={copy} title={copied?'Copied':'Copy'} aria-label={copied?'Copied reference solution':'Copy reference solution'}>
            <Copy size={17}/>
          </button>
        </div>
      </div>
      <div className="solution-code-shell" ref={solutionShellRef}>
        {formatting && <span className="solution-formatting-status" aria-live="polite">Formatting…</span>}
        {displayCode ? <ReadOnlyHDLViewer code={displayCode} language={language} formatMode={formatMode} formatColumn={formatColumn} /> : <div className="solution-code-empty">Reference solution will be added for this problem.</div>}
      </div>
    </section>
  </article>
}

function ReactOwnedRunResult({ result, isConceptual }) {
  const tests = Array.isArray(result?.tests) ? result.tests : []
  const output = result?.output || ''
  const compileError = !result?.pass && !tests.length &&
    /syntax\s+error|parse\s+error|compil(?:e|ation)|unexpected\s+token|malformed|unknown\s+module|error\s*:/i.test(output)

  if (compileError) {
    return <div className="run-result fail sim-v2-result" data-react-owned="true">
      <div className="sim-v2-result-head">
        <strong className="sim-v2-status fail">Compilation Error</strong>
        <span>Simulation did not run</span>
      </div>
      <div className="sim-v2-compile">
        <pre className="sim-v2-compiler-output">{output}</pre>
      </div>
    </div>
  }

  const passCount = tests.filter(test => test.passed).length
  const status = result?.pass ? 'Accepted' : isConceptual ? 'Evaluation unavailable' : 'Wrong Answer'
  const totalLabel = tests.length
    ? `${passCount} / ${tests.length} testcases passed`
    : result?.pass ? 'Simulation passed' : 'Simulation failed'

  return <div className={`run-result sim-v2-result ${result?.pass ? 'pass' : 'fail'}`} data-react-owned="true">
    <div className="sim-v2-result-head">
      <strong className={`sim-v2-status ${result?.pass ? 'pass' : 'fail'}`}>{status}</strong>
      <span>{totalLabel}</span>
    </div>
    {tests.length ? <div className="test-cases sim-v2-case-strip">
      {tests.map((testCase,index)=><div className={`test-case sim-v2-case ${testCase.passed?'pass':'fail'}`} key={`${testCase.name}-${index}`}>
        <span className="test-case-status">{testCase.passed?'✓':'×'}</span>
        <span className="test-case-name">Test {index+1}: {testCase.name}</span>
        <span className="test-case-time">t={testCase.time}</span>
      </div>)}
    </div> : null}
    <div className="sim-v2-output-label">Simulator output</div>
    <pre className="sim-v2-raw-output">{output}</pre>
  </div>
}

function Editor({ code, language, onChange, onRun, onFormat, onLayoutColumnChange }) {
  return <MonacoHDLEditor code={code} language={language} onChange={onChange} onRun={onRun} onFormat={onFormat} onLayoutColumnChange={onLayoutColumnChange} />
}
function ProblemScrollPane({ children, refreshKey }) {
  const paneRef = useRef(null)
  const dragRef = useRef(null)
  const [thumb, setThumb] = useState({ top: 0, height: 0, visible: false })

  const syncThumb = () => {
    const pane = paneRef.current
    if (!pane) return
    const { clientHeight, scrollHeight, scrollTop } = pane
    if (scrollHeight <= clientHeight + 1) {
      setThumb({ top: 0, height: clientHeight, visible: false })
      return
    }
    const height = Math.max(24, Math.round((clientHeight / scrollHeight) * clientHeight))
    const maxThumbTop = Math.max(0, clientHeight - height)
    const maxScroll = Math.max(1, scrollHeight - clientHeight)
    setThumb({
      top: Math.round((scrollTop / maxScroll) * maxThumbTop),
      height,
      visible: true,
    })
  }

  useEffect(() => {
    const pane = paneRef.current
    if (!pane) return undefined
    syncThumb()
    const observer = new ResizeObserver(syncThumb)
    observer.observe(pane)
    const content = pane.firstElementChild
    if (content) observer.observe(content)
    return () => observer.disconnect()
  }, [refreshKey])

  const beginDrag = event => {
    const pane = paneRef.current
    if (!pane || !thumb.visible) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      startY: event.clientY,
      startScroll: pane.scrollTop,
      maxScroll: Math.max(1, pane.scrollHeight - pane.clientHeight),
      maxThumbTop: Math.max(1, pane.clientHeight - thumb.height),
    }
  }

  const drag = event => {
    const pane = paneRef.current
    const state = dragRef.current
    if (!pane || !state) return
    pane.scrollTop = state.startScroll + ((event.clientY - state.startY) / state.maxThumbTop) * state.maxScroll
  }

  const endDrag = event => {
    if (!dragRef.current) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    dragRef.current = null
  }

  const jump = event => {
    if (event.target !== event.currentTarget) return
    const pane = paneRef.current
    if (!pane || !thumb.visible) return
    const rect = event.currentTarget.getBoundingClientRect()
    const targetTop = Math.max(0, Math.min(pane.clientHeight - thumb.height, event.clientY - rect.top - thumb.height / 2))
    const maxThumbTop = Math.max(1, pane.clientHeight - thumb.height)
    pane.scrollTop = (targetTop / maxThumbTop) * Math.max(0, pane.scrollHeight - pane.clientHeight)
  }

  return <div className="ide-problem-scroll-shell">
    <div ref={paneRef} className="ide-problem-content" onScroll={syncThumb}>{children}</div>
    <div className={`problem-scrollbar${thumb.visible ? ' visible' : ''}`} aria-hidden="true" onPointerDown={jump}>
      <div
        className="problem-scrollbar-thumb"
        style={{ height: `${thumb.height}px`, transform: `translateY(${thumb.top}px)` }}
        onPointerDown={beginDrag}
        onPointerMove={drag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  </div>
}

export default function ProblemIDE({ problem, solved, draft, onBack, onSave, onSolved, onToggle, onPrevious, onNext, hasPrevious, hasNext, navigationLabel }) {
  const supported = problem.languages?.length ? problem.languages : languages, evaluationType = problem.evaluation?.type || 'simulation', isConceptual = evaluationType === 'answer', defaultLanguage = supported.includes('SystemVerilog') ? 'SystemVerilog' : supported[0] || 'SystemVerilog'
  const initialDraftState = useMemo(() => resolveInitialStarterDraft(problem, draft, defaultLanguage), [problem.id])
  const [code, setCode] = useState(initialDraftState.code), [editorLanguage, setEditorLanguage] = useState(initialDraftState.language), [bottomTab, setBottomTab] = useState('console'), [result, setResult] = useState(null), [running, setRunning] = useState(false), [statementTab, setStatementTab] = useState('problem'), [bottomCollapsed, setBottomCollapsed] = useState(false), [panelSplit, setPanelSplit] = useState(38), [draggingPanel, setDraggingPanel] = useState(false), [waveformOpen, setWaveformOpen] = useState(false)
  const [editorFormatColumn,setEditorFormatColumn] = useState(84)
  const [editorDirty,setEditorDirty] = useState(!initialDraftState.isStarter)
  const editorDirtyRef = useRef(!initialDraftState.isStarter)
  const editorFormatRequest = useRef(0)

  useEffect(()=>{
    if(initialDraftState.migrated) onSave(problem.id, initialDraftState.code)
  },[])

  const update = value => {
    editorFormatRequest.current += 1
    editorDirtyRef.current = true
    setEditorDirty(true)
    setCode(value)
    onSave(problem.id, value)
  }

  const changeLanguage = language => {
    editorFormatRequest.current += 1
    editorDirtyRef.current = false
    setEditorDirty(false)
    setEditorLanguage(language)
    const next = languageStarter(problem, language)
    setCode(next)
    onSave(problem.id, next)
    setResult(null)
    setWaveformOpen(false)
  }

  const formatEditorText = async (source, columnLimit = editorFormatColumn) => {
    if (!RUNNER_URL || isConceptual || !source) return source
    try {
      return await requestFormattedReference(editorLanguage, source, columnLimit)
    } catch {
      return source
    }
  }

  useEffect(()=>{
    if (isConceptual || editorDirty || !RUNNER_URL) return undefined
    const requestId = ++editorFormatRequest.current
    const source = languageStarter(problem, editorLanguage)
    let active = true
    requestFormattedReference(editorLanguage, source, editorFormatColumn)
      .then(formatted=>{
        if(!active || editorDirtyRef.current || requestId!==editorFormatRequest.current || !formatted) return
        setCode(formatted)
        onSave(problem.id, formatted)
      })
      .catch(()=>{})
    return ()=>{active=false}
  },[problem.id,editorLanguage,editorFormatColumn,editorDirty,isConceptual])
  useEffect(() => {
    if (!waveformOpen) return undefined
    const onKeyDown = event => { if (event.key === 'Escape' && !document.fullscreenElement) setWaveformOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [waveformOpen])
  const run = async () => {
    if (isConceptual) { setResult({ pass: false, output: 'Automated answer evaluation is not configured for this problem yet.', waveform: null, tests: [] }); return }
    setRunning(true); setBottomTab('console'); setBottomCollapsed(false)
    try {
      let data
      if (editorLanguage === 'VHDL') { if (!RUNNER_URL) throw new Error('VHDL simulator is not configured. Set VITE_RUNNER_URL to the HDLForge GHDL runner.'); const response = await fetch(`${RUNNER_URL}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problemId: problem.id, source: code, language: 'VHDL' }) }); data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || 'VHDL runner failed.') }
      else data = await runBrowserSimulation(problem.id, code)
      const passed = Boolean(data.passed); setResult({ pass: passed, output: data.output || 'Simulation completed.', waveform: data.waveform, tests: Array.isArray(data.tests) ? data.tests : [] }); if (passed && !solved) (onSolved || onToggle)?.(problem.id)
    } catch (error) { setResult({ pass: false, output: error?.message || 'Simulator failed.', waveform: null, tests: [] }) } finally { setRunning(false) }
  }
  const renderProblem = () => <div className="problem-copy"><section className="problem-section first"><div className="problem-heading" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',padding:'20px 0 18px',borderBottom:'1px solid var(--ide-border-soft)'}}><div style={{minWidth:0}}><h1 style={{margin:0,color:'#e8eef5',fontSize:'20px',lineHeight:1.25,fontWeight:750,overflowWrap:'anywhere'}}>{problem.title}</h1><span className="problem-category" style={{display:'inline-block',marginTop:'7px',color:'#d4d4d8',fontSize:'9px',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase'}}>{problem.topic||problem.category}</span></div><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span></div><h2>Task</h2><p>{problem.task}</p></section>{problem.explanation?<section className="problem-section"><h2>What this means</h2><p>{problem.explanation}</p></section>:null}{problem.signals?.length?<section className="problem-section"><h2>Inputs & outputs</h2><ul>{problem.signals.map((signal,index)=><li key={index}><strong>{signal.name}</strong> — {signal.direction}. {signal.description}</li>)}</ul></section>:null}<section className="problem-section"><h2>Examples</h2><div className="examples">{problem.examples.map((example, index) => <div key={index}><span>Example {index + 1}</span><pre>{example}</pre></div>)}</div></section>{problem.constraints?.length ? <section className="problem-section"><h2>Constraints</h2><ul>{problem.constraints.map((item, index) => <li key={index}>{item}</li>)}</ul></section> : null}</div>
  const resizePanel = e => { if (!draggingPanel) return; const body = e.currentTarget.closest('.ide-body'); if (!body) return; const rect = body.getBoundingClientRect(); setPanelSplit(Math.min(65, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100))) }
  const referenceSolutions = solutions[problem.id] || (problem.solution ? {[editorLanguage]:problem.solution} : {})
  return <div className="ide-page"><header className="ide-topbar"><button className="ide-brand topbar-brand" onClick={onBack} aria-label="Back to HDLForge problems" style={{flex:'0 0 auto',margin:0,padding:'7px 9px',border:'0',background:'transparent',color:'#e8eef5',cursor:'pointer'}}><span className="ide-brand-icon">HDL</span><strong>HDLForge</strong></button><div className="ide-problem-navigation topbar-navigation" style={{position:'absolute',left:'50%',transform:'translateX(-50%)'}}><button onClick={onPrevious} disabled={!hasPrevious}>← Previous</button><button className="section-navigation" onClick={onBack} aria-label={`Back to ${navigationLabel || problem.topic || problem.category}`}>{navigationLabel || problem.topic || problem.category}</button><button onClick={onNext} disabled={!hasNext}>Next →</button></div><div className="ide-actions">{solved ? <div className="solve-status passed"><CheckCircle2 size={15} /> {isConceptual ? 'Evaluated · Solved' : 'Tests passed · Solved'}</div> : <div className="solve-status">{isConceptual ? 'Evaluation not configured' : 'Run tests to solve'}</div>}<button className="primary" disabled={running} onClick={run}>{running ? <><Activity size={15} /> Running…</> : <><Play size={15} /> {isConceptual ? 'Evaluate' : 'Run tests'}</>}</button></div></header>
    <div className="ide-body" style={{ '--ide-panel-split': `${panelSplit}%` }} onPointerMove={resizePanel} onPointerUp={() => setDraggingPanel(false)}><aside className="ide-problem"><nav className="problem-tabs" aria-label="Problem information">{['problem', 'approach', 'solution', 'discussion'].map(tab => <button key={tab} className={statementTab === tab ? 'active' : ''} onClick={() => setStatementTab(tab)}>{tab === 'discussion' && <MessageSquare size={13} />}{tab[0].toUpperCase() + tab.slice(1)}</button>)}</nav><ProblemScrollPane refreshKey={`${problem.id}:${statementTab}`}>{statementTab === 'problem' && renderProblem()}{statementTab === 'approach' && <ApproachGuide problem={problem}/>}{statementTab === 'solution' && <SolutionGuide problem={problem} referenceSolutions={referenceSolutions} initialLanguage={editorLanguage}/>}{statementTab === 'discussion' && <Discussion problem={problem} />}</ProblemScrollPane></aside><div className={`ide-panel-resizer${draggingPanel ? ' dragging' : ''}`} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); setDraggingPanel(true) }} role="separator" aria-label="Resize task and editor panels" aria-valuenow={Math.round(panelSplit)}><span>⋮</span></div>
      <section className="ide-workspace"><div className="file-tabs"><div className="file-tab active"><FileCode2 size={14} /><span>{isConceptual ? 'answer.txt' : `solution.${editorLanguage === 'VHDL' ? 'vhd' : editorLanguage === 'Verilog' ? 'v' : 'sv'}`}</span></div>{!isConceptual && <><div className="editor-language"><select value={editorLanguage} onChange={e => changeLanguage(e.target.value)}>{supported.map(language => <option key={language}>{language}</option>)}</select></div><button type="button" className={`icon-btn waveform-launch-button${waveformOpen ? ' active' : ''}`} title="Waveform" aria-label="Waveform" aria-pressed={waveformOpen} onClick={() => setWaveformOpen(value => !value)}><Activity size={14} /></button><button className="icon-btn" title="Reset editor" onClick={() => changeLanguage(editorLanguage)}><RotateCcw size={14} /></button></>}</div>
      <div className="waveform-editor-stage">{isConceptual ? <div className="editor-shell"><div className="editor-gutter">{code.split('\n').map((_, i) => <span key={i}>{i + 1}</span>)}</div><textarea className="ide-editor" value={code} onChange={e => update(e.target.value)} spellCheck="false" /></div> : <Editor code={code} language={editorLanguage} onChange={update} onRun={run} onFormat={formatEditorText} onLayoutColumnChange={setEditorFormatColumn} />}{!isConceptual && waveformOpen && <WaveformWindow vcd={result?.waveform} onClose={() => setWaveformOpen(false)} />}</div>
      <div className={`ide-bottom${bottomCollapsed ? ' collapsed' : ''}`}><div className="bottom-tabs"><button className={bottomTab === 'console' ? 'active' : ''} onClick={() => { setBottomTab('console'); setBottomCollapsed(false) }}><Terminal size={14} /> Console</button><button className={bottomTab === 'testbench' ? 'active' : ''} onClick={() => { setBottomTab('testbench'); setBottomCollapsed(false) }}><Code2 size={14} /> {isConceptual ? 'Evaluation' : 'Testbench'}</button><button className="bottom-collapse" title={bottomCollapsed ? 'Expand console' : 'Collapse console'} onClick={() => setBottomCollapsed(v => !v)}>{bottomCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{bottomCollapsed ? 'Expand' : 'Collapse'}</button></div>{!bottomCollapsed && <div className="console">{bottomTab === 'console' && (result ? <ReactOwnedRunResult result={result} isConceptual={isConceptual}/> : <div className="console-empty"><Terminal size={18} /><span>{isConceptual ? 'Evaluation is not configured for this conceptual problem.' : 'Run the tests to see compiler and test output.'}</span></div>)}{bottomTab === 'testbench' && <div className="testbench-info"><strong><Code2 size={15} /> {isConceptual ? 'Evaluation' : 'Testbench'}</strong><p>{isConceptual ? 'This problem is conceptual and uses answer evaluation. Automated answer evaluation will be added with Interview Mode.' : 'HDLForge runs the problem\'s testbench against your submitted design. Hidden tests will be server-side in Interview Mode.'}</p><pre>{problem.testbench || 'The evaluator is managed by the problem harness.'}</pre></div>}</div>}</div></section></div></div>
}
