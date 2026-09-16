export const riscvProject={
 id:'rv32-core',
 slug:'riscv-core',
 title:'32-bit RISC-V CPU',
 problemIds:['rv32-pc','rv32-decode','rv32-register-file','rv32-immediate','rv32-alu','rv32-branch-control','rv32-memory-control','rv32-core-integration']
}

const project=(step)=>({id:riscvProject.id,title:riscvProject.title,step,total:riscvProject.problemIds.length})

export const riscvProjectProblems=[
 {
  id:'rv32-pc',title:'RISC-V Program Counter',category:'RTL Design',difficulty:'Easy',languages:['SystemVerilog'],evaluation:{type:'pattern'},project:project(1),tags:['RISC-V','CPU','program-counter'],
  description:'Build the 32-bit program-counter register used by the guided RISC-V CPU project.',
  task:'Complete rv32_pc so reset returns the PC to address 0 and every rising edge otherwise loads pc_next.',
  approach:'Treat the PC as a single piece of sequential state. Reset establishes address zero; otherwise the register simply captures the selected next address.',
  examples:['reset=1 at a rising edge → pc=0','reset=0, pc_next=0x00000004 → pc=0x00000004 after the edge'],
  constraints:['Use always_ff on the rising edge of clk.','Reset is active high.','Use non-blocking assignment for pc.'],
  starterCode:`module rv32_pc(
  input  logic        clk,
  input  logic        reset,
  input  logic [31:0] pc_next,
  output logic [31:0] pc
);
  // TODO: update pc on the rising clock edge
endmodule`,
  solution:`module rv32_pc(
  input logic clk, reset,
  input logic [31:0] pc_next,
  output logic [31:0] pc
);
  always_ff @(posedge clk) begin
    if (reset) pc <= 32'b0;
    else       pc <= pc_next;
  end
endmodule`,
  checks:[['Clocked state',/always_ff\s*@\s*\(\s*posedge\s+clk\s*\)/i],['Reset to address zero',/if\s*\(\s*reset\s*\)[\s\S]{0,50}pc\s*<=\s*(32'b0|'0|0)/i],['Load the selected next PC',/else[\s\S]{0,35}pc\s*<=\s*pc_next/i]]
 },
 {
  id:'rv32-decode',title:'RISC-V Instruction Decoder',category:'RTL Design',difficulty:'Easy',languages:['SystemVerilog'],evaluation:{type:'pattern'},project:project(2),tags:['RISC-V','decode','instruction-format'],
  description:'Slice the fixed RV32I instruction fields used by the rest of the CPU datapath.',
  task:'Drive opcode, rd, funct3, rs1, rs2 and funct7 from their standard RV32I bit positions.',
  approach:'RISC-V keeps these fields in fixed positions across the common instruction formats, so the decoder can expose them with continuous assignments.',
  examples:['opcode = instr[6:0]','rd = instr[11:7]','funct7 = instr[31:25]'],
  constraints:['Use the exact RV32I field positions.','Keep the decoder combinational.'],
  starterCode:`module rv32_decode(
  input  logic [31:0] instr,
  output logic [6:0]  opcode, funct7,
  output logic [4:0]  rd, rs1, rs2,
  output logic [2:0]  funct3
);
  // TODO: slice each field from instr
endmodule`,
  solution:`module rv32_decode(
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
endmodule`,
  checks:[['Opcode field',/opcode\s*=\s*instr\s*\[\s*6\s*:\s*0\s*\]/i],['Destination and source fields',/rd\s*=\s*instr\s*\[\s*11\s*:\s*7\s*\][\s\S]*rs1\s*=\s*instr\s*\[\s*19\s*:\s*15\s*\][\s\S]*rs2\s*=\s*instr\s*\[\s*24\s*:\s*20\s*\]/i],['Function fields',/funct3\s*=\s*instr\s*\[\s*14\s*:\s*12\s*\][\s\S]*funct7\s*=\s*instr\s*\[\s*31\s*:\s*25\s*\]/i]]
 },
 {
  id:'rv32-register-file',title:'RISC-V Register File',category:'RTL Design',difficulty:'Medium',languages:['SystemVerilog'],evaluation:{type:'pattern'},project:project(3),tags:['RISC-V','register-file','datapath'],
  description:'Create the 32 × 32-bit register file with two read ports, one write port and the architectural x0 rule.',
  task:'Implement two combinational reads and one clocked write. Register x0 must always read as zero and ignore writes.',
  approach:'Use an unpacked array for storage, continuous assignments for both read ports, and a clocked write guarded by rd_write and rd != 0.',
  examples:['rs1=0 → rs1_data=0','rd_write=1, rd=5 → regs[5] receives rd_data on the rising edge'],
  constraints:['32 registers, each 32 bits.','Reads are combinational.','Writes are synchronous.','x0 is hard-wired to zero.'],
  starterCode:`module rv32_regs(
  input logic clk, rd_write,
  input logic [4:0] rs1, rs2, rd,
  input logic [31:0] rd_data,
  output logic [31:0] rs1_data, rs2_data
);
  logic [31:0] regs [0:31];
  // TODO: two reads, one protected write
endmodule`,
  solution:`module rv32_regs(
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
endmodule`,
  checks:[['32 × 32-bit storage',/logic\s*\[\s*31\s*:\s*0\s*\]\s+regs\s*\[\s*0\s*:\s*31\s*\]/i],['Two asynchronous reads',/rs1_data\s*=\s*\(\s*rs1\s*==\s*(?:5'?d?)?0\s*\)[\s\S]*rs2_data\s*=\s*\(\s*rs2\s*==\s*(?:5'?d?)?0\s*\)/i],['Clocked write protects x0',/always_ff\s*@\s*\(\s*posedge\s+clk\s*\)[\s\S]*rd_write\s*&&\s*rd\s*!=\s*(?:5'?d?)?0[\s\S]*regs\s*\[\s*rd\s*\]\s*<=\s*rd_data/i]]
 },
 {
  id:'rv32-immediate',title:'RISC-V Immediate Generator',category:'RTL Design',difficulty:'Medium',languages:['SystemVerilog'],evaluation:{type:'pattern'},project:project(4),tags:['RISC-V','immediate','decode'],
  description:'Reassemble and sign-extend RV32I immediate fields for the CPU datapath.',
  task:'Generate I, S, B, U and J immediates from instr and opcode. The required checks focus on the I and S forms.',
  approach:'Use opcode to choose the instruction format. Reassemble split fields before sign extension; branch and jump immediates end in a hard-wired zero bit.',
  examples:['I-type: {{20{instr[31]}}, instr[31:20]}','S-type combines instr[31:25] with instr[11:7]'],
  constraints:['Keep the logic combinational.','Default imm to zero for unsupported opcodes.','Sign-extend from instr[31].'],
  starterCode:`module rv32_imm(
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
endmodule`,
  solution:`module rv32_imm(input logic [31:0] instr, input logic [6:0] opcode, output logic [31:0] imm);
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
endmodule`,
  checks:[['Combinational selection',/always_comb[\s\S]*case\s*\(\s*opcode\s*\)/i],['I-type sign extension',/\{\{\s*20\s*\{\s*instr\s*\[\s*31\s*\]\s*\}\s*\}\s*,\s*instr\s*\[\s*31\s*:\s*20\s*\]\s*\}/i],['S-type reassembly',/instr\s*\[\s*31\s*:\s*25\s*\][\s\S]{0,40}instr\s*\[\s*11\s*:\s*7\s*\]/i]]
 },
 {
  id:'rv32-alu',title:'RISC-V ALU',category:'RTL Design',difficulty:'Medium',languages:['SystemVerilog'],evaluation:{type:'pattern'},project:project(5),tags:['RISC-V','ALU','datapath'],
  description:'Implement the arithmetic and logic unit used by the guided RV32I core.',
  task:'Implement ADD, SUB, AND, OR, XOR, signed SLT, SLL, SRL and SRA in a combinational case statement.',
  approach:'Decode alu_op in always_comb. Signed compare and arithmetic right shift need signed operands; use only b[4:0] as a 32-bit shift amount.',
  examples:['alu_op=0 → a+b','alu_op=5 → signed a<b','alu_op=8 → arithmetic right shift'],
  constraints:['Combinational logic only.','Provide a safe default result.','Use signed semantics for SLT and SRA.'],
  starterCode:`module rv32_alu(
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
endmodule`,
  solution:`module rv32_alu(input logic [31:0] a, b, input logic [3:0] alu_op, output logic [31:0] result);
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
endmodule`,
  checks:[['Combinational ALU select',/always_comb[\s\S]*case\s*\(\s*alu_op\s*\)/i],['Arithmetic and logic',/result\s*=\s*a\s*\+\s*b[\s\S]*result\s*=\s*a\s*-\s*b[\s\S]*result\s*=\s*a\s*&\s*b[\s\S]*result\s*=\s*a\s*\|\s*b[\s\S]*result\s*=\s*a\s*\^\s*b/i],['Signed compare and shifts',/\$signed\s*\(\s*a\s*\)\s*<\s*\$signed\s*\(\s*b\s*\)[\s\S]*<<[\s\S]*>>[\s\S]*>>>/i]]
 },
 {
  id:'rv32-branch-control',title:'RISC-V Branch Control',category:'RTL Design',difficulty:'Medium',languages:['SystemVerilog'],evaluation:{type:'pattern'},project:project(6),tags:['RISC-V','branch','control-flow'],
  description:'Add the PC-relative target calculation and conditional branch decision logic.',
  task:'Calculate pc_target = pc + imm and implement BEQ and BNE decisions selected by funct3 when is_branch is asserted.',
  approach:'Compute the target independently, default branch_taken low, then decode funct3 only when the instruction is a branch.',
  examples:['funct3=000 and operands equal → branch_taken=1','funct3=001 and operands different → branch_taken=1'],
  constraints:['Default branch_taken low.','Keep the comparison logic combinational.'],
  starterCode:`module rv32_branch(
  input logic [31:0] pc, imm, rs1_data, rs2_data,
  input logic [2:0] funct3,
  input logic is_branch,
  output logic branch_taken,
  output logic [31:0] pc_target
);
  // TODO: target, BEQ and BNE
endmodule`,
  solution:`module rv32_branch(
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
endmodule`,
  checks:[['PC-relative target',/pc_target\s*=\s*pc\s*\+\s*imm/i],['Safe default',/branch_taken\s*=\s*1'b0/i],['BEQ and BNE comparisons',/rs1_data\s*==\s*rs2_data[\s\S]*rs1_data\s*!=\s*rs2_data/i]]
 },
 {
  id:'rv32-memory-control',title:'RISC-V Load/Store Control',category:'RTL Design',difficulty:'Medium',languages:['SystemVerilog'],evaluation:{type:'pattern'},project:project(7),tags:['RISC-V','load-store','control'],
  description:'Decode memory operations into read, write and register-writeback control signals.',
  task:'Decode LOAD and STORE opcodes into mem_read, mem_write and rd_write. Default every control low to prevent accidental writes.',
  approach:'Start the combinational block with safe defaults, then override only the outputs required by each opcode.',
  examples:['LOAD 0000011 → mem_read=1 and rd_write=1','STORE 0100011 → mem_write=1'],
  constraints:['Use safe defaults.','LOAD writes a register; STORE does not.','Keep control combinational.'],
  starterCode:`module rv32_mem_control(
  input logic [6:0] opcode,
  output logic mem_read, mem_write, rd_write
);
  always_comb begin
    // TODO: safe defaults and LOAD/STORE decode
  end
endmodule`,
  solution:`module rv32_mem_control(input logic [6:0] opcode, output logic mem_read, mem_write, rd_write);
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
endmodule`,
  checks:[['Safe control defaults',/mem_read\s*=\s*1'b0[\s\S]*mem_write\s*=\s*1'b0[\s\S]*rd_write\s*=\s*1'b0/i],['LOAD enables read and writeback',/7'b0000011[\s\S]{0,100}mem_read\s*=\s*1'b1[\s\S]{0,80}rd_write\s*=\s*1'b1/i],['STORE enables memory write',/7'b0100011[\s\S]{0,60}mem_write\s*=\s*1'b1/i]]
 },
 {
  id:'rv32-core-integration',title:'Integrate the 32-bit RISC-V Core',category:'RTL Design',difficulty:'Hard',languages:['SystemVerilog'],evaluation:{type:'pattern'},project:project(8),tags:['RISC-V','CPU','integration'],
  description:'Bring the guided CPU blocks together into one single-cycle RV32I top-level datapath.',
  task:'Instantiate the PC, decoder, register file and ALU, then complete the next-PC, memory and writeback paths.',
  approach:'Wire the design from instruction fetch through decode, operand read, ALU/memory and register writeback. Keep pc+4 as the default next address and redirect it when a branch is taken.',
  examples:['imem_addr follows pc','pc_next selects branch_target or pc+4','load writeback selects dmem_rdata instead of alu_result'],
  constraints:['Instantiate rv32_pc, rv32_decode, rv32_regs and rv32_alu.','Drive the instruction-memory address from pc.','Drive data-memory address/data from the ALU and rs2 path.','Select memory data for load writeback.'],
  starterCode:`module rv32_core(
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
endmodule`,
  solution:`module rv32_core(
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
endmodule`,
  checks:[['Four datapath blocks',/rv32_pc\s+\w+[\s\S]*rv32_decode\s+\w+[\s\S]*rv32_regs\s+\w+[\s\S]*rv32_alu\s+\w+/i],['Sequential or redirected PC',/pc_next\s*=\s*branch_taken\s*\?\s*branch_target\s*:\s*pc\s*\+\s*(?:32'd)?4/i],['Memory path',/dmem_addr\s*=\s*alu_result[\s\S]*dmem_wdata\s*=\s*rs2_data/i],['Writeback selection',/rd_data\s*=\s*mem_to_reg\s*\?\s*dmem_rdata\s*:\s*alu_result/i]]
 }
]

export const riscvProjectProblemMap=Object.fromEntries(riscvProjectProblems.map(problem=>[problem.id,problem]))
