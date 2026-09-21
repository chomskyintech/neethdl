const guidedProjectExpansionProblems2=[
  {
    "projectId": "cache-memory-controller",
    "id": "cache-address-decode",
    "title": "Cache Address Decode",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "cache",
      "addressing",
      "tag/index/offset"
    ],
    "description": "Split a 32-bit byte address into tag, index and word offset fields for a small direct-mapped cache.",
    "task": "Use a 16-line cache with 4 words per line. Produce a 24-bit tag, 4-bit line index and 2-bit word offset from address bits.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module cache_address_decode(\n  input  logic [31:0] addr,\n  output logic [23:0] tag,\n  output logic [3:0]  index,\n  output logic [1:0]  word_offset\n);\n  // TODO\nendmodule",
    "solution": "module cache_address_decode(\n  input logic [31:0] addr,\n  output logic [23:0] tag,\n  output logic [3:0] index,\n  output logic [1:0] word_offset\n);\n  assign word_offset = addr[3:2];\n  assign index = addr[7:4];\n  assign tag = addr[31:8];\nendmodule",
    "checks": [
      {
        "label": "Word offset uses address bits 3:2",
        "pattern": "word_offset\\s*=\\s*addr\\s*\\[\\s*3\\s*:\\s*2\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Index uses address bits 7:4",
        "pattern": "index\\s*=\\s*addr\\s*\\[\\s*7\\s*:\\s*4\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Tag uses upper bits",
        "pattern": "tag\\s*=\\s*addr\\s*\\[\\s*31\\s*:\\s*8\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "cache-memory-controller",
    "id": "cache-hit-logic",
    "title": "Cache Hit Detection",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "cache",
      "tags",
      "hit/miss"
    ],
    "description": "Determine whether the selected direct-mapped cache line contains the requested address.",
    "task": "Assert hit only when the selected line is valid and its stored tag equals the request tag.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module cache_hit_logic(\n  input logic valid,\n  input logic [23:0] stored_tag,\n  input logic [23:0] request_tag,\n  output logic hit\n);\n  // TODO\nendmodule",
    "solution": "module cache_hit_logic(\n  input logic valid,\n  input logic [23:0] stored_tag,\n  input logic [23:0] request_tag,\n  output logic hit\n);\n  assign hit = valid && (stored_tag == request_tag);\nendmodule",
    "checks": [
      {
        "label": "Valid required",
        "pattern": "hit\\s*=\\s*valid\\s*&&",
        "flags": "i"
      },
      {
        "label": "Tags compared",
        "pattern": "stored_tag\\s*==\\s*request_tag",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "cache-memory-controller",
    "id": "cache-line-store",
    "title": "Cache Line Store",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "cache",
      "memory",
      "dirty bit"
    ],
    "description": "Store tag, valid, dirty and four 32-bit words for each direct-mapped cache line.",
    "task": "Implement 16 cache lines. Support indexed metadata writes and indexed word writes, and expose the selected line.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module cache_line_store(\n  input logic clk,\n  input logic [3:0] index,\n  input logic meta_we, data_we,\n  input logic [1:0] word_sel,\n  input logic [23:0] tag_in,\n  input logic valid_in, dirty_in,\n  input logic [31:0] data_in,\n  output logic [23:0] tag_out,\n  output logic valid_out, dirty_out,\n  output logic [31:0] data_out\n);\n  // TODO\nendmodule",
    "solution": "module cache_line_store(\n  input logic clk,\n  input logic [3:0] index,\n  input logic meta_we, data_we,\n  input logic [1:0] word_sel,\n  input logic [23:0] tag_in,\n  input logic valid_in, dirty_in,\n  input logic [31:0] data_in,\n  output logic [23:0] tag_out,\n  output logic valid_out, dirty_out,\n  output logic [31:0] data_out\n);\n  logic [23:0] tags[0:15];\n  logic valids[0:15], dirty[0:15];\n  logic [31:0] data[0:15][0:3];\n\n  always_ff @(posedge clk) begin\n    if (meta_we) begin\n      tags[index] <= tag_in;\n      valids[index] <= valid_in;\n      dirty[index] <= dirty_in;\n    end\n    if (data_we) data[index][word_sel] <= data_in;\n  end\n\n  assign tag_out = tags[index];\n  assign valid_out = valids[index];\n  assign dirty_out = dirty[index];\n  assign data_out = data[index][word_sel];\nendmodule",
    "checks": [
      {
        "label": "Sixteen tag entries",
        "pattern": "logic\\s*\\[\\s*23\\s*:\\s*0\\s*\\]\\s*tags\\s*\\[\\s*0\\s*:\\s*15\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Four words per line",
        "pattern": "logic\\s*\\[\\s*31\\s*:\\s*0\\s*\\]\\s*data\\s*\\[\\s*0\\s*:\\s*15\\s*\\]\\s*\\[\\s*0\\s*:\\s*3\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Metadata write",
        "pattern": "if\\s*\\(\\s*meta_we\\s*\\)[\\s\\S]*tags\\s*\\[\\s*index\\s*\\]\\s*<=\\s*tag_in",
        "flags": "i"
      },
      {
        "label": "Data write",
        "pattern": "if\\s*\\(\\s*data_we\\s*\\)[\\s\\S]*data\\s*\\[\\s*index\\s*\\]\\s*\\[\\s*word_sel\\s*\\]\\s*<=\\s*data_in",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "cache-memory-controller",
    "id": "cache-miss-fsm",
    "title": "Cache Miss / Refill FSM",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "cache",
      "FSM",
      "refill"
    ],
    "description": "Sequence lookup, optional writeback and four-word line refill after a cache miss.",
    "task": "Implement IDLE, LOOKUP, WRITEBACK, REFILL and RESPOND states. Dirty misses go through WRITEBACK before REFILL; clean misses go directly to REFILL.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module cache_miss_fsm(\n  input logic clk, reset, request, hit, dirty, refill_done, writeback_done,\n  output logic lookup, do_writeback, do_refill, response_valid\n);\n  // TODO\nendmodule",
    "solution": "module cache_miss_fsm(\n  input logic clk, reset, request, hit, dirty, refill_done, writeback_done,\n  output logic lookup, do_writeback, do_refill, response_valid\n);\n  typedef enum logic [2:0] {IDLE,LOOKUP,WRITEBACK,REFILL,RESPOND} state_t;\n  state_t state,next;\n  always_ff @(posedge clk) begin\n    if (reset) state <= IDLE;\n    else state <= next;\n  end\n  always_comb begin\n    next=state; lookup=0; do_writeback=0; do_refill=0; response_valid=0;\n    case(state)\n      IDLE: if(request) next=LOOKUP;\n      LOOKUP: begin\n        lookup=1;\n        if(hit) next=RESPOND;\n        else if(dirty) next=WRITEBACK;\n        else next=REFILL;\n      end\n      WRITEBACK: begin do_writeback=1; if(writeback_done) next=REFILL; end\n      REFILL: begin do_refill=1; if(refill_done) next=RESPOND; end\n      RESPOND: begin response_valid=1; next=IDLE; end\n    endcase\n  end\nendmodule",
    "checks": [
      {
        "label": "Required states",
        "pattern": "IDLE[\\s\\S]*LOOKUP[\\s\\S]*WRITEBACK[\\s\\S]*REFILL[\\s\\S]*RESPOND",
        "flags": "i"
      },
      {
        "label": "Dirty miss writes back",
        "pattern": "else\\s+if\\s*\\(\\s*dirty\\s*\\)\\s*next\\s*=\\s*WRITEBACK",
        "flags": "i"
      },
      {
        "label": "Clean miss refills",
        "pattern": "else\\s+next\\s*=\\s*REFILL",
        "flags": "i"
      },
      {
        "label": "Writeback precedes refill",
        "pattern": "WRITEBACK[\\s\\S]*writeback_done[\\s\\S]*next\\s*=\\s*REFILL",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "cache-memory-controller",
    "id": "cache-refill-counter",
    "title": "Four-Beat Refill Counter",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "cache",
      "refill",
      "counter"
    ],
    "description": "Track the four words transferred while refilling a cache line.",
    "task": "Increment a 2-bit word counter on each accepted refill beat. Pulse refill_done when word 3 is accepted, then wrap to zero.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module cache_refill_counter(\n  input logic clk, reset, beat_valid,\n  output logic [1:0] word_index,\n  output logic refill_done\n);\n  // TODO\nendmodule",
    "solution": "module cache_refill_counter(\n  input logic clk, reset, beat_valid,\n  output logic [1:0] word_index,\n  output logic refill_done\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin word_index<='0; refill_done<=1'b0; end\n    else begin\n      refill_done<=1'b0;\n      if(beat_valid) begin\n        if(word_index==2'd3) begin\n          word_index<='0;\n          refill_done<=1'b1;\n        end else word_index<=word_index+1'b1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Counts refill beats",
        "pattern": "if\\s*\\(\\s*beat_valid\\s*\\)[\\s\\S]*word_index\\s*<=\\s*word_index\\s*\\+\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Completes on word three",
        "pattern": "word_index\\s*==\\s*2'd3[\\s\\S]*refill_done\\s*<=\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Wraps counter",
        "pattern": "word_index\\s*==\\s*2'd3[\\s\\S]*word_index\\s*<=\\s*'0",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "cache-memory-controller",
    "id": "cache-controller-top",
    "title": "Direct-Mapped Cache Controller",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "cache",
      "integration",
      "memory controller"
    ],
    "description": "Integrate address decode, hit detection and miss handling into a compact direct-mapped cache controller.",
    "task": "Accept a request, return data immediately on hits, mark writes dirty, and raise miss_start on misses. Hold busy while a miss transaction is outstanding.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module cache_controller_top(\n  input logic clk, reset,\n  input logic req_valid, req_write,\n  input logic [31:0] req_addr, req_wdata,\n  input logic line_valid, line_dirty,\n  input logic [23:0] line_tag,\n  input logic [31:0] line_rdata,\n  input logic miss_done,\n  output logic req_ready, resp_valid,\n  output logic [31:0] resp_rdata,\n  output logic miss_start, mark_dirty\n);\n  // TODO\nendmodule",
    "solution": "module cache_controller_top(\n  input logic clk, reset,\n  input logic req_valid, req_write,\n  input logic [31:0] req_addr, req_wdata,\n  input logic line_valid, line_dirty,\n  input logic [23:0] line_tag,\n  input logic [31:0] line_rdata,\n  input logic miss_done,\n  output logic req_ready, resp_valid,\n  output logic [31:0] resp_rdata,\n  output logic miss_start, mark_dirty\n);\n  logic busy;\n  logic hit;\n  assign hit = line_valid && (line_tag == req_addr[31:8]);\n  assign req_ready = !busy;\n  assign resp_rdata = line_rdata;\n  always_ff @(posedge clk) begin\n    if(reset) begin busy<=0; resp_valid<=0; miss_start<=0; mark_dirty<=0; end\n    else begin\n      resp_valid<=0; miss_start<=0; mark_dirty<=0;\n      if(req_valid && req_ready) begin\n        if(hit) begin\n          resp_valid<=1;\n          if(req_write) mark_dirty<=1;\n        end else begin\n          busy<=1;\n          miss_start<=1;\n        end\n      end\n      if(busy && miss_done) begin busy<=0; resp_valid<=1; end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Hit compares tag and valid",
        "pattern": "hit\\s*=\\s*line_valid\\s*&&\\s*\\(\\s*line_tag\\s*==\\s*req_addr\\s*\\[\\s*31\\s*:\\s*8\\s*\\]\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Miss starts transaction",
        "pattern": "else\\s+begin[\\s\\S]{0,100}busy\\s*<=\\s*1[\\s\\S]{0,100}miss_start\\s*<=\\s*1",
        "flags": "i"
      },
      {
        "label": "Write hit marks dirty",
        "pattern": "if\\s*\\(\\s*req_write\\s*\\)\\s*mark_dirty\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "risc-v-core-verification",
    "id": "rvv-instruction-item",
    "title": "RISC-V Instruction Transaction",
    "category": "UVM",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "UVM",
      "transaction"
    ],
    "description": "Represent an architectural instruction and its expected retirement information as a reusable verification transaction.",
    "task": "Create a `uvm_sequence_item` with randomized instruction word and PC plus observed rd/writeback fields. Register fields with UVM macros.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "class rv_instr_item extends uvm_sequence_item;\n  // TODO\nendclass",
    "solution": "class rv_instr_item extends uvm_sequence_item;\n  rand bit [31:0] pc;\n  rand bit [31:0] instr;\n       bit [4:0]  rd;\n       bit [31:0] rd_value;\n       bit        rd_write;\n  `uvm_object_utils_begin(rv_instr_item)\n    `uvm_field_int(pc,UVM_ALL_ON)\n    `uvm_field_int(instr,UVM_ALL_ON)\n    `uvm_field_int(rd,UVM_ALL_ON)\n    `uvm_field_int(rd_value,UVM_ALL_ON)\n    `uvm_field_int(rd_write,UVM_ALL_ON)\n  `uvm_object_utils_end\n  function new(string name=\"rv_instr_item\"); super.new(name); endfunction\nendclass",
    "checks": [
      {
        "label": "Extends UVM sequence item",
        "pattern": "class\\s+rv_instr_item\\s+extends\\s+uvm_sequence_item",
        "flags": "i"
      },
      {
        "label": "Random PC and instruction",
        "pattern": "rand\\s+bit\\s*\\[\\s*31\\s*:\\s*0\\s*\\]\\s*pc[\\s\\S]*rand\\s+bit\\s*\\[\\s*31\\s*:\\s*0\\s*\\]\\s*instr",
        "flags": "i"
      },
      {
        "label": "Registered with UVM",
        "pattern": "\\x60uvm_object_utils_begin\\s*\\(\\s*rv_instr_item\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "risc-v-core-verification",
    "id": "rvv-random-sequence",
    "title": "Constrained RV32I Instruction Sequence",
    "category": "UVM",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "constrained random",
      "UVM"
    ],
    "description": "Generate legal randomized RV32I arithmetic instructions for processor regression.",
    "task": "Create a UVM sequence that repeatedly randomizes transactions while constraining opcode to OP-IMM or OP.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "class rv_random_sequence extends uvm_sequence #(rv_instr_item);\n  `uvm_object_utils(rv_random_sequence)\n  // TODO\nendclass",
    "solution": "class rv_random_sequence extends uvm_sequence #(rv_instr_item);\n  `uvm_object_utils(rv_random_sequence)\n  function new(string name=\"rv_random_sequence\"); super.new(name); endfunction\n  task body();\n    rv_instr_item tr;\n    repeat(100) begin\n      tr=rv_instr_item::type_id::create(\"tr\");\n      start_item(tr);\n      if(!tr.randomize() with {\n        instr[6:0] inside {7'b0010011,7'b0110011};\n      }) `uvm_fatal(\"RAND\",\"instruction randomization failed\")\n      finish_item(tr);\n    end\n  endtask\nendclass",
    "checks": [
      {
        "label": "Repeats randomized stimulus",
        "pattern": "repeat\\s*\\(\\s*100\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Constrains legal opcodes",
        "pattern": "instr\\s*\\[\\s*6\\s*:\\s*0\\s*\\]\\s+inside\\s*\\{[\\s\\S]*0010011[\\s\\S]*0110011",
        "flags": "i"
      },
      {
        "label": "Uses start and finish item",
        "pattern": "start_item\\s*\\(\\s*tr\\s*\\)[\\s\\S]*finish_item\\s*\\(\\s*tr\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "risc-v-core-verification",
    "id": "rvv-reference-model",
    "title": "RV32I Reference Model",
    "category": "Scoreboards",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "reference model",
      "ISA"
    ],
    "description": "Maintain a simple architectural register model for ADD, SUB and ADDI instructions.",
    "task": "Implement a model class with 32 registers, x0 forced to zero, and an `execute()` method that updates the expected destination register.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "class rv_reference_model;\n  bit [31:0] regs[32];\n  function void execute(bit [31:0] instr);\n    // TODO\n  endfunction\nendclass",
    "solution": "class rv_reference_model;\n  bit [31:0] regs[32];\n  function void execute(bit [31:0] instr);\n    bit [6:0] opcode;\n    bit [4:0] rd,rs1,rs2;\n    bit [2:0] funct3;\n    bit [6:0] funct7;\n    bit signed [31:0] imm;\n    opcode=instr[6:0]; rd=instr[11:7]; funct3=instr[14:12];\n    rs1=instr[19:15]; rs2=instr[24:20]; funct7=instr[31:25];\n    imm={{20{instr[31]}},instr[31:20]};\n    if(rd!=0) begin\n      if(opcode==7'b0010011 && funct3==3'b000) regs[rd]=regs[rs1]+imm;\n      else if(opcode==7'b0110011 && funct3==3'b000 && funct7==7'b0000000) regs[rd]=regs[rs1]+regs[rs2];\n      else if(opcode==7'b0110011 && funct3==3'b000 && funct7==7'b0100000) regs[rd]=regs[rs1]-regs[rs2];\n    end\n    regs[0]=32'b0;\n  endfunction\nendclass",
    "checks": [
      {
        "label": "Decodes opcode",
        "pattern": "opcode\\s*=\\s*instr\\s*\\[\\s*6\\s*:\\s*0\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Models ADDI",
        "pattern": "0010011[\\s\\S]*regs\\s*\\[\\s*rd\\s*\\]\\s*=\\s*regs\\s*\\[\\s*rs1\\s*\\]\\s*\\+\\s*imm",
        "flags": "i"
      },
      {
        "label": "Models ADD and SUB",
        "pattern": "0110011[\\s\\S]*regs\\s*\\[\\s*rd\\s*\\]\\s*=\\s*regs\\s*\\[\\s*rs1\\s*\\]\\s*\\+\\s*regs\\s*\\[\\s*rs2\\s*\\][\\s\\S]*regs\\s*\\[\\s*rd\\s*\\]\\s*=\\s*regs\\s*\\[\\s*rs1\\s*\\]\\s*-\\s*regs\\s*\\[\\s*rs2\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Keeps x0 zero",
        "pattern": "regs\\s*\\[\\s*0\\s*\\]\\s*=\\s*32'b0",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "risc-v-core-verification",
    "id": "rvv-retire-scoreboard",
    "title": "RISC-V Retirement Scoreboard",
    "category": "Scoreboards",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "scoreboard",
      "retirement"
    ],
    "description": "Compare each retired architectural register write with the reference model.",
    "task": "Implement a UVM scoreboard analysis write method that ignores x0 writes and reports a mismatch when retired rd_value differs from the expected register value.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "class rv_scoreboard extends uvm_scoreboard;\n  `uvm_component_utils(rv_scoreboard)\n  // TODO\nendclass",
    "solution": "class rv_scoreboard extends uvm_scoreboard;\n  `uvm_component_utils(rv_scoreboard)\n  uvm_analysis_imp #(rv_instr_item,rv_scoreboard) imp;\n  rv_reference_model model;\n  function new(string name,uvm_component parent);\n    super.new(name,parent);\n    imp=new(\"imp\",this);\n    model=new();\n  endfunction\n  function void write(rv_instr_item tr);\n    model.execute(tr.instr);\n    if(tr.rd_write && tr.rd!=0 && tr.rd_value!==model.regs[tr.rd])\n      `uvm_error(\"RV_SCB\",$sformatf(\"x%0d exp=%08h got=%08h\",\n        tr.rd,model.regs[tr.rd],tr.rd_value))\n  endfunction\nendclass",
    "checks": [
      {
        "label": "Analysis implementation",
        "pattern": "uvm_analysis_imp\\s*#\\s*\\(\\s*rv_instr_item\\s*,\\s*rv_scoreboard\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Executes reference model",
        "pattern": "model\\.execute\\s*\\(\\s*tr\\.instr\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Compares retirement",
        "pattern": "tr\\.rd_write[\\s\\S]*tr\\.rd\\s*!=\\s*0[\\s\\S]*tr\\.rd_value\\s*!==\\s*model\\.regs\\s*\\[\\s*tr\\.rd\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "risc-v-core-verification",
    "id": "rvv-core-assertions",
    "title": "RISC-V Core Assertions",
    "category": "SVA",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "SVA",
      "processor verification"
    ],
    "description": "Check key architectural invariants around x0 and retirement stability.",
    "task": "Assert that x0 is always zero and that retirement payload stays stable while retire_valid is high and retire_ready is low.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module rv_core_assertions(\n  input logic clk,reset_n,\n  input logic [31:0] x0_value,\n  input logic retire_valid,retire_ready,\n  input logic [31:0] retire_pc,retire_instr\n);\n  // TODO\nendmodule",
    "solution": "module rv_core_assertions(\n  input logic clk,reset_n,\n  input logic [31:0] x0_value,\n  input logic retire_valid,retire_ready,\n  input logic [31:0] retire_pc,retire_instr\n);\n  property p_x0_zero;\n    @(posedge clk) disable iff(!reset_n) x0_value==32'b0;\n  endproperty\n  assert property(p_x0_zero);\n\n  property p_retire_stable;\n    @(posedge clk) disable iff(!reset_n)\n      retire_valid && !retire_ready |=> retire_valid &&\n        $stable({retire_pc,retire_instr});\n  endproperty\n  assert property(p_retire_stable);\nendmodule",
    "checks": [
      {
        "label": "x0 assertion",
        "pattern": "x0_value\\s*==\\s*32'b0",
        "flags": "i"
      },
      {
        "label": "Retirement stall condition",
        "pattern": "retire_valid\\s*&&\\s*!retire_ready",
        "flags": "i"
      },
      {
        "label": "Stable retirement payload",
        "pattern": "\\$stable\\s*\\(\\s*\\{\\s*retire_pc\\s*,\\s*retire_instr\\s*\\}\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "risc-v-core-verification",
    "id": "rvv-functional-coverage",
    "title": "RISC-V Functional Coverage",
    "category": "Functional Coverage",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "coverage",
      "cross coverage"
    ],
    "description": "Measure instruction-class and destination-register diversity during regression.",
    "task": "Create coverpoints for opcode class, destination register and register-write enable, and cross opcode with register-write behavior.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "class rv_coverage extends uvm_subscriber #(rv_instr_item);\n  `uvm_component_utils(rv_coverage)\n  // TODO\nendclass",
    "solution": "class rv_coverage extends uvm_subscriber #(rv_instr_item);\n  `uvm_component_utils(rv_coverage)\n  rv_instr_item tr;\n  covergroup cg;\n    cp_opcode: coverpoint tr.instr[6:0] {\n      bins op_imm={7'b0010011};\n      bins op={7'b0110011};\n    }\n    cp_rd: coverpoint tr.rd { bins regs[]={[0:31]}; }\n    cp_write: coverpoint tr.rd_write;\n    op_write: cross cp_opcode,cp_write;\n  endgroup\n  function new(string name,uvm_component parent); super.new(name,parent); cg=new(); endfunction\n  function void write(rv_instr_item t); tr=t; cg.sample(); endfunction\nendclass",
    "checks": [
      {
        "label": "Opcode coverpoint",
        "pattern": "coverpoint\\s+tr\\.instr\\s*\\[\\s*6\\s*:\\s*0\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Destination coverpoint",
        "pattern": "coverpoint\\s+tr\\.rd",
        "flags": "i"
      },
      {
        "label": "Cross coverage",
        "pattern": "cross\\s+cp_opcode\\s*,\\s*cp_write",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "fpga-packet-parser",
    "id": "pkt-byte-position",
    "title": "Streaming Byte Position Counter",
    "category": "FPGA",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "packet parser",
      "streaming",
      "counter"
    ],
    "description": "Track byte position within a packet without buffering the complete frame.",
    "task": "Reset the position to zero on start_of_packet. Increment by four for each valid 32-bit word.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module packet_byte_position(\n  input logic clk,reset,start_of_packet,word_valid,\n  output logic [15:0] byte_pos\n);\n  // TODO\nendmodule",
    "solution": "module packet_byte_position(\n  input logic clk,reset,start_of_packet,word_valid,\n  output logic [15:0] byte_pos\n);\n  always_ff @(posedge clk) begin\n    if(reset || start_of_packet) byte_pos<=16'd0;\n    else if(word_valid) byte_pos<=byte_pos+16'd4;\n  end\nendmodule",
    "checks": [
      {
        "label": "Packet start resets position",
        "pattern": "reset\\s*\\|\\|\\s*start_of_packet[\\s\\S]*byte_pos\\s*<=\\s*16'd0",
        "flags": "i"
      },
      {
        "label": "Valid word adds four bytes",
        "pattern": "word_valid[\\s\\S]*byte_pos\\s*<=\\s*byte_pos\\s*\\+\\s*16'd4",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "fpga-packet-parser",
    "id": "pkt-ethertype",
    "title": "EtherType Extractor",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "Ethernet",
      "parser",
      "field extraction"
    ],
    "description": "Extract the Ethernet EtherType field from the word carrying bytes 12-15.",
    "task": "When byte_pos equals 12 and word_valid is high, capture the upper 16 bits as EtherType and pulse type_valid.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module ethertype_extract(\n  input logic clk,reset,word_valid,\n  input logic [15:0] byte_pos,\n  input logic [31:0] data,\n  output logic [15:0] ethertype,\n  output logic type_valid\n);\n  // TODO\nendmodule",
    "solution": "module ethertype_extract(\n  input logic clk,reset,word_valid,\n  input logic [15:0] byte_pos,\n  input logic [31:0] data,\n  output logic [15:0] ethertype,\n  output logic type_valid\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin ethertype<='0; type_valid<=0; end\n    else begin\n      type_valid<=0;\n      if(word_valid && byte_pos==16'd12) begin\n        ethertype<=data[31:16];\n        type_valid<=1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Matches byte twelve",
        "pattern": "byte_pos\\s*==\\s*16'd12",
        "flags": "i"
      },
      {
        "label": "Captures EtherType",
        "pattern": "ethertype\\s*<=\\s*data\\s*\\[\\s*31\\s*:\\s*16\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Pulses valid",
        "pattern": "type_valid\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "fpga-packet-parser",
    "id": "pkt-ip-protocol",
    "title": "IPv4 Protocol Extractor",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "IPv4",
      "parser",
      "field extraction"
    ],
    "description": "Capture the IPv4 protocol byte after an Ethernet IPv4 frame is identified.",
    "task": "When EtherType is 0x0800 and the parser reaches byte position 20, capture data[23:16] as protocol.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module ipv4_protocol_extract(\n  input logic clk,reset,word_valid,\n  input logic [15:0] byte_pos,ethertype,\n  input logic [31:0] data,\n  output logic [7:0] protocol,\n  output logic protocol_valid\n);\n  // TODO\nendmodule",
    "solution": "module ipv4_protocol_extract(\n  input logic clk,reset,word_valid,\n  input logic [15:0] byte_pos,ethertype,\n  input logic [31:0] data,\n  output logic [7:0] protocol,\n  output logic protocol_valid\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin protocol<='0; protocol_valid<=0; end\n    else begin\n      protocol_valid<=0;\n      if(word_valid && ethertype==16'h0800 && byte_pos==16'd20) begin\n        protocol<=data[23:16];\n        protocol_valid<=1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Requires IPv4 EtherType",
        "pattern": "ethertype\\s*==\\s*16'h0800",
        "flags": "i"
      },
      {
        "label": "Checks byte position",
        "pattern": "byte_pos\\s*==\\s*16'd20",
        "flags": "i"
      },
      {
        "label": "Captures protocol byte",
        "pattern": "protocol\\s*<=\\s*data\\s*\\[\\s*23\\s*:\\s*16\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "fpga-packet-parser",
    "id": "pkt-udp-ports",
    "title": "UDP Port Extractor",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UDP",
      "parser",
      "ports"
    ],
    "description": "Extract source and destination ports from a simplified fixed-header IPv4/UDP packet.",
    "task": "When protocol is 17 and byte_pos equals 34, capture source port from data[31:16] and destination port from data[15:0].",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module udp_port_extract(\n  input logic clk,reset,word_valid,\n  input logic [15:0] byte_pos,\n  input logic [7:0] protocol,\n  input logic [31:0] data,\n  output logic [15:0] src_port,dst_port,\n  output logic ports_valid\n);\n  // TODO\nendmodule",
    "solution": "module udp_port_extract(\n  input logic clk,reset,word_valid,\n  input logic [15:0] byte_pos,\n  input logic [7:0] protocol,\n  input logic [31:0] data,\n  output logic [15:0] src_port,dst_port,\n  output logic ports_valid\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin src_port<='0;dst_port<='0;ports_valid<=0; end\n    else begin\n      ports_valid<=0;\n      if(word_valid && protocol==8'd17 && byte_pos==16'd34) begin\n        src_port<=data[31:16];\n        dst_port<=data[15:0];\n        ports_valid<=1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Requires UDP protocol",
        "pattern": "protocol\\s*==\\s*8'd17",
        "flags": "i"
      },
      {
        "label": "Captures source port",
        "pattern": "src_port\\s*<=\\s*data\\s*\\[\\s*31\\s*:\\s*16\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Captures destination port",
        "pattern": "dst_port\\s*<=\\s*data\\s*\\[\\s*15\\s*:\\s*0\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "fpga-packet-parser",
    "id": "pkt-statistics",
    "title": "Packet Statistics Counters",
    "category": "FPGA",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "packet parser",
      "statistics",
      "counters"
    ],
    "description": "Maintain simple line-rate counters for total IPv4 packets and UDP packets.",
    "task": "Increment ipv4_count on ipv4_packet and udp_count on udp_packet. Clear both on reset.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module packet_stats(\n  input logic clk,reset,ipv4_packet,udp_packet,\n  output logic [31:0] ipv4_count,udp_count\n);\n  // TODO\nendmodule",
    "solution": "module packet_stats(\n  input logic clk,reset,ipv4_packet,udp_packet,\n  output logic [31:0] ipv4_count,udp_count\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin ipv4_count<=0;udp_count<=0; end\n    else begin\n      if(ipv4_packet) ipv4_count<=ipv4_count+1'b1;\n      if(udp_packet) udp_count<=udp_count+1'b1;\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "IPv4 counter increments",
        "pattern": "if\\s*\\(\\s*ipv4_packet\\s*\\)\\s*ipv4_count\\s*<=\\s*ipv4_count\\s*\\+\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "UDP counter increments",
        "pattern": "if\\s*\\(\\s*udp_packet\\s*\\)\\s*udp_count\\s*<=\\s*udp_count\\s*\\+\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "fpga-packet-parser",
    "id": "pkt-parser-top",
    "title": "Streaming Ethernet/IPv4/UDP Parser",
    "category": "FPGA",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "packet parser",
      "streaming",
      "integration"
    ],
    "description": "Integrate a fixed-latency streaming packet parser without full-frame buffering.",
    "task": "Track byte position, identify IPv4 using EtherType 0x0800, identify UDP using protocol 17, and pulse metadata_valid when UDP ports are captured.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module packet_parser_top(\n  input logic clk,reset,sop,word_valid,\n  input logic [31:0] data,\n  output logic metadata_valid,\n  output logic [15:0] src_port,dst_port\n);\n  // TODO\nendmodule",
    "solution": "module packet_parser_top(\n  input logic clk,reset,sop,word_valid,\n  input logic [31:0] data,\n  output logic metadata_valid,\n  output logic [15:0] src_port,dst_port\n);\n  logic [15:0] pos,ethertype;\n  logic [7:0] protocol;\n  always_ff @(posedge clk) begin\n    if(reset || sop) begin\n      pos<=0; ethertype<=0; protocol<=0; metadata_valid<=0;\n    end else begin\n      metadata_valid<=0;\n      if(word_valid) begin\n        if(pos==16'd12) ethertype<=data[31:16];\n        if(pos==16'd20 && ethertype==16'h0800) protocol<=data[23:16];\n        if(pos==16'd34 && protocol==8'd17) begin\n          src_port<=data[31:16];\n          dst_port<=data[15:0];\n          metadata_valid<=1;\n        end\n        pos<=pos+16'd4;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Tracks word position",
        "pattern": "pos\\s*<=\\s*pos\\s*\\+\\s*16'd4",
        "flags": "i"
      },
      {
        "label": "Recognizes IPv4",
        "pattern": "ethertype\\s*==\\s*16'h0800",
        "flags": "i"
      },
      {
        "label": "Recognizes UDP",
        "pattern": "protocol\\s*==\\s*8'd17",
        "flags": "i"
      },
      {
        "label": "Produces metadata",
        "pattern": "src_port\\s*<=\\s*data\\s*\\[\\s*31\\s*:\\s*16\\s*\\][\\s\\S]*dst_port\\s*<=\\s*data\\s*\\[\\s*15\\s*:\\s*0\\s*\\][\\s\\S]*metadata_valid\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "branch-predictor",
    "id": "bp-two-bit-counter",
    "title": "2-bit Saturating Counter",
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "branch predictor",
      "counter",
      "microarchitecture"
    ],
    "description": "Implement the classic four-state branch-direction predictor.",
    "task": "Increment toward strongly taken on taken outcomes and decrement toward strongly not-taken on not-taken outcomes. Never wrap.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module bp_counter(\n  input logic clk,reset,update,taken,\n  output logic predict_taken\n);\n  logic [1:0] state;\n  // TODO\nendmodule",
    "solution": "module bp_counter(\n  input logic clk,reset,update,taken,\n  output logic predict_taken\n);\n  logic [1:0] state;\n  always_ff @(posedge clk) begin\n    if(reset) state<=2'b01;\n    else if(update) begin\n      if(taken && state!=2'b11) state<=state+1'b1;\n      else if(!taken && state!=2'b00) state<=state-1'b1;\n    end\n  end\n  assign predict_taken=state[1];\nendmodule",
    "checks": [
      {
        "label": "Saturates high",
        "pattern": "taken\\s*&&\\s*state\\s*!=\\s*2'b11[\\s\\S]*state\\s*<=\\s*state\\s*\\+\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Saturates low",
        "pattern": "!taken\\s*&&\\s*state\\s*!=\\s*2'b00[\\s\\S]*state\\s*<=\\s*state\\s*-\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Prediction uses MSB",
        "pattern": "predict_taken\\s*=\\s*state\\s*\\[\\s*1\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "branch-predictor",
    "id": "bp-bht",
    "title": "Branch History Table",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "branch predictor",
      "BHT",
      "table"
    ],
    "description": "Scale the two-bit predictor into a small PC-indexed Branch History Table.",
    "task": "Implement 64 two-bit counters indexed by PC[7:2]. Reset all entries weakly not-taken and update one indexed entry per cycle.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module branch_history_table(\n  input logic clk,reset,update,taken,\n  input logic [31:0] pc,update_pc,\n  output logic predict_taken\n);\n  // TODO\nendmodule",
    "solution": "module branch_history_table(\n  input logic clk,reset,update,taken,\n  input logic [31:0] pc,update_pc,\n  output logic predict_taken\n);\n  logic [1:0] table[0:63];\n  integer i;\n  always_ff @(posedge clk) begin\n    if(reset) for(i=0;i<64;i=i+1) table[i]<=2'b01;\n    else if(update) begin\n      if(taken && table[update_pc[7:2]]!=2'b11)\n        table[update_pc[7:2]]<=table[update_pc[7:2]]+1'b1;\n      else if(!taken && table[update_pc[7:2]]!=2'b00)\n        table[update_pc[7:2]]<=table[update_pc[7:2]]-1'b1;\n    end\n  end\n  assign predict_taken=table[pc[7:2]][1];\nendmodule",
    "checks": [
      {
        "label": "64 predictor entries",
        "pattern": "logic\\s*\\[\\s*1\\s*:\\s*0\\s*\\]\\s*table\\s*\\[\\s*0\\s*:\\s*63\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Indexes with PC",
        "pattern": "table\\s*\\[\\s*pc\\s*\\[\\s*7\\s*:\\s*2\\s*\\]\\s*\\]\\s*\\[\\s*1\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Updates indexed entry",
        "pattern": "table\\s*\\[\\s*update_pc\\s*\\[\\s*7\\s*:\\s*2\\s*\\]\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "branch-predictor",
    "id": "bp-btb",
    "title": "Branch Target Buffer",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "branch predictor",
      "BTB",
      "tags"
    ],
    "description": "Cache branch targets so a taken prediction can redirect fetch immediately.",
    "task": "Implement 16 BTB entries indexed by PC[5:2], each with valid, tag PC[31:6] and 32-bit target. Hit requires valid plus tag match.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module branch_target_buffer(\n  input logic clk,reset,update,\n  input logic [31:0] pc,update_pc,update_target,\n  output logic hit,\n  output logic [31:0] target\n);\n  // TODO\nendmodule",
    "solution": "module branch_target_buffer(\n  input logic clk,reset,update,\n  input logic [31:0] pc,update_pc,update_target,\n  output logic hit,\n  output logic [31:0] target\n);\n  logic valid[0:15];\n  logic [25:0] tag[0:15];\n  logic [31:0] targets[0:15];\n  integer i;\n  always_ff @(posedge clk) begin\n    if(reset) for(i=0;i<16;i=i+1) valid[i]<=1'b0;\n    else if(update) begin\n      valid[update_pc[5:2]]<=1'b1;\n      tag[update_pc[5:2]]<=update_pc[31:6];\n      targets[update_pc[5:2]]<=update_target;\n    end\n  end\n  assign hit=valid[pc[5:2]] && tag[pc[5:2]]==pc[31:6];\n  assign target=targets[pc[5:2]];\nendmodule",
    "checks": [
      {
        "label": "16 BTB entries",
        "pattern": "valid\\s*\\[\\s*0\\s*:\\s*15\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Stores PC tag",
        "pattern": "tag\\s*\\[\\s*update_pc\\s*\\[\\s*5\\s*:\\s*2\\s*\\]\\s*\\]\\s*<=\\s*update_pc\\s*\\[\\s*31\\s*:\\s*6\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Hit checks tag and valid",
        "pattern": "hit\\s*=\\s*valid\\s*\\[\\s*pc\\s*\\[\\s*5\\s*:\\s*2\\s*\\]\\s*\\]\\s*&&\\s*tag\\s*\\[\\s*pc\\s*\\[\\s*5\\s*:\\s*2\\s*\\]\\s*\\]\\s*==\\s*pc\\s*\\[\\s*31\\s*:\\s*6\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "branch-predictor",
    "id": "bp-next-pc",
    "title": "Predicted Next-PC Select",
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "branch predictor",
      "fetch",
      "mux"
    ],
    "description": "Use direction and target predictions to select the speculative next fetch address.",
    "task": "Choose BTB target only when predict_taken and btb_hit are both true; otherwise choose PC+4.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module predicted_next_pc(\n  input logic predict_taken,btb_hit,\n  input logic [31:0] pc_plus4,btb_target,\n  output logic [31:0] next_pc\n);\n  // TODO\nendmodule",
    "solution": "module predicted_next_pc(\n  input logic predict_taken,btb_hit,\n  input logic [31:0] pc_plus4,btb_target,\n  output logic [31:0] next_pc\n);\n  assign next_pc=(predict_taken && btb_hit)?btb_target:pc_plus4;\nendmodule",
    "checks": [
      {
        "label": "Requires both prediction and BTB hit",
        "pattern": "predict_taken\\s*&&\\s*btb_hit",
        "flags": "i"
      },
      {
        "label": "Selects BTB target or PC+4",
        "pattern": "\\?\\s*btb_target\\s*:\\s*pc_plus4",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "branch-predictor",
    "id": "bp-mispredict",
    "title": "Misprediction Detection",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "branch predictor",
      "recovery",
      "control"
    ],
    "description": "Detect when speculative fetch disagrees with the resolved branch outcome or target.",
    "task": "Assert mispredict if predicted taken differs from actual taken, or if both are taken but predicted target differs from actual target.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module branch_mispredict(\n  input logic predicted_taken,actual_taken,\n  input logic [31:0] predicted_target,actual_target,\n  output logic mispredict\n);\n  // TODO\nendmodule",
    "solution": "module branch_mispredict(\n  input logic predicted_taken,actual_taken,\n  input logic [31:0] predicted_target,actual_target,\n  output logic mispredict\n);\n  always_comb begin\n    mispredict=(predicted_taken!=actual_taken) ||\n      (actual_taken && predicted_taken && predicted_target!=actual_target);\n  end\nendmodule",
    "checks": [
      {
        "label": "Detects direction mismatch",
        "pattern": "predicted_taken\\s*!=\\s*actual_taken",
        "flags": "i"
      },
      {
        "label": "Detects target mismatch",
        "pattern": "actual_taken\\s*&&\\s*predicted_taken[\\s\\S]*predicted_target\\s*!=\\s*actual_target",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "branch-predictor",
    "id": "bp-top",
    "title": "Branch Predictor Top",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "branch predictor",
      "BHT",
      "BTB",
      "integration"
    ],
    "description": "Combine direction prediction, target lookup and resolved-branch update behavior.",
    "task": "Implement a compact top level with a 64-entry two-bit BHT and 16-entry BTB. Produce predict_taken, predicted_target and redirect_valid.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module branch_predictor(\n  input logic clk,reset,\n  input logic [31:0] fetch_pc,\n  input logic update,actual_taken,\n  input logic [31:0] update_pc,actual_target,\n  output logic predict_taken,redirect_valid,\n  output logic [31:0] predicted_target\n);\n  // TODO\nendmodule",
    "solution": "module branch_predictor(\n  input logic clk,reset,\n  input logic [31:0] fetch_pc,\n  input logic update,actual_taken,\n  input logic [31:0] update_pc,actual_target,\n  output logic predict_taken,redirect_valid,\n  output logic [31:0] predicted_target\n);\n  logic [1:0] bht[0:63];\n  logic btb_valid[0:15];\n  logic [25:0] btb_tag[0:15];\n  logic [31:0] btb_target[0:15];\n  integer i;\n  always_ff @(posedge clk) begin\n    if(reset) begin\n      for(i=0;i<64;i=i+1) bht[i]<=2'b01;\n      for(i=0;i<16;i=i+1) btb_valid[i]<=0;\n    end else if(update) begin\n      if(actual_taken && bht[update_pc[7:2]]!=2'b11) bht[update_pc[7:2]]<=bht[update_pc[7:2]]+1'b1;\n      else if(!actual_taken && bht[update_pc[7:2]]!=2'b00) bht[update_pc[7:2]]<=bht[update_pc[7:2]]-1'b1;\n      if(actual_taken) begin\n        btb_valid[update_pc[5:2]]<=1;\n        btb_tag[update_pc[5:2]]<=update_pc[31:6];\n        btb_target[update_pc[5:2]]<=actual_target;\n      end\n    end\n  end\n  assign predict_taken=bht[fetch_pc[7:2]][1];\n  assign redirect_valid=predict_taken && btb_valid[fetch_pc[5:2]] &&\n    btb_tag[fetch_pc[5:2]]==fetch_pc[31:6];\n  assign predicted_target=btb_target[fetch_pc[5:2]];\nendmodule",
    "checks": [
      {
        "label": "Contains BHT",
        "pattern": "logic\\s*\\[\\s*1\\s*:\\s*0\\s*\\]\\s*bht\\s*\\[\\s*0\\s*:\\s*63\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Contains BTB",
        "pattern": "btb_valid\\s*\\[\\s*0\\s*:\\s*15\\s*\\][\\s\\S]*btb_target\\s*\\[\\s*0\\s*:\\s*15\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Prediction from BHT",
        "pattern": "predict_taken\\s*=\\s*bht\\s*\\[\\s*fetch_pc\\s*\\[\\s*7\\s*:\\s*2\\s*\\]\\s*\\]\\s*\\[\\s*1\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Redirect requires matching BTB",
        "pattern": "redirect_valid\\s*=\\s*predict_taken[\\s\\S]*btb_tag\\s*\\[\\s*fetch_pc\\s*\\[\\s*5\\s*:\\s*2\\s*\\]\\s*\\]\\s*==\\s*fetch_pc\\s*\\[\\s*31\\s*:\\s*6\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "convolution-accelerator",
    "id": "conv-line-buffer",
    "title": "Three-Row Line Buffer",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "convolution",
      "line buffer",
      "streaming"
    ],
    "description": "Maintain the current and previous two image rows needed by a 3x3 streaming convolution.",
    "task": "Use three parameterized row memories. On each valid pixel, shift the column entry row1→row2, row0→row1 and new pixel→row0.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module conv_line_buffer #(parameter WIDTH=8, IMAGE_W=16)(\n  input logic clk,reset,pixel_valid,\n  input logic [$clog2(IMAGE_W)-1:0] col,\n  input logic [WIDTH-1:0] pixel_in,\n  output logic [WIDTH-1:0] row0,row1,row2\n);\n  // TODO\nendmodule",
    "solution": "module conv_line_buffer #(parameter WIDTH=8, IMAGE_W=16)(\n  input logic clk,reset,pixel_valid,\n  input logic [$clog2(IMAGE_W)-1:0] col,\n  input logic [WIDTH-1:0] pixel_in,\n  output logic [WIDTH-1:0] row0,row1,row2\n);\n  logic [WIDTH-1:0] mem0[0:IMAGE_W-1],mem1[0:IMAGE_W-1],mem2[0:IMAGE_W-1];\n  always_ff @(posedge clk) begin\n    if(pixel_valid) begin\n      mem2[col]<=mem1[col];\n      mem1[col]<=mem0[col];\n      mem0[col]<=pixel_in;\n    end\n  end\n  assign row0=mem0[col];\n  assign row1=mem1[col];\n  assign row2=mem2[col];\nendmodule",
    "checks": [
      {
        "label": "Three row memories",
        "pattern": "mem0\\s*\\[\\s*0\\s*:\\s*IMAGE_W-1\\s*\\][\\s\\S]*mem1\\s*\\[\\s*0\\s*:\\s*IMAGE_W-1\\s*\\][\\s\\S]*mem2\\s*\\[\\s*0\\s*:\\s*IMAGE_W-1\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Shifts rows on valid",
        "pattern": "pixel_valid[\\s\\S]*mem2\\s*\\[\\s*col\\s*\\]\\s*<=\\s*mem1\\s*\\[\\s*col\\s*\\][\\s\\S]*mem1\\s*\\[\\s*col\\s*\\]\\s*<=\\s*mem0\\s*\\[\\s*col\\s*\\][\\s\\S]*mem0\\s*\\[\\s*col\\s*\\]\\s*<=\\s*pixel_in",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "convolution-accelerator",
    "id": "conv-window3",
    "title": "3x3 Sliding Window",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "convolution",
      "window",
      "shift registers"
    ],
    "description": "Build the nine-pixel window presented to a 3x3 convolution kernel.",
    "task": "For each valid column, shift three pixels per row so p00/p10/p20 are oldest and p02/p12/p22 are newest.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module conv_window3(\n  input logic clk,reset,valid,\n  input logic [7:0] r0,r1,r2,\n  output logic [7:0] p00,p01,p02,p10,p11,p12,p20,p21,p22\n);\n  // TODO\nendmodule",
    "solution": "module conv_window3(\n  input logic clk,reset,valid,\n  input logic [7:0] r0,r1,r2,\n  output logic [7:0] p00,p01,p02,p10,p11,p12,p20,p21,p22\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin\n      p00<=0;p01<=0;p02<=0;p10<=0;p11<=0;p12<=0;p20<=0;p21<=0;p22<=0;\n    end else if(valid) begin\n      p00<=p01;p01<=p02;p02<=r0;\n      p10<=p11;p11<=p12;p12<=r1;\n      p20<=p21;p21<=p22;p22<=r2;\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Shifts first row",
        "pattern": "p00\\s*<=\\s*p01[\\s\\S]*p01\\s*<=\\s*p02[\\s\\S]*p02\\s*<=\\s*r0",
        "flags": "i"
      },
      {
        "label": "Shifts second row",
        "pattern": "p10\\s*<=\\s*p11[\\s\\S]*p11\\s*<=\\s*p12[\\s\\S]*p12\\s*<=\\s*r1",
        "flags": "i"
      },
      {
        "label": "Shifts third row",
        "pattern": "p20\\s*<=\\s*p21[\\s\\S]*p21\\s*<=\\s*p22[\\s\\S]*p22\\s*<=\\s*r2",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "convolution-accelerator",
    "id": "conv-mac9",
    "title": "Nine-Tap Convolution MAC",
    "category": "Accelerators",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "convolution",
      "MAC",
      "datapath"
    ],
    "description": "Compute a signed 3x3 dot product between nine pixels and nine kernel coefficients.",
    "task": "Multiply all nine signed 8-bit pixel values by signed 8-bit coefficients and accumulate into a signed 24-bit output.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module conv_mac9(\n  input logic signed [7:0] p0,p1,p2,p3,p4,p5,p6,p7,p8,\n  input logic signed [7:0] k0,k1,k2,k3,k4,k5,k6,k7,k8,\n  output logic signed [23:0] sum\n);\n  // TODO\nendmodule",
    "solution": "module conv_mac9(\n  input logic signed [7:0] p0,p1,p2,p3,p4,p5,p6,p7,p8,\n  input logic signed [7:0] k0,k1,k2,k3,k4,k5,k6,k7,k8,\n  output logic signed [23:0] sum\n);\n  always_comb begin\n    sum=p0*k0+p1*k1+p2*k2+p3*k3+p4*k4+\n        p5*k5+p6*k6+p7*k7+p8*k8;\n  end\nendmodule",
    "checks": [
      {
        "label": "Includes first products",
        "pattern": "p0\\s*\\*\\s*k0[\\s\\S]*p1\\s*\\*\\s*k1[\\s\\S]*p2\\s*\\*\\s*k2",
        "flags": "i"
      },
      {
        "label": "Includes center product",
        "pattern": "p4\\s*\\*\\s*k4",
        "flags": "i"
      },
      {
        "label": "Includes final products",
        "pattern": "p6\\s*\\*\\s*k6[\\s\\S]*p7\\s*\\*\\s*k7[\\s\\S]*p8\\s*\\*\\s*k8",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "convolution-accelerator",
    "id": "conv-valid-pipe",
    "title": "Convolution Valid Pipeline",
    "category": "Accelerators",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "convolution",
      "pipeline",
      "valid"
    ],
    "description": "Align output validity with a three-stage convolution datapath.",
    "task": "Delay in_valid by three cycles using a shift register and clear the pipeline on reset.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module conv_valid_pipe(\n  input logic clk,reset,in_valid,\n  output logic out_valid\n);\n  // TODO\nendmodule",
    "solution": "module conv_valid_pipe(\n  input logic clk,reset,in_valid,\n  output logic out_valid\n);\n  logic [2:0] v;\n  always_ff @(posedge clk) begin\n    if(reset) v<=3'b000;\n    else v<={v[1:0],in_valid};\n  end\n  assign out_valid=v[2];\nendmodule",
    "checks": [
      {
        "label": "Three-stage valid register",
        "pattern": "logic\\s*\\[\\s*2\\s*:\\s*0\\s*\\]\\s*v",
        "flags": "i"
      },
      {
        "label": "Shifts input valid",
        "pattern": "v\\s*<=\\s*\\{\\s*v\\s*\\[\\s*1\\s*:\\s*0\\s*\\]\\s*,\\s*in_valid\\s*\\}",
        "flags": "i"
      },
      {
        "label": "Outputs final stage",
        "pattern": "out_valid\\s*=\\s*v\\s*\\[\\s*2\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "convolution-accelerator",
    "id": "conv-clamp8",
    "title": "8-bit Output Clamp",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "convolution",
      "saturation",
      "quantization"
    ],
    "description": "Convert a wide signed convolution result into an unsigned 8-bit pixel using saturation.",
    "task": "Clamp values below zero to 0, values above 255 to 255, otherwise pass the low 8-bit value.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module clamp_u8(\n  input logic signed [23:0] value_in,\n  output logic [7:0] pixel_out\n);\n  // TODO\nendmodule",
    "solution": "module clamp_u8(\n  input logic signed [23:0] value_in,\n  output logic [7:0] pixel_out\n);\n  always_comb begin\n    if(value_in<0) pixel_out=8'd0;\n    else if(value_in>24'sd255) pixel_out=8'd255;\n    else pixel_out=value_in[7:0];\n  end\nendmodule",
    "checks": [
      {
        "label": "Clamps negative",
        "pattern": "value_in\\s*<\\s*0[\\s\\S]*pixel_out\\s*=\\s*8'd0",
        "flags": "i"
      },
      {
        "label": "Clamps high",
        "pattern": "value_in\\s*>\\s*24'sd255[\\s\\S]*pixel_out\\s*=\\s*8'd255",
        "flags": "i"
      },
      {
        "label": "Passes in range",
        "pattern": "else\\s+pixel_out\\s*=\\s*value_in\\s*\\[\\s*7\\s*:\\s*0\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "convolution-accelerator",
    "id": "conv-accelerator-top",
    "title": "Streaming 3x3 Convolution Accelerator",
    "category": "Accelerators",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "convolution",
      "accelerator",
      "streaming"
    ],
    "description": "Integrate a streaming 3x3 convolution engine with valid/ready flow control.",
    "task": "Integrate row buffering, the sliding 3x3 window, nine coefficient MACs, 8-bit saturation and valid/ready flow control into one raster-streaming accelerator.",
    "examples": [
      "Complete the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this is a verification-only stage."
    ],
    "starterCode": "module conv3x3_accel #(parameter IMAGE_W=16)(\n  input logic clk,reset,\n  input logic in_valid,output logic in_ready,\n  input logic [7:0] pixel_in,\n  input logic signed [7:0] k0,k1,k2,k3,k4,k5,k6,k7,k8,\n  input logic out_ready,\n  output logic out_valid,\n  output logic [7:0] pixel_out\n);\n  // TODO: integrate line buffers, 3x3 window, MAC and clamp\nendmodule",
    "solution": "module conv3x3_accel #(parameter IMAGE_W=16)(\n  input logic clk,reset,\n  input logic in_valid,output logic in_ready,\n  input logic [7:0] pixel_in,\n  input logic signed [7:0] k0,k1,k2,k3,k4,k5,k6,k7,k8,\n  input logic out_ready,\n  output logic out_valid,\n  output logic [7:0] pixel_out\n);\n  logic [7:0] prev1[0:IMAGE_W-1],prev2[0:IMAGE_W-1];\n  logic [7:0] t1,t2,m1,m2,b1,b2;\n  logic [$clog2(IMAGE_W)-1:0] col;\n  logic [15:0] row;\n  logic signed [23:0] sum_comb;\n  logic [7:0] clamp_comb;\n\n  assign in_ready=!out_valid || out_ready;\n\n  always_comb begin\n    sum_comb =\n      $signed({1'b0,t1})*$signed(k0) +\n      $signed({1'b0,t2})*$signed(k1) +\n      $signed({1'b0,prev2[col]})*$signed(k2) +\n      $signed({1'b0,m1})*$signed(k3) +\n      $signed({1'b0,m2})*$signed(k4) +\n      $signed({1'b0,prev1[col]})*$signed(k5) +\n      $signed({1'b0,b1})*$signed(k6) +\n      $signed({1'b0,b2})*$signed(k7) +\n      $signed({1'b0,pixel_in})*$signed(k8);\n    if(sum_comb<0) clamp_comb=8'd0;\n    else if(sum_comb>24'sd255) clamp_comb=8'd255;\n    else clamp_comb=sum_comb[7:0];\n  end\n\n  always_ff @(posedge clk) begin\n    if(reset) begin\n      col<=0; row<=0; out_valid<=0; pixel_out<=0;\n      t1<=0;t2<=0;m1<=0;m2<=0;b1<=0;b2<=0;\n    end else begin\n      if(out_valid && out_ready) out_valid<=0;\n      if(in_valid && in_ready) begin\n        prev2[col]<=prev1[col];\n        prev1[col]<=pixel_in;\n        t1<=t2; t2<=prev2[col];\n        m1<=m2; m2<=prev1[col];\n        b1<=b2; b2<=pixel_in;\n        if(row>=2 && col>=2) begin\n          pixel_out<=clamp_comb;\n          out_valid<=1;\n        end\n        if(col==IMAGE_W-1) begin\n          col<=0; row<=row+1'b1;\n          t1<=0;t2<=0;m1<=0;m2<=0;b1<=0;b2<=0;\n        end else col<=col+1'b1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Backpressure-aware input",
        "pattern": "in_ready\\s*=\\s*!out_valid\\s*\\|\\|\\s*out_ready",
        "flags": "i"
      },
      {
        "label": "Maintains two previous rows",
        "pattern": "prev2\\s*\\[\\s*col\\s*\\]\\s*<=\\s*prev1\\s*\\[\\s*col\\s*\\][\\s\\S]*prev1\\s*\\[\\s*col\\s*\\]\\s*<=\\s*pixel_in",
        "flags": "i"
      },
      {
        "label": "Builds three window rows",
        "pattern": "t1\\s*<=\\s*t2[\\s\\S]*t2\\s*<=\\s*prev2\\s*\\[\\s*col\\s*\\][\\s\\S]*m1\\s*<=\\s*m2[\\s\\S]*b2\\s*<=\\s*pixel_in",
        "flags": "i"
      },
      {
        "label": "Nine coefficient MAC",
        "pattern": "k0[\\s\\S]*k1[\\s\\S]*k2[\\s\\S]*k3[\\s\\S]*k4[\\s\\S]*k5[\\s\\S]*k6[\\s\\S]*k7[\\s\\S]*k8",
        "flags": "i"
      },
      {
        "label": "Only emits complete windows",
        "pattern": "row\\s*>=\\s*2\\s*&&\\s*col\\s*>=\\s*2[\\s\\S]*pixel_out\\s*<=\\s*clamp_comb[\\s\\S]*out_valid\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectExpansionProblems2
