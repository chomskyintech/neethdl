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

const detailDir=path.join(root,'public/problem-data')
const detailFiles=fs.readdirSync(detailDir).filter(file=>file.endsWith('.json'))
if(detailFiles.length!==fullProblems.length){
  console.error(`Expected ${fullProblems.length} problem detail payloads, found ${detailFiles.length}.`)
  process.exit(1)
}
for(const problem of fullProblems){
  const file=path.join(detailDir,`${encodeURIComponent(problem.id)}.json`)
  if(!fs.existsSync(file)){
    console.error(`Missing on-demand problem payload: ${problem.id}`)
    process.exit(1)
  }
}

const indexHtml=fs.readFileSync(path.join(root,'index.html'),'utf8')
const globallyLoadedIdeScripts=[
  'ide-redesign.js',
  'ide-section-label.js',
  'ide-language-control.js',
  'console-panel-resize.js',
  'simulation-panel-v2.js',
  'simulation-panel-quality.js',
  'simulation-panel-behavior.js',
  'waveform-window-refinement.js',
  'riscv-project-ui.js',
]
for(const script of globallyLoadedIdeScripts){
  if(indexHtml.includes(`/src/${script}`)){
    console.error(`IDE-only script is still globally loaded from index.html: ${script}`)
    process.exit(1)
  }
}

const globallyLoadedIdeStyles=[
  'ide-redesign.css',
  'ide-sizing-fix.css',
  'ide-control-refinement.css',
  'ide-brand-title-tweak.css',
  'ide-leetcode-theme.css',
  'ide-leetcode-monaco.css',
  'ide-control-fix.css',
  'ide-scrollbar-fix.css',
  'ide-final-polish.css',
  'ide-edge-alignment.css',
  'ide-language-control.css',
  'ide-compact-layout.css',
  'ide-theme-lock.css',
  'simulation-panel-v2.css',
  'simulation-panel-quality.css',
]
for(const stylesheet of globallyLoadedIdeStyles){
  if(indexHtml.includes(`href="/${stylesheet}"`)){
    console.error(`IDE-only stylesheet is still globally loaded from index.html: ${stylesheet}`)
    process.exit(1)
  }
}

const mainSource=fs.readFileSync(path.join(root,'src/main.jsx'),'utf8')
if(mainSource.includes("from './data/activeProblems'")||mainSource.includes("from './data/guidedProjects'")){
  console.error('Initial app entry imports a full problem/project catalog instead of runtimeCatalog.')
  process.exit(1)
}

const problemBytes=Buffer.byteLength(JSON.stringify(problemCatalog))
const projectBytes=Buffer.byteLength(JSON.stringify(projectCatalog))
if(problemBytes>140000){
  console.error(`Runtime problem catalog is too large: ${problemBytes} bytes`)
  process.exit(1)
}

console.log(`Runtime catalog regression passed: ${problemCatalog.length} lightweight problems (${problemBytes} bytes), ${projectCatalog.length} projects (${projectBytes} bytes), and ${detailFiles.length} on-demand detail payloads.`)
