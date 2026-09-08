const tracks = [
  {
    id: 'jane-street',
    name: 'Jane Street',
    description: 'Low-latency RTL, arbitration, pipelines, state machines and architecture reasoning.',
    problemIds: ['rtl-arbiter','rtl-fifo','rtl-counter','rtl-lfsr','arch-hazard','arch-load-use','arch-cache','proto-axi-ready-valid']
  },
  {
    id: 'amd',
    name: 'AMD',
    description: 'RTL fundamentals, verification, pipelines, memory systems and interface protocols.',
    problemIds: ['rtl-fifo','rtl-regfile','rtl-arbiter','sv-always','sva-handshake','uvm-driver','arch-hazard','arch-cache','proto-axi-ready-valid','fpga-cdc-sync']
  },
  {
    id: 'arm',
    name: 'Arm',
    description: 'Digital design, CPU pipelines, cache/TLB concepts, assertions and AMBA-style protocols.',
    problemIds: ['rtl-regfile','rtl-arbiter','arch-hazard','arch-load-use','arch-cache','arch-tlb','arch-branch-predictor','proto-axi-ready-valid','proto-apb-transfer','sva-stable-stall']
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    description: 'High-performance RTL, verification, pipelines, CDC and memory-oriented architecture.',
    problemIds: ['rtl-fifo','rtl-regfile','rtl-arbiter','sv-always','sva-onehot-grant','uvm-monitor','arch-load-use','arch-cache','fpga-cdc-sync','fpga-bram-inference']
  },
  {
    id: 'qualcomm',
    name: 'Qualcomm',
    description: 'SoC-oriented RTL, verification, CDC, buses and computer architecture fundamentals.',
    problemIds: ['rtl-fifo','rtl-regfile','sv-interface','sva-reset','uvm-config-db','arch-hazard','arch-tlb','proto-axi-ready-valid','proto-apb-transfer','fpga-reset-strategy']
  },
  {
    id: 'apple',
    name: 'Apple',
    description: 'Clean RTL, verification discipline, timing-sensitive logic and architecture fundamentals.',
    problemIds: ['rtl-mux','rtl-counter','rtl-fifo','rtl-regfile','sva-stable-stall','uvm-scoreboard','arch-cache','arch-tlb','fpga-cdc-sync','fpga-timing-constraints']
  },
  {
    id: 'hft-fpga',
    name: 'HFT / FPGA',
    description: 'Latency-focused RTL, deterministic control, arbitration, pipelines and FPGA timing.',
    problemIds: ['rtl-arbiter','rtl-fifo','rtl-edge-detector','rtl-shift-register','arch-hazard','arch-load-use','proto-axi-ready-valid','fpga-cdc-sync','fpga-timing-constraints','fpga-bram-inference']
  },
  {
    id: 'verification',
    name: 'Verification',
    description: 'SystemVerilog, assertions, constrained random and UVM interview preparation.',
    problemIds: ['sv-always','sv-interface','sv-random-constraints','sv-virtual-interface','sva-handshake','sva-onehot-grant','sva-stable-stall','uvm-driver','uvm-monitor','uvm-scoreboard','uvm-factory-override']
  },
  {
    id: 'rtl-digital',
    name: 'RTL / Digital Design',
    description: 'Core synthesizable RTL and digital-design interview fundamentals.',
    problemIds: ['rtl-mux','rtl-counter','rtl-priority','rtl-fifo','rtl-shift-register','rtl-edge-detector','rtl-arbiter','rtl-regfile','rtl-lfsr','rtl-clock-divider']
  }
]

export default tracks
