import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const publicDir=path.join(root,'public')
const problems=JSON.parse(fs.readFileSync(path.join(root,'src/data/problems.json'),'utf8'))
const base='https://hdlforge.netlify.app'
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const write=(rel,content)=>{const p=path.join(publicDir,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content)}

const topicSlugs={
  'RTL Design':'rtl-design',
  'SystemVerilog':'systemverilog',
  'SVA':'sva',
  'UVM':'uvm',
  'Computer Architecture':'computer-architecture',
  'Protocols':'protocols',
  'FPGA':'fpga'
}

const shell=({title,description,canonical,body,itemList})=>`<!doctype html>
<html lang="en-GB">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website"><meta property="og:site_name" content="HDLForge">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}">
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'CollectionPage','name':title,'description':description,'url':canonical,'isPartOf':{'@type':'WebSite','name':'HDLForge','url':base+'/' }},{'@type':'ItemList','itemListElement':itemList.map((item,i)=>({'@type':'ListItem','position':i+1,'name':item.name,'url':base+item.url}))}]})}</script>
<style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:980px;margin:0 auto;padding:48px 24px;line-height:1.65;color:#171717}nav{margin-bottom:38px}h1{font-size:2.4rem;line-height:1.1;letter-spacing:-.03em}h2{margin-top:2.3rem}.intro{font-size:1.08rem;max-width:800px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.card{display:block;border:1px solid #ddd;border-radius:12px;padding:17px;text-decoration:none;color:inherit}.card:hover{border-color:#888}.meta{color:#666;font-size:.9rem}.category{margin-top:2.6rem}.problem-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}.problem{display:block;border:1px solid #e2e2e2;border-radius:9px;padding:13px;text-decoration:none;color:inherit}.problem strong{display:block}.problem span{color:#666;font-size:.88rem}</style>
</head><body><nav><a href="/">HDLForge</a> · <a href="/problems/">Problems</a> · <a href="/learn/">Learn</a></nav><main>${body}</main></body></html>`

const problemItems=problems.map(p=>({name:p.title,url:`/problems/${p.id}/`}))
const problemSections=Object.keys(topicSlugs).map(category=>{
  const items=problems.filter(p=>p.category===category)
  if(!items.length)return ''
  const links=items.map(p=>`<a class="problem" href="/problems/${esc(p.id)}/"><strong>${esc(p.title)}</strong><span>${esc(p.difficulty)} · ${esc((p.languages?.length?p.languages:['Conceptual']).join(' / '))}</span></a>`).join('')
  return `<section class="category"><h2>${esc(category)}</h2><p><a href="/learn/${topicSlugs[category]}/">Study the ${esc(category)} topic guide</a></p><div class="problem-list">${links}</div></section>`
}).join('')

write('problems/index.html',shell({
  title:'Hardware Design Practice Problems | HDLForge',
  description:'Browse HDLForge hardware design interview problems across RTL, Verilog, SystemVerilog, SVA, UVM, computer architecture, protocols and FPGA design.',
  canonical:`${base}/problems/`,
  itemList:problemItems,
  body:`<p class="meta">HDLForge problem library</p><h1>Hardware Design Practice Problems</h1><p class="intro">Browse the complete HDLForge problem set. Each problem has its own crawlable page with the task, constraints, concepts and related practice, while the interactive editor remains available from HDLForge.</p>${problemSections}`
}))

const guides=[
  {name:'Hardware Design Interview Guide',url:'/learn/hardware-design-interview/',desc:'A broad preparation guide covering RTL, verification, architecture, protocols and FPGA topics.'},
  {name:'Hardware Design Interview Questions',url:'/learn/hardware-design-interview-questions/',desc:'Interview-style questions for digital hardware roles.'},
  {name:'RTL Interview Guide',url:'/learn/rtl-interview/',desc:'RTL design concepts and interview preparation.'},
  {name:'Verilog Interview Guide',url:'/learn/verilog-interview/',desc:'Verilog coding and synthesizable RTL interview preparation.'},
  {name:'SystemVerilog Interview Guide',url:'/learn/systemverilog-interview/',desc:'SystemVerilog design and verification interview preparation.'},
  {name:'RTL Design Exercises',url:'/learn/rtl-design-exercises/',desc:'Focused RTL exercises for hands-on practice.'},
  {name:'SVA Examples',url:'/learn/sva-examples/',desc:'SystemVerilog Assertion examples and temporal-property practice.'},
  {name:'UVM Interview Guide',url:'/learn/uvm-interview/',desc:'UVM components, transactions, scoreboards and verification methodology.'},
  {name:'FPGA Interview Guide',url:'/learn/fpga-interview/',desc:'FPGA design, timing, CDC and implementation interview topics.'},
  {name:'Computer Architecture Interview Guide',url:'/learn/computer-architecture-interview/',desc:'Pipelines, caches, hazards, latency and architecture interview topics.'},
  {name:'CDC Interview Guide',url:'/learn/cdc-interview/',desc:'Metastability, synchronizers, handshakes and asynchronous FIFOs.'},
  {name:'AXI Ready/Valid Interview Guide',url:'/learn/axi-interview/',desc:'Ready/valid handshakes, backpressure and AXI-Lite reasoning.'},
  {name:'FPGA Timing Constraints Guide',url:'/learn/timing-constraints/',desc:'Setup, hold, clock constraints and timing exceptions.'}
]
const topicItems=Object.entries(topicSlugs).map(([name,slug])=>({name:`${name} Practice`,url:`/learn/${slug}/`,desc:`Browse ${name} practice problems and preparation material.`}))
const learnItems=[...guides,...topicItems]
const learnCards=learnItems.map(x=>`<a class="card" href="${x.url}"><strong>${esc(x.name)}</strong><br><span class="meta">${esc(x.desc)}</span></a>`).join('')
write('learn/index.html',shell({
  title:'Hardware Design Learning & Interview Guides | HDLForge',
  description:'Explore HDLForge learning hubs and interview guides for RTL, Verilog, SystemVerilog, SVA, UVM, FPGA, protocols, CDC, AXI and computer architecture.',
  canonical:`${base}/learn/`,
  itemList:learnItems,
  body:`<p class="meta">HDLForge learning library</p><h1>Hardware Design Learning & Interview Guides</h1><p class="intro">Use these topic hubs and interview guides to move from concepts into focused practice. Every guide links into relevant HDLForge problems, creating a clear path between learning and hands-on work.</p><div class="grid">${learnCards}</div><h2>Practice what you learn</h2><p><a href="/problems/">Browse the complete HDLForge problem library</a>.</p>`
}))

const sitemapPath=path.join(publicDir,'sitemap.xml')
if(fs.existsSync(sitemapPath)){
  let xml=fs.readFileSync(sitemapPath,'utf8')
  if(!xml.includes(`${base}/learn/`)){
    xml=xml.replace('</urlset>',`  <url><loc>${base}/learn/</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n</urlset>`)
    fs.writeFileSync(sitemapPath,xml)
  }
}

console.log(`Generated crawl hubs for ${problems.length} problems and ${learnItems.length} learning pages.`)
