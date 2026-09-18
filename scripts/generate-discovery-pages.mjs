import fs from 'node:fs'
import path from 'node:path'
import tracks from '../src/data/tracks.js'
import {allProjects,guidedProject} from '../src/data/projects.js'

const root=process.cwd()
const publicDir=path.join(root,'public')
const problems=JSON.parse(fs.readFileSync(path.join(root,'src/data/problems.json'),'utf8'))
const base='https://hdlforge.netlify.app'
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const write=(rel,content)=>{const file=path.join(publicDir,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content)}
const list=items=>`<ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c')

const shell=({title,description,canonical,crumbs,body,type='WebPage'})=>`<!doctype html>
<html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="HDLForge"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><script type="application/ld+json">${json({'@context':'https://schema.org','@graph':[{'@type':type,'name':title,'headline':title,'description':description,'url':canonical,'isPartOf':{'@type':'WebSite','name':'HDLForge','url':base+'/' }},{'@type':'BreadcrumbList','itemListElement':crumbs.map((c,i)=>({'@type':'ListItem','position':i+1,'name':c.name,'item':c.url}))}]})}</script><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:980px;margin:0 auto;padding:48px 24px;line-height:1.7;color:#f4f4f5;background:#1d1c1e}nav{margin-bottom:38px}h1{font-size:clamp(2rem,5vw,3rem);line-height:1.08;letter-spacing:-.035em}h2{margin-top:2.2rem}h3{margin-bottom:.35rem}.intro{font-size:1.08rem;max-width:820px}.meta{color:#aaa8ad}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.card{display:block;border:1px solid #3a393d;background:#262527;border-radius:12px;padding:17px;text-decoration:none;color:inherit}.card:hover{border-color:#615fff}.callout{border-left:4px solid #615fff;background:#262527;padding:14px 16px;margin:22px 0}.tags{display:flex;flex-wrap:wrap;gap:7px}.tag{border:1px solid #3a393d;background:#262527;border-radius:999px;padding:3px 9px;font-size:.88rem}.section{margin-top:2.4rem}.cta{display:inline-block;margin-top:12px;border:1px solid #615fff;border-radius:9px;padding:10px 14px;text-decoration:none;font-weight:650}.fine{font-size:.9rem;color:#aaa8ad}</style></head><body><nav><a href="/">HDLForge</a> · <a href="/problems/">Problems</a> · <a href="/learn/">Learn</a> · <a href="/companies/">Companies</a> · <a href="/projects/">Projects</a></nav><main>${body}</main></body></html>`

const companyConfigs={
 'jane-street':{slug:'jane-street-fpga-interview',title:'Jane Street FPGA & Hardware Interview Practice',focus:'Low-latency RTL, deterministic pipelines, arbitration, FIFOs, architecture reasoning and performance-aware FPGA design.',projects:['low-latency-market-data-parser','feed-to-action-latency-pipeline','fpga-packet-parser']},
 amd:{slug:'amd-hardware-design-interview',title:'AMD Hardware Design Interview Practice',focus:'RTL fundamentals, processor pipelines, verification, memory systems, assertions and interface protocols.',projects:['pipelined-risc-v-core','risc-v-core-verification','uvm-axi4-lite-verification']},
 arm:{slug:'arm-hardware-interview',title:'Arm Hardware & CPU Design Interview Practice',focus:'Digital logic, CPU microarchitecture, pipeline hazards, cache/TLB reasoning, assertions and AMBA-style interfaces.',projects:['pipelined-risc-v-core','small-risc-v-soc','cache-memory-controller']},
 nvidia:{slug:'nvidia-hardware-design-interview',title:'NVIDIA Hardware Design Interview Practice',focus:'High-performance RTL, pipelining, verification, CDC, memory-oriented architecture and throughput reasoning.',projects:['hardware-dsp-pipeline','pipelined-risc-v-core','cache-memory-controller']},
 qualcomm:{slug:'qualcomm-hardware-design-interview',title:'Qualcomm Hardware Design Interview Practice',focus:'SoC-oriented RTL, CDC, buses, verification methodology, processor fundamentals and robust reset/interface design.',projects:['small-risc-v-soc','axi-lite-apb-bridge','uvm-axi4-lite-verification']},
 apple:{slug:'apple-silicon-hardware-interview',title:'Apple Silicon Hardware Interview Practice',focus:'Clean RTL, verification discipline, timing-sensitive logic, CDC and computer architecture fundamentals.',projects:['pipelined-risc-v-core','asynchronous-fifo','cache-memory-controller']}
}

const companyTracks=tracks.filter(track=>companyConfigs[track.id])
const topicSummary=items=>{
 const counts=new Map()
 for(const p of items)counts.set(p.category,(counts.get(p.category)||0)+1)
 return [...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([name,count])=>`${name} (${count})`)
}

for(const track of companyTracks){
 const config=companyConfigs[track.id]
 const selected=track.problemIds.map(id=>problems.find(p=>p.id===id)).filter(Boolean)
 const projectItems=config.projects.map(slug=>allProjects.find(p=>p.slug===slug)).filter(Boolean)
 const canonical=`${base}/companies/${config.slug}/`
 const problemCards=selected.map(p=>`<a class="card" href="/problems/${esc(p.id)}/"><strong>${esc(p.title)}</strong><br><span class="meta">${esc(p.category)} · ${esc(p.difficulty)}</span><br>${esc(p.description)}</a>`).join('')
 const projectCards=projectItems.map(p=>`<a class="card" href="/projects/${esc(p.slug)}/"><strong>${esc(p.title)}</strong><br><span class="meta">${esc(p.level)} · ${esc(p.role||'Hardware design')}</span><br>${esc(p.why)}</a>`).join('')
 const description=`Independent ${track.name} hardware interview practice for RTL, FPGA, verification and architecture topics, with HDLForge problems and project recommendations.`
 const body=`<p class="meta">Company-style hardware interview preparation</p><h1>${esc(config.title)}</h1><p class="intro">${esc(config.focus)}</p><div class="callout"><strong>Independent preparation resource:</strong> HDLForge is not affiliated with ${esc(track.name)}. These are practice problems selected for relevant hardware skills; they are not presented as leaked or guaranteed interview questions.</div><h2>What to practise</h2><p>${esc(track.description)}</p><div class="tags">${topicSummary(selected).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><h2>Practice set</h2><p>Work through these problems without looking at solutions first. Explain assumptions, edge cases and verification strategy as if an interviewer were reviewing the design.</p><div class="grid">${problemCards}</div><h2>Recommended projects</h2><p>Projects give you deeper material to discuss after the shorter interview exercises.</p><div class="grid">${projectCards}</div><h2>How to use this track</h2>${list(['Start with the RTL and architecture problems to identify weak fundamentals.','Repeat the set under time pressure and explain your reasoning aloud.','For every RTL answer, state reset behavior, edge cases and how you would verify it.','Build one related project deeply enough to discuss architecture, bugs, verification and trade-offs.'])}<a class="cta" href="/app/tracks/">Open company tracks in HDLForge</a>`
 write(`companies/${config.slug}/index.html`,shell({title:`${config.title} | HDLForge`,description,canonical,crumbs:[{name:'HDLForge',url:base+'/'},{name:'Company interview practice',url:base+'/companies/'},{name:track.name,url:canonical}],body,type:'CollectionPage'}))
}

const companyCards=companyTracks.map(track=>{const c=companyConfigs[track.id];return `<a class="card" href="/companies/${c.slug}/"><strong>${esc(track.name)}</strong><br><span class="meta">${esc(c.focus)}</span></a>`}).join('')
write('companies/index.html',shell({title:'Company-Specific Hardware Interview Practice | HDLForge',description:'Practice company-style hardware design interview problems for Jane Street, AMD, Arm, NVIDIA, Qualcomm and Apple with RTL, FPGA, verification and architecture tracks.',canonical:`${base}/companies/`,crumbs:[{name:'HDLForge',url:base+'/'},{name:'Companies',url:base+'/companies/'}],type:'CollectionPage',body:`<p class="meta">HDLForge company tracks</p><h1>Company-specific hardware interview practice</h1><p class="intro">Choose a company-style preparation track and practise the RTL, verification, FPGA and computer-architecture skills most relevant to that track. HDLForge does not claim these are confidential or guaranteed interview questions.</p><div class="grid">${companyCards}</div><h2>Build the fundamentals first</h2><p>Company preparation works best after core practice. Use the <a href="/problems/">hardware design problem library</a> and <a href="/learn/">learning guides</a> alongside these tracks.</p>`}))

const roleGuidance={
 'Design Verification':['Write a concise verification plan before building the environment.','Separate stimulus, observation, prediction and checking responsibilities.','Add assertions for protocol invariants and functional coverage for meaningful scenarios.','Run regression seeds, classify failures and document coverage closure.'],
 'RTL / Digital Design':['Turn the requirements into a block diagram and explicit state/data-path decisions.','Define interfaces, reset behavior, widths and latency before coding.','Build self-checking simulation for nominal and boundary cases.','Review synthesis/timing consequences and document the trade-offs you made.'],
 FPGA:['Design for a target clock and realistic FPGA resources rather than simulation alone.','Plan clock/reset domains, external interfaces and timing constraints early.','Verify functionality before implementation, then inspect utilization and timing reports.','Measure throughput/latency and document hardware-specific issues such as CDC or BRAM inference.'],
 'SoC / Embedded Hardware':['Start with a memory map, interfaces and ownership of each transaction path.','Implement and verify blocks independently before subsystem integration.','Exercise software-visible reset/status/error behavior and bus backpressure.','Finish with an end-to-end firmware or transaction-level demonstration.'],
 'Low-Latency / HFT Hardware':['Define a cycle-level latency budget and throughput target before coding.','Avoid unnecessary buffering on the critical path and make backpressure behavior explicit.','Use a reference model plus timestamped self-checking stimulus.','Report measured per-stage latency, timing margin and resource trade-offs.']
}

const relatedProblemMap={
 'guided-risc-v-cpu':['arch-hazard','arch-load-use','rtl-regfile'],
 'uvm-axi4-lite-verification':['uvm-driver','uvm-monitor','uvm-scoreboard','proto-axi-ready-valid','sva-stable-stall'],
 'risc-v-core-verification':['arch-hazard','arch-load-use','arch-cache','sva-reset','uvm-scoreboard'],
 'apb-peripheral-verification':['proto-apb-transfer','uvm-driver','uvm-monitor','sva-handshake'],
 'pipelined-risc-v-core':['arch-hazard','arch-load-use','rtl-regfile','arch-branch-predictor'],
 'cache-memory-controller':['arch-cache','rtl-regfile','rtl-arbiter'],
 'asynchronous-fifo':['rtl-fifo','fpga-cdc-sync','sva-stable-stall'],
 'fpga-packet-parser':['rtl-fifo','rtl-arbiter','proto-axi-ready-valid','fpga-bram-inference'],
 'uart-spi-i2c-controller':['proto-uart','proto-spi','rtl-fsm','rtl-shift-register'].filter(Boolean),
 'hardware-dsp-pipeline':['rtl-shift-register','proto-axi-ready-valid','fpga-bram-inference'],
 'small-risc-v-soc':['arch-hazard','proto-apb-transfer','proto-axi-ready-valid','rtl-arbiter'],
 'axi-lite-apb-bridge':['proto-axi-ready-valid','proto-apb-transfer','sva-stable-stall'],
 'dma-engine':['proto-axi-ready-valid','rtl-fifo','rtl-arbiter'],
 'low-latency-market-data-parser':['rtl-fifo','rtl-arbiter','proto-axi-ready-valid'],
 'order-book-update-datapath':['fpga-bram-inference','rtl-arbiter','arch-cache'],
 'feed-to-action-latency-pipeline':['rtl-fifo','rtl-arbiter','arch-hazard','fpga-timing-constraints']
}

for(const project of allProjects){
 const canonical=`${base}/projects/${project.slug}/`
 const guidance=roleGuidance[project.role]||roleGuidance['RTL / Digital Design']
 const related=(relatedProblemMap[project.slug]||[]).map(id=>problems.find(p=>p.id===id)).filter(Boolean)
 const relatedCards=related.map(p=>`<a class="card" href="/problems/${esc(p.id)}/"><strong>${esc(p.title)}</strong><br><span class="meta">${esc(p.category)} · ${esc(p.difficulty)}</span></a>`).join('')
 const description=`${project.title} hardware project guide: architecture goals, key skills, verification plan and deliverables for ${project.role} roles on HDLForge.`.slice(0,160)
 const body=`<p class="meta">${esc(project.role)} · ${esc(project.level)}</p><h1>${esc(project.title)}</h1><p class="intro">${esc(project.build)}</p><div class="callout"><strong>Why build it:</strong> ${esc(project.why)}</div><h2>Key skills</h2><div class="tags">${project.skills.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><h2>Implementation plan</h2>${list(guidance)}<h2>Verification plan</h2>${list(['Create a self-checking reference for the expected behavior before optimizing the RTL.','Test reset and initialization, nominal operation, boundary conditions and back-to-back activity.','Inject stalls, invalid requests or other stress cases when the interface permits them.','Keep regression results, waveforms and failure notes so the project demonstrates debugging as well as coding.'])}<h2>Suggested deliverables</h2>${list(project.deliverables)}${relatedCards?`<h2>Problems to practise first</h2><div class="grid">${relatedCards}</div>`:''}<h2>What to discuss in an interview</h2>${list(['The architecture you chose and the alternatives you rejected.','The hardest bug or corner case and how you found it.','How you verified correctness beyond one successful waveform.','Timing, area, latency, coverage or protocol trade-offs relevant to the project.'])}${project.guided?`<a class="cta" href="/app/projects/riscv-core/">Start the guided RISC-V build</a>`:`<a class="cta" href="/app/projects/">Browse projects in HDLForge</a>`}`
 write(`projects/${project.slug}/index.html`,shell({title:`${project.title} Hardware Project | HDLForge`,description,canonical,crumbs:[{name:'HDLForge',url:base+'/'},{name:'Hardware projects',url:base+'/projects/'},{name:project.title,url:canonical}],body,type:'TechArticle'}))
}

const roleSections=[...new Set(allProjects.map(p=>p.role))].map(role=>{const items=allProjects.filter(p=>p.role===role);return `<section class="section"><h2>${esc(role)}</h2><div class="grid">${items.map(p=>`<a class="card" href="/projects/${esc(p.slug)}/"><strong>${esc(p.title)}</strong><br><span class="meta">${esc(p.level)}</span><br>${esc(p.why)}</a>`).join('')}</div></section>`}).join('')
write('projects/index.html',shell({title:'Hardware Design, RTL, FPGA & Verification Projects | HDLForge',description:'Browse hands-on hardware design projects for RTL, FPGA, design verification, RISC-V, SoC and low-latency hardware roles, with implementation and verification plans.',canonical:`${base}/projects/`,crumbs:[{name:'HDLForge',url:base+'/'},{name:'Projects',url:base+'/projects/'}],type:'CollectionPage',body:`<p class="meta">HDLForge project library</p><h1>Hardware design projects</h1><p class="intro">Build portfolio projects that go beyond toy RTL. Each guide defines what to build, which skills it demonstrates, how to verify it and what evidence to keep for interviews.</p><div class="callout"><strong>Start interactively:</strong> ${esc(guidedProject.title)} is available as a guided HDLForge lab.</div>${roleSections}`}))

const notFound=`<!doctype html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Page not found | HDLForge</title><meta name="robots" content="noindex, follow"><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:760px;margin:12vh auto;padding:24px;line-height:1.65;color:#f4f4f5;background:#1d1c1e}a{color:inherit}</style></head><body><h1>Page not found</h1><p>The HDLForge page you requested does not exist.</p><p><a href="/">Return to HDLForge</a> · <a href="/problems/">Browse problems</a> · <a href="/projects/">Browse projects</a></p></body></html>`
write('404.html',notFound)

const urls=['/companies/','/projects/',...companyTracks.map(t=>`/companies/${companyConfigs[t.id].slug}/`),...allProjects.map(p=>`/projects/${p.slug}/`)]
const sitemapPath=path.join(publicDir,'sitemap.xml')
if(fs.existsSync(sitemapPath)){
 let xml=fs.readFileSync(sitemapPath,'utf8')
 const additions=urls.filter(url=>!xml.includes(`${base}${url}`)).map(url=>`  <url><loc>${base}${url}</loc><changefreq>monthly</changefreq><priority>${url==='/companies/'||url==='/projects/'?'0.9':'0.8'}</priority></url>`).join('\n')
 if(additions)xml=xml.replace('</urlset>',`${additions}\n</urlset>`)
 fs.writeFileSync(sitemapPath,xml)
}

console.log(`Generated ${companyTracks.length} company pages and ${allProjects.length} project pages plus discovery hubs.`)
