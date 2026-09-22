import fs from 'node:fs'
import path from 'node:path'
import {guidedProjectProblems,guidedProjects} from '../src/data/guidedProjects.js'
import {assignProblemTopic,problemTopics} from '../src/data/problemTopics.js'

const root=process.cwd()
const outDir=path.join(root,'src/data/.generated')
const detailDir=path.join(root,'public/problem-data')
fs.mkdirSync(outDir,{recursive:true})
fs.rmSync(detailDir,{recursive:true,force:true})
fs.mkdirSync(detailDir,{recursive:true})

const readJson=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'))
const baseProblems=readJson('src/data/problems.json').filter(problem=>problem.evaluation?.type!=='answer')
const acceleratorProblems=readJson('src/data/acceleratorProblems.json')
const expansionProblems=readJson('src/data/expansionProblems.json')
const activeProblems=[...baseProblems,...acceleratorProblems,...expansionProblems,...guidedProjectProblems]
  .map(problem=>({...problem,topic:assignProblemTopic(problem)}))

const problemCatalog=activeProblems.map(problem=>({
  id:problem.id,
  title:problem.title,
  difficulty:problem.difficulty,
  category:problem.category,
  topic:problem.topic,
  languages:Array.isArray(problem.languages)?problem.languages:[],
  tags:Array.isArray(problem.tags)?problem.tags:[],
  project:problem.project?{
    id:problem.project.id,
    title:problem.project.title,
    step:problem.project.step,
    total:problem.project.total,
  }:undefined,
}))

const projectCatalog=guidedProjects.map(project=>({
  id:project.id,
  slug:project.slug,
  title:project.title,
  level:project.level,
  roadmap:project.roadmap,
  categories:Array.isArray(project.categories)?project.categories:[],
  skills:Array.isArray(project.skills)?project.skills:[],
  why:project.why||'',
  problemIds:Array.isArray(project.problemIds)?project.problemIds:[],
}))

fs.writeFileSync(path.join(outDir,'problemCatalog.json'),JSON.stringify(problemCatalog,null,2)+'\n')
fs.writeFileSync(path.join(outDir,'guidedProjectCatalog.json'),JSON.stringify(projectCatalog,null,2)+'\n')
fs.writeFileSync(path.join(outDir,'problemTopics.json'),JSON.stringify(problemTopics,null,2)+'\n')

for(const problem of activeProblems){
  fs.writeFileSync(
    path.join(detailDir,`${encodeURIComponent(problem.id)}.json`),
    JSON.stringify(problem)+'\n'
  )
}

console.log(`Generated lightweight runtime catalogs: ${problemCatalog.length} problems, ${projectCatalog.length} guided projects, and ${activeProblems.length} on-demand problem payloads.`)
