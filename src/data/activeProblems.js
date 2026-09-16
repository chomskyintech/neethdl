import baseProblems from './problems.json'
import acceleratorProblems from './acceleratorProblems.json'
import expansionProblems from './expansionProblems.json'
import {riscvProjectProblems} from './riscvProject'

const catalog=[
  ...baseProblems.filter(problem=>problem.evaluation?.type!=='answer'),
  ...acceleratorProblems,
  ...expansionProblems,
]

// Scatter project tasks through the ordinary problem library so they remain
// discoverable as standalone exercises while Projects can assemble them in order.
const insertionSlots=[3,8,14,20,26,32,38,44]
const activeProblems=[...catalog]
riscvProjectProblems.forEach((problem,index)=>{
  const offset=Math.min(insertionSlots[index]+index,activeProblems.length)
  activeProblems.splice(offset,0,problem)
})

export default activeProblems
