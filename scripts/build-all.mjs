import fs from 'node:fs'
import path from 'node:path'
import {build} from 'vite'

const root=process.cwd()
const problemFile=path.join(root,'src/data/problems.json')
const mainFile=path.join(root,'src/main.jsx')
const acceleratorFile=path.join(root,'src/data/acceleratorProblems.json')
const originalProblems=fs.readFileSync(problemFile,'utf8')
const originalMain=fs.readFileSync(mainFile,'utf8')
const baseProblems=JSON.parse(originalProblems)
const acceleratorProblems=JSON.parse(fs.readFileSync(acceleratorFile,'utf8'))
const codingProblems=baseProblems.filter(problem=>problem.evaluation?.type!=='answer')
const activeProblems=[...codingProblems,...acceleratorProblems]
const removedCount=baseProblems.length-codingProblems.length

function appWithCodingCategories(source){
 return source
  .replace("const categories=['All','RTL Design','SystemVerilog','SVA','UVM','Computer Architecture','Protocols','FPGA']","const categories=['All','RTL Design','SystemVerilog','SVA','UVM','Protocols','FPGA','Accelerators']")
  .replace("if(p.category==='RTL Design'||p.category==='Protocols'||p.category==='FPGA')return ['Verilog','SystemVerilog','VHDL']","if(p.category==='RTL Design'||p.category==='Protocols'||p.category==='FPGA')return ['Verilog','SystemVerilog','VHDL']\n if(p.category==='Accelerators')return ['Verilog','SystemVerilog']")
}

async function runGenerator(name){
 await import(`./${name}?catalog=${Date.now()}-${Math.random()}`)
}

try{
 // Existing SEO generators all read problems.json directly. During the build we give
 // every generator one canonical, coding-only catalog so theory-only prompts cannot
 // leak back into crawl hubs, company tracks, project links, practice paths or sitemap.
 fs.writeFileSync(problemFile,JSON.stringify(activeProblems,null,2)+'\n')

 await runGenerator('generate-seo.mjs')
 await runGenerator('generate-crawl-hubs.mjs')
 await runGenerator('generate-discovery-pages.mjs')
 await runGenerator('generate-practice-pages.mjs')
 await runGenerator('enrich-seo.mjs')
 await runGenerator('generate-accelerator-seo.mjs')

 // The interactive app gets the same active catalog and a dedicated Accelerators
 // filter during production bundling. Restore the source files after the bundle.
 fs.writeFileSync(mainFile,appWithCodingCategories(originalMain))
 await build()
 console.log(`Built HDLForge with ${activeProblems.length} coding problems; removed ${removedCount} theory-only problems and added ${acceleratorProblems.length} accelerator problems.`)
} finally {
 fs.writeFileSync(problemFile,originalProblems)
 fs.writeFileSync(mainFile,originalMain)
}
