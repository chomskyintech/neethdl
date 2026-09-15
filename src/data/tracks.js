const tracks = [
  {
    id: 'jane-street',
    name: 'Jane Street',
    description: 'Low-latency RTL, arbitration, backpressure, streaming pipelines and deterministic datapaths.',
    problemIds: ['rtl-round-robin-arbiter','rtl-skid-buffer','rtl-fifo','rtl-pipeline-register','proto-ready-valid-source','rtl-regfile','fpga-pulse-sync','accel-pipelined-mul','accel-stream-accum','rtl-onehot-fsm']
  },
  {
    id: 'amd',
    name: 'AMD',
    description: 'RTL fundamentals, buses, memory structures, CDC, pipelines and accelerator-oriented datapaths.',
    problemIds: ['rtl-fifo','rtl-regfile','rtl-skid-buffer','rtl-dual-port-ram','rtl-reset-synchronizer','proto-apb-register','proto-axi-lite-write','fpga-pulse-sync','accel-pipelined-mul','accel-matmul2']
  },
  {
    id: 'arm',
    name: 'Arm',
    description: 'Clean digital design, pipelines, AMBA-style interfaces, register structures and CDC-safe control.',
    problemIds: ['rtl-regfile','rtl-onehot-fsm','rtl-pipeline-register','rtl-gray-counter','rtl-fifo','proto-ready-valid-source','proto-apb-register','proto-axi-lite-write','rtl-reset-synchronizer','rtl-skid-buffer']
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    description: 'High-throughput RTL, vector and matrix datapaths, pipelines, memory movement, CDC and accelerator arithmetic.',
    problemIds: ['accel-mac8','accel-dot4','accel-reduction8','accel-systolic-pe','accel-pipelined-mul','accel-matmul2','accel-conv3','accel-fixed-mul','rtl-dual-port-ram','rtl-skid-buffer','fpga-pulse-sync']
  },
  {
    id: 'qualcomm',
    name: 'Qualcomm',
    description: 'SoC-oriented RTL, AMBA buses, CDC, FIFOs, control logic and efficient streaming datapaths.',
    problemIds: ['rtl-fifo','rtl-regfile','rtl-reset-synchronizer','rtl-gray-counter','rtl-skid-buffer','proto-apb-register','proto-axi-lite-write','fpga-pulse-sync','accel-stream-accum','accel-fixed-mul']
  },
  {
    id: 'apple',
    name: 'Apple',
    description: 'Clean RTL, timing-aware pipelines, memory structures, interface discipline and efficient compute datapaths.',
    problemIds: ['rtl-fifo','rtl-regfile','rtl-pipeline-register','rtl-skid-buffer','rtl-dual-port-ram','proto-ready-valid-source','rtl-reset-synchronizer','accel-pipelined-mul','accel-vector-max4','accel-matmul2']
  },
  {
    id: 'hft-fpga',
    name: 'HFT / FPGA',
    description: 'Latency-focused RTL, arbitration, streaming handshakes, deterministic pipelines and FPGA-safe clock-domain control.',
    problemIds: ['rtl-round-robin-arbiter','rtl-skid-buffer','rtl-pipeline-register','proto-ready-valid-source','rtl-fifo','rtl-edge-detector','fpga-pulse-sync','fpga-clock-enable','accel-pipelined-mul','accel-stream-accum']
  },
  {
    id: 'verification',
    name: 'Verification',
    description: 'SystemVerilog, assertions and UVM-oriented coding exercises for verification interviews.',
    problemIds: ['sv-always','sv-interface','sva-handshake','sva-reset','uvm-driver','uvm-scoreboard','rtl-skid-buffer','proto-ready-valid-source','proto-apb-register','proto-axi-lite-write']
  },
  {
    id: 'rtl-digital',
    name: 'RTL / Digital Design',
    description: 'Core synthesizable RTL, state machines, memories, arbitration, pipelines and clock/reset structures.',
    problemIds: ['rtl-mux','rtl-counter','rtl-priority','rtl-fifo','rtl-shift-register','rtl-edge-detector','rtl-arbiter','rtl-regfile','rtl-round-robin-arbiter','rtl-skid-buffer','rtl-pipeline-register','rtl-reset-synchronizer','rtl-gray-counter','rtl-dual-port-ram','rtl-onehot-fsm']
  },
  {
    id: 'accelerators',
    name: 'Accelerator Design',
    description: 'MACs, vector reductions, quantized arithmetic, matrix multiply, convolution and throughput-oriented pipelines.',
    problemIds: ['accel-mac8','accel-dot4','accel-reduction8','accel-relu-quant','accel-systolic-pe','accel-pipelined-mul','accel-popcount32','accel-vector-max4','accel-fixed-mul','accel-stream-accum','accel-matmul2','accel-conv3']
  }
]

export default tracks
