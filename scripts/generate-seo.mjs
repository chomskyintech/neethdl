import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const problems=JSON.parse(fs.readFileSync(path.join(root,'src/data/problems.json'),'utf8'))
const base='https://hdlforge.netlify.app'
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const slug=s=>s.toLowerCase().replace(/systemverilog/g,'systemverilog').replace(/computer architecture/g,'computer-architecture').replace(/rtl design/g,'rtl-design').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const write=(rel,content)=>{const p=path.join(root,'public',rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content)}
const json=s=>JSON.stringify(s).replace(/</g,'\\u003c')

const shell=({title,description,canonical,crumbs,body,type='Article',extraGraph=[]})=>`<!doctype html>
<html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:site_name" content="HDLForge"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><script type="application/ld+json">${json({'@context':'https://schema.org','@graph':[{'@type':type,'headline':title,'name':title,'description':description,'url':canonical,'publisher':{'@type':'Organization','name':'HDLForge','url':base+'/' }},{'@type':'BreadcrumbList','itemListElement':crumbs.map((c,i)=>({'@type':'ListItem','position':i+1,'name':c.name,'item':c.url}))},...extraGraph]})}</script><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:900px;margin:0 auto;padding:48px 24px;line-height:1.7;color:#171717}nav{margin-bottom:36px}h1{line-height:1.15;letter-spacing:-.025em}h2{margin-top:2.1rem}a{color:inherit}code{background:#f2f2f2;padding:.1rem .3rem;border-radius:4px}.meta{color:#666}.cards{display:grid;gap:12px}.card{border:1px solid #ddd;border-radius:10px;padding:16px;text-decoration:none}</style></head><body><nav><a href="/">HDLForge</a> · <a href="/problems/">Problems</a> · <a href="/learn/hardware-design-interview/">Learn</a></nav><main>${body}</main></body></html>`

const topicMap={
 'RTL Design':{slug:'rtl-design',title:'RTL Design Practice & Interview Preparation',desc:'Practice synthesizable RTL design with focused exercises covering combinational logic, sequential logic, counters, FIFOs, arbiters, register files and timing-aware design.'},
 'SystemVerilog':{slug:'systemverilog',title:'SystemVerilog Practice & Interview Preparation',desc:'Learn SystemVerilog for RTL and verification with practice on always_comb, always_ff, interfaces, packed data, constraints and reusable design constructs.'},
 'SVA':{slug:'sva',title:'SystemVerilog Assertions (SVA) Practice',desc:'Practice SystemVerilog Assertions with clocked properties, implication, bounded response, reset handling, one-hot checks and stability requirements.'},
 'UVM':{slug:'uvm',title:'UVM Practice & Interview Preparation',desc:'Build UVM verification skills with sequence items, drivers, monitors, scoreboards, config_db, factory overrides and objection handling.'},
 'FPGA':{slug:'fpga',title:'FPGA Design Practice & Interview Preparation',desc:'Practice FPGA-oriented design topics including debouncing, FSMs, CDC synchronizers, BRAM inference, timing constraints and reset strategy.'},
 'Protocols':{slug:'protocols',title:'Digital Protocol Practice: UART, SPI, AXI, APB & I2C',desc:'Practice digital interface and protocol reasoning across UART, SPI, AXI ready/valid, AXI-Lite, APB and I2C arbitration.'},
 'Computer Architecture':{slug:'computer-architecture',title:'Computer Architecture Practice & Interview Preparation',desc:'Practice pipeline hazards, caches, branch prediction, AMAT, TLBs, reorder buffers and other computer architecture interview topics.'}
}

for(const [category,topic] of Object.entries(topicMap)){
 const items=problems.filter(p=>p.category===category)
 const cards=items.map(p=>`<a class="card" href="/problems/${esc(p.id)}/"><strong>${esc(p.title)}</strong><br><span class="meta">${esc(p.difficulty)} · ${esc((p.tags||[]).join(' · '))}</span><br>${esc(p.description)}</a>`).join('')
 const canonical=`${base}/learn/${topic.slug}/`
 const body=`<p class="meta">HDLForge learning hub</p><h1>${esc(topic.title)}</h1><p>${esc(topic.desc)}</p><h2>Practice problems</h2><div class="cards">${cards}</div><h2>How to use this topic</h2><p>Start with easier problems, implement or reason through the task without looking at a solution, then revisit medium and hard problems. Use the HDLForge roadmap to combine this topic with adjacent skills.</p><p><a href="/">Follow the HDLForge roadmap</a> or <a href="/problems/">browse the complete problem set</a>.</p>`
 write(`learn/${topic.slug}/index.html`,shell({title:`${topic.title} | HDLForge`,description:topic.desc,canonical,crumbs:[{name:'HDLForge',url:base+'/'},{name:'Learn',url:base+'/learn/hardware-design-interview/'},{name:topic.title,url:canonical}],body}))
}

for(const p of problems){
 const topic=topicMap[p.category]
 const canonical=`${base}/problems/${p.id}/`
 const langs=(p.languages?.length?p.languages:['Conceptual']).join(', ')
 const description=`${p.title}: ${p.description} ${p.difficulty} ${p.category} practice on HDLForge.`.slice(0,158)
 const examples=(p.examples||[]).map(x=>`<li>${esc(x)}</li>`).join('')
 const constraints=(p.constraints||[]).map(x=>`<li>${esc(x)}</li>`).join('')
 const related=problems.filter(x=>x.id!==p.id&&(x.category===p.category||(x.tags||[]).some(t=>(p.tags||[]).includes(t)))).slice(0,5)
 const relatedHtml=related.map(x=>`<li><a href="/problems/${esc(x.id)}/">${esc(x.title)}</a> — ${esc(x.difficulty)}</li>`).join('')
 const body=`<p class="meta">${esc(p.category)} · ${esc(p.difficulty)} · ${esc(langs)}</p><h1>${esc(p.title)}</h1><p>${esc(p.description)}</p><h2>Task</h2><p>${esc(p.task)}</p>${examples?`<h2>Examples</h2><ul>${examples}</ul>`:''}${constraints?`<h2>Constraints</h2><ul>${constraints}</ul>`:''}<h2>Concepts to review</h2><p>${esc((p.tags||[]).join(', '))}</p><p><a href="/">Open HDLForge to solve this problem in the interactive editor</a>.</p>${relatedHtml?`<h2>Related problems</h2><ul>${relatedHtml}</ul>`:''}${topic?`<p><a href="/learn/${topic.slug}/">Explore the ${esc(topic.title)} hub</a>.</p>`:''}`
 write(`problems/${p.id}/index.html`,shell({title:`${p.title} — ${p.category} Practice | HDLForge`,description,canonical,crumbs:[{name:'HDLForge',url:base+'/'},{name:'Problems',url:base+'/problems/'},{name:p.title,url:canonical}],body,type:'TechArticle'}))
}

const guides=[
 {slug:'cdc-interview',title:'Clock Domain Crossing (CDC) Interview Guide',description:'Review metastability, synchronizer chains, pulse transfer, multi-bit CDC, handshakes and asynchronous FIFOs for digital design and FPGA interviews.',sections:[['Metastability','A receiving flip-flop can violate setup or hold time when sampling an asynchronous transition. A two-flop synchronizer reduces the probability that metastability propagates into destination logic.'],['Single-bit versus multi-bit CDC','Single-bit controls can often use synchronizer chains. Multi-bit data generally needs a protocol such as a handshake, Gray-coded pointer scheme or asynchronous FIFO rather than synchronizing every bit independently.'],['Questions to practise','Why are two flip-flops commonly used? When is a pulse synchronizer needed? Why is synchronizing each bit of a bus unsafe? How do asynchronous FIFO pointers cross domains?']]},
 {slug:'axi-interview',title:'AXI Ready/Valid Interview Guide',description:'Understand AXI ready/valid handshakes, backpressure, channel independence and AXI-Lite ordering for RTL and verification interviews.',sections:[['Handshake rule','A transfer occurs only on a cycle where VALID and READY are both asserted. A producer must not wait for READY before asserting VALID when data is available.'],['Backpressure','READY allows a receiver to throttle traffic. While stalled, transaction information associated with a asserted VALID must remain stable until the handshake occurs.'],['Questions to practise','What happens if VALID is high and READY is low? Can READY be asserted before VALID? Why are AXI channels independent? What ordering assumptions are safe in AXI-Lite?']]},
 {slug:'timing-constraints',title:'FPGA Timing Constraints Interview Guide',description:'Review setup, hold, clock constraints, input/output delays, false paths and multicycle paths for FPGA implementation interviews.',sections:[['Setup and hold','Setup analysis checks whether data arrives before the capture edge with required margin. Hold analysis checks that data does not change too soon after the capture edge.'],['Constraints','Clock definitions establish timing relationships. External interfaces need input and output delays that describe board-level timing relative to clocks.'],['Exceptions','False-path and multicycle constraints should describe genuine design intent. They are not substitutes for fixing ordinary timing failures.']]}
]
for(const g of guides){const canonical=`${base}/learn/${g.slug}/`;const body=`<p class="meta">HDLForge interview guide</p><h1>${esc(g.title)}</h1><p>${esc(g.description)}</p>${g.sections.map(([h,p])=>`<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('')}<h2>Practise on HDLForge</h2><p><a href="/problems/">Browse related hardware design problems</a> and follow the <a href="/">structured roadmap</a>.</p>`;write(`learn/${g.slug}/index.html`,shell({title:`${g.title} | HDLForge`,description:g.description,canonical,crumbs:[{name:'HDLForge',url:base+'/'},{name:'Learn',url:base+'/learn/hardware-design-interview/'},{name:g.title,url:canonical}],body}))}

const staticUrls=['/','/problems/','/learn/hardware-design-interview/','/learn/hardware-design-interview-questions/','/learn/rtl-interview/','/learn/systemverilog-interview/','/learn/uvm-interview/','/learn/fpga-interview/','/learn/computer-architecture-interview/','/learn/verilog-interview/','/learn/rtl-design-exercises/','/learn/sva-examples/',...Object.values(topicMap).map(t=>`/learn/${t.slug}/`),...guides.map(g=>`/learn/${g.slug}/`),...problems.map(p=>`/problems/${p.id}/`)]
const unique=[...new Set(staticUrls)]
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map((u,i)=>`  <url><loc>${base}${u}</loc><changefreq>${u==='/'?'weekly':'monthly'}</changefreq><priority>${u==='/'?'1.0':u.startsWith('/problems/')?'0.7':'0.9'}</priority></url>`).join('\n')}\n</urlset>\n`
write('sitemap.xml',sitemap)
console.log(`Generated ${problems.length} problem pages, ${Object.keys(topicMap).length} topic hubs, ${guides.length} guides and ${unique.length} sitemap URLs.`)
