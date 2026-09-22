#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

await import('../scripts/generate-runtime-catalogs.mjs')

const root=process.cwd()
const generated=path.join(root,'src/data/.generated')
const problemCatalog=JSON.parse(fs.readFileSync(path.join(generated,'problemCatalog.json'),'utf8'))
const projectCatalog=JSON.parse(fs.readFileSync(path.join(generated,'guidedProjectCatalog.json'),'utf8'))

const [{guidedProjectProblems,guidedProjects},{assignProblemTopic}] = await Promise.all([
  import('../src/data/guidedProjects.js'),
  import('../src/data/problemTopics.js'),
])

const readJson=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'))
const fullProblems=[
  ...readJson('src/data/problems.json').filter(problem=>problem.evaluation?.type!=='answer'),
  ...readJson('src/data/acceleratorProblems.json'),
  ...readJson('src/data/expansionProblems.json'),
  ...guidedProjectProblems,
].map(problem=>({...problem,topic:assignProblemTopic(problem)}))

const ids=list=>list.map(item=>item.id).sort()
const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right)

if(!same(ids(problemCatalog),ids(fullProblems))){
  console.error('Runtime problem catalog IDs do not match the full active problem catalog.')
  process.exit(1)
}
if(!same(ids(projectCatalog),ids(guidedProjects))){
  console.error('Runtime project catalog IDs do not match guidedProjects.')
  process.exit(1)
}

const allowedProblemKeys=new Set(['id','title','difficulty','category','topic','languages','tags','project'])
const oversized=problemCatalog.filter(problem=>Object.keys(problem).some(key=>!allowedProblemKeys.has(key)))
if(oversized.length){
  console.error('Runtime problem catalog contains full-detail fields:',oversized.slice(0,5).map(problem=>problem.id))
  process.exit(1)
}

const forbidden=['starterCode','solution','task','description','examples','displayExamples','checks','evaluation']
for(const problem of problemCatalog){
  for(const key of forbidden){
    if(Object.prototype.hasOwnProperty.call(problem,key)){
      console.error(`Runtime problem catalog unexpectedly contains ${key}: ${problem.id}`)
      process.exit(1)
    }
  }
}

const problemBytes=Buffer.byteLength(JSON.stringify(problemCatalog))
const projectBytes=Buffer.byteLength(JSON.stringify(projectCatalog))
if(problemBytes>140000){
  console.error(`Runtime problem catalog is too large: ${problemBytes} bytes`)
  process.exit(1)
}

console.log(`Runtime catalog regression passed: ${problemCatalog.length} problems (${problemBytes} bytes) and ${projectCatalog.length} projects (${projectBytes} bytes), with full editor payloads excluded.`)
