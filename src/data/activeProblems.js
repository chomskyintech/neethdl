import baseProblems from './problems.json'
import acceleratorProblems from './acceleratorProblems.json'
import expansionProblems from './expansionProblems.json'
import {guidedProjectProblems} from './guidedProjects.js'
import {assignProblemTopic,problemTopics} from './problemTopics.js'

export {problemTopics}

const catalog=[
  ...baseProblems.filter(problem=>problem.evaluation?.type!=='answer'),
  ...acceleratorProblems,
  ...expansionProblems,
]

// Guided-project modules stay discoverable as standalone exercises while
// Projects assembles them into ordered build sequences.
const activeProblems=[...catalog,...guidedProjectProblems]

export default activeProblems.map(problem=>({
  ...problem,
  topic:assignProblemTopic(problem),
}))
