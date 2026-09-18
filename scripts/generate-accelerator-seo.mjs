import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const publicDir=path.join(root,'public')
const base='https://hdlforge.netlify.app'
const accelerators=JSON.parse(fs.readFileSync(path.join(root,'src/data/acceleratorProblems.json'),'utf8'))
const activeProblems=JSON.parse(fs.readFileSync(path.join(root,'src/data/problems.json'),'utf8'))
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const write=(rel,content)=>{const file=path.join(publicDir,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content)}

const cards=accelerators.map((p,i)=>`<a class="card" href="/problems/${esc(p.id)}/"><span class="meta">${String(i+1).padStart(2,'0')} · ${esc(p.difficulty)}</span><strong>${esc(p.title)}</strong><p>${esc(p.description)}</p><span>${esc((p.tags||[]).join(' · '))}</span></a>`).join('')
const shell=({title,description,canonical,body})=>`<!doctype html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)} | HDLForge</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="HDLForge"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'CollectionPage','name':title,'description':description,'url':canonical,'isPartOf':{'@type':'WebSite','name':'HDLForge','url':base+'/' }},{'@type':'ItemList','itemListElement':accelerators.map((p,i)=>({'@type':'ListItem','position':i+1,'name':p.title,'url':`${base}/problems/${p.id}/`}))}]}).replace(/</g,'\\u003c')}</script><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:980px;margin:0 auto;padding:48px 24px;line-height:1.65;color:#f4f4f5;background:#1d1c1e}nav{margin-bottom:38px}h1{font-size:2.5rem;line-height:1.08;letter-spacing:-.03em}h2{margin-top:2.2rem}.intro{font-size:1.08rem;max-width:830px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px}.card{display:block;border:1px solid #3a393d;background:#262527;border-radius:12px;padding:16px;text-decoration:none;color:inherit}.card strong{display:block;font-size:1.04rem;margin:.2rem 0}.card p{margin:.45rem 0}.meta,.card span{color:#aaa8ad;font-size:.9rem}.callout{border-left:4px solid #615fff;background:#262527;padding:14px 16px;margin:22px 0}</style></head><body><nav><a href="/">HDLForge</a> · <a href="/practice/">Practice</a> · <a href="/problems/">Problems</a> · <a href="/projects/">Projects</a></nav><main>${body}</main></body></html>`

const practiceDescription='Practice hardware accelerator RTL with executable problems covering INT8 MACs, dot products, reduction trees, quantized activations, systolic processing elements and pipelined arithmetic.'
write('practice/accelerators/index.html',shell({
 title:'Hardware Accelerator RTL Practice Problems',
 description:practiceDescription,
 canonical:`${base}/practice/accelerators/`,
 body:`<p class="meta">HDLForge accelerator practice</p><h1>Hardware Accelerator RTL Practice Problems</h1><p class="intro">This path is implementation-first. Every problem is an executable RTL task rather than a theory prompt, with emphasis on datapath width, signed arithmetic, throughput, pipelining and parallel compute structures.</p><div class="callout"><strong>Suggested order:</strong> start with the INT8 MAC, then dot product and reduction logic, then move to quantization, systolic processing and valid-aligned pipelining.</div><h2>Accelerator problems</h2><div class="grid">${cards}</div><h2>What to focus on</h2><ul><li>Signed arithmetic and deliberate bit growth.</li><li>Throughput versus latency when adding pipeline stages.</li><li>Regular compute structures that map cleanly to FPGA or ASIC datapaths.</li><li>Corner cases such as saturation, negative operands, reset and back-to-back valid data.</li></ul>`
}))

const learnDescription='Learn the RTL building blocks behind AI, DSP and domain-specific accelerators, then practise them with executable HDLForge coding problems.'
write('learn/accelerators/index.html',shell({
 title:'Hardware Accelerator Design Practice',
 description:learnDescription,
 canonical:`${base}/learn/accelerators/`,
 body:`<p class="meta">HDLForge accelerator design hub</p><h1>Hardware Accelerator Design Practice</h1><p class="intro">Accelerators improve throughput or energy efficiency by specialising the datapath for a workload. For RTL interviews, the most useful building blocks are multiply-accumulate units, vector reductions, quantized arithmetic, regular systolic structures and pipelines that sustain one result per cycle.</p><h2>Core implementation skills</h2><ul><li>Choose widths from numeric ranges instead of relying on implicit truncation.</li><li>Keep signedness explicit across multiplication, addition and saturation.</li><li>Pipeline long arithmetic paths while keeping valid/control signals aligned.</li><li>Exploit lane-level and spatial parallelism without losing deterministic data movement.</li><li>Verify extreme operands, bubbles, reset and back-to-back traffic.</li></ul><h2>Practice the datapaths</h2><div class="grid">${cards}</div>`
}))

// Add Accelerators to the crawlable problem hub because the legacy hub generator only
// knows the original topic list.
const problemHub=path.join(publicDir,'problems','index.html')
if(fs.existsSync(problemHub)){
 let html=fs.readFileSync(problemHub,'utf8')
 if(!html.includes('<h2>Accelerators</h2>')){
  const links=accelerators.map(p=>`<a class="problem" href="/problems/${esc(p.id)}/"><strong>${esc(p.title)}</strong><span>${esc(p.difficulty)} · Verilog / SystemVerilog</span></a>`).join('')
  const section=`<section class="category"><h2>Accelerators</h2><p><a href="/learn/accelerators/">Study the hardware accelerator design guide</a></p><div class="problem-list">${links}</div></section>`
  html=html.replace('</main>',`${section}</main>`)
  fs.writeFileSync(problemHub,html)
 }
}

// Add the accelerator path to the practice hub and remove an empty architecture-practice
// card when the coding-only catalog contains no executable architecture problems.
const practiceHub=path.join(publicDir,'practice','index.html')
if(fs.existsSync(practiceHub)){
 let html=fs.readFileSync(practiceHub,'utf8')
 if(!html.includes('/practice/accelerators/')){
  const card=`<a class="card" href="/practice/accelerators/"><strong>Hardware Accelerator RTL Practice Problems</strong><br><span class="meta">INT8 MACs, dot products, reductions, quantization, systolic processing and pipelined compute.</span></a>`
  html=html.replace('</div><div class="cta">',`${card}</div><div class="cta">`)
 }
 if(!activeProblems.some(p=>p.category==='Computer Architecture')){
  html=html.replace(/<a class="card" href="\/practice\/computer-architecture\/">[\s\S]*?<\/a>/,'')
 }
 fs.writeFileSync(practiceHub,html)
}

const learnHub=path.join(publicDir,'learn','index.html')
if(fs.existsSync(learnHub)){
 let html=fs.readFileSync(learnHub,'utf8')
 if(!html.includes('/learn/accelerators/')){
  const card=`<a class="card" href="/learn/accelerators/"><strong>Hardware Accelerator Design Practice</strong><br><span class="meta">MACs, vector datapaths, quantization, systolic arrays and accelerator pipelines.</span></a>`
  html=html.replace('</div><h2>Practice what you learn</h2>',`${card}</div><h2>Practice what you learn</h2>`)
  fs.writeFileSync(learnHub,html)
 }
}

// Give each accelerator problem a direct app link and implementation-specific verification guidance.
for(const p of accelerators){
 const file=path.join(publicDir,'problems',p.id,'index.html')
 if(!fs.existsSync(file))continue
 let html=fs.readFileSync(file,'utf8')
 html=html.replace('<p><a href="/">Open HDLForge to solve this problem in the interactive editor</a>.</p>',`<p><a href="/app/problems/${p.id}/">Open ${esc(p.title)} in the HDLForge interactive editor</a>.</p>`)
 if(!html.includes('<h2>Accelerator verification checklist</h2>')){
  const verify=`<h2>Accelerator verification checklist</h2><ul><li>Exercise zero, maximum positive and negative operands where signed data is used.</li><li>Check exact bit growth and make overflow or saturation behavior intentional.</li><li>Verify reset, enable, valid and pipeline alignment cycle by cycle.</li><li>Send back-to-back data to confirm the advertised throughput.</li></ul>`
  html=html.replace('<h2>Concepts to review</h2>',`${verify}<h2>Concepts to review</h2>`)
 }
 fs.writeFileSync(file,html)
}

if(!activeProblems.some(p=>p.category==='Computer Architecture')){
 fs.rmSync(path.join(publicDir,'practice','computer-architecture'),{recursive:true,force:true})
}

const sitemap=path.join(publicDir,'sitemap.xml')
if(fs.existsSync(sitemap)){
 let xml=fs.readFileSync(sitemap,'utf8')
 if(!activeProblems.some(p=>p.category==='Computer Architecture')){
  xml=xml.replace(/\s*<url><loc>https:\/\/hdlforge\.netlify\.app\/practice\/computer-architecture\/<\/loc>[\s\S]*?<\/url>/,'')
 }
 for(const url of ['/practice/accelerators/','/learn/accelerators/']){
  if(!xml.includes(`${base}${url}`))xml=xml.replace('</urlset>',`  <url><loc>${base}${url}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n</urlset>`)
 }
 fs.writeFileSync(sitemap,xml)
}

console.log(`Generated accelerator SEO hubs for ${accelerators.length} executable problems.`)
