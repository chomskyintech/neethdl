import baseProblems from './problems.json'
import acceleratorProblems from './acceleratorProblems.json'

const activeProblems = [
  ...baseProblems.filter(problem => problem.evaluation?.type !== 'answer'),
  ...acceleratorProblems,
]

export default activeProblems
