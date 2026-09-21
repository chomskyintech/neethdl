export const careerPaths={
  'rtl-digital':{
    id:'rtl-digital',
    slug:'rtl-design',
    label:'RTL Design Engineer',
    eyebrow:'CAREER ROADMAP',
    summary:'Build the core digital-design skills used in RTL interviews and day-to-day block design: combinational logic, state, memories, FIFOs, pipelining, CDC and clean synthesizable interfaces.',
    skills:['Verilog / SystemVerilog','Combinational logic','Sequential logic','FSMs','FIFOs','Memories','Pipelining','CDC'],
    problemIds:['rtl-mux','rtl-counter','rtl-priority','rtl-fifo','rtl-shift-register','rtl-edge-detector','rtl-arbiter','rtl-regfile','rtl-clock-divider','rtl-skid-buffer','rtl-pipeline-register','rtl-reset-synchronizer','rtl-gray-counter','rtl-dual-port-ram','rtl-onehot-fsm'],
    projectSlugs:['axi-lite-slave','asynchronous-fifo','guided-risc-v-cpu','cache-memory-controller','axi-lite-apb-bridge','dma-engine','small-risc-v-soc'],
    milestones:[
      {title:'1. RTL fundamentals',problemIds:['rtl-mux','rtl-priority','rtl-counter','rtl-clock-divider','rtl-shift-register','rtl-edge-detector']},
      {title:'2. Control and state',problemIds:['rtl-arbiter','rtl-onehot-fsm','rtl-regfile']},
      {title:'3. Storage and flow control',problemIds:['rtl-fifo','rtl-skid-buffer','rtl-pipeline-register','rtl-dual-port-ram']},
      {title:'4. Clock/reset depth',problemIds:['rtl-reset-synchronizer','rtl-gray-counter']},
    ],
  },
  'verification':{
    id:'verification',
    slug:'design-verification',
    label:'Design Verification',
    summary:'Practice SystemVerilog, assertions, reusable testbench structure and UVM-style checking for verification interviews.',
    problemIds:['sv-always','sv-interface','sva-handshake','sva-reset','uvm-driver','uvm-scoreboard','rtl-skid-buffer','proto-ready-valid-source','proto-apb-register','proto-axi-lite-write'],
    projectSlugs:['uvm-axi4-lite-verification','apb-peripheral-verification','risc-v-core-verification'],
  },
  'hft-fpga':{
    id:'hft-fpga',
    slug:'fpga-engineer',
    label:'FPGA Engineer',
    summary:'Focus on deterministic RTL, streaming datapaths, clock-domain control and board-relevant interfaces.',
    problemIds:['rtl-round-robin-arbiter','rtl-skid-buffer','rtl-pipeline-register','proto-ready-valid-source','rtl-fifo','rtl-edge-detector','fpga-pulse-sync','fpga-clock-enable','accel-pipelined-mul','accel-stream-accum'],
    projectSlugs:['uart-controller','hardware-dsp-pipeline','asynchronous-fifo','fpga-packet-parser','low-latency-market-data-parser'],
  },
  'cpu-gpu':{
    id:'cpu-gpu',
    slug:'cpu-gpu-hardware',
    label:'CPU / GPU Hardware',
    summary:'Develop processor-oriented RTL skills around register structures, pipelines, memories, arbitration and compute datapaths.',
    problemIds:['rtl-regfile','rtl-pipeline-register','rtl-skid-buffer','rtl-dual-port-ram','rtl-fifo','rtl-arbiter','proto-ready-valid-source','proto-axi-lite-write','accel-vector-max4','accel-matmul2'],
    projectSlugs:['guided-risc-v-cpu','pipelined-risc-v-core','cache-memory-controller','small-risc-v-soc','risc-v-core-verification'],
  },
  'accelerators':{
    id:'accelerators',
    slug:'hardware-accelerator',
    label:'Hardware Accelerator',
    summary:'Practice MACs, reductions, fixed-point arithmetic, matrix/conv datapaths and throughput-oriented streaming pipelines.',
    problemIds:['accel-mac8','accel-dot4','accel-reduction8','accel-relu-quant','accel-systolic-pe','accel-pipelined-mul','accel-popcount32','accel-vector-max4','accel-fixed-mul','accel-stream-accum','accel-matmul2','accel-conv3'],
    projectSlugs:['matrix-multiplication-accelerator','hardware-dsp-pipeline','fpga-packet-parser','feed-to-action-latency-pipeline'],
  },
}

export const careerPathList=Object.values(careerPaths)
export const careerPathBySlug=Object.fromEntries(careerPathList.map(path=>[path.slug,path]))
