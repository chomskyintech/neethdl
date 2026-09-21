import rawProjectProblems from './guidedProjectProblems.js'
import {riscvProject,riscvProjectProblems} from './riscvProject.js'

export const uartProject={
  id:'uart-controller',
  slug:'uart-controller',
  title:'UART Controller',
  level:'Easy to Medium',
  categories:['all','rtl','fpga','soc'],
  skills:['UART','FSMs','Counters','Shift registers','Serial protocols'],
  problemIds:['uart-baud-tick','uart-tx-shift','uart-tx-control','uart-rx-start','uart-rx-shift','uart-rx-control','uart-loopback'],
}

export const axiLiteProject={
  id:'axi-lite-slave',
  slug:'axi-lite-slave',
  title:'AXI4-Lite Slave Peripheral',
  level:'Medium',
  categories:['all','rtl','soc'],
  skills:['AXI4-Lite','Ready/valid','Register maps','Backpressure','SoC interfaces'],
  problemIds:['axi-reg-bank','axi-aw-capture','axi-w-capture','axi-write-commit','axi-b-response','axi-ar-capture','axi-r-response','axi-lite-slave-top'],
}

export const asyncFifoProject={
  id:'async-fifo',
  slug:'async-fifo',
  title:'Asynchronous FIFO / CDC',
  level:'Medium to Hard',
  categories:['all','rtl','fpga'],
  skills:['CDC','Gray code','Synchronizers','Dual-clock FIFO','Reset strategy'],
  problemIds:['afifo-dual-port-ram','afifo-binary-pointers','afifo-gray-converter','afifo-gray-sync','afifo-empty-detect','afifo-full-detect','afifo-reset-sync','afifo-top'],
}

export const guidedProjects=[
  {
    ...riscvProject,
    level:'Beginner to Intermediate',
    categories:['all','rtl','soc'],
    skills:['RV32I','SystemVerilog','CPU architecture','Datapath design','Control logic'],
  },
  uartProject,
  axiLiteProject,
  asyncFifoProject,
]

export const guidedProjectById=Object.fromEntries(guidedProjects.map(project=>[project.id,project]))
export const guidedProjectBySlug=Object.fromEntries(guidedProjects.map(project=>[project.slug,project]))

const rawById=Object.fromEntries(rawProjectProblems.map(problem=>[problem.id,problem]))

export const guidedProjectProblems=[
  ...riscvProjectProblems,
  ...guidedProjects.flatMap(project=>{
    if(project.id===riscvProject.id)return []
    return project.problemIds.map((id,index)=>{
      const problem=rawById[id]
      if(!problem)throw new Error(`Missing guided project problem: ${id}`)
      return {
        ...problem,
        project:{
          id:project.id,
          title:project.title,
          step:index+1,
          total:project.problemIds.length,
        },
      }
    })
  }),
]
