import React,{useMemo,useState}from'react'
import{ArrowLeft,BookOpen,Check,CheckCircle2,ChevronRight,Circle,Cpu,Lightbulb,LockKeyhole,Play,RotateCcw}from'lucide-react'
import MonacoHDLEditor from'./MonacoHDLEditor'

const STORAGE_KEY='hdlforge-rv32i-lab-v1'
const loadLab=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return{}}}

const steps=[
 {id:'pc',short:'PC',title:'Build the program counter',time:'10 min',concept:'Every instruction begins at an address. Your first block stores that address and advances it on each clock.',task:'Complete rv32_pc so reset returns to address 0 and each rising edge loads pc_next.',learn:['Sequential state changes only on a clock edge.','Reset gives the processor a known starting point.','RV32I instructions are 4 bytes, but the next-address choice belongs outside this register.'],ports:'clk, reset, pc_next[31:0] → pc[31:0]',starter:`module rv32_pc(
  input  logic        clk,
  input  logic        reset,
  input  logic [31:0] pc_next,
  output logic [31:0] pc
);
  // TODO: update pc on the rising clock edge
endmodule`,solution:`module rv32_pc(
  input  logic clk, reset,
  input  logic [31:0] pc_next,
  output logic [31:0] pc
);
  always_ff @(posedge clk) begin
    if (reset) pc <= 32'b0;
    else       pc <= pc_next;
  end
endmodule`,checks:[['Clocked state',/always_ff\s*@\s*\(\s*posedge\s+clk\s*\)/i],['Reset to address zero',/if\s*\(\s*reset\s*\)[\s\S]{0,50}pc\s*<=\s*(32'b0|'0|0)/i],['Load the selected next PC',/else[\s\S]{0,35}pc\s*<=\s*pc_next/i]]},
 {id:'decode',short:'Decode',title:'Decode an instruction',time:'12 min',concept:'RISC-V keeps register fields in fixed positions. Split a 32-bit instruction into the fields the rest of the datapath needs.',task:'Drive opcode, rd, funct3, rs1, rs2 and funct7 from their RV32I bit positions.',learn:['The opcode is always instr[6:0].','rd, rs1 and rs2 each select one of 32 registers.','funct3 and funct7 refine the operation.'],ports:'instr[31:0] → opcode, rd, funct3, rs1, rs2, funct7',starter:`module rv32_decode(
  input  logic [31:0] instr,
  output logic [6:0]  opcode, funct7,
  output logic [4:0]  rd, rs1, rs2,
  output logic [2:0]  funct3
);
  // TODO: slice each field from instr
endmodule`,solution:`module rv32_decode(
  input logic [31:0] instr,
  output logic [6:0] opcode, funct7,
  output logic [4:0] rd, rs1, rs2,
  output logic [2:0] funct3
);
  assign opcode = instr[6:0];
  assign rd     = instr[11:7];
  assign funct3 = instr[14:12];
  assign rs1    = instr[19:15];
  assign rs2    = instr[24:20];
  assign funct7 = instr[31:25];
endmodule`,checks:[['Opcode field',/opcode\s*=\s*instr\s*\[\s*6\s*:\s*0\s*\]/i],['Destination and source fields',/rd\s*=\s*instr\s*\[\s*11\s*:\s*7\s*\][\s\S]*rs1\s*=\s*instr\s*\[\s*19\s*:\s*15\s*\][\s\S]*rs2\s*=\s*instr\s*\[\s*24\s*:\s*20\s*\]/i],['Function fields',/funct3\s*=\s*instr\s*\[\s*14\s*:\s*12\s*\][\s\S]*funct7\s*=\s*instr\s*\[\s*31\s*:\s*25\s*\]/i]]},
 {id:'registers',short:'Registers',title:'Create the register file',time:'18 min',concept:'The core reads two operands and writes one result each cycle. Register x0 is special: it must always read as zero.',task:'Implement 32 × 32-bit registers with two combinational reads and one clocked write. Protect x0.',learn:['Two read ports feed the ALU in parallel.','Writes happen on a clock edge.','Ignoring writes to address 0 preserves the RISC-V x0 rule.'],ports:'rs1, rs2, rd, rd_data, rd_write → rs1_data, rs2_data',starter:`module rv32_regs(
  input logic clk, rd_write,
  input logic [4:0] rs1, rs2, rd,
  input logic [31:0] rd_data,
  output logic [31:0] rs1_data, rs2_data
);
  logic [31:0] regs [0:31];
  // TODO: two reads, one protected write
endmodule`,solution:`module rv32_regs(
  input logic clk, rd_write,
  input logic [4:0] rs1, rs2, rd,
  input logic [31:0] rd_data,
  output logic [31:0] rs1_data, rs2_data
);
  logic [31:0] regs [0:31];
  assign rs1_data = (rs1 == 0) ? 32'b0 : regs[rs1];
  assign rs2_data = (rs2 == 0) ? 32'b0 : regs[rs2];
  always_ff @(posedge clk)
    if (rd_write && rd != 0) regs[rd] <= rd_data;
endmodule`,checks:[['32 × 32-bit storage',/logic\s*\[\s*31\s*:\s*0\s*\]\s+regs\s*\[\s*0\s*:\s*31\s*\]/i],['Two asynchronous reads',/rs1_data\s*=\s*\(\s*rs1\s*==\s*(?:5'?d?)?0\s*\)[\s\S]*rs2_data\s*=\s*\(\s*rs2\s*==\s*(?:5'?d?)?0\s*\)/i],['Clocked write protects x0',/always_ff\s*@\s*\(\s*posedge\s+clk\s*\)[\s\S]*rd_write\s*&&\s*rd\s*!=\s*(?:5'?d?)?0[\s\S]*regs\s*\[\s*rd\s*\]\s*<=\s*rd_data/i]]},
 {id:'immediate',short:'Immediate',title:'Generate immediates',time:'20 min',concept:'Constants and offsets are packed differently by instruction type. Reassemble them and sign-extend to 32 bits.',task:'Generate I, S, B, U and J immediates from opcode. At minimum, implement the I and S forms to pass this stage.',learn:['Sign extension repeats instr[31].','Store immediates are split around the register fields.','Branch and jump offsets always have bit 0 equal to zero.'],ports:'instr, opcode → imm[31:0]',starter:`module rv32_imm(
  input  logic [31:0] instr,
  input  logic [6:0]  opcode,
  output logic [31:0] imm
);
  always_comb begin
    imm = 32'b0;
    case (opcode)
      7'b0010011, 7'b0000011: ; // TODO: I-type
      7'b0100011: ;             // TODO: S-type
      default: imm = 32'b0;
    endcase
  end
endmodule`,solution:`module rv32_imm(input logic [31:0] instr, input logic [6:0] opcode, output logic [31:0] imm);
  always_comb begin
    case (opcode)
      7'b0010011, 7'b0000011, 7'b1100111: imm = {{20{instr[31]}}, instr[31:20]};
      7'b0100011: imm = {{20{instr[31]}}, instr[31:25], instr[11:7]};
      7'b1100011: imm = {{19{instr[31]}}, instr[31], instr[7], instr[30:25], instr[11:8], 1'b0};
      7'b0110111, 7'b0010111: imm = {instr[31:12], 12'b0};
      7'b1101111: imm = {{11{instr[31]}}, instr[31], instr[19:12], instr[20], instr[30:21], 1'b0};
      default: imm = 32'b0;
    endcase
  end
endmodule`,checks:[['Combinational selection',/always_comb[\s\S]*case\s*\(\s*opcode\s*\)/i],['I-type sign extension',/\{\{\s*20\s*\{\s*instr\s*\[\s*31\s*\]\s*\}\s*\}\s*,\s*instr\s*\[\s*31\s*:\s*20\s*\]\s*\}/i],['S-type reassembly',/instr\s*\[\s*31\s*:\s*25\s*\][\s\S]{0,40}instr\s*\[\s*11\s*:\s*7\s*\]/i]]},
 {id:'alu',short:'ALU',title:'Implement the ALU',time:'25 min',concept:'The arithmetic logic unit is the core’s calculator. A compact control code selects one operation on two 32-bit operands.',task:'Implement ADD, SUB, AND, OR, XOR, SLT, SLL, SRL and SRA in a combinational case statement.',learn:['Signed comparison needs $signed.','SRA preserves the sign; SRL inserts zeros.','Only the low 5 bits of b are used as the shift amount.'],ports:'a, b, alu_op → result',starter:`module rv32_alu(
  input logic [31:0] a, b,
  input logic [3:0] alu_op,
  output logic [31:0] result
);
  always_comb begin
    result = 32'b0;
    case (alu_op)
      4'd0: result = a + b; // ADD
      // TODO: operations 1 through 8
      default: result = 32'b0;
    endcase
  end
endmodule`,solution:`module rv32_alu(input logic [31:0] a, b, input logic [3:0] alu_op, output logic [31:0] result);
  always_comb case (alu_op)
    4'd0: result = a + b;
    4'd1: result = a - b;
    4'd2: result = a & b;
    4'd3: result = a | b;
    4'd4: result = a ^ b;
    4'd5: result = $signed(a) < $signed(b);
    4'd6: result = a << b[4:0];
    4'd7: result = a >> b[4:0];
    4'd8: result = $signed(a) >>> b[4:0];
    default: result = 32'b0;
  endcase
endmodule`,checks:[['Combinational ALU select',/always_comb[\s\S]*case\s*\(\s*alu_op\s*\)/i],['Arithmetic and logic',/result\s*=\s*a\s*\+\s*b[\s\S]*result\s*=\s*a\s*-\s*b[\s\S]*result\s*=\s*a\s*&\s*b[\s\S]*result\s*=\s*a\s*\|\s*b[\s\S]*result\s*=\s*a\s*\^\s*b/i],['Signed compare and shifts',/\$signed\s*\(\s*a\s*\)\s*<\s*\$signed\s*\(\s*b\s*\)[\s\S]*<<[\s\S]*>>[\s\S]*>>>/i]]},
 {id:'branch',short:'Control',title:'Add branches and jumps',time:'20 min',concept:'Control-flow instructions choose between pc + 4 and a target address. Comparisons decide whether a conditional branch is taken.',task:'Calculate pc_target = pc + imm and implement BEQ and BNE decisions using funct3.',learn:['The immediate generator already supplies an aligned offset.','Branch comparison uses the two register values.','JAL and JALR write pc + 4 back to rd.'],ports:'pc, imm, rs1_data, rs2_data, funct3, is_branch → branch_taken, pc_target',starter:`module rv32_branch(
  input logic [31:0] pc, imm, rs1_data, rs2_data,
  input logic [2:0] funct3,
  input logic is_branch,
  output logic branch_taken,
  output logic [31:0] pc_target
);
  // TODO: target, BEQ and BNE
endmodule`,solution:`module rv32_branch(
  input logic [31:0] pc, imm, rs1_data, rs2_data,
  input logic [2:0] funct3, input logic is_branch,
  output logic branch_taken, output logic [31:0] pc_target
);
  assign pc_target = pc + imm;
  always_comb begin
    branch_taken = 1'b0;
    if (is_branch) case (funct3)
      3'b000: branch_taken = (rs1_data == rs2_data);
      3'b001: branch_taken = (rs1_data != rs2_data);
      default: branch_taken = 1'b0;
    endcase
  end
endmodule`,checks:[['PC-relative target',/pc_target\s*=\s*pc\s*\+\s*imm/i],['Safe default',/branch_taken\s*=\s*1'b0/i],['BEQ and BNE comparisons',/rs1_data\s*==\s*rs2_data[\s\S]*rs1_data\s*!=\s*rs2_data/i]]},
 {id:'memory',short:'Memory',title:'Control loads and stores',time:'18 min',concept:'Loads read data memory; stores write it. The opcode tells the core which path is active and whether a register receives a result.',task:'Decode LOAD and STORE opcodes into mem_read, mem_write and rd_write. Default every control low to avoid accidental writes.',learn:['LOAD is opcode 0000011.','STORE is opcode 0100011.','Only loads write the returned memory value to rd.'],ports:'opcode → mem_read, mem_write, rd_write',starter:`module rv32_mem_control(
  input logic [6:0] opcode,
  output logic mem_read, mem_write, rd_write
);
  always_comb begin
    // TODO: safe defaults and LOAD/STORE decode
  end
endmodule`,solution:`module rv32_mem_control(input logic [6:0] opcode, output logic mem_read, mem_write, rd_write);
  always_comb begin
    mem_read = 1'b0;
    mem_write = 1'b0;
    rd_write = 1'b0;
    case (opcode)
      7'b0000011: begin mem_read = 1'b1; rd_write = 1'b1; end
      7'b0100011: mem_write = 1'b1;
      7'b0110011, 7'b0010011: rd_write = 1'b1;
      default: ;
    endcase
  end
endmodule`,checks:[['Safe control defaults',/mem_read\s*=\s*1'b0[\s\S]*mem_write\s*=\s*1'b0[\s\S]*rd_write\s*=\s*1'b0/i],['LOAD enables read and writeback',/7'b0000011[\s\S]{0,100}mem_read\s*=\s*1'b1[\s\S]{0,80}rd_write\s*=\s*1'b1/i],['STORE enables memory write',/7'b0100011[\s\S]{0,60}mem_write\s*=\s*1'b1/i]]},
 {id:'core',short:'Integrate',title:'Wire the single-cycle core',time:'30 min',concept:'Now connect the datapath. The PC fetches an instruction, decode selects operands, the ALU produces a result, and control chooses the next PC and writeback value.',task:'Complete the top-level next-PC and writeback multiplexers, then instantiate at least the PC, decoder, register file and ALU blocks.',learn:['The default next address is pc + 4.','A taken branch replaces the sequential next address.','A load writes memory data; ALU instructions write alu_result.'],ports:'instruction/data memory interfaces around one RV32I core',starter:`module rv32_core(
  input logic clk, reset,
  output logic [31:0] imem_addr,
  input logic [31:0] imem_rdata,
  output logic [31:0] dmem_addr, dmem_wdata,
  output logic dmem_read, dmem_write,
  input logic [31:0] dmem_rdata
);
  logic [31:0] pc, pc_next, branch_target;
  logic branch_taken, mem_to_reg;
  logic [31:0] alu_result, rd_data;
  // TODO: instantiate your blocks
  // TODO: assign next PC, memory address and writeback
endmodule`,solution:`module rv32_core(
  input logic clk, reset,
  output logic [31:0] imem_addr, input logic [31:0] imem_rdata,
  output logic [31:0] dmem_addr, dmem_wdata,
  output logic dmem_read, dmem_write, input logic [31:0] dmem_rdata
);
  logic [31:0] pc, pc_next, branch_target, rs1_data, rs2_data, imm, alu_result, rd_data;
  logic [6:0] opcode, funct7; logic [4:0] rd, rs1, rs2; logic [2:0] funct3;
  logic [3:0] alu_op; logic rd_write, branch_taken, mem_to_reg;
  rv32_pc u_pc(.clk, .reset, .pc_next, .pc);
  rv32_decode u_decode(.instr(imem_rdata), .opcode, .funct7, .rd, .rs1, .rs2, .funct3);
  rv32_regs u_regs(.clk, .rd_write, .rs1, .rs2, .rd, .rd_data, .rs1_data, .rs2_data);
  rv32_alu u_alu(.a(rs1_data), .b(imm), .alu_op, .result(alu_result));
  assign imem_addr = pc;
  assign pc_next = branch_taken ? branch_target : pc + 32'd4;
  assign dmem_addr = alu_result;
  assign dmem_wdata = rs2_data;
  assign rd_data = mem_to_reg ? dmem_rdata : alu_result;
endmodule`,checks:[['Four datapath blocks',/rv32_pc\s+\w+[\s\S]*rv32_decode\s+\w+[\s\S]*rv32_regs\s+\w+[\s\S]*rv32_alu\s+\w+/i],['Sequential or redirected PC',/pc_next\s*=\s*branch_taken\s*\?\s*branch_target\s*:\s*pc\s*\+\s*(?:32'd)?4/i],['Memory path',/dmem_addr\s*=\s*alu_result[\s\S]*dmem_wdata\s*=\s*rs2_data/i],['Writeback selection',/rd_data\s*=\s*mem_to_reg\s*\?\s*dmem_rdata\s*:\s*alu_result/i]]}
]

function checkStep(step,code){return step.checks.map(([label,pattern])=>({label,pass:pattern.test(code.replace(/\/\/.*$/gm,''))}))}

export default function RiscvCoreLab({onExit}){
 const initial=useMemo(loadLab,[])
 const [active,setActive]=useState(Math.min(initial.active||0,steps.length-1))
 const [drafts,setDrafts]=useState(initial.drafts||{})
 const [complete,setComplete]=useState(initial.complete||[])
 const [results,setResults]=useState(null)
 const [hint,setHint]=useState(false)
 const [solution,setSolution]=useState(false)
 const step=steps[active],code=drafts[step.id]??step.starter,done=complete.includes(step.id)
 const save=(nextDrafts,nextComplete=complete,nextActive=active)=>localStorage.setItem(STORAGE_KEY,JSON.stringify({drafts:nextDrafts,complete:nextComplete,active:nextActive}))
 const updateCode=value=>{const next={...drafts,[step.id]:value};setDrafts(next);setResults(null);save(next)}
 const run=()=>{const nextResults=checkStep(step,code);setResults(nextResults);if(nextResults.every(r=>r.pass)&&!done){const next=[...complete,step.id];setComplete(next);save(drafts,next)}}
 const choose=index=>{if(index<=complete.length){setActive(index);setResults(null);setHint(false);setSolution(false);save(drafts,complete,index)}}
 const next=()=>choose(Math.min(active+1,steps.length-1))
 const resetStep=()=>{const nextDrafts={...drafts,[step.id]:step.starter};setDrafts(nextDrafts);setResults(null);setSolution(false);save(nextDrafts)}
 const pct=Math.round(complete.length/steps.length*100)
 return <div className="riscv-lab" data-testid="riscv-lab">
  <div className="lab-topbar"><button className="lab-back" onClick={onExit}><ArrowLeft size={16}/> Projects</button><div className="lab-title"><Cpu size={18}/><strong>Build a 32-bit RISC-V CPU</strong><span>RV32I · Single cycle</span></div><div className="lab-progress"><span>{complete.length}/{steps.length} complete</span><div><i style={{width:`${pct}%`}}/></div></div></div>
  <div className="lab-shell">
   <aside className="lab-steps"><div className="lab-steps-head"><span>BUILD PATH</span><strong>{pct}% complete</strong></div>{steps.map((item,index)=>{const unlocked=index<=complete.length,isDone=complete.includes(item.id);return <button key={item.id} className={`${index===active?'active ':''}${isDone?'done ':''}`} disabled={!unlocked} onClick={()=>choose(index)}><span className="step-state">{isDone?<Check size={14}/>:unlocked?<span>{index+1}</span>:<LockKeyhole size={13}/>}</span><span><small>STEP {index+1}</small><strong>{item.short}</strong></span></button>})}<div className="lab-architecture"><span>YOU ARE BUILDING</span><div className="cpu-flow"><b>PC</b><i>→</i><b>Decode</b><i>→</i><b>Execute</b><i>→</i><b>Memory</b></div></div></aside>
   <section className="lab-work"><div className="lesson-pane"><div className="lesson-scroll"><div className="lesson-meta"><span>STEP {active+1} OF {steps.length}</span><span>{step.time}</span></div><h1>{step.title}</h1><p className="lesson-concept">{step.concept}</p><div className="task-card"><div><Play size={15}/><strong>Your task</strong></div><p>{step.task}</p><code>{step.ports}</code></div><h3><BookOpen size={15}/> What you’ll learn</h3><ul className="learn-list">{step.learn.map(item=><li key={item}>{item}</li>)}</ul><button className="hint-button" onClick={()=>setHint(v=>!v)}><Lightbulb size={15}/>{hint?'Hide hint':'Need a hint?'}</button>{hint&&<p className="hint-copy">Start with the safest default behaviour, then add one instruction or signal at a time. The checks below name each requirement independently.</p>}<button className="solution-button" onClick={()=>setSolution(v=>!v)}>{solution?'Hide reference solution':'View reference solution'}</button>{solution&&<pre className="reference-code">{step.solution}</pre>}</div></div>
    <div className="code-pane"><div className="code-heading"><div><span>SYSTEMVERILOG</span><strong>{step.id}.sv</strong></div><button onClick={resetStep} title="Reset this step"><RotateCcw size={14}/> Reset</button></div><div className="lab-editor"><MonacoHDLEditor code={code} language="SystemVerilog" onChange={updateCode} onRun={run}/></div><div className="checks-panel"><div className="checks-head"><div><strong>Stage checks</strong><span>{results?`${results.filter(r=>r.pass).length}/${results.length} passing`:'Ready to check'}</span></div><button className="run-checks" onClick={run}><Play size={15}/> Check code</button></div>{results&&<div className="check-list">{results.map(r=><div className={r.pass?'pass':'fail'} key={r.label}>{r.pass?<CheckCircle2 size={16}/>:<Circle size={16}/>}<span>{r.label}</span></div>)}</div>}{done&&<div className="stage-success"><CheckCircle2 size={18}/><div><strong>Stage complete</strong><span>{active===steps.length-1?'You built the RV32I datapath!':'Your next stage is unlocked.'}</span></div>{active<steps.length-1&&<button onClick={next}>Next step <ChevronRight size={15}/></button>}</div>}</div></div>
   </section>
  </div>
 </div>
}
