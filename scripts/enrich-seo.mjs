import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const publicDir=path.join(root,'public')
const problems=JSON.parse(fs.readFileSync(path.join(root,'src/data/problems.json'),'utf8'))
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))

const guidance={
 'RTL Design':{
  focus:'A strong answer translates the requirement into synthesizable state and combinational logic, states reset and update semantics precisely, and handles boundary conditions rather than only the nominal case.',
  verify:['Check reset or initialization before normal operation.','Exercise the nominal sequence cycle by cycle.','Test boundaries such as zero, maximum count, wraparound, full/empty, or simultaneous controls when they apply.','Prove the design holds state when an enable or qualifying condition is absent.'],
  mistakes:['Incomplete combinational assignments that infer a latch.','Blocking/non-blocking assignments that do not match combinational versus sequential intent.','Parameter-width and boundary errors.','Passing the happy path while missing reset, overflow, simultaneous operations, or illegal requests.']
 },
 'SystemVerilog':{
  focus:'The interviewer is usually testing language semantics as much as syntax: driver intent, scheduling, type behavior, interface directionality, and whether the construct communicates hardware intent clearly.',
  verify:['Compile with warnings enabled and investigate multiple drivers or incomplete assignments.','Exercise values that expose signedness, width extension, packed-array indexing, or modport direction mistakes.','Check behavior around clock edges and time zero.','Compare the construct with its simpler Verilog equivalent to confirm the intended hardware behavior.'],
  mistakes:['Using a construct without understanding its scheduling or driver rules.','Mixing signed and unsigned arithmetic accidentally.','Confusing packed and unpacked dimensions.','Hiding signal ownership with unclear interface or modport directions.']
 },
 'SVA':{
  focus:'SVA questions test temporal reasoning: exactly when signals are sampled, overlapped versus non-overlapped implication, reset disabling, and whether an assertion can pass vacuously.',
  verify:['Write one passing trace and one deliberately failing trace.','Check the exact cycle where the antecedent becomes true and where the consequent starts.','Exercise reset while the property is active.','Use cover or directed stimulus when useful to prove the antecedent can actually occur.'],
  mistakes:['Choosing |-> versus |=> by habit.','Forgetting disable iff or mishandling reset.','Allowing vacuous success because the antecedent never occurs.','Using unbounded eventuality when the protocol has a finite response requirement.']
 },
 'UVM':{
  focus:'UVM interview problems test transaction flow, ownership, phasing, TLM connections, checking strategy, and whether components remain reusable and debuggable.',
  verify:['Trace one item from sequence creation through driver activity, monitor observation, and scoreboard checking.','Inject a mismatch or protocol error to confirm the environment can fail for the correct reason.','Check that handshakes and analysis connections cannot silently drop transactions.','Run multiple transactions to exercise queues, ordering, and end-of-test behavior.'],
  mistakes:['Putting checking logic in the driver.','Dropping or duplicating items around sequencer-driver or analysis-port handshakes.','Ending the test before outstanding transactions are checked.','Reporting mismatches without enough diagnostic context.']
 },
 'FPGA':{
  focus:'FPGA problems test whether logically correct RTL will behave predictably in hardware, including clock-domain boundaries, reset release, noisy inputs, inferred resources, and timing.',
  verify:['Separate functional checks from implementation concerns such as CDC and timing.','Test asynchronous or noisy inputs with realistic transitions when relevant.','Confirm reset assertion and release do not create unintended pulses or state.','Review whether the RTL infers the intended FPGA resource.'],
  mistakes:['Treating an asynchronous input as synchronous.','Using a simple synchronizer for a pulse or multi-bit bus when a different CDC structure is needed.','Generating clocks in ordinary RTL when a clock enable would be safer.','Ignoring implementation timing because behavioral simulation passes.']
 },
 'Protocols':{
  focus:'Protocol questions test cycle-accurate sequencing, framing, handshake rules, backpressure, data stability, and the independence of channels or phases.',
  verify:['Exercise the fastest legal transfer and a stalled or backpressured transfer.','Check payload and control stability while a transfer is pending.','Test transaction boundaries and back-to-back transfers.','Exercise malformed or unexpected sequencing when the specification defines a response.'],
  mistakes:['Assuming handshake signals must occur in one fixed order.','Changing payload while a stalled transaction is still valid.','Off-by-one errors around beats, bits, or completion.','Coupling channels that the protocol defines as independent.']
 },
 'Computer Architecture':{
  focus:'Architecture questions test whether you state assumptions, calculate timing or storage fields correctly, and explain the microarchitectural consequence rather than only giving a final number.',
  verify:['Write down pipeline, cache, and latency assumptions before calculating.','Check a concrete example by hand.','Consider dependencies, misses, branches, structural conflicts, or replacement events.','Explain how the answer changes if forwarding, associativity, or latency changes.'],
  mistakes:['Giving a number without showing the derivation.','Assuming forwarding removes every RAW hazard.','Mixing bytes, words, lines, sets, and address bits.','Ignoring the stage that produces or consumes a value.']
 }
}

const edgeCases={
 fifo:['Write when full and read when empty.','Simultaneous read and write.','Pointer wraparound and transitions into and out of full/empty.'],
 counter:['Maximum value and wraparound.','Enable low while the counter would otherwise advance.','Reset coincident with another control.'],
 handshake:['VALID held while READY is low.','READY asserted before VALID.','Back-to-back transfers without an idle cycle.'],
 memory:['Read-after-write behavior.','Address boundary values.','Simultaneous accesses or collisions when the interface permits them.'],
 reset:['Reset asserted during active operation.','The first cycle after reset is released.'],
 pipeline:['An immediately preceding dependency.','A dependency that can be forwarded versus one that requires a stall.'],
 cache:['First and last byte within a line.','Two addresses that map to the same set.'],
 uart:['Back-to-back frames.','Start/stop timing and LSB-first ordering.'],
 spi:['First and last sampled bit.','Chip-select boundaries and the configured sampling edge.'],
 cdc:['A transition close to the destination clock edge.','A pulse shorter than a destination clock period.'],
 arbiter:['No requests, one request, and simultaneous requests.','Priority behavior when the highest-priority requester changes.'],
 lfsr:['Reset seed behavior.','Protection against the all-zero lock-up state.'],
 assertion:['A trace where the antecedent occurs but the consequent fails.','A trace where the antecedent never occurs, to inspect vacuity.']
}

const unique=arr=>[...new Set(arr.filter(Boolean))]
const list=items=>`<ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`
const followUps=p=>{
 const q=[]
 if(p.category==='RTL Design') q.push('How would you parameterize this design without introducing width or boundary bugs?','What changes if reset timing or polarity changes?')
 if(p.category==='SystemVerilog') q.push('What language rule makes this construct safer or clearer than the equivalent Verilog?','What simulation/synthesis mismatch could appear if this were written carelessly?')
 if(p.category==='SVA') q.push('Would overlapped or non-overlapped implication be correct here, and why?','How would you detect or avoid vacuous success?')
 if(p.category==='UVM') q.push('Which component should own the reference-model comparison?','How would you debug a transaction that was driven but never reached the scoreboard?')
 if(p.category==='FPGA') q.push('What hardware-specific issue could make a simulation-only solution unreliable?','What timing or CDC check would you review before sign-off?')
 if(p.category==='Protocols') q.push('How does the design behave under the slowest legal peer timing?','Which signals must remain stable while a transfer is pending?')
 if(p.category==='Computer Architecture') q.push('Which assumption has the largest effect on the answer?','How would the result change if latency or forwarding changed?')
 if((p.tags||[]).includes('fifo')) q.push('How would this change for an asynchronous FIFO?')
 if((p.tags||[]).includes('memory')) q.push('What read-during-write behavior do you expect from the target memory?')
 return unique(q).slice(0,4)
}

let enriched=0
for(const [index,p] of problems.entries()){
 const file=path.join(publicDir,'problems',p.id,'index.html')
 if(!fs.existsSync(file)) continue
 let html=fs.readFileSync(file,'utf8')
 const g=guidance[p.category]
 if(!g || html.includes('<h2>Verification plan</h2>')) continue
 const edges=unique((p.tags||[]).flatMap(t=>edgeCases[String(t).toLowerCase()]||[])).slice(0,6)
 const questions=followUps(p)
 const prev=problems[index-1]
 const next=problems[index+1]
 const extra=`<h2>What this problem is testing</h2><p>${esc(g.focus)}</p><div class="callout"><strong>Interview habit:</strong> before coding, state reset behavior, the state that must be stored, and the conditions that update each output.</div><h2>Verification plan</h2>${list(g.verify)}${edges.length?`<h3>Edge cases worth testing</h3>${list(edges)}`:''}<h2>Common mistakes</h2>${list(g.mistakes)}${questions.length?`<h2>Interview follow-up questions</h2>${list(questions)}`:''}`
 html=html.replace('<h2>Concepts to review</h2>',`${extra}<h2>Concepts to review</h2>`)
 html=html.replace('<p><a href="/">Open HDLForge to solve this problem in the interactive editor</a>.</p>',`<p><a href="/?problem=${encodeURIComponent(p.id)}">Open ${esc(p.title)} in the HDLForge interactive editor</a>.</p>`)
 if(prev||next){
  const nav=`<h2>Continue practising</h2><div class="next-links">${prev?`<a href="/problems/${esc(prev.id)}/">← ${esc(prev.title)}</a>`:''}${next?`<a href="/problems/${esc(next.id)}/">${esc(next.title)} →</a>`:''}</div>`
  html=html.replace('</main>',`${nav}</main>`)
 }
 html=html.replace('</style>','.callout{border-left:4px solid #222;background:#f7f7f7;padding:14px 16px;margin:20px 0}.next-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.next-links a{border:1px solid #ddd;border-radius:9px;padding:12px;text-decoration:none}</style>')
 fs.writeFileSync(file,html)
 enriched++
}

for(const [category,g] of Object.entries(guidance)){
 const slug={'RTL Design':'rtl-design','SystemVerilog':'systemverilog','SVA':'sva','UVM':'uvm','FPGA':'fpga','Protocols':'protocols','Computer Architecture':'computer-architecture'}[category]
 const file=path.join(publicDir,'learn',slug,'index.html')
 if(!fs.existsSync(file)) continue
 let html=fs.readFileSync(file,'utf8')
 if(html.includes('<h2>What interviewers usually look for</h2>')) continue
 const intro=`<h2>What interviewers usually look for</h2><p>${esc(g.focus)}</p><h2>How to practise this topic</h2><ol>${g.verify.slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`
 html=html.replace('<h2>Practice problems</h2>',`${intro}<h2>Practice problems</h2>`)
 html=html.replace('/learn/hardware-design-interview/','/learn/')
 fs.writeFileSync(file,html)
}

console.log(`Enriched ${enriched} problem SEO pages with interview and verification guidance.`)
