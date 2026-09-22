import problems from './.generated/problemCatalog.json'
import guidedProjects from './.generated/guidedProjectCatalog.json'
import problemTopics from './.generated/problemTopics.json'

export {problemTopics,guidedProjects}
export const guidedProjectById=Object.fromEntries(guidedProjects.map(project=>[project.id,project]))
export const guidedProjectBySlug=Object.fromEntries(guidedProjects.map(project=>[project.slug,project]))

let fullProblemsPromise=null
function loadFullProblems(){
  if(!fullProblemsPromise){
    fullProblemsPromise=import('./activeProblems.js').then(module=>module.default)
  }
  return fullProblemsPromise
}

export async function loadProblemDetails(id){
  if(!id)return null
  const fullProblems=await loadFullProblems()
  return fullProblems.find(problem=>problem.id===id)||null
}

export default problems
