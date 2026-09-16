import fs from 'node:fs'
import path from 'node:path'
import {build} from 'vite'
import {riscvProjectProblems} from '../src/data/riscvProject.js'

const root=process.cwd()
const problemFile=path.join(root,'src/data/problems.json')
const acceleratorFile=path.join(root,'src/data/acceleratorProblems.json')
const expansionFile=path.join(root,'src/data/expansionProblems.json')
const originalProblems=fs.readFileSync(problemFile,'utf8')
const originalAccelerators=fs.readFileSync(acceleratorFile,'utf8')
const baseProblems=JSON.parse(originalProblems)
const acceleratorProblems=JSON.parse(originalAccelerators)
const expansionProblems=JSON.parse(fs.readFileSync(expansionFile,'utf8'))
const codingProblems=baseProblems.filter(problem=>problem.evaluation?.type!=='answer')
const activeProblems=[...codingProblems,...acceleratorProblems,...expansionProblems,...riscvProjectProblems]
const allAccelerators=activeProblems.filter(problem=>problem.category==='Accelerators')
const removedCount=baseProblems.length-codingProblems.length

async function runGenerator(name){
 await import(`./${name}?catalog=${Date.now()}-${Math.random()}`)
}

try{
 // Legacy SEO generators read problems.json (and the accelerator generator reads
 // acceleratorProblems.json) directly. Temporarily expose the complete coding-only
 // catalogs to those generators, then restore source data BEFORE Vite bundles the app.
 fs.writeFileSync(problemFile,JSON.stringify(activeProblems,null,2)+'\n')
 fs.writeFileSync(acceleratorFile,JSON.stringify(allAccelerators,null,2)+'\n')

 await runGenerator('generate-seo.mjs')
 await runGenerator('generate-crawl-hubs.mjs')
 await runGenerator('generate-discovery-pages.mjs')
 await runGenerator('generate-practice-pages.mjs')
 await runGenerator('enrich-seo.mjs')
 await runGenerator('generate-accelerator-seo.mjs')
 await runGenerator('generate-intent-guides.mjs')

 // Rebuild the sitemap only after every crawlable page generator has finished.
 // This avoids individual generators accidentally leaving new URLs out of sitemap.xml.
 await runGenerator('generate-sitemap.mjs')
 await runGenerator('validate-sitemap.mjs')

 fs.writeFileSync(problemFile,originalProblems)
 fs.writeFileSync(acceleratorFile,originalAccelerators)

 await build()
 console.log(`Built HDLForge with ${activeProblems.length} coding problems; removed ${removedCount} theory-only problems, including ${allAccelerators.length} accelerator problems.`)
} finally {
 fs.writeFileSync(problemFile,originalProblems)
 fs.writeFileSync(acceleratorFile,originalAccelerators)
}
