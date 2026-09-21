import rawProjectProblems from './guidedProjectProblems.js'
import expansionGuidedProblems from './guidedProjectExpansionProblems.js'
import {riscvProject,riscvProjectProblems} from './riscvProject.js'

export const uartProject={
  id:'uart-controller',
  slug:'uart-controller',
  title:'UART Controller',
  level:'Easy to Medium',
  roadmap:'hft-fpga',
  categories:['all','rtl','fpga','soc'],
  skills:['UART','FSMs','Counters','Shift registers','Serial protocols'],
  why:'Build a complete serial controller from timing generation through transmit, receive and loopback integration.',
  problemIds:['uart-baud-tick','uart-tx-shift','uart-tx-control','uart-rx-start','uart-rx-shift','uart-rx-control','uart-loopback'],
}

export const axiLiteProject={
  id:'axi-lite-slave',
  slug:'axi-lite-slave',
  title:'AXI4-Lite Slave Peripheral',
  level:'Medium',
  roadmap:'rtl-digital',
  categories:['all','rtl','soc'],
  skills:['AXI4-Lite','Ready/valid','Register maps','Backpressure','SoC interfaces'],
  why:'Build a realistic memory-mapped RTL peripheral with independent AXI-Lite channels and correct response handling.',
  problemIds:['axi-reg-bank','axi-aw-capture','axi-w-capture','axi-write-commit','axi-b-response','axi-ar-capture','axi-r-response','axi-lite-slave-top'],
}

export const asyncFifoProject={
  id:'async-fifo',
  slug:'async-fifo',
  title:'Asynchronous FIFO / CDC',
  level:'Medium to Hard',
  roadmap:'rtl-digital',
  categories:['all','rtl','fpga'],
  skills:['CDC','Gray code','Synchronizers','Dual-clock FIFO','Reset strategy'],
  why:'Build the Gray-pointer, synchronizer and full/empty logic behind a production-style dual-clock FIFO.',
  problemIds:['afifo-dual-port-ram','afifo-binary-pointers','afifo-gray-converter','afifo-gray-sync','afifo-empty-detect','afifo-full-detect','afifo-reset-sync','afifo-top'],
}

export const uvmAxiProject={
  id:'uvm-axi4-lite-verification',
  slug:'uvm-axi4-lite-verification',
  title:'UVM AXI4-Lite Verification Environment',
  level:'Intermediate to Hard',
  roadmap:'verification',
  categories:['all','dv','soc'],
  skills:['SystemVerilog','UVM','SVA','AXI4-Lite','Functional coverage'],
  why:'Build a reusable verification environment with transaction-level stimulus, passive monitoring, scoreboarding, coverage and protocol assertions.',
  problemIds:['uvm-axi-interface','uvm-axi-sequence-item','uvm-axi-driver','uvm-axi-monitor','uvm-axi-scoreboard','uvm-axi-coverage','uvm-axi-assertions'],
}

export const pipelinedRiscvProject={
  id:'pipelined-risc-v-core',
  slug:'pipelined-risc-v-core',
  title:'Three-Stage Pipelined RISC-V Core',
  level:'Hard',
  roadmap:'cpu-gpu',
  categories:['all','rtl','soc'],
  skills:['RISC-V','Pipelining','Hazards','Forwarding','Control'],
  why:'Move beyond a basic CPU by implementing pipeline state, forwarding, load-use stalls, branch flushes and writeback control.',
  problemIds:['pipe-if-id','pipe-id-ex','pipe-forwarding','pipe-load-use-stall','pipe-branch-flush','pipe-writeback-mux','pipe-control-integration'],
}

export const dspPipelineProject={
  id:'hardware-dsp-pipeline',
  slug:'hardware-dsp-pipeline',
  title:'Hardware DSP Pipeline',
  level:'Intermediate',
  roadmap:'hft-fpga',
  categories:['all','fpga','rtl'],
  skills:['DSP','Fixed point','FIR','Pipelining','Streaming RTL'],
  why:'Build a streaming FIR-style datapath with signed MAC arithmetic, sample history, control alignment and saturation.',
  problemIds:['dsp-fixed-mac','dsp-delay-line','dsp-fir-sum','dsp-valid-pipeline','dsp-saturate','dsp-fir-stream-top'],
}

export const matrixMultiplyProject={
  id:'matrix-multiplication-accelerator',
  slug:'matrix-multiplication-accelerator',
  title:'Matrix-Multiplication Accelerator',
  level:'Intermediate to Hard',
  roadmap:'accelerators',
  categories:['all','fpga'],
  skills:['Matrix multiply','MAC datapaths','Accelerators','Valid/ready','Parallel compute'],
  why:'Build a small parallel matrix engine from processing elements and tile registers through control, buffering and top-level handshakes.',
  problemIds:['matmul-mac-pe','matmul-dot2','matmul-input-tile','matmul-controller','matmul-result-buffer','matmul-2x2-top'],
}

export const guidedProjects=[
  {
    ...riscvProject,
    level:'Beginner to Intermediate',
    roadmap:'cpu-gpu',
    categories:['all','rtl','soc'],
    skills:['RV32I','SystemVerilog','CPU architecture','Datapath design','Control logic'],
    why:'Build a complete RV32I datapath one block at a time before moving into pipelining and processor microarchitecture.',
  },
  uartProject,
  axiLiteProject,
  asyncFifoProject,
  uvmAxiProject,
  pipelinedRiscvProject,
  dspPipelineProject,
  matrixMultiplyProject,
]

export const guidedProjectById=Object.fromEntries(guidedProjects.map(project=>[project.id,project]))
export const guidedProjectBySlug=Object.fromEntries(guidedProjects.map(project=>[project.slug,project]))

const allRawProjectProblems=[...rawProjectProblems,...expansionGuidedProblems]
const rawById=Object.fromEntries(allRawProjectProblems.map(problem=>[problem.id,problem]))

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
