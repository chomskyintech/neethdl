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
  'Embedded / Firmware',
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

export function projectTopic(problem){
  if(problem.project?.id==='uart-controller'||problem.project?.id==='axi-lite-slave')return 'Protocols & Handshakes'
  if(problem.project?.id==='async-fifo')return 'CDC & Synchronization'
  if(problem.project?.id==='uvm-axi4-lite-verification'){
    const verificationTopics={
      'uvm-axi-interface':'Interfaces',
      'uvm-axi-sequence-item':'Constrained Random',
      'uvm-axi-driver':'UVM',
      'uvm-axi-monitor':'UVM',
      'uvm-axi-scoreboard':'Scoreboards',
      'uvm-axi-coverage':'Functional Coverage',
      'uvm-axi-assertions':'SVA',
    }
    return verificationTopics[problem.id]||'UVM'
  }
  if(problem.project?.id==='pipelined-risc-v-core')return 'CPU / RISC-V'
  if(problem.project?.id==='hardware-dsp-pipeline')return 'Pipelining & Streaming'
  if(problem.project?.id==='matrix-multiplication-accelerator')return 'Arithmetic & Datapaths'
  if(problem.project?.id==='cache-memory-controller')return 'Memories & Registers'
  if(problem.project?.id==='risc-v-core-verification'){
    const rvvTopics={
      'rvv-instruction-item':'Interfaces',
      'rvv-random-sequence':'Constrained Random',
      'rvv-reference-model':'Scoreboards',
      'rvv-retire-scoreboard':'Scoreboards',
      'rvv-core-assertions':'SVA',
      'rvv-functional-coverage':'Functional Coverage',
    }
    return rvvTopics[problem.id]||'UVM'
  }
  if(problem.project?.id==='fpga-packet-parser')return 'Pipelining & Streaming'
  if(problem.project?.id==='branch-predictor')return 'CPU / RISC-V'
  if(problem.project?.id==='convolution-accelerator')return 'Arithmetic & Datapaths'
  if(problem.project?.id==='small-risc-v-soc')return 'CPU / RISC-V'
  if(problem.project?.id==='formal-verification-rtl')return 'Formal Verification'
  if(problem.project?.id==='low-latency-market-data-parser')return 'Pipelining & Streaming'
  if(problem.project?.id==='simd-vector-unit')return 'Arithmetic & Datapaths'
  if(problem.project?.id==='dma-engine')return 'Protocols & Handshakes'
  if(problem.project?.id==='axi4-interconnect-crossbar')return 'Protocols & Handshakes'
  if(problem.project?.id==='soc-peripheral-subsystem')return 'Protocols & Handshakes'
  if(problem.project?.id==='riscv-firmware-bringup')return 'Embedded / Firmware'
  if(problem.project?.id==='formal-cache-verification')return 'Formal Verification'
  if(problem.project?.id==='spi-controller')return 'Protocols & Handshakes'
  if(problem.project?.id==='i2c-slave-peripheral')return 'Protocols & Handshakes'
  if(problem.project?.id==='axi-crossbar-verification'){
    const xbarVerificationTopics={
      'xbarv-sequence-item':'Interfaces',
      'xbarv-random-sequence':'Constrained Random',
      'xbarv-monitor':'UVM',
      'xbarv-scoreboard':'Scoreboards',
      'xbarv-contention-sequence':'Constrained Random',
      'xbarv-assertions':'SVA',
      'xbarv-coverage':'Functional Coverage',
    }
    return xbarVerificationTopics[problem.id]||'UVM'
  }
  return null
}

export function assignProblemTopic(problem){
  return topicById[problem.id]||problem.topic||projectTopic(problem)||'Other'
}
