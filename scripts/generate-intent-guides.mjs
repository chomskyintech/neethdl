import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const publicDir=path.join(root,'public')
const base='https://hdlforge.netlify.app'
const problems=JSON.parse(fs.readFileSync(path.join(root,'src/data/problems.json'),'utf8'))
const problemById=new Map(problems.map(problem=>[problem.id,problem]))
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))
const write=(rel,content)=>{const file=path.join(publicDir,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content)}

const guides=[
 {
  slug:'axi-lite-verification',
  title:'AXI-Lite Verification Guide',
  description:'Learn how to verify AXI-Lite RTL with independent channel handshakes, assertions, scoreboards, backpressure tests and executable HDLForge practice.',
  kicker:'AMBA / design verification',
  intro:'AXI-Lite looks simple because transactions carry only one data beat, but verification still has to respect independent address, data and response channels. A good testbench proves channel ordering, backpressure behavior, data stability and one-response-per-transaction behavior instead of testing only the fastest path.',
  principles:[
   'Treat AW and W as independent channels. A legal slave must not assume they arrive in the same cycle.',
   'Keep BVALID asserted until BREADY completes the response handshake.',
   'Check payload stability whenever a VALID signal is held while READY is low.',
   'Separate protocol checking from data checking: assertions catch temporal violations while a scoreboard checks architectural results.'
  ],
  implementation:[
   'Start with a single-register write slave and make address/data capture explicit.',
   'Add directed cases for AW-before-W, W-before-AW, same-cycle arrival and delayed BREADY.',
   'Add SVA for VALID hold/stability, legal reset behavior and response persistence.',
   'Use a monitor/scoreboard path to prove that each accepted write updates the expected register exactly once.'
  ],
  verification:[
   'Randomize the relative timing of AWVALID, WVALID and BREADY.',
   'Hold the response channel stalled for several cycles and verify BVALID does not disappear.',
   'Reset during idle and around transactions, then confirm no stale response survives.',
   'Count accepted write transactions and responses; the counts should remain consistent.'
  ],
  snippet:`// Transfer on each independent channel\naw_fire = awvalid && awready;\nw_fire  = wvalid  && wready;\nb_fire  = bvalid  && bready;`,
  problemIds:['proto-axi-lite-write','sva-handshake','uvm-scoreboard','sv-interface'],
  projects:[['uvm-axi4-lite-verification','UVM Verification Environment for an AXI4-Lite Peripheral'],['axi-lite-apb-bridge','AXI-Lite to APB Bridge']],
  companies:[['arm','Arm'],['amd','AMD'],['qualcomm','Qualcomm']]
 },
 {
  slug:'ready-valid-handshake-rtl',
  title:'Ready/Valid Handshake RTL Guide',
  description:'Design ready/valid RTL correctly with backpressure, payload stability, skid buffers, elastic pipelines and executable HDLForge practice problems.',
  kicker:'Streaming RTL / protocols',
  intro:'Ready/valid is one of the most reusable hardware interface patterns. The transfer rule is tiny—data moves only when VALID and READY are both high—but robust RTL also needs clear ownership, stable stalled data and deliberate buffering so timing pressure does not create combinational loops or lost transfers.',
  principles:[
   'A transfer occurs only on a clock edge where valid && ready is true.',
   'The source owns VALID and payload; while stalled, both must remain stable until the transfer completes.',
   'READY can be used to apply backpressure, but combinational dependencies across multiple stages should be controlled carefully.',
   'A skid buffer is useful when READY arrives too late to stop one in-flight item without losing it.'
  ],
  implementation:[
   'Write the fire condition first and use it consistently for state updates.',
   'Implement a one-entry source register before attempting a multi-stage streaming pipeline.',
   'Add an elastic register or skid buffer and verify full-throughput back-to-back transfers.',
   'Pipeline data and control together; a valid bit that is one cycle misaligned is a functional bug.'
  ],
  verification:[
   'Exercise always-ready, always-stalled and bursty READY patterns.',
   'Send back-to-back valid data and prove there are no drops, duplicates or reordering.',
   'Check that data remains stable for every cycle of a stall.',
   'Assert transfer counts at the input and output of buffered pipelines.'
  ],
  snippet:`wire fire = valid && ready;\n// If valid && !ready, hold valid and payload stable.`,
  problemIds:['proto-ready-valid-source','rtl-skid-buffer','rtl-pipeline-register','rtl-ready-valid-register','sva-handshake'],
  projects:[['fpga-packet-parser','FPGA Packet Parser and Statistics Engine'],['hardware-dsp-pipeline','Hardware DSP Pipeline']],
  companies:[['jane-street','Jane Street'],['nvidia','NVIDIA'],['amd','AMD']]
 },
 {
  slug:'verilog-fifo-design',
  title:'Verilog FIFO Design Guide',
  description:'Learn synchronous FIFO RTL in Verilog: pointers, occupancy, full/empty logic, simultaneous read/write behavior and verification edge cases.',
  kicker:'RTL design / memory',
  intro:'A FIFO is a compact interview problem that exposes whether you can reason about state, memory, boundary conditions and simultaneous controls. The cleanest design starts from explicit enqueue/dequeue events and derives pointer and occupancy updates from those events.',
  principles:[
   'Define write_fire = wr_en && !full and read_fire = rd_en && !empty before updating any state.',
   'Do not advance pointers for rejected reads or writes.',
   'Handle simultaneous successful read/write without accidentally changing occupancy.',
   'Make full and empty semantics explicit for the chosen pointer/count implementation.'
  ],
  implementation:[
   'Use a small synchronous FIFO first: memory array, read pointer, write pointer and occupancy count.',
   'Parameterize width and depth only after the fixed-size behavior is correct.',
   'Decide whether read data is registered or combinational and keep the testbench aligned with that choice.',
   'For FPGA-oriented versions, consider how the memory style maps to BRAM and whether non-power-of-two depth is required.'
  ],
  verification:[
   'Reset to empty and verify the flags before the first transaction.',
   'Fill to capacity, attempt an extra write and prove state does not corrupt.',
   'Drain to empty, attempt an extra read and prove the read pointer does not move.',
   'Run simultaneous read/write at empty, full and mid-occupancy boundaries.'
  ],
  snippet:`wire write_fire = wr_en && !full;\nwire read_fire  = rd_en && !empty;\n\ncase ({write_fire, read_fire})\n  2'b10: count <= count + 1'b1;\n  2'b01: count <= count - 1'b1;\n  default: count <= count;\nendcase`,
  problemIds:['rtl-fifo','rtl-dual-port-ram','rtl-gray-counter'],
  projects:[['asynchronous-fifo','CDC-Safe Asynchronous FIFO'],['cache-memory-controller','Parameterized Cache or Memory Controller']],
  companies:[['amd','AMD'],['apple','Apple Silicon'],['jane-street','Jane Street']]
 },
 {
  slug:'asynchronous-fifo-cdc',
  title:'Asynchronous FIFO and CDC Guide',
  description:'Understand asynchronous FIFO RTL, Gray-code pointers, synchronizers, reset release and CDC verification with HDLForge practice and project links.',
  kicker:'Clock-domain crossing / FPGA / ASIC',
  intro:'An asynchronous FIFO moves ordered data between unrelated clocks by keeping the memory local while synchronizing pointer information across domains. The difficult part is not the RAM—it is representing multi-bit pointer state safely, comparing synchronized pointers correctly and making reset behavior deterministic in both domains.',
  principles:[
   'Maintain binary pointers locally for addressing and derive Gray-code pointers for clock-domain crossing.',
   'Synchronize Gray pointers through two-flop chains before using them in the opposite clock domain.',
   'Generate empty in the read domain and full in the write domain using only locally clocked state plus synchronized remote pointers.',
   'Treat reset deassertion as a CDC problem: asynchronous assertion with synchronous release is a common robust pattern.'
  ],
  implementation:[
   'Build and test binary-to-Gray conversion independently.',
   'Add reset synchronizers for each domain and document the reset assumptions.',
   'Implement pointer synchronizers, then empty detection, then full detection.',
   'Only after the control path is proven should you combine it with the dual-port memory datapath.'
  ],
  verification:[
   'Use different, non-harmonically related write/read clock periods.',
   'Sweep from write-faster-than-read to read-faster-than-write conditions.',
   'Reset one or both domains around empty/full boundaries and inspect recovery.',
   'Assert that overflow/underflow are impossible and that dequeued data preserves enqueue order.'
  ],
  snippet:`// Binary to Gray\ngray = binary ^ (binary >> 1);\n// Cross Gray pointers through synchronizer flops, not raw binary counters.`,
  problemIds:['rtl-gray-counter','rtl-reset-synchronizer','fpga-pulse-sync','rtl-fifo','rtl-dual-port-ram'],
  projects:[['asynchronous-fifo','CDC-Safe Asynchronous FIFO'],['fpga-packet-parser','FPGA Packet Parser and Statistics Engine']],
  companies:[['nvidia','NVIDIA'],['qualcomm','Qualcomm'],['apple','Apple Silicon']]
 },
 {
  slug:'systolic-array-rtl',
  title:'Systolic Array RTL Design Guide',
  description:'Learn systolic-array RTL from multiply-accumulate processing elements to data forwarding, pipeline timing and matrix-multiply verification.',
  kicker:'AI accelerator / datapath design',
  intro:'A systolic array turns a regular arithmetic kernel into a spatial pipeline. Each processing element performs local work—usually multiply-accumulate—while operands move predictably between neighbours. The main RTL challenge is keeping arithmetic, forwarding and cycle alignment consistent across the array.',
  principles:[
   'Start from a processing element with explicit signed widths, accumulator width and enable/reset behavior.',
   'Forward operands and update the accumulator on well-defined clock edges so wavefront timing is deterministic.',
   'Size accumulators from the maximum dot-product length and operand range rather than relying on implicit truncation.',
   'Array-level correctness depends on launch timing: rows and columns may need deliberate staggering before products meet at the intended PE.'
  ],
  implementation:[
   'Verify one MAC, then one forwarding PE, before instantiating a 2-D array.',
   'Create a small 2x2 matrix-multiply schedule on paper and annotate the expected cycle at each PE.',
   'Add valid/enable propagation if the array must support bubbles or repeated tiles.',
   'Measure initiation interval separately from total latency; a pipelined array can have high latency and still sustain high throughput.'
  ],
  verification:[
   'Test positive, negative, zero and extreme signed operands.',
   'Compare against a software/reference matrix multiplication for randomized vectors.',
   'Check every PE accumulator and forwarding signal cycle-by-cycle for at least one tiny matrix.',
   'Send consecutive tiles or vectors to expose stale-state and valid-alignment bugs.'
  ],
  snippet:`// Conceptual PE update\nif (enable) begin\n  a_out <= a_in;\n  b_out <= b_in;\n  acc   <= acc + a_in * b_in;\nend`,
  problemIds:['accel-systolic-pe','accel-mac8','accel-dot4','accel-pipelined-mul','accel-fixed-mul'],
  projects:[['hardware-dsp-pipeline','Hardware DSP Pipeline'],['feed-to-action-latency-pipeline','Timestamped Feed-to-Action Pipeline']],
  companies:[['nvidia','NVIDIA'],['amd','AMD'],['apple','Apple Silicon']]
 },
 {
  slug:'hardware-accelerator-design',
  title:'Hardware Accelerator RTL Design Guide',
  description:'Learn hardware accelerator RTL through MACs, reductions, fixed-point arithmetic, streaming pipelines, quantization and systolic compute structures.',
  kicker:'GPU / NPU / DSP-style hardware',
  intro:'Accelerator RTL is about shaping a datapath around a workload. The transferable skills are numeric width discipline, explicit signedness, parallel reductions, streaming control and pipelining for throughput. These same building blocks appear in DSP, AI inference, image processing and domain-specific compute engines.',
  principles:[
   'Derive arithmetic widths from numeric range and accumulation depth; do not let Verilog choose truncation accidentally.',
   'Separate throughput from latency. Pipelining can increase latency while improving maximum clock rate and sustained results per cycle.',
   'Use regular structures—lanes, trees and processing-element arrays—when they simplify routing and verification.',
   'Define overflow behavior deliberately: wrap, truncate, round or saturate depending on the specification.'
  ],
  implementation:[
   'Begin with a signed INT8 MAC, then build dot products and reduction trees.',
   'Add quantization/fixed-point stages and write explicit corner-case rules for negative and saturated values.',
   'Wrap datapaths in valid/ready control so they can live inside streaming systems.',
   'Move to systolic or tiled structures only after the single-lane arithmetic and pipeline timing are verified.'
  ],
  verification:[
   'Generate golden results in software using exactly the same signed widths and quantization rules.',
   'Exercise maximum/minimum operands, zeros and alternating signs.',
   'Check bubbles and back-to-back valid traffic across every pipeline stage.',
   'Track both functional correctness and performance properties such as initiation interval and latency.'
  ],
  snippet:`// Width planning matters\n// INT8 x INT8 -> signed 16-bit product\n// N products require extra accumulator headroom.`,
  problemIds:['accel-mac8','accel-dot4','accel-reduction8','accel-relu-quant','accel-fixed-mul','accel-stream-accum','accel-systolic-pe','accel-pipelined-mul'],
  projects:[['hardware-dsp-pipeline','Hardware DSP Pipeline'],['fpga-packet-parser','FPGA Packet Parser and Statistics Engine']],
  companies:[['nvidia','NVIDIA'],['amd','AMD'],['apple','Apple Silicon']]
 },
 {
  slug:'uvm-scoreboard-guide',
  title:'UVM Scoreboard Guide',
  description:'Build a practical UVM scoreboard with monitor transactions, reference-model prediction, analysis connections, mismatch reporting and coverage-aware verification.',
  kicker:'UVM / design verification',
  intro:'A scoreboard answers the core end-to-end verification question: did the DUT produce the result the specification predicts? Good scoreboards are intentionally separate from drivers and timing details. They consume observed transactions, model expected behavior and report useful mismatches without becoming another copy of the RTL.',
  principles:[
   'Observe DUT behavior through monitors; the scoreboard should not peek into internal DUT state unless the verification plan explicitly requires it.',
   'Keep prediction/reference-model logic conceptually independent from the DUT implementation.',
   'Match transactions by ordering, ID, address or another architectural key appropriate to the protocol.',
   'Report expected and actual values plus enough context to reproduce the failure.'
  ],
  implementation:[
   'Start with one analysis implementation and an in-order queue of expected results.',
   'Add separate input/output monitor streams when the DUT transforms transactions.',
   'Handle reset by clearing or invalidating outstanding expected transactions according to the specification.',
   'Add counters for compared, passed, failed and outstanding transactions so regressions are easy to audit.'
  ],
  verification:[
   'Inject one deliberate DUT or testbench error and confirm the scoreboard produces a useful failure.',
   'Check reset while transactions are pending.',
   'Stress back-to-back traffic to ensure the checker is not accidentally relying on idle cycles.',
   'Use functional coverage alongside the scoreboard; passing comparisons alone do not prove the input space was exercised.'
  ],
  snippet:`function void write(txn t);\n  expected = predict(t);\n  // Compare later against the observed output transaction.\nendfunction`,
  problemIds:['uvm-scoreboard','uvm-driver','sv-interface','sva-handshake'],
  projects:[['uvm-axi4-lite-verification','UVM Verification Environment for an AXI4-Lite Peripheral'],['risc-v-core-verification','RISC-V Core Verification']],
  companies:[['amd','AMD'],['qualcomm','Qualcomm'],['nvidia','NVIDIA']]
 },
 {
  slug:'sva-handshake-assertions',
  title:'SVA Handshake Assertions Guide',
  description:'Write SystemVerilog Assertions for ready/valid and bus handshakes: VALID hold, payload stability, responses, reset disabling and backpressure.',
  kicker:'SystemVerilog Assertions',
  intro:'Handshake assertions convert informal timing rules into executable properties. For ready/valid-style interfaces, the highest-value properties usually describe what must persist during backpressure, when transfers are allowed to occur and how reset disables or constrains the protocol.',
  principles:[
   'Sample protocol properties on the interface clock and make reset semantics explicit with disable iff or implication as appropriate.',
   'When VALID is high and READY is low, assert that VALID remains high until the transfer and that payload remains stable.',
   'Distinguish same-cycle implication (|->) from next-cycle implication (|=>); choosing the wrong one shifts the intended requirement.',
   'Prefer several small properties with clear failure messages over one giant property that is difficult to debug.'
  ],
  implementation:[
   'Write a transfer definition and a stall definition before writing properties.',
   'Add a VALID-hold property, then a payload-stability property.',
   'Add response persistence or one-hot/ordering properties specific to the protocol.',
   'Run both passing and intentionally failing stimulus so you know the assertion can actually fire.'
  ],
  verification:[
   'Hold READY low for multiple cycles while changing stimulus around the source.',
   'Deassert VALID illegally during a stall and confirm the property fails.',
   'Change payload illegally while stalled and confirm $stable catches it.',
   'Exercise reset near a pending transfer to confirm the property is neither over- nor under-disabled.'
  ],
  snippet:`property valid_holds_until_ready;\n  @(posedge clk) disable iff (reset)\n    valid && !ready |=> valid;\nendproperty\n\nproperty payload_stable_while_stalled;\n  @(posedge clk) disable iff (reset)\n    valid && !ready |=> $stable(data);\nendproperty`,
  problemIds:['sva-handshake','sva-reset','proto-ready-valid-source','rtl-skid-buffer'],
  projects:[['uvm-axi4-lite-verification','UVM Verification Environment for an AXI4-Lite Peripheral'],['apb-peripheral-verification','APB Peripheral Verification Suite']],
  companies:[['arm','Arm'],['amd','AMD'],['qualcomm','Qualcomm']]
 }
]

function problemCards(ids){
 return ids.map(id=>problemById.get(id)).filter(Boolean).map(problem=>`<a class="card" href="/problems/${esc(problem.id)}/"><span class="meta">${esc(problem.category)} · ${esc(problem.difficulty)}</span><strong>${esc(problem.title)}</strong><p>${esc(problem.description)}</p></a>`).join('')
}
function projectCards(projects){return projects.map(([slug,title])=>`<a class="card compact" href="/projects/${esc(slug)}/"><span class="meta">Project</span><strong>${esc(title)}</strong></a>`).join('')}
function companyLinks(companies){return companies.map(([slug,title])=>`<a href="/companies/${esc(slug)}/">${esc(title)}</a>`).join(' · ')}
function list(items){return `<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`}
function shell(guide){
 const canonical=`${base}/learn/${guide.slug}/`
 const linkedProblems=guide.problemIds.map(id=>problemById.get(id)).filter(Boolean)
 const graph=[
  {'@type':'TechArticle','headline':guide.title,'description':guide.description,'url':canonical,'mainEntityOfPage':canonical,'isPartOf':{'@type':'WebSite','name':'HDLForge','url':base+'/'},'about':guide.kicker},
  {'@type':'BreadcrumbList','itemListElement':[
   {'@type':'ListItem','position':1,'name':'HDLForge','item':base+'/'},
   {'@type':'ListItem','position':2,'name':'Learn','item':base+'/learn/'},
   {'@type':'ListItem','position':3,'name':guide.title,'item':canonical}
  ]},
  {'@type':'ItemList','name':`${guide.title} practice problems`,'itemListElement':linkedProblems.map((problem,index)=>({'@type':'ListItem','position':index+1,'name':problem.title,'url':`${base}/problems/${problem.id}/`}))}
 ]
 return `<!doctype html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(guide.title)} | HDLForge</title><meta name="description" content="${esc(guide.description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:site_name" content="HDLForge"><meta property="og:title" content="${esc(guide.title)}"><meta property="og:description" content="${esc(guide.description)}"><meta property="og:url" content="${canonical}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:1020px;margin:0 auto;padding:48px 24px 72px;line-height:1.67;color:#171717}nav{margin-bottom:40px}h1{font-size:2.55rem;line-height:1.08;letter-spacing:-.035em;margin:.35rem 0 1rem}h2{margin-top:2.4rem;letter-spacing:-.015em}.eyebrow,.meta{color:#666;font-size:.9rem}.intro{font-size:1.09rem;max-width:860px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.card{display:block;border:1px solid #ddd;border-radius:12px;padding:16px;text-decoration:none;color:inherit}.card:hover{border-color:#777}.card strong{display:block;margin:.2rem 0}.card p{margin:.4rem 0 0;color:#444}.card.compact{min-height:82px}.callout{margin:22px 0;padding:16px 18px;border-left:4px solid #222;background:#f7f7f7}.code{white-space:pre-wrap;overflow:auto;border:1px solid #ddd;border-radius:12px;background:#f8f8f8;padding:16px;font:13px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace}.next{margin-top:34px;padding:18px;border:1px solid #ddd;border-radius:12px;background:#fafafa}li{margin:.35rem 0}</style></head><body><nav><a href="/">HDLForge</a> · <a href="/learn/">Learn</a> · <a href="/practice/">Practice</a> · <a href="/problems/">Problems</a> · <a href="/projects/">Projects</a></nav><main><p class="eyebrow">${esc(guide.kicker)}</p><h1>${esc(guide.title)}</h1><p class="intro">${esc(guide.intro)}</p><div class="callout"><strong>Implementation-first:</strong> use this guide to review the design rules, then solve the linked HDLForge problems without looking at a solution first.</div><h2>Core design rules</h2>${list(guide.principles)}<h2>Implementation path</h2>${list(guide.implementation)}<h2>Verification checklist</h2>${list(guide.verification)}<h2>Useful RTL / verification pattern</h2><pre class="code">${esc(guide.snippet)}</pre><h2>Practice with executable problems</h2><div class="grid">${problemCards(guide.problemIds)}</div><h2>Turn it into a project</h2><div class="grid">${projectCards(guide.projects)}</div><div class="next"><strong>Interview paths using these skills</strong><p>${companyLinks(guide.companies)}</p><p><a href="/app/problems/">Open the interactive HDLForge problem workspace</a> or return to the <a href="/learn/">hardware learning hub</a>.</p></div></main></body></html>`
}

for(const guide of guides)write(`learn/${guide.slug}/index.html`,shell(guide))

// Add a dedicated deep-dive section to the main learning hub.
const learnHub=path.join(publicDir,'learn','index.html')
if(fs.existsSync(learnHub)){
 let html=fs.readFileSync(learnHub,'utf8')
 const marker='HDLForge implementation deep dives'
 if(!html.includes(marker)){
  const cards=guides.map(guide=>`<a class="card" href="/learn/${guide.slug}/"><strong>${esc(guide.title)}</strong><br><span>${esc(guide.description)}</span></a>`).join('')
  const section=`<section><p class="meta">${marker}</p><h2>Implementation deep dives</h2><p>Focused guides that connect hardware concepts directly to executable RTL and verification practice.</p><div class="grid">${cards}</div></section>`
  html=html.replace('</main>',`${section}</main>`)
  fs.writeFileSync(learnHub,html)
 }
}

// Strengthen internal linking from the most relevant topic/practice hubs.
const hubLinks={
 'learn/protocols/index.html':['axi-lite-verification','ready-valid-handshake-rtl'],
 'learn/rtl-design/index.html':['ready-valid-handshake-rtl','verilog-fifo-design'],
 'learn/fpga/index.html':['asynchronous-fifo-cdc','verilog-fifo-design'],
 'learn/sva/index.html':['sva-handshake-assertions','axi-lite-verification'],
 'learn/uvm/index.html':['uvm-scoreboard-guide','axi-lite-verification'],
 'learn/accelerators/index.html':['hardware-accelerator-design','systolic-array-rtl'],
 'practice/protocols/index.html':['axi-lite-verification','ready-valid-handshake-rtl'],
 'practice/rtl-design/index.html':['verilog-fifo-design','ready-valid-handshake-rtl'],
 'practice/design-verification/index.html':['uvm-scoreboard-guide','sva-handshake-assertions','axi-lite-verification'],
 'practice/fpga/index.html':['asynchronous-fifo-cdc'],
 'practice/accelerators/index.html':['hardware-accelerator-design','systolic-array-rtl']
}
for(const [rel,slugs] of Object.entries(hubLinks)){
 const file=path.join(publicDir,rel)
 if(!fs.existsSync(file))continue
 let html=fs.readFileSync(file,'utf8')
 if(html.includes('Related implementation guides'))continue
 const links=slugs.map(slug=>guides.find(guide=>guide.slug===slug)).filter(Boolean).map(guide=>`<li><a href="/learn/${guide.slug}/">${esc(guide.title)}</a> — ${esc(guide.description)}</li>`).join('')
 html=html.replace('</main>',`<section><h2>Related implementation guides</h2><ul>${links}</ul></section></main>`)
 fs.writeFileSync(file,html)
}

const sitemapPath=path.join(publicDir,'sitemap.xml')
if(fs.existsSync(sitemapPath)){
 let xml=fs.readFileSync(sitemapPath,'utf8')
 const additions=guides.filter(guide=>!xml.includes(`${base}/learn/${guide.slug}/`)).map(guide=>`  <url><loc>${base}/learn/${guide.slug}/</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>`).join('\n')
 if(additions)xml=xml.replace('</urlset>',`${additions}\n</urlset>`)
 fs.writeFileSync(sitemapPath,xml)
}

console.log(`Generated ${guides.length} high-intent implementation guides and connected topic hubs.`)
