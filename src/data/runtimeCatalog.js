import problems from './.generated/problemCatalog.json'
import guidedProjects from './.generated/guidedProjectCatalog.json'
import problemTopics from './.generated/problemTopics.json'

export {problemTopics,guidedProjects}
export const guidedProjectById=Object.fromEntries(guidedProjects.map(project=>[project.id,project]))
export const guidedProjectBySlug=Object.fromEntries(guidedProjects.map(project=>[project.slug,project]))

const detailPromises=new Map()

export async function loadProblemDetails(id){
  if(!id)return null
  if(detailPromises.has(id))return detailPromises.get(id)

  const pending=fetch(`/problem-data/${encodeURIComponent(id)}.json`,{cache:'force-cache'})
    .then(response=>{
      if(!response.ok)throw new Error(`Problem payload returned HTTP ${response.status}`)
      return response.json()
    })
    .catch(error=>{
      detailPromises.delete(id)
      throw error
    })

  detailPromises.set(id,pending)
  return pending
}

export default problems
