import baseProblems from './problems.json'
import acceleratorProblems from './acceleratorProblems.json'
import expansionProblems from './expansionProblems.json'
import {riscvProjectProblems} from './riscvProject'

export const problemTopics=[
  'Combinational Logic',
  'Sequential Logic',
  'Counters & Timers',
  'FSMs',
  'FIFOs & Buffers',
  'Memories & Registers',
  'Pipelining & Streaming',
  'CDC & Synchronization',
  'Protocols & Handshakes',
  'Arithmetic & Datapaths',
  'CPU / RISC-V',
  'Testbenches',
  'Interfaces',
  'SVA',
  'Constrained Random',
  'Functional Coverage',
  'UVM',
  'Scoreboards',
  'Formal Verification',
]

const topicById={
  'rtl-mux':'Combinational Logic',
  'rtl-priority':'Combinational Logic',
  'rtl-arbiter':'Combinational Logic',
  'accel-popcount32':'Combinational Logic',

  'rtl-shift-register':'Sequential Logic',
  'rtl-edge-detector':'Sequential Logic',
  'rtl-lfsr':'Sequential Logic',
  'fpga-clock-enable':'Sequential Logic',

  'rtl-counter':'Counters & Timers',
  'rtl-clock-divider':'Counters & Timers',
  'rtl-gray-counter':'Counters & Timers',
  'fpga-pwm':'Counters & Timers',

  'fpga-fsm':'FSMs',
  'rtl-onehot-fsm':'FSMs',

  'rtl-fifo':'FIFOs & Buffers',
  'rtl-skid-buffer':'FIFOs & Buffers',

  'rtl-regfile':'Memories & Registers',
  'rtl-dual-port-ram':'Memories & Registers',

  'rtl-pipeline-register':'Pipelining & Streaming',
  'accel-pipelined-mul':'Pipelining & Streaming',
  'accel-stream-accum':'Pipelining & Streaming',

  'rtl-reset-synchronizer':'CDC & Synchronization',
  'fpga-pulse-sync':'CDC & Synchronization',
  'fpga-debounce':'CDC & Synchronization',

  'proto-uart':'Protocols & Handshakes',
  'proto-spi':'Protocols & Handshakes',
  'proto-ready-valid-source':'Protocols & Handshakes',
  'proto-apb-register':'Protocols & Handshakes',
  'proto-axi-lite-write':'Protocols & Handshakes',

  'accel-mac8':'Arithmetic & Datapaths',
  'accel-dot4':'Arithmetic & Datapaths',
  'accel-reduction8':'Arithmetic & Datapaths',
  'accel-relu-quant':'Arithmetic & Datapaths',
  'accel-systolic-pe':'Arithmetic & Datapaths',
  'accel-vector-max4':'Arithmetic & Datapaths',
  'accel-fixed-mul':'Arithmetic & Datapaths',
  'accel-matmul2':'Arithmetic & Datapaths',
  'accel-conv3':'Arithmetic & Datapaths',

  'rv32-pc':'CPU / RISC-V',
  'rv32-decode':'CPU / RISC-V',
  'rv32-register-file':'CPU / RISC-V',
  'rv32-immediate':'CPU / RISC-V',
  'rv32-alu':'CPU / RISC-V',
  'rv32-branch-control':'CPU / RISC-V',
  'rv32-memory-control':'CPU / RISC-V',
  'rv32-core-integration':'CPU / RISC-V',

  'sv-always':'Testbenches',
  'sv-interface':'Interfaces',
  'sva-handshake':'SVA',
  'sva-reset':'SVA',
  'uvm-driver':'UVM',
  'uvm-scoreboard':'Scoreboards',
}

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

export default activeProblems.map(problem=>({
  ...problem,
  topic:topicById[problem.id]||'Other',
}))
