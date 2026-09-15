import fs from 'node:fs'
import path from 'node:path'
import {build} from 'vite'

const root=process.cwd()
const problemFile=path.join(root,'src/data/problems.json')
const acceleratorFile=path.join(root,'src/data/acceleratorProblems.json')
const originalProblems=fs.readFileSync(problemFile,'utf8')
const baseProblems=JSON.parse(originalProblems)
const acceleratorProblems=JSON.parse(fs.readFileSync(acceleratorFile,'utf8'))
const codingProblems=baseProblems.filter(problem=>problem.evaluation?.type!=='answer')
const activeProblems=[...codingProblems,...acceleratorProblems]
const removedCount=baseProblems.length-codingProblems.length

async function runGenerator(name){
 await import(`./${name}?catalog=${Date.now()}-${Math.random()}`)
}

try{
 // Existing SEO generators read problems.json directly. Give them the same coding-only
 // catalog used by src/data/activeProblems.js, then restore the historical source file.
 fs.writeFileSync(problemFile,JSON.stringify(activeProblems,null,2)+'\n')

 await runGenerator('generate-seo.mjs')
 await runGenerator('generate-crawl-hubs.mjs')
 await runGenerator('generate-discovery-pages.mjs')
 await runGenerator('generate-practice-pages.mjs')
 await runGenerator('enrich-seo.mjs')
 await runGenerator('generate-accelerator-seo.mjs')

 await build()
 console.log(`Built HDLForge with ${activeProblems.length} coding problems; removed ${removedCount} theory-only problems and added ${acceleratorProblems.length} accelerator problems.`)
} finally {
 fs.writeFileSync(problemFile,originalProblems)
}
