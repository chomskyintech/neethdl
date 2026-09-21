import rawProjectProblems from './guidedProjectProblems.js'
import expansionGuidedProblems from './guidedProjectExpansionProblems.js'
import expansionGuidedProblems2 from './guidedProjectExpansionProblems2.js'
import guidedProjectSocProblems from './guidedProjectSocProblems.js'
import guidedProjectFormalProblems from './guidedProjectFormalProblems.js'
import guidedProjectMarketProblems from './guidedProjectMarketProblems.js'
import guidedProjectSimdProblems from './guidedProjectSimdProblems.js'
import guidedProjectDmaProblems from './guidedProjectDmaProblems.js'
import guidedProjectCrossbarProblems from './guidedProjectCrossbarProblems.js'
import guidedProjectPeripheralSubsystemProblems from './guidedProjectPeripheralSubsystemProblems.js'
import guidedProjectFirmwareProblems from './guidedProjectFirmwareProblems.js'
import guidedProjectFormalCacheProblems from './guidedProjectFormalCacheProblems.js'
import guidedProjectCrossbarVerificationProblems from './guidedProjectCrossbarVerificationProblems.js'
import guidedProjectSpiProblems from './guidedProjectSpiProblems.js'
import guidedProjectI2cSlaveProblems from './guidedProjectI2cSlaveProblems.js'
import {riscvProject,riscvProjectProblems} from './riscvProject.js'

export const uartProject={
  id:'uart-controller',
  slug:'uart-controller',
  title:'UART Controller',
  level:'Easy to Medium',
  roadmap:'embedded-hardware',
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
  roadmap:'noc-interconnect',
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

export const cacheMemoryProject={
  id:'cache-memory-controller',
  slug:'cache-memory-controller',
  title:'Cache / Memory Controller',
  level:'Hard',
  roadmap:'rtl-digital',
  categories:['all','rtl','soc'],
  skills:['Caches','Memory systems','FSMs','Writeback','Refill control'],
  why:'Build a direct-mapped cache from address decode and tag/data storage through dirty writeback, refill sequencing and controller integration.',
  problemIds:['cache-address-decode','cache-hit-logic','cache-line-store','cache-miss-fsm','cache-refill-counter','cache-controller-top'],
}

export const riscvVerificationProject={
  id:'risc-v-core-verification',
  slug:'risc-v-core-verification',
  title:'RISC-V Core Verification',
  level:'Hard',
  roadmap:'verification',
  categories:['all','dv'],
  skills:['RISC-V','UVM','Constrained random','Scoreboards','Coverage'],
  why:'Verify architectural retirement with constrained-random instructions, a reference model, scoreboarding, assertions and functional coverage.',
  problemIds:['rvv-instruction-item','rvv-random-sequence','rvv-reference-model','rvv-retire-scoreboard','rvv-core-assertions','rvv-functional-coverage'],
}

export const packetParserProject={
  id:'fpga-packet-parser',
  slug:'fpga-packet-parser',
  title:'FPGA Packet Parser',
  level:'Intermediate to Hard',
  roadmap:'hft-fpga',
  categories:['all','fpga','hft'],
  skills:['Streaming RTL','Ethernet','IPv4/UDP','Pipelining','Packet processing'],
  why:'Build a fixed-latency Ethernet/IPv4/UDP parser with field extraction and line-rate statistics without full-frame buffering.',
  problemIds:['pkt-byte-position','pkt-ethertype','pkt-ip-protocol','pkt-udp-ports','pkt-statistics','pkt-parser-top'],
}

export const branchPredictorProject={
  id:'branch-predictor',
  slug:'branch-predictor',
  title:'Branch Predictor',
  level:'Intermediate to Hard',
  roadmap:'cpu-gpu',
  categories:['all','rtl','soc'],
  skills:['Branch prediction','BHT','BTB','Speculation','Microarchitecture'],
  why:'Build the prediction structures behind speculative fetch: saturating counters, a PC-indexed BHT, BTB lookup, next-PC selection and recovery.',
  problemIds:['bp-two-bit-counter','bp-bht','bp-btb','bp-next-pc','bp-mispredict','bp-top'],
}

export const convolutionProject={
  id:'convolution-accelerator',
  slug:'convolution-accelerator',
  title:'Convolution Accelerator',
  level:'Hard',
  roadmap:'accelerators',
  categories:['all','fpga'],
  skills:['Convolution','Line buffers','MAC arrays','Streaming','Quantization'],
  why:'Build a streaming 3x3 convolution datapath with row buffering, sliding windows, parallel MAC arithmetic, valid alignment and saturated output.',
  problemIds:['conv-line-buffer','conv-window3','conv-mac9','conv-valid-pipe','conv-clamp8','conv-accelerator-top'],
}

export const smallRiscvSocProject={
  id:'small-risc-v-soc',
  slug:'small-risc-v-soc',
  title:'Small RISC-V SoC',
  level:'Hard',
  roadmap:'soc-integration',
  categories:['all','rtl','soc'],
  skills:['SoC integration','RISC-V','Memory maps','Peripherals','Interrupts'],
  why:'Integrate processor-facing ROM, RAM, GPIO, timer, interrupts and memory-mapped response routing into a compact programmable SoC.',
  problemIds:['soc-address-decoder','soc-boot-rom','soc-data-ram','soc-gpio','soc-timer','soc-interrupt-controller','soc-top-integration'],
}

export const formalVerificationProject={
  id:'formal-verification-rtl',
  slug:'formal-verification-rtl',
  title:'Formal Verification of RTL Interfaces',
  level:'Intermediate to Hard',
  roadmap:'formal-verification',
  categories:['all','dv'],
  skills:['Formal verification','SVA','Safety','Liveness','Cover properties'],
  why:'Move beyond simulation by proving FIFO, arbiter and ready/valid properties with assumptions, assertions, bounded progress and reachability goals.',
  problemIds:['formal-reset-assumption','formal-fifo-bounds','formal-fifo-order','formal-arbiter-onehot','formal-arbiter-liveness','formal-ready-valid','formal-cover-progress'],
}

export const marketDataProject={
  id:'low-latency-market-data-parser',
  slug:'low-latency-market-data-parser',
  title:'Low-Latency Market Data Parser',
  level:'Hard',
  roadmap:'hft-fpga',
  categories:['all','fpga','hft'],
  skills:['Low-latency RTL','Streaming','Market data','Field extraction','Latency measurement'],
  why:'Build a fixed-format line-rate parser that normalizes market-data messages while tracking deterministic cycle latency.',
  problemIds:['md-word-counter','md-header-decode','md-symbol-filter','md-price-quantity','md-message-classifier','md-latency-meter','md-parser-top'],
}

export const simdVectorProject={
  id:'simd-vector-unit',
  slug:'simd-vector-unit',
  title:'SIMD / Vector Execution Unit',
  level:'Hard',
  roadmap:'cpu-gpu',
  categories:['all','rtl','fpga'],
  skills:['SIMD','Vector ALU','Masks','Reductions','Register files'],
  why:'Build a four-lane vector execution block with arithmetic lanes, masking, reductions, architectural vector registers and pipelined output.',
  problemIds:['simd-lane-alu','simd-four-lanes','simd-mask','simd-reduction','simd-register-file','simd-pipeline-register','simd-top'],
}

export const dmaProject={
  id:'dma-engine',
  slug:'dma-engine',
  title:'DMA Engine',
  level:'Hard',
  roadmap:'accelerators',
  categories:['all','rtl','soc','fpga'],
  skills:['DMA','Ready/valid','Address generation','FSMs','Interrupts'],
  why:'Build the data-movement engine accelerators need: programmable registers, source/destination sequencing, backpressure, transfer counting and completion interrupts.',
  problemIds:['dma-control-registers','dma-address-generator','dma-read-engine','dma-write-engine','dma-transfer-counter','dma-controller','dma-top'],
}

export const axiCrossbarProject={
  id:'axi4-interconnect-crossbar',
  slug:'axi4-interconnect-crossbar',
  title:'AXI4 Interconnect / Crossbar',
  level:'Hard',
  roadmap:'noc-interconnect',
  categories:['all','rtl','soc'],
  skills:['AXI4-Lite','Crossbar','Arbitration','Routing','Backpressure'],
  why:'Build a two-master, three-slave interconnect with address decoding, fair arbitration, ownership locking, response routing and DECERR handling.',
  problemIds:['xbar-address-decode','xbar-round-robin','xbar-request-route','xbar-write-lock','xbar-response-route','xbar-decode-error','xbar-top'],
}

export const peripheralSubsystemProject={
  id:'soc-peripheral-subsystem',
  slug:'soc-peripheral-subsystem',
  title:'SoC Peripheral Subsystem',
  level:'Intermediate to Hard',
  roadmap:'soc-integration',
  categories:['all','rtl','soc'],
  skills:['APB','SoC integration','Reset control','MMIO','Interrupts'],
  why:'Build a reusable APB peripheral subsystem with reset control, decoding, response muxing, GPIO, timer, UART registers and interrupt aggregation.',
  problemIds:['periph-reset-controller','periph-apb-decoder','periph-apb-mux','periph-gpio-block','periph-timer-block','periph-uart-registers','periph-subsystem-top'],
}

export const firmwareBringupProject={
  id:'riscv-firmware-bringup',
  slug:'riscv-firmware-bringup',
  title:'RISC-V Firmware + Hardware Bring-Up',
  level:'Intermediate',
  roadmap:'embedded-hardware',
  categories:['all','soc'],
  skills:['Bare-metal C','MMIO','GPIO','UART','Interrupts'],
  why:'Use C to bring up the memory-mapped hardware around a small RISC-V SoC: MMIO helpers, GPIO, UART, timer interrupts, command handling and a complete boot demo.',
  problemIds:['fw-mmio-access','fw-gpio-driver','fw-uart-driver','fw-timer-driver','fw-timer-isr','fw-command-shell','fw-bringup-main'],
}

export const formalCacheProject={
  id:'formal-cache-verification',
  slug:'formal-cache-verification',
  title:'Formal Verification of a Cache Controller',
  level:'Hard',
  roadmap:'formal-verification',
  categories:['all','dv','soc'],
  skills:['Formal verification','SVA','Caches','Safety','Liveness'],
  why:'Prove cache invariants around hits, dirty eviction, refill ordering and bounded progress, then add reachability cover goals.',
  problemIds:['fcache-env-assumptions','fcache-hit-correctness','fcache-no-false-hit','fcache-dirty-eviction','fcache-refill-order','fcache-progress','fcache-cover-scenarios'],
}

export const crossbarVerificationProject={
  id:'axi-crossbar-verification',
  slug:'axi-crossbar-verification',
  title:'AXI Interconnect Verification Environment',
  level:'Hard',
  roadmap:'verification',
  categories:['all','dv','soc'],
  skills:['UVM','AXI','Constrained random','Scoreboards','Coverage'],
  why:'Verify the AXI crossbar with randomized multi-master traffic, routing scoreboards, contention tests, protocol assertions and cross coverage.',
  problemIds:['xbarv-sequence-item','xbarv-random-sequence','xbarv-monitor','xbarv-scoreboard','xbarv-contention-sequence','xbarv-assertions','xbarv-coverage'],
}

export const spiControllerProject={
  id:'spi-controller',
  slug:'spi-controller',
  title:'SPI Controller',
  level:'Intermediate',
  roadmap:'hft-fpga',
  categories:['all','fpga','rtl','soc'],
  skills:['SPI','CPOL/CPHA','Serial protocols','Shift registers','Timing'],
  why:'Build a configurable SPI master from clock generation and edge timing through MOSI/MISO shifting, chip-select control and complete multi-mode transfers.',
  problemIds:['spi-clock-divider','spi-sclk-generator','spi-edge-classifier','spi-tx-shifter','spi-rx-shifter','spi-chip-select','spi-bit-counter','spi-master-top'],
}

export const i2cSlaveProject={
  id:'i2c-slave-peripheral',
  slug:'i2c-slave-peripheral',
  title:'I²C Peripheral / Slave',
  level:'Intermediate to Hard',
  roadmap:'soc-integration',
  categories:['all','rtl','soc','fpga'],
  skills:['I²C','Open-drain I/O','ACK/NACK','Register maps','Clock stretching'],
  why:'Build the slave side of I²C from START/STOP detection and address matching through ACKs, byte RX/TX, register addressing and open-drain control.',
  problemIds:['i2c-start-stop','i2c-address-match','i2c-rx-byte','i2c-ack-driver','i2c-tx-byte','i2c-register-pointer','i2c-clock-stretch','i2c-slave-top'],
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
  cacheMemoryProject,
  riscvVerificationProject,
  packetParserProject,
  branchPredictorProject,
  convolutionProject,
  smallRiscvSocProject,
  formalVerificationProject,
  marketDataProject,
  simdVectorProject,
  dmaProject,
  axiCrossbarProject,
  peripheralSubsystemProject,
  firmwareBringupProject,
  formalCacheProject,
  crossbarVerificationProject,
  spiControllerProject,
  i2cSlaveProject,
]

export const guidedProjectById=Object.fromEntries(guidedProjects.map(project=>[project.id,project]))
export const guidedProjectBySlug=Object.fromEntries(guidedProjects.map(project=>[project.slug,project]))

const allRawProjectProblems=[...rawProjectProblems,...expansionGuidedProblems,...expansionGuidedProblems2,...guidedProjectSocProblems,...guidedProjectFormalProblems,...guidedProjectMarketProblems,...guidedProjectSimdProblems,...guidedProjectDmaProblems,...guidedProjectCrossbarProblems,...guidedProjectPeripheralSubsystemProblems,...guidedProjectFirmwareProblems,...guidedProjectFormalCacheProblems,...guidedProjectCrossbarVerificationProblems,...guidedProjectSpiProblems,...guidedProjectI2cSlaveProblems]
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
