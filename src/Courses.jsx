import React from 'react'
import {ArrowRight,BookOpen,Layers3} from 'lucide-react'

const COURSES=[
 {id:'rtl',title:'Verilog / RTL Fundamentals',level:'Beginner',prerequisite:'Basic Boolean logic and synchronous digital design',summary:'Learn how to turn specifications into clean synthesizable combinational and sequential RTL.',modules:[
  {title:'Combinational RTL',topics:'muxes, encoders, decoders, priority logic',problems:['rtl-mux','rtl-priority']},
  {title:'Sequential RTL',topics:'registers, counters, clocked state',problems:['rtl-counter','rtl-shift-register','rtl-edge-detector']},
  {title:'Stateful blocks',topics:'FIFOs, arbiters and register files',problems:['rtl-fifo','rtl-arbiter','rtl-regfile']}
 ],projects:['Three-Stage Pipelined RISC-V Core','CDC-Safe Asynchronous FIFO']},
 {id:'systemverilog',title:'SystemVerilog for Design',level:'Intermediate',prerequisite:'Comfortable writing synthesizable Verilog',summary:'Build fluency with the SystemVerilog constructs used in modern RTL and verification codebases.',modules:[
  {title:'Design constructs',topics:'always_comb, always_ff, enums and strong typing',problems:['sv-always','sv-enum-fsm']},
  {title:'Data structures',topics:'packed arrays and expressive types',problems:['sv-packed-arrays','sv-unique-case']},
  {title:'Interfaces and reusable structure',topics:'interfaces and virtual interfaces',problems:['sv-interface','sv-virtual-interface']}
 ],projects:['UVM Verification Environment for an AXI4-Lite Peripheral']},
 {id:'sva',title:'SystemVerilog Assertions',level:'Intermediate',prerequisite:'SystemVerilog event scheduling and clocked logic',summary:'Write temporal properties for handshakes, reset behaviour, bounded response and protocol invariants.',modules:[
  {title:'Implication and sequencing',topics:'overlapped/non-overlapped implication and delays',problems:['sva-handshake','sva-bounded-response']},
  {title:'Reset and stability',topics:'disable iff, stable-under-stall properties',problems:['sva-reset','sva-disable-iff','sva-stable-stall']},
  {title:'Protocol invariants',topics:'one-hot and throughout-style properties',problems:['sva-onehot-grant','sva-throughout']}
 ],projects:['RISC-V Core Verification','APB Peripheral Verification Suite']},
 {id:'uvm',title:'UVM Fundamentals',level:'Intermediate',prerequisite:'SystemVerilog classes, interfaces and basic testbench concepts',summary:'Learn the reusable verification architecture used for constrained-random block and subsystem verification.',modules:[
  {title:'Transactions and stimulus',topics:'sequence items, sequences and drivers',problems:['uvm-sequence-item','uvm-driver']},
  {title:'Observation and checking',topics:'monitors and scoreboards',problems:['uvm-monitor','uvm-scoreboard']},
  {title:'Configuration and reuse',topics:'config_db, factory overrides and objections',problems:['uvm-config-db','uvm-factory-override','uvm-objections']}
 ],projects:['UVM Verification Environment for an AXI4-Lite Peripheral','RISC-V Core Verification']},
 {id:'architecture',title:'Computer Architecture',level:'Intermediate',prerequisite:'Digital design fundamentals',summary:'Connect RTL implementation decisions to pipelines, caches, prediction, memory translation and out-of-order concepts.',modules:[
  {title:'Pipeline hazards',topics:'RAW hazards, forwarding and stalls',problems:['arch-hazard','arch-load-use']},
  {title:'Memory hierarchy',topics:'caches, AMAT and TLBs',problems:['arch-cache','arch-amat','arch-tlb']},
  {title:'Advanced execution',topics:'branch prediction and reorder buffers',problems:['arch-branch-predictor','arch-rob']}
 ],projects:['Three-Stage Pipelined RISC-V Core','Parameterized Cache or Memory Controller']},
 {id:'fpga',title:'FPGA Design and Implementation',level:'Intermediate',prerequisite:'Synthesizable RTL and basic timing concepts',summary:'Move from simulation-only RTL to FPGA-oriented design choices, timing, memory inference and board-ready interfaces.',modules:[
  {title:'Robust input logic',topics:'debouncing, synchronizers and reset strategy',problems:['fpga-debounce','fpga-cdc-sync','fpga-reset-strategy']},
  {title:'Implementation-aware RTL',topics:'FSM structure, BRAM inference and clocking',problems:['fpga-fsm','fpga-bram-inference','rtl-clock-divider']},
  {title:'Timing closure basics',topics:'constraints, critical paths and implementation trade-offs',problems:['fpga-timing-constraints']}
 ],projects:['FPGA Packet Parser and Statistics Engine','UART/SPI/I2C Multi-Protocol Controller','Hardware DSP Pipeline']},
 {id:'soc',title:'SoC, AXI, APB and Protocols',level:'Intermediate',prerequisite:'RTL FSMs and ready/valid-style handshakes',summary:'Practice the bus and serial protocol reasoning used when integrating IP into an SoC.',modules:[
  {title:'Ready/valid protocols',topics:'backpressure, transfer acceptance and ordering',problems:['proto-axi-ready-valid','proto-axi-lite-ordering']},
  {title:'Peripheral buses',topics:'APB transfer phases and bridge control',problems:['proto-apb-transfer']},
  {title:'Serial protocols',topics:'UART, SPI and I2C behaviour',problems:['proto-uart','proto-spi','proto-i2c-arbitration']}
 ],projects:['Small RISC-V SoC','AXI-Lite to APB Bridge','DMA Engine with Register Interface']},
 {id:'cdc',title:'CDC and Timing',level:'Advanced',prerequisite:'Clocked RTL, setup/hold timing and reset fundamentals',summary:'Learn practical clock-domain-crossing patterns and the timing discipline needed for reliable high-speed hardware.',modules:[
  {title:'Single-bit CDC',topics:'synchronizer chains, metastability containment and assumptions',problems:['fpga-cdc-sync']},
  {title:'Multi-bit CDC',topics:'Gray-code pointers and asynchronous FIFO structure',problems:['rtl-fifo']},
  {title:'Constraints and reset',topics:'timing constraints and safe reset release',problems:['fpga-timing-constraints','fpga-reset-strategy']}
 ],projects:['CDC-Safe Asynchronous FIFO','FPGA Packet Parser and Statistics Engine']},
 {id:'hft',title:'Low-Latency FPGA / HFT',level:'Advanced',prerequisite:'Strong RTL, pipelining, FPGA timing and streaming interfaces',summary:'Develop deterministic streaming datapaths, latency budgeting and throughput-oriented hardware design skills.',modules:[
  {title:'Pipeline for throughput',topics:'one-item-per-cycle design and backpressure',problems:['proto-axi-ready-valid','rtl-shift-register']},
  {title:'Priority and state updates',topics:'priority logic, bounded state access and arbitration',problems:['rtl-priority','rtl-arbiter']},
  {title:'Latency discipline',topics:'clock division, timing constraints and critical-path thinking',problems:['rtl-clock-divider','fpga-timing-constraints']}
 ],projects:['Low-Latency Market Data Parser','Order Book Update Datapath','Timestamped Feed-to-Action Pipeline']}
]

export default function Courses({problems,onOpen,go}){
 const byId=new Map(problems.map(problem=>[problem.id,problem]))
 return <div className="courses-page">
  <div className="page-head"><div className="eyebrow">SKILL PATHS</div><h1>Courses</h1><p>Learn a hardware skill in order, then reinforce it with HDLForge problems and portfolio projects. Tracks tell you what a role needs; Courses teach the underlying skills.</p></div>
  <div className="course-grid">{COURSES.map(course=><section className="course-card" key={course.id}>
   <div className="course-top"><span className="course-icon"><BookOpen size={20}/></span><div><span className="course-level">{course.level}</span><h2>{course.title}</h2></div></div>
   <p className="course-summary">{course.summary}</p>
   <p className="course-prerequisite"><strong>Prerequisite:</strong> {course.prerequisite}</p>
   <div className="course-modules">{course.modules.map((module,index)=><div className="course-module" key={module.title}><div className="course-module-head"><span>{String(index+1).padStart(2,'0')}</span><div><strong>{module.title}</strong><small>{module.topics}</small></div></div><div className="course-links">{module.problems.map(id=>{const problem=byId.get(id);return problem?<button key={id} onClick={()=>onOpen(problem)}>{problem.title}<ArrowRight size={13}/></button>:null})}</div></div>)}</div>
   <div className="course-projects"><div className="course-project-title"><Layers3 size={16}/><strong>Build next</strong></div><p>{course.projects.join(' · ')}</p><button className="secondary" onClick={()=>go('projects')}>Open Projects</button></div>
  </section>)}</div>
 </div>
}

export {COURSES}
