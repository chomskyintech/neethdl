import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const publicDir=path.join(root,'public')
const problems=JSON.parse(fs.readFileSync(path.join(root,'src/data/problems.json'),'utf8'))
const base='https://hdlforge.netlify.app'
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const write=(rel,content)=>{const p=path.join(publicDir,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content)}
const difficultyRank={Easy:0,Medium:1,Hard:2}

const paths=[
 {
  slug:'hardware-design',
  title:'Hardware Design Practice Problems',
  description:'Practice RTL, FPGA, verification, protocols and computer architecture with a structured HDLForge problem path for hardware design interviews.',
  intro:'Use this path when you want broad hardware-design practice rather than a single topic. It starts with synthesizable RTL, then adds interfaces, verification, FPGA concerns and architecture reasoning.',
  filter:p=>['RTL Design','Protocols','FPGA','Computer Architecture','SystemVerilog','SVA','UVM'].includes(p.category),
  limit:24,
  stages:['Start with combinational and sequential RTL fundamentals.','Move into FIFOs, register files, arbiters and protocol state machines.','Add SystemVerilog, assertions and UVM-style checking.','Finish with CDC, FPGA implementation concerns and architecture problems.']
 },
 {
  slug:'verilog',
  title:'Verilog Practice Problems',
  description:'Solve Verilog practice problems covering combinational logic, counters, FIFOs, FSMs, memories, UART, SPI and FPGA-oriented RTL.',
  intro:'This path is for hands-on Verilog practice. The selected problems are all implementable as synthesizable RTL and progress from small coding exercises toward interview-sized blocks.',
  filter:p=>(p.languages||[]).includes('Verilog'),
  limit:20,
  stages:['Write simple combinational modules without inferred latches.','Practice clocked state, reset behavior and parameterization.','Implement stateful blocks such as FIFOs, register files and serial controllers.','Review edge cases before opening the simulator.']
 },
 {
  slug:'rtl-design',
  title:'RTL Design Practice Problems',
  description:'Practice RTL design interview problems across combinational logic, sequential logic, counters, FIFOs, arbiters, memories and parameterized hardware.',
  intro:'Use this path for digital-design and RTL interviews. Every problem asks you to turn a behavioral requirement into explicit synthesizable state, update rules and edge-case handling.',
  filter:p=>p.category==='RTL Design',
  limit:20,
  stages:['Define outputs and state before coding.','State reset semantics and cycle timing explicitly.','Handle simultaneous controls, boundaries and wraparound.','Explain how you would verify the block after writing RTL.']
 },
 {
  slug:'design-verification',
  title:'Design Verification Practice Problems',
  description:'Practice design verification with SystemVerilog, SVA and UVM problems covering interfaces, assertions, drivers, monitors, scoreboards and coverage-oriented thinking.',
  intro:'This path targets design-verification interviews. It combines SystemVerilog language semantics, temporal assertions and UVM transaction flow rather than treating them as isolated topics.',
  filter:p=>['SystemVerilog','SVA','UVM'].includes(p.category),
  limit:20,
  stages:['Start with SystemVerilog constructs and signal ownership.','Add assertions for reset, handshakes and temporal requirements.','Trace transactions through driver, monitor and scoreboard paths.','For each problem, identify stimulus, checking and coverage separately.']
 },
 {
  slug:'fpga',
  title:'FPGA Practice Problems',
  description:'Practice FPGA interview problems covering synthesizable RTL, debouncing, clock-domain crossing, memories, timing-aware design and serial interfaces.',
  intro:'This path emphasizes the difference between RTL that merely simulates and RTL that behaves predictably on an FPGA. It mixes logic design with CDC, reset and interface considerations.',
  filter:p=>p.category==='FPGA'||(p.category==='RTL Design'&&['fifo','memory','clock'].some(t=>(p.tags||[]).includes(t)))||p.category==='Protocols',
  limit:18,
  stages:['Solve the RTL function first.','Identify asynchronous inputs and clock-domain boundaries.','Consider reset release and inferred FPGA resources.','Check protocol timing and implementation assumptions.']
 },
 {
  slug:'protocols',
  title:'Digital Protocol Practice Problems',
  description:'Practice UART, SPI, AXI, APB, I2C and ready/valid protocol problems for RTL and verification interviews.',
  intro:'Protocol interviews are cycle-accurate. Use this path to practise framing, channel independence, backpressure, data stability and legal transaction sequencing.',
  filter:p=>p.category==='Protocols'||(p.tags||[]).some(t=>['handshake','uart','spi','axi','apb','i2c'].includes(String(t).toLowerCase())),
  limit:18,
  stages:['Write the legal transfer rule in one sentence.','Draw the fastest and slowest valid transaction.','Check what must remain stable under backpressure.','Test back-to-back transfers and transaction boundaries.']
 },
 {
  slug:'computer-architecture',
  title:'Computer Architecture Practice Problems',
  description:'Practice CPU and computer architecture interview problems covering pipelines, hazards, caches, branch behavior, latency and memory systems.',
  intro:'This path targets CPU, GPU and architecture interviews where assumptions and timing matter as much as the final result. Show the derivation for every answer.',
  filter:p=>p.category==='Computer Architecture',
  limit:20,
  stages:['Write down pipeline or memory-system assumptions first.','Draw cycle timing for dependencies and hazards.','Show cache/address calculations explicitly.','Explain how the answer changes when latency or microarchitecture changes.']
 }
]

function shell({title,description,canonical,body,itemList=[]}){
 const graph=[
  {'@type':'CollectionPage','name':title,'headline':title,'description':description,'url':canonical,'isPartOf':{'@type':'WebSite','name':'HDLForge','url':base+'/' }},
  {'@type':'BreadcrumbList','itemListElement':[
   {'@type':'ListItem','position':1,'name':'HDLForge','item':base+'/'},
   {'@type':'ListItem','position':2,'name':'Practice','item':base+'/practice/'},
   {'@type':'ListItem','position':3,'name':title,'item':canonical}
  ]}
 ]
 if(itemList.length)graph.push({'@type':'ItemList','itemListElement':itemList.map((p,i)=>({'@type':'ListItem','position':i+1,'name':p.title,'url':`${base}/problems/${p.id}/`}))})
 return `<!doctype html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)} | HDLForge</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="HDLForge"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:980px;margin:0 auto;padding:48px 24px;line-height:1.65;color:#f4f4f5;background:#1d1c1e}nav{margin-bottom:38px}h1{font-size:2.45rem;line-height:1.1;letter-spacing:-.03em}h2{margin-top:2.25rem}.intro{font-size:1.08rem;max-width:820px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px}.card{display:block;border:1px solid #3a393d;background:#262527;border-radius:12px;padding:16px;text-decoration:none;color:inherit}.card:hover{border-color:#615fff}.meta{color:#aaa8ad;font-size:.9rem}.step{border-left:3px solid #615fff;padding-left:14px;margin:12px 0}.cta{margin-top:32px;padding:18px;border:1px solid #3a393d;border-radius:12px;background:#262527}</style></head><body><nav><a href="/">HDLForge</a> · <a href="/practice/">Practice</a> · <a href="/problems/">Problems</a> · <a href="/companies/">Companies</a> · <a href="/projects/">Projects</a></nav><main>${body}</main></body></html>`
}

const hubCards=paths.map(x=>`<a class="card" href="/practice/${x.slug}/"><strong>${esc(x.title)}</strong><br><span class="meta">${esc(x.description)}</span></a>`).join('')
write('practice/index.html',shell({
 title:'Hardware Design Practice Paths',
 description:'Choose a structured HDLForge practice path for hardware design, Verilog, RTL, design verification, FPGA, digital protocols or computer architecture.',
 canonical:`${base}/practice/`,
 body:`<p class="meta">HDLForge practice library</p><h1>Hardware Design Practice Paths</h1><p class="intro">Choose a focused problem sequence based on the kind of hardware role or interview you are preparing for. These pages organise the existing HDLForge problem library into deliberate practice paths rather than duplicating the learning guides.</p><div class="grid">${hubCards}</div><div class="cta"><strong>Want the full library?</strong><p><a href="/problems/">Browse every HDLForge hardware design problem</a>, or use <a href="/companies/">company-style interview preparation</a>.</p></div>`
}))

for(const pathDef of paths){
 const selected=problems.filter(pathDef.filter).sort((a,b)=>(difficultyRank[a.difficulty]??9)-(difficultyRank[b.difficulty]??9)).slice(0,pathDef.limit)
 const cards=selected.map((p,i)=>`<a class="card" href="/problems/${esc(p.id)}/"><span class="meta">${String(i+1).padStart(2,'0')} · ${esc(p.category)} · ${esc(p.difficulty)}</span><br><strong>${esc(p.title)}</strong><br>${esc(p.description)}</a>`).join('')
 const steps=pathDef.stages.map((s,i)=>`<div class="step"><strong>Stage ${i+1}</strong><br>${esc(s)}</div>`).join('')
 const canonical=`${base}/practice/${pathDef.slug}/`
 const body=`<p class="meta">HDLForge structured practice path</p><h1>${esc(pathDef.title)}</h1><p class="intro">${esc(pathDef.intro)}</p><h2>How to use this practice path</h2>${steps}<h2>Problems to solve</h2><div class="grid">${cards}</div><h2>Interview routine</h2><p>For each problem, first restate the requirement and assumptions. Then write the RTL, assertion, verification component or architecture derivation without looking at a solution. Before running anything, list at least three edge cases. Finish by explaining how you would verify the result and what trade-offs you made.</p><div class="cta"><strong>Keep going</strong><p>Use the <a href="/app/problems/">interactive HDLForge problem workspace</a>, browse <a href="/companies/">company-style tracks</a>, or choose a <a href="/projects/">hardware project</a> that uses the same skills.</p></div>`
 write(`practice/${pathDef.slug}/index.html`,shell({title:pathDef.title,description:pathDef.description,canonical,body,itemList:selected}))
}

const sitemapPath=path.join(publicDir,'sitemap.xml')
if(fs.existsSync(sitemapPath)){
 let xml=fs.readFileSync(sitemapPath,'utf8')
 const urls=['/practice/',...paths.map(x=>`/practice/${x.slug}/`)]
 const additions=urls.filter(u=>!xml.includes(`${base}${u}`)).map(u=>`  <url><loc>${base}${u}</loc><changefreq>weekly</changefreq><priority>${u==='/practice/'?'0.95':'0.9'}</priority></url>`).join('\n')
 if(additions)xml=xml.replace('</urlset>',`${additions}\n</urlset>`)
 fs.writeFileSync(sitemapPath,xml)
}

console.log(`Generated practice hub plus ${paths.length} intent-focused practice pages.`)
