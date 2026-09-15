import baseProblems from './problems.json'
import acceleratorProblems from './acceleratorProblems.json'
import expansionProblems from './expansionProblems.json'

const activeProblems = [
  ...baseProblems.filter(problem => problem.evaluation?.type !== 'answer'),
  ...acceleratorProblems,
  ...expansionProblems,
]

export default activeProblems
