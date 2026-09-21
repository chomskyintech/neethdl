const expansionGuidedProblems=[
  {
    "projectId": "uvm-axi4-lite-verification",
    "id": "uvm-axi-interface",
    "title": "AXI-Lite Verification Interface",
    "category": "UVM",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UVM",
      "AXI4-Lite",
      "interface"
    ],
    "description": "Define the signal-level contract shared by the AXI-Lite DUT and UVM components.",
    "task": "Create an AXI-Lite SystemVerilog interface with AW, W, B, AR and R channel signals plus separate driver and monitor clocking blocks.",
    "examples": [
      "Driver clocking block drives request/ready signals.",
      "Monitor clocking block samples all five AXI-Lite channels."
    ],
    "constraints": [
      "Use a single `clk` input.",
      "Declare AW/W/B/AR/R channel signals.",
      "Provide `drv_cb` and `mon_cb` clocking blocks."
    ],
    "starterCode": "interface axi_lite_if(input logic clk);\n  logic reset_n;\n  logic [31:0] awaddr, wdata, araddr, rdata;\n  logic [3:0]  wstrb;\n  logic [1:0]  bresp, rresp;\n  logic awvalid, awready, wvalid, wready;\n  logic bvalid, bready, arvalid, arready, rvalid, rready;\n  // TODO: add driver and monitor clocking blocks\nendinterface\n",
    "solution": "interface axi_lite_if(input logic clk);\n  logic reset_n;\n  logic [31:0] awaddr, wdata, araddr, rdata;\n  logic [3:0]  wstrb;\n  logic [1:0]  bresp, rresp;\n  logic awvalid, awready, wvalid, wready;\n  logic bvalid, bready, arvalid, arready, rvalid, rready;\n\n  clocking drv_cb @(posedge clk);\n    output awaddr, awvalid, wdata, wstrb, wvalid, bready, araddr, arvalid, rready;\n    input  awready, wready, bvalid, bresp, arready, rvalid, rdata, rresp;\n  endclocking\n\n  clocking mon_cb @(posedge clk);\n    input awaddr, awvalid, awready, wdata, wstrb, wvalid, wready;\n    input bvalid, bready, bresp, araddr, arvalid, arready;\n    input rvalid, rready, rdata, rresp;\n  endclocking\nendinterface\n",
    "checks": [
      {
        "label": "Driver clocking block",
        "pattern": "clocking\\s+drv_cb\\s*@\\s*\\(\\s*posedge\\s+clk\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Monitor clocking block",
        "pattern": "clocking\\s+mon_cb\\s*@\\s*\\(\\s*posedge\\s+clk\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Five AXI channels represented",
        "pattern": "awvalid[\\s\\S]*wvalid[\\s\\S]*bvalid[\\s\\S]*arvalid[\\s\\S]*rvalid",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "uvm-axi4-lite-verification",
    "id": "uvm-axi-sequence-item",
    "title": "AXI-Lite Sequence Item",
    "category": "UVM",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UVM",
      "sequence item",
      "randomization"
    ],
    "description": "Represent reads and writes as reusable randomized transactions.",
    "task": "Create a `uvm_sequence_item` containing operation type, address, write data, strobes, read data and response fields. Register every field with UVM automation macros.",
    "examples": [
      "A write transaction carries address, data and byte strobes.",
      "A read transaction carries an address and later receives read data/response."
    ],
    "constraints": [
      "Address and write payload should be randomizable.",
      "Use `uvm_object_utils_begin/end`.",
      "Include response data for scoreboard/monitor use."
    ],
    "starterCode": "class axi_lite_item extends uvm_sequence_item;\n  // TODO: add randomized request fields and observed response fields\n  `uvm_object_utils(axi_lite_item)\n  function new(string name=\"axi_lite_item\");\n    super.new(name);\n  endfunction\nendclass\n",
    "solution": "class axi_lite_item extends uvm_sequence_item;\n  rand bit        write;\n  rand bit [31:0] addr;\n  rand bit [31:0] wdata;\n  rand bit [3:0]  wstrb;\n       bit [31:0] rdata;\n       bit [1:0]  resp;\n\n  `uvm_object_utils_begin(axi_lite_item)\n    `uvm_field_int(write, UVM_ALL_ON)\n    `uvm_field_int(addr,  UVM_ALL_ON)\n    `uvm_field_int(wdata, UVM_ALL_ON)\n    `uvm_field_int(wstrb, UVM_ALL_ON)\n    `uvm_field_int(rdata, UVM_ALL_ON)\n    `uvm_field_int(resp,  UVM_ALL_ON)\n  `uvm_object_utils_end\n\n  function new(string name=\"axi_lite_item\");\n    super.new(name);\n  endfunction\nendclass\n",
    "checks": [
      {
        "label": "Extends sequence item",
        "pattern": "class\\s+axi_lite_item\\s+extends\\s+uvm_sequence_item",
        "flags": "i"
      },
      {
        "label": "Random request fields",
        "pattern": "rand\\s+bit[\\s\\S]{0,180}write[\\s\\S]{0,180}addr[\\s\\S]{0,180}wdata",
        "flags": "i"
      },
      {
        "label": "UVM field registration",
        "pattern": "\\x60uvm_object_utils_begin\\s*\\(\\s*axi_lite_item\\s*\\)[\\s\\S]*\\x60uvm_field_int",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "uvm-axi4-lite-verification",
    "id": "uvm-axi-driver",
    "title": "AXI-Lite UVM Driver",
    "category": "UVM",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UVM",
      "driver",
      "ready-valid"
    ],
    "description": "Translate sequence items into protocol-correct AXI-Lite pin activity.",
    "task": "Implement a UVM driver that gets an item from the sequencer, dispatches reads or writes, waits for ready/valid handshakes, then calls `item_done`.",
    "examples": [
      "Write: drive AW and W then accept B response.",
      "Read: drive AR then accept R response."
    ],
    "constraints": [
      "Use a virtual `axi_lite_if`.",
      "Use `get_next_item`/`item_done`.",
      "Wait for channel handshakes instead of fixed-cycle assumptions."
    ],
    "starterCode": "class axi_lite_driver extends uvm_driver #(axi_lite_item);\n  `uvm_component_utils(axi_lite_driver)\n  virtual axi_lite_if vif;\n  // TODO: drive read/write transactions\nendclass\n",
    "solution": "class axi_lite_driver extends uvm_driver #(axi_lite_item);\n  `uvm_component_utils(axi_lite_driver)\n  virtual axi_lite_if vif;\n\n  function new(string name, uvm_component parent);\n    super.new(name,parent);\n  endfunction\n\n  task run_phase(uvm_phase phase);\n    axi_lite_item tr;\n    forever begin\n      seq_item_port.get_next_item(tr);\n      if (tr.write) drive_write(tr);\n      else          drive_read(tr);\n      seq_item_port.item_done();\n    end\n  endtask\n\n  task drive_write(axi_lite_item tr);\n    vif.drv_cb.awaddr <= tr.addr;\n    vif.drv_cb.awvalid <= 1'b1;\n    do @(vif.drv_cb); while (!vif.drv_cb.awready);\n    vif.drv_cb.awvalid <= 1'b0;\n    vif.drv_cb.wdata <= tr.wdata;\n    vif.drv_cb.wstrb <= tr.wstrb;\n    vif.drv_cb.wvalid <= 1'b1;\n    do @(vif.drv_cb); while (!vif.drv_cb.wready);\n    vif.drv_cb.wvalid <= 1'b0;\n    vif.drv_cb.bready <= 1'b1;\n    do @(vif.drv_cb); while (!vif.drv_cb.bvalid);\n    vif.drv_cb.bready <= 1'b0;\n  endtask\n\n  task drive_read(axi_lite_item tr);\n    vif.drv_cb.araddr <= tr.addr;\n    vif.drv_cb.arvalid <= 1'b1;\n    do @(vif.drv_cb); while (!vif.drv_cb.arready);\n    vif.drv_cb.arvalid <= 1'b0;\n    vif.drv_cb.rready <= 1'b1;\n    do @(vif.drv_cb); while (!vif.drv_cb.rvalid);\n    vif.drv_cb.rready <= 1'b0;\n  endtask\nendclass\n",
    "checks": [
      {
        "label": "Sequencer handshake",
        "pattern": "get_next_item\\s*\\([\\s\\S]{0,220}item_done\\s*\\(",
        "flags": "i"
      },
      {
        "label": "Write handshake waits for ready",
        "pattern": "awvalid[\\s\\S]{0,260}awready[\\s\\S]{0,320}wvalid[\\s\\S]{0,260}wready",
        "flags": "i"
      },
      {
        "label": "Read handshake waits for response",
        "pattern": "arvalid[\\s\\S]{0,260}arready[\\s\\S]{0,260}rready[\\s\\S]{0,260}rvalid",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "uvm-axi4-lite-verification",
    "id": "uvm-axi-monitor",
    "title": "AXI-Lite UVM Monitor",
    "category": "UVM",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UVM",
      "monitor",
      "analysis port"
    ],
    "description": "Observe completed bus activity without driving the DUT.",
    "task": "Create a passive monitor with an analysis port. Reconstruct write and read transactions only when the corresponding ready/valid handshakes complete, then publish them.",
    "examples": [
      "AW/W completion forms a write transaction.",
      "AR/R completion forms a read transaction."
    ],
    "constraints": [
      "Use `uvm_analysis_port #(axi_lite_item)`.",
      "Sample through the monitor clocking block.",
      "Call `ap.write(tr)` for observed transactions."
    ],
    "starterCode": "class axi_lite_monitor extends uvm_monitor;\n  `uvm_component_utils(axi_lite_monitor)\n  virtual axi_lite_if vif;\n  // TODO: declare analysis port and publish completed transfers\nendclass\n",
    "solution": "class axi_lite_monitor extends uvm_monitor;\n  `uvm_component_utils(axi_lite_monitor)\n  virtual axi_lite_if vif;\n  uvm_analysis_port #(axi_lite_item) ap;\n\n  function new(string name, uvm_component parent);\n    super.new(name,parent);\n    ap = new(\"ap\",this);\n  endfunction\n\n  task run_phase(uvm_phase phase);\n    axi_lite_item tr;\n    forever begin\n      @(vif.mon_cb);\n      if (vif.mon_cb.awvalid && vif.mon_cb.awready &&\n          vif.mon_cb.wvalid  && vif.mon_cb.wready) begin\n        tr = axi_lite_item::type_id::create(\"wr\");\n        tr.write = 1'b1;\n        tr.addr  = vif.mon_cb.awaddr;\n        tr.wdata = vif.mon_cb.wdata;\n        tr.wstrb = vif.mon_cb.wstrb;\n        ap.write(tr);\n      end\n      if (vif.mon_cb.rvalid && vif.mon_cb.rready) begin\n        tr = axi_lite_item::type_id::create(\"rd\");\n        tr.write = 1'b0;\n        tr.rdata = vif.mon_cb.rdata;\n        tr.resp  = vif.mon_cb.rresp;\n        ap.write(tr);\n      end\n    end\n  endtask\nendclass\n",
    "checks": [
      {
        "label": "Analysis port declared",
        "pattern": "uvm_analysis_port\\s*#\\s*\\(\\s*axi_lite_item\\s*\\)\\s+ap",
        "flags": "i"
      },
      {
        "label": "Samples ready-valid handshakes",
        "pattern": "awvalid\\s*&&\\s*vif\\.mon_cb\\.awready[\\s\\S]*wvalid\\s*&&\\s*vif\\.mon_cb\\.wready",
        "flags": "i"
      },
      {
        "label": "Publishes observations",
        "pattern": "ap\\.write\\s*\\(\\s*tr\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "uvm-axi4-lite-verification",
    "id": "uvm-axi-scoreboard",
    "title": "AXI-Lite Reference Scoreboard",
    "category": "UVM",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UVM",
      "scoreboard",
      "reference model"
    ],
    "description": "Check reads against a compact reference register model updated by observed writes.",
    "task": "Implement a scoreboard analysis `write()` method. Apply write strobes to reference memory and compare read data against the stored expected word.",
    "examples": [
      "Observed write updates reference memory bytes selected by WSTRB.",
      "Observed read is compared with the reference word at the same address."
    ],
    "constraints": [
      "Use an analysis implementation.",
      "Model byte strobes.",
      "Report mismatches with `uvm_error`."
    ],
    "starterCode": "class axi_lite_scoreboard extends uvm_scoreboard;\n  `uvm_component_utils(axi_lite_scoreboard)\n  uvm_analysis_imp #(axi_lite_item, axi_lite_scoreboard) imp;\n  bit [31:0] ref_mem [0:255];\n  // TODO: update writes and check reads\nendclass\n",
    "solution": "class axi_lite_scoreboard extends uvm_scoreboard;\n  `uvm_component_utils(axi_lite_scoreboard)\n  uvm_analysis_imp #(axi_lite_item, axi_lite_scoreboard) imp;\n  bit [31:0] ref_mem [0:255];\n\n  function new(string name, uvm_component parent);\n    super.new(name,parent);\n    imp = new(\"imp\",this);\n  endfunction\n\n  function void write(axi_lite_item tr);\n    int idx = tr.addr[9:2];\n    if (tr.write) begin\n      for (int b=0;b<4;b++)\n        if (tr.wstrb[b]) ref_mem[idx][8*b +: 8] = tr.wdata[8*b +: 8];\n    end else if (tr.rdata !== ref_mem[idx]) begin\n      `uvm_error(\"AXI_SCB\",$sformatf(\"addr=%08h exp=%08h got=%08h\",\n        tr.addr,ref_mem[idx],tr.rdata))\n    end\n  endfunction\nendclass\n",
    "checks": [
      {
        "label": "Analysis implementation",
        "pattern": "uvm_analysis_imp\\s*#\\s*\\(\\s*axi_lite_item\\s*,\\s*axi_lite_scoreboard\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Byte strobes update model",
        "pattern": "wstrb\\s*\\[\\s*b\\s*\\][\\s\\S]{0,160}ref_mem[\\s\\S]{0,160}wdata",
        "flags": "i"
      },
      {
        "label": "Read mismatch reported",
        "pattern": "rdata\\s*!==\\s*ref_mem[\\s\\S]{0,180}\\x60uvm_error",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "uvm-axi4-lite-verification",
    "id": "uvm-axi-coverage",
    "title": "AXI-Lite Functional Coverage",
    "category": "UVM",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "coverage",
      "AXI4-Lite",
      "cross coverage"
    ],
    "description": "Measure whether verification exercised operation types, address regions, byte strobes and responses.",
    "task": "Create a covergroup that samples transaction direction, address region, write strobes and response, including at least one useful cross.",
    "examples": [
      "Cover reads and writes.",
      "Cross writes with byte-strobe patterns."
    ],
    "constraints": [
      "Use a covergroup with `coverpoint`.",
      "Include bins for common WSTRB patterns.",
      "Add a cross coverage item."
    ],
    "starterCode": "class axi_lite_coverage extends uvm_subscriber #(axi_lite_item);\n  `uvm_component_utils(axi_lite_coverage)\n  // TODO: add covergroup and sample received transactions\nendclass\n",
    "solution": "class axi_lite_coverage extends uvm_subscriber #(axi_lite_item);\n  `uvm_component_utils(axi_lite_coverage)\n  axi_lite_item tr;\n\n  covergroup cg;\n    cp_write: coverpoint tr.write;\n    cp_addr: coverpoint tr.addr[9:8] { bins regions[] = {[0:3]}; }\n    cp_wstrb: coverpoint tr.wstrb {\n      bins full = {4'hF};\n      bins byte[] = {4'h1,4'h2,4'h4,4'h8};\n    }\n    cp_resp: coverpoint tr.resp;\n    write_strobes: cross cp_write, cp_wstrb;\n  endgroup\n\n  function new(string name,uvm_component parent);\n    super.new(name,parent);\n    cg = new();\n  endfunction\n\n  function void write(axi_lite_item t);\n    tr = t;\n    cg.sample();\n  endfunction\nendclass\n",
    "checks": [
      {
        "label": "Covergroup present",
        "pattern": "covergroup\\s+cg",
        "flags": "i"
      },
      {
        "label": "Multiple coverpoints",
        "pattern": "coverpoint\\s+tr\\.write[\\s\\S]*coverpoint\\s+tr\\.addr[\\s\\S]*coverpoint\\s+tr\\.wstrb",
        "flags": "i"
      },
      {
        "label": "Cross coverage",
        "pattern": "cross\\s+cp_write\\s*,\\s*cp_wstrb",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "uvm-axi4-lite-verification",
    "id": "uvm-axi-assertions",
    "title": "AXI-Lite Protocol Assertions",
    "category": "SVA",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SVA",
      "AXI4-Lite",
      "protocol checking"
    ],
    "description": "Add protocol properties that catch payload instability and missing responses.",
    "task": "Write SVA properties requiring AW payload stability while stalled, W payload stability while stalled, and an eventual B response after an accepted write.",
    "examples": [
      "AWVALID && !AWREADY keeps AWADDR stable.",
      "WVALID && !WREADY keeps WDATA/WSTRB stable."
    ],
    "constraints": [
      "Use `property`/`assert property`.",
      "Check both address and data stall stability.",
      "Include a bounded write-response property."
    ],
    "starterCode": "module axi_lite_assertions(\n  input logic clk, reset_n,\n  input logic awvalid, awready,\n  input logic [31:0] awaddr,\n  input logic wvalid, wready,\n  input logic [31:0] wdata,\n  input logic [3:0] wstrb,\n  input logic bvalid\n);\n  // TODO: add AXI-Lite protocol properties\nendmodule\n",
    "solution": "module axi_lite_assertions(\n  input logic clk, reset_n,\n  input logic awvalid, awready,\n  input logic [31:0] awaddr,\n  input logic wvalid, wready,\n  input logic [31:0] wdata,\n  input logic [3:0] wstrb,\n  input logic bvalid\n);\n  property p_aw_stable;\n    @(posedge clk) disable iff(!reset_n)\n      awvalid && !awready |=> awvalid && $stable(awaddr);\n  endproperty\n  assert property(p_aw_stable);\n\n  property p_w_stable;\n    @(posedge clk) disable iff(!reset_n)\n      wvalid && !wready |=> wvalid && $stable({wdata,wstrb});\n  endproperty\n  assert property(p_w_stable);\n\n  property p_write_response;\n    @(posedge clk) disable iff(!reset_n)\n      (awvalid && awready && wvalid && wready) |-> ##[1:8] bvalid;\n  endproperty\n  assert property(p_write_response);\nendmodule\n",
    "checks": [
      {
        "label": "AW stall assertion",
        "pattern": "awvalid\\s*&&\\s*!awready[\\s\\S]{0,180}\\$stable\\s*\\(\\s*awaddr\\s*\\)",
        "flags": "i"
      },
      {
        "label": "W stall assertion",
        "pattern": "wvalid\\s*&&\\s*!wready[\\s\\S]{0,180}\\$stable\\s*\\(\\s*\\{\\s*wdata\\s*,\\s*wstrb\\s*\\}\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Bounded write response",
        "pattern": "awvalid\\s*&&\\s*awready[\\s\\S]{0,120}wvalid\\s*&&\\s*wready[\\s\\S]{0,120}##\\s*\\[\\s*1\\s*:\\s*8\\s*\\]\\s*bvalid",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "pipelined-risc-v-core",
    "id": "pipe-if-id",
    "title": "IF/ID Pipeline Register",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "pipeline",
      "IF/ID"
    ],
    "description": "Create the first stage boundary that preserves fetched PC and instruction.",
    "task": "Build an IF/ID register with enable and flush controls. Flush inserts the RV32I NOP `32'h00000013`.",
    "examples": [
      "enable=0 holds the current stage.",
      "flush=1 replaces the instruction with a NOP."
    ],
    "constraints": [
      "Synchronous active-high reset.",
      "Flush has priority over enable.",
      "Carry both PC and instruction."
    ],
    "starterCode": "module pipe_if_id(\n  input logic clk, reset, enable, flush,\n  input logic [31:0] pc_in, instr_in,\n  output logic [31:0] pc_out, instr_out\n);\n  // TODO: pipeline fetched PC/instruction\nendmodule\n",
    "solution": "module pipe_if_id(\n  input logic clk, reset, enable, flush,\n  input logic [31:0] pc_in, instr_in,\n  output logic [31:0] pc_out, instr_out\n);\n  always_ff @(posedge clk) begin\n    if (reset || flush) begin\n      pc_out <= '0;\n      instr_out <= 32'h00000013;\n    end else if (enable) begin\n      pc_out <= pc_in;\n      instr_out <= instr_in;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Pipeline register",
        "pattern": "always_ff\\s*@\\s*\\(\\s*posedge\\s+clk\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Flush inserts NOP",
        "pattern": "reset\\s*\\|\\|\\s*flush[\\s\\S]{0,160}instr_out\\s*<=\\s*32'h00000013",
        "flags": "i"
      },
      {
        "label": "Enable captures stage",
        "pattern": "else\\s+if\\s*\\(\\s*enable\\s*\\)[\\s\\S]{0,160}pc_out\\s*<=\\s*pc_in[\\s\\S]{0,120}instr_out\\s*<=\\s*instr_in",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "pipelined-risc-v-core",
    "id": "pipe-id-ex",
    "title": "ID/EX Pipeline Register",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "pipeline",
      "ID/EX"
    ],
    "description": "Carry decoded operands and control signals into the execute stage.",
    "task": "Register source operands, immediate, destination register and writeback controls. A bubble must clear side-effect controls.",
    "examples": [
      "bubble=1 disables register write and memory read/write.",
      "Normal cycle captures operands and control."
    ],
    "constraints": [
      "Use nonblocking assignments.",
      "Bubble must suppress side effects.",
      "Retain `rd`, operands and immediate on normal capture."
    ],
    "starterCode": "module pipe_id_ex(\n  input logic clk, reset, bubble,\n  input logic [31:0] rs1_in, rs2_in, imm_in,\n  input logic [4:0] rd_in,\n  input logic reg_write_in, mem_read_in, mem_write_in,\n  output logic [31:0] rs1_out, rs2_out, imm_out,\n  output logic [4:0] rd_out,\n  output logic reg_write_out, mem_read_out, mem_write_out\n);\n  // TODO: create ID/EX stage register\nendmodule\n",
    "solution": "module pipe_id_ex(\n  input logic clk, reset, bubble,\n  input logic [31:0] rs1_in, rs2_in, imm_in,\n  input logic [4:0] rd_in,\n  input logic reg_write_in, mem_read_in, mem_write_in,\n  output logic [31:0] rs1_out, rs2_out, imm_out,\n  output logic [4:0] rd_out,\n  output logic reg_write_out, mem_read_out, mem_write_out\n);\n  always_ff @(posedge clk) begin\n    if (reset || bubble) begin\n      reg_write_out <= 1'b0;\n      mem_read_out  <= 1'b0;\n      mem_write_out <= 1'b0;\n      rd_out <= '0;\n      rs1_out <= '0; rs2_out <= '0; imm_out <= '0;\n    end else begin\n      rs1_out <= rs1_in; rs2_out <= rs2_in; imm_out <= imm_in;\n      rd_out <= rd_in;\n      reg_write_out <= reg_write_in;\n      mem_read_out <= mem_read_in;\n      mem_write_out <= mem_write_in;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Bubble clears register write",
        "pattern": "reset\\s*\\|\\|\\s*bubble[\\s\\S]{0,160}reg_write_out\\s*<=\\s*1'b0",
        "flags": "i"
      },
      {
        "label": "Bubble clears memory controls",
        "pattern": "mem_read_out\\s*<=\\s*1'b0[\\s\\S]{0,100}mem_write_out\\s*<=\\s*1'b0",
        "flags": "i"
      },
      {
        "label": "Normal capture",
        "pattern": "rs1_out\\s*<=\\s*rs1_in[\\s\\S]{0,160}rd_out\\s*<=\\s*rd_in",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "pipelined-risc-v-core",
    "id": "pipe-forwarding",
    "title": "EX Forwarding Unit",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "hazards",
      "forwarding"
    ],
    "description": "Resolve common RAW dependencies without stalling when the producer value is already available.",
    "task": "Generate two 2-bit forwarding selects. Prefer the newest EX/MEM producer, otherwise use MEM/WB, while never forwarding x0.",
    "examples": [
      "EX/MEM rd matches rs1 → forward_a=2'b10.",
      "Otherwise MEM/WB rd matches rs1 → forward_a=2'b01."
    ],
    "constraints": [
      "Never forward register x0.",
      "EX/MEM has priority over MEM/WB.",
      "Handle rs1 and rs2 independently."
    ],
    "starterCode": "module forwarding_unit(\n  input logic [4:0] rs1, rs2, exmem_rd, memwb_rd,\n  input logic exmem_reg_write, memwb_reg_write,\n  output logic [1:0] forward_a, forward_b\n);\n  // TODO: choose register-file, EX/MEM or MEM/WB values\nendmodule\n",
    "solution": "module forwarding_unit(\n  input logic [4:0] rs1, rs2, exmem_rd, memwb_rd,\n  input logic exmem_reg_write, memwb_reg_write,\n  output logic [1:0] forward_a, forward_b\n);\n  always_comb begin\n    forward_a = 2'b00;\n    forward_b = 2'b00;\n    if (exmem_reg_write && exmem_rd != 5'd0 && exmem_rd == rs1) forward_a = 2'b10;\n    else if (memwb_reg_write && memwb_rd != 5'd0 && memwb_rd == rs1) forward_a = 2'b01;\n    if (exmem_reg_write && exmem_rd != 5'd0 && exmem_rd == rs2) forward_b = 2'b10;\n    else if (memwb_reg_write && memwb_rd != 5'd0 && memwb_rd == rs2) forward_b = 2'b01;\n  end\nendmodule\n",
    "checks": [
      {
        "label": "EX/MEM forward",
        "pattern": "exmem_reg_write[\\s\\S]{0,100}exmem_rd\\s*!=\\s*5'd0[\\s\\S]{0,100}exmem_rd\\s*==\\s*rs1[\\s\\S]{0,100}forward_a\\s*=\\s*2'b10",
        "flags": "i"
      },
      {
        "label": "MEM/WB fallback",
        "pattern": "else\\s+if\\s*\\(\\s*memwb_reg_write[\\s\\S]{0,180}forward_a\\s*=\\s*2'b01",
        "flags": "i"
      },
      {
        "label": "Second operand forwarding",
        "pattern": "exmem_rd\\s*==\\s*rs2[\\s\\S]{0,100}forward_b\\s*=\\s*2'b10",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "pipelined-risc-v-core",
    "id": "pipe-load-use-stall",
    "title": "Load-Use Hazard Detector",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "hazards",
      "stall"
    ],
    "description": "Detect the dependency that forwarding cannot resolve in time: an instruction immediately consuming a load result.",
    "task": "Assert `stall` when the execute-stage instruction is a load and its destination matches either decode-stage source register, excluding x0.",
    "examples": [
      "EX load rd=x5 and ID rs1=x5 → stall=1.",
      "EX rd=x0 → no stall."
    ],
    "constraints": [
      "Combinational logic only.",
      "Check both source operands.",
      "Do not stall on x0."
    ],
    "starterCode": "module load_use_hazard(\n  input logic ex_mem_read,\n  input logic [4:0] ex_rd, id_rs1, id_rs2,\n  output logic stall\n);\n  // TODO: detect load-use hazard\nendmodule\n",
    "solution": "module load_use_hazard(\n  input logic ex_mem_read,\n  input logic [4:0] ex_rd, id_rs1, id_rs2,\n  output logic stall\n);\n  always_comb begin\n    stall = ex_mem_read && (ex_rd != 5'd0) &&\n            ((ex_rd == id_rs1) || (ex_rd == id_rs2));\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Requires load",
        "pattern": "stall\\s*=\\s*ex_mem_read",
        "flags": "i"
      },
      {
        "label": "Excludes x0",
        "pattern": "ex_rd\\s*!=\\s*5'd0",
        "flags": "i"
      },
      {
        "label": "Checks both sources",
        "pattern": "ex_rd\\s*==\\s*id_rs1[\\s\\S]{0,80}\\|\\|[\\s\\S]{0,80}ex_rd\\s*==\\s*id_rs2",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "pipelined-risc-v-core",
    "id": "pipe-branch-flush",
    "title": "Branch Redirect and Flush",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "branch",
      "flush"
    ],
    "description": "Redirect fetch and invalidate younger work after a taken branch.",
    "task": "Select the next PC between sequential PC+4 and the branch target, and assert flush whenever a branch is taken.",
    "examples": [
      "branch_taken=0 → next_pc=pc_plus4.",
      "branch_taken=1 → next_pc=branch_target and flush=1."
    ],
    "constraints": [
      "Combinational logic.",
      "Flush exactly follows taken redirect.",
      "No speculative state beyond the redirect decision."
    ],
    "starterCode": "module branch_redirect(\n  input logic branch_taken,\n  input logic [31:0] pc_plus4, branch_target,\n  output logic [31:0] next_pc,\n  output logic flush\n);\n  // TODO: choose next PC and request a pipeline flush\nendmodule\n",
    "solution": "module branch_redirect(\n  input logic branch_taken,\n  input logic [31:0] pc_plus4, branch_target,\n  output logic [31:0] next_pc,\n  output logic flush\n);\n  always_comb begin\n    next_pc = branch_taken ? branch_target : pc_plus4;\n    flush = branch_taken;\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Taken branch redirects",
        "pattern": "next_pc\\s*=\\s*branch_taken\\s*\\?\\s*branch_target\\s*:\\s*pc_plus4",
        "flags": "i"
      },
      {
        "label": "Flush follows branch",
        "pattern": "flush\\s*=\\s*branch_taken",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "pipelined-risc-v-core",
    "id": "pipe-writeback-mux",
    "title": "Writeback Result Select",
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "writeback",
      "mux"
    ],
    "description": "Select the value returned to the architectural register file.",
    "task": "Choose between ALU result, load data and PC+4 using a compact writeback select.",
    "examples": [
      "wb_sel=00 → ALU result.",
      "wb_sel=01 → load data.",
      "wb_sel=10 → PC+4 for JAL/JALR."
    ],
    "constraints": [
      "Combinational logic.",
      "Provide a safe default.",
      "Support three result sources."
    ],
    "starterCode": "module wb_mux(\n  input logic [1:0] wb_sel,\n  input logic [31:0] alu_result, load_data, pc_plus4,\n  output logic [31:0] wb_data\n);\n  // TODO: select architectural writeback data\nendmodule\n",
    "solution": "module wb_mux(\n  input logic [1:0] wb_sel,\n  input logic [31:0] alu_result, load_data, pc_plus4,\n  output logic [31:0] wb_data\n);\n  always_comb begin\n    case (wb_sel)\n      2'b00: wb_data = alu_result;\n      2'b01: wb_data = load_data;\n      2'b10: wb_data = pc_plus4;\n      default: wb_data = 32'b0;\n    endcase\n  end\nendmodule\n",
    "checks": [
      {
        "label": "ALU writeback",
        "pattern": "2'b00\\s*:\\s*wb_data\\s*=\\s*alu_result",
        "flags": "i"
      },
      {
        "label": "Load writeback",
        "pattern": "2'b01\\s*:\\s*wb_data\\s*=\\s*load_data",
        "flags": "i"
      },
      {
        "label": "Link writeback",
        "pattern": "2'b10\\s*:\\s*wb_data\\s*=\\s*pc_plus4",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "pipelined-risc-v-core",
    "id": "pipe-control-integration",
    "title": "Pipeline Hazard Control Integration",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "RISC-V",
      "pipeline control",
      "integration"
    ],
    "description": "Combine stall and redirect decisions into coherent controls for the PC and stage registers.",
    "task": "Generate PC enable, IF/ID enable, IF/ID flush and ID/EX bubble controls. A taken branch flushes younger work; a load-use hazard freezes fetch/decode and bubbles execute.",
    "examples": [
      "load_stall=1 → pc_enable=0, ifid_enable=0, idex_bubble=1.",
      "branch_taken=1 → ifid_flush=1 and idex_bubble=1."
    ],
    "constraints": [
      "Branch redirect must not leave younger instructions alive.",
      "Stall freezes PC and IF/ID.",
      "Keep the logic purely combinational."
    ],
    "starterCode": "module pipeline_control(\n  input logic load_stall, branch_taken,\n  output logic pc_enable, ifid_enable, ifid_flush, idex_bubble\n);\n  // TODO: integrate stall and flush controls\nendmodule\n",
    "solution": "module pipeline_control(\n  input logic load_stall, branch_taken,\n  output logic pc_enable, ifid_enable, ifid_flush, idex_bubble\n);\n  always_comb begin\n    pc_enable   = !load_stall;\n    ifid_enable = !load_stall;\n    ifid_flush  = branch_taken;\n    idex_bubble = load_stall || branch_taken;\n  end\nendmodule\n",
    "checks": [
      {
        "label": "PC freezes on stall",
        "pattern": "pc_enable\\s*=\\s*!\\s*load_stall",
        "flags": "i"
      },
      {
        "label": "IF/ID freezes on stall",
        "pattern": "ifid_enable\\s*=\\s*!\\s*load_stall",
        "flags": "i"
      },
      {
        "label": "Branch flush and bubble",
        "pattern": "ifid_flush\\s*=\\s*branch_taken[\\s\\S]{0,100}idex_bubble\\s*=\\s*load_stall\\s*\\|\\|\\s*branch_taken",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "hardware-dsp-pipeline",
    "id": "dsp-fixed-mac",
    "title": "Signed Fixed-Point MAC",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DSP",
      "MAC",
      "fixed point"
    ],
    "description": "Build the arithmetic primitive used by the FIR datapath.",
    "task": "Multiply two signed 16-bit inputs and accumulate into a signed 40-bit register when `enable` is asserted.",
    "examples": [
      "enable=1 → acc += a*b.",
      "clear=1 → accumulator returns to zero."
    ],
    "constraints": [
      "Signed arithmetic.",
      "Synchronous clear.",
      "40-bit accumulator to reduce overflow risk."
    ],
    "starterCode": "module fixed_mac(\n  input logic clk, clear, enable,\n  input logic signed [15:0] a, b,\n  output logic signed [39:0] acc\n);\n  // TODO: multiply and accumulate\nendmodule\n",
    "solution": "module fixed_mac(\n  input logic clk, clear, enable,\n  input logic signed [15:0] a, b,\n  output logic signed [39:0] acc\n);\n  always_ff @(posedge clk) begin\n    if (clear) acc <= '0;\n    else if (enable) acc <= acc + a*b;\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Signed operands",
        "pattern": "logic\\s+signed\\s*\\[\\s*15\\s*:\\s*0\\s*\\]\\s*a\\s*,\\s*b",
        "flags": "i"
      },
      {
        "label": "Clear accumulator",
        "pattern": "if\\s*\\(\\s*clear\\s*\\)[\\s\\S]{0,80}acc\\s*<=\\s*'0",
        "flags": "i"
      },
      {
        "label": "MAC operation",
        "pattern": "acc\\s*<=\\s*acc\\s*\\+\\s*a\\s*\\*\\s*b",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "hardware-dsp-pipeline",
    "id": "dsp-delay-line",
    "title": "Four-Sample Delay Line",
    "category": "FPGA",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DSP",
      "FIR",
      "shift register"
    ],
    "description": "Store the current and previous input samples for a four-tap FIR.",
    "task": "On each valid sample, shift the delay line so `x0` is newest and `x3` is oldest.",
    "examples": [
      "First valid sample appears at x0.",
      "Each following sample pushes older values toward x3."
    ],
    "constraints": [
      "Shift only when `sample_valid` is high.",
      "Clear all taps on reset.",
      "Use signed 16-bit samples."
    ],
    "starterCode": "module sample_delay4(\n  input logic clk, reset, sample_valid,\n  input logic signed [15:0] sample_in,\n  output logic signed [15:0] x0, x1, x2, x3\n);\n  // TODO: shift valid samples through four taps\nendmodule\n",
    "solution": "module sample_delay4(\n  input logic clk, reset, sample_valid,\n  input logic signed [15:0] sample_in,\n  output logic signed [15:0] x0, x1, x2, x3\n);\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      x0<='0; x1<='0; x2<='0; x3<='0;\n    end else if (sample_valid) begin\n      x3<=x2; x2<=x1; x1<=x0; x0<=sample_in;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Valid-gated shift",
        "pattern": "else\\s+if\\s*\\(\\s*sample_valid\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Old samples move back",
        "pattern": "x3\\s*<=\\s*x2[\\s\\S]{0,80}x2\\s*<=\\s*x1[\\s\\S]{0,80}x1\\s*<=\\s*x0",
        "flags": "i"
      },
      {
        "label": "Newest sample captured",
        "pattern": "x0\\s*<=\\s*sample_in",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "hardware-dsp-pipeline",
    "id": "dsp-fir-sum",
    "title": "Four-Tap FIR Datapath",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DSP",
      "FIR",
      "parallel MAC"
    ],
    "description": "Compute the combinational weighted sum for four delayed samples.",
    "task": "Multiply four signed samples by four signed coefficients and sum the products into a wide signed result.",
    "examples": [
      "All four taps contribute in the same cycle.",
      "Output width is wider than individual products."
    ],
    "constraints": [
      "Treat samples and coefficients as signed.",
      "Use all four products.",
      "Provide at least 35 result bits."
    ],
    "starterCode": "module fir_sum4(\n  input logic signed [15:0] x0,x1,x2,x3,\n  input logic signed [15:0] c0,c1,c2,c3,\n  output logic signed [35:0] sum\n);\n  // TODO: weighted four-tap sum\nendmodule\n",
    "solution": "module fir_sum4(\n  input logic signed [15:0] x0,x1,x2,x3,\n  input logic signed [15:0] c0,c1,c2,c3,\n  output logic signed [35:0] sum\n);\n  always_comb begin\n    sum = x0*c0 + x1*c1 + x2*c2 + x3*c3;\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Uses tap zero",
        "pattern": "x0\\s*\\*\\s*c0",
        "flags": "i"
      },
      {
        "label": "Uses all remaining taps",
        "pattern": "x1\\s*\\*\\s*c1[\\s\\S]{0,80}x2\\s*\\*\\s*c2[\\s\\S]{0,80}x3\\s*\\*\\s*c3",
        "flags": "i"
      },
      {
        "label": "Wide signed output",
        "pattern": "output\\s+logic\\s+signed\\s*\\[\\s*35\\s*:\\s*0\\s*\\]\\s*sum",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "hardware-dsp-pipeline",
    "id": "dsp-valid-pipeline",
    "title": "DSP Valid Pipeline",
    "category": "FPGA",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DSP",
      "pipeline",
      "valid"
    ],
    "description": "Keep control timing aligned with a multi-stage arithmetic datapath.",
    "task": "Delay `in_valid` by three clock cycles and expose the final pulse as `out_valid`.",
    "examples": [
      "in_valid at cycle N → out_valid at N+3.",
      "reset clears all validity state."
    ],
    "constraints": [
      "Use a 3-bit shift register or equivalent.",
      "Synchronous reset.",
      "One clock of latency per stage."
    ],
    "starterCode": "module valid_pipe3(\n  input logic clk, reset, in_valid,\n  output logic out_valid\n);\n  // TODO: delay valid by three cycles\nendmodule\n",
    "solution": "module valid_pipe3(\n  input logic clk, reset, in_valid,\n  output logic out_valid\n);\n  logic [2:0] valid_q;\n  always_ff @(posedge clk) begin\n    if (reset) valid_q <= '0;\n    else valid_q <= {valid_q[1:0],in_valid};\n  end\n  assign out_valid = valid_q[2];\nendmodule\n",
    "checks": [
      {
        "label": "Three valid stages",
        "pattern": "logic\\s*\\[\\s*2\\s*:\\s*0\\s*\\]\\s*valid_q",
        "flags": "i"
      },
      {
        "label": "Shifts input valid",
        "pattern": "valid_q\\s*<=\\s*\\{\\s*valid_q\\s*\\[\\s*1\\s*:\\s*0\\s*\\]\\s*,\\s*in_valid\\s*\\}",
        "flags": "i"
      },
      {
        "label": "Output final stage",
        "pattern": "out_valid\\s*=\\s*valid_q\\s*\\[\\s*2\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "hardware-dsp-pipeline",
    "id": "dsp-saturate",
    "title": "Signed Saturation Stage",
    "category": "Accelerators",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DSP",
      "fixed point",
      "saturation"
    ],
    "description": "Reduce a wide accumulator to a 16-bit output without wraparound on overflow.",
    "task": "Saturate a signed 36-bit value to the signed 16-bit range [-32768, 32767].",
    "examples": [
      "40000 → 32767.",
      "-40000 → -32768.",
      "1234 → 1234."
    ],
    "constraints": [
      "Combinational logic.",
      "Clamp positive and negative overflow.",
      "Preserve in-range values."
    ],
    "starterCode": "module sat16(\n  input logic signed [35:0] value_in,\n  output logic signed [15:0] value_out\n);\n  // TODO: saturate to signed 16-bit range\nendmodule\n",
    "solution": "module sat16(\n  input logic signed [35:0] value_in,\n  output logic signed [15:0] value_out\n);\n  always_comb begin\n    if (value_in > 36'sd32767) value_out = 16'sd32767;\n    else if (value_in < -36'sd32768) value_out = -16'sd32768;\n    else value_out = value_in[15:0];\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Positive clamp",
        "pattern": "value_in\\s*>\\s*36'sd32767[\\s\\S]{0,100}value_out\\s*=\\s*16'sd32767",
        "flags": "i"
      },
      {
        "label": "Negative clamp",
        "pattern": "value_in\\s*<\\s*-\\s*36'sd32768[\\s\\S]{0,100}value_out\\s*=\\s*-\\s*16'sd32768",
        "flags": "i"
      },
      {
        "label": "Passes in-range bits",
        "pattern": "else\\s+value_out\\s*=\\s*value_in\\s*\\[\\s*15\\s*:\\s*0\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "hardware-dsp-pipeline",
    "id": "dsp-fir-stream-top",
    "title": "Streaming FIR Pipeline Top",
    "category": "FPGA",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DSP",
      "streaming",
      "integration"
    ],
    "description": "Combine sample storage, FIR arithmetic and registered output into a streaming block.",
    "task": "Create a four-tap FIR top that accepts `in_valid`, shifts samples, computes the weighted sum, registers the saturated result and asserts `out_valid` with the registered output.",
    "examples": [
      "Each valid input advances the filter.",
      "Output validity is delayed to match the registered result."
    ],
    "constraints": [
      "Instantiate/use a four-sample history.",
      "Use four coefficients.",
      "Register output and valid together."
    ],
    "starterCode": "module fir_stream4(\n  input logic clk, reset, in_valid,\n  input logic signed [15:0] sample_in,\n  input logic signed [15:0] c0,c1,c2,c3,\n  output logic out_valid,\n  output logic signed [15:0] sample_out\n);\n  // TODO: integrate a streaming four-tap FIR\nendmodule\n",
    "solution": "module fir_stream4(\n  input logic clk, reset, in_valid,\n  input logic signed [15:0] sample_in,\n  input logic signed [15:0] c0,c1,c2,c3,\n  output logic out_valid,\n  output logic signed [15:0] sample_out\n);\n  logic signed [15:0] x0,x1,x2,x3;\n  logic signed [35:0] sum;\n  logic signed [15:0] sat;\n\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      x0<='0; x1<='0; x2<='0; x3<='0;\n      sample_out<='0; out_valid<=1'b0;\n    end else begin\n      out_valid <= in_valid;\n      if (in_valid) begin\n        x3<=x2; x2<=x1; x1<=x0; x0<=sample_in;\n        sample_out <= sat;\n      end\n    end\n  end\n\n  assign sum = x0*c0 + x1*c1 + x2*c2 + x3*c3;\n  always_comb begin\n    if (sum > 36'sd32767) sat = 16'sd32767;\n    else if (sum < -36'sd32768) sat = -16'sd32768;\n    else sat = sum[15:0];\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Input advances history",
        "pattern": "if\\s*\\(\\s*in_valid\\s*\\)[\\s\\S]{0,180}x3\\s*<=\\s*x2[\\s\\S]{0,180}x0\\s*<=\\s*sample_in",
        "flags": "i"
      },
      {
        "label": "Four-tap arithmetic",
        "pattern": "sum\\s*=\\s*x0\\s*\\*\\s*c0[\\s\\S]{0,100}x3\\s*\\*\\s*c3",
        "flags": "i"
      },
      {
        "label": "Registers output and valid",
        "pattern": "out_valid\\s*<=\\s*in_valid[\\s\\S]{0,220}sample_out\\s*<=\\s*sat",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "matrix-multiplication-accelerator",
    "id": "matmul-mac-pe",
    "title": "Matrix MAC Processing Element",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "matrix multiply",
      "MAC",
      "PE"
    ],
    "description": "Create the processing element used repeatedly in the matrix accelerator.",
    "task": "Accumulate signed 16x16 products into a signed 40-bit accumulator with synchronous clear and enable.",
    "examples": [
      "clear=1 starts a new dot product.",
      "enable=1 adds one product."
    ],
    "constraints": [
      "Signed arithmetic.",
      "40-bit accumulation.",
      "Synchronous clear."
    ],
    "starterCode": "module matmul_pe(\n  input logic clk, clear, enable,\n  input logic signed [15:0] a, b,\n  output logic signed [39:0] acc\n);\n  // TODO: processing-element MAC\nendmodule\n",
    "solution": "module matmul_pe(\n  input logic clk, clear, enable,\n  input logic signed [15:0] a, b,\n  output logic signed [39:0] acc\n);\n  always_ff @(posedge clk) begin\n    if (clear) acc <= '0;\n    else if (enable) acc <= acc + a*b;\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Accumulator clear",
        "pattern": "if\\s*\\(\\s*clear\\s*\\)[\\s\\S]{0,80}acc\\s*<=\\s*'0",
        "flags": "i"
      },
      {
        "label": "Signed MAC",
        "pattern": "acc\\s*<=\\s*acc\\s*\\+\\s*a\\s*\\*\\s*b",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "matrix-multiplication-accelerator",
    "id": "matmul-dot2",
    "title": "Two-Element Dot Product",
    "category": "Accelerators",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "matrix multiply",
      "dot product",
      "datapath"
    ],
    "description": "Implement the arithmetic kernel for a 2x2 matrix result element.",
    "task": "Compute `a0*b0 + a1*b1` using signed 16-bit operands and a wide signed result.",
    "examples": [
      "[1,2]·[3,4] = 11.",
      "Negative operands retain signed behavior."
    ],
    "constraints": [
      "Use both products.",
      "Signed inputs.",
      "At least 32 output bits."
    ],
    "starterCode": "module dot2(\n  input logic signed [15:0] a0,a1,b0,b1,\n  output logic signed [32:0] result\n);\n  // TODO: two-product dot product\nendmodule\n",
    "solution": "module dot2(\n  input logic signed [15:0] a0,a1,b0,b1,\n  output logic signed [32:0] result\n);\n  always_comb result = a0*b0 + a1*b1;\nendmodule\n",
    "checks": [
      {
        "label": "First product",
        "pattern": "a0\\s*\\*\\s*b0",
        "flags": "i"
      },
      {
        "label": "Second product",
        "pattern": "a1\\s*\\*\\s*b1",
        "flags": "i"
      },
      {
        "label": "Adds products",
        "pattern": "a0\\s*\\*\\s*b0\\s*\\+\\s*a1\\s*\\*\\s*b1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "matrix-multiplication-accelerator",
    "id": "matmul-input-tile",
    "title": "2x2 Input Tile Registers",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "matrix multiply",
      "buffering",
      "registers"
    ],
    "description": "Capture two 2x2 input matrices so computation is isolated from the input interface.",
    "task": "On `load`, register A00..A11 and B00..B11. Hold the tile unchanged while compute is active.",
    "examples": [
      "load=1 captures all eight matrix elements.",
      "load=0 preserves the current tile."
    ],
    "constraints": [
      "Synchronous reset.",
      "Capture only on load.",
      "Use signed 16-bit elements."
    ],
    "starterCode": "module matmul_tile_regs(\n  input logic clk, reset, load,\n  input logic signed [15:0] a00_i,a01_i,a10_i,a11_i,\n  input logic signed [15:0] b00_i,b01_i,b10_i,b11_i,\n  output logic signed [15:0] a00,a01,a10,a11,\n  output logic signed [15:0] b00,b01,b10,b11\n);\n  // TODO: capture the matrix tile\nendmodule\n",
    "solution": "module matmul_tile_regs(\n  input logic clk, reset, load,\n  input logic signed [15:0] a00_i,a01_i,a10_i,a11_i,\n  input logic signed [15:0] b00_i,b01_i,b10_i,b11_i,\n  output logic signed [15:0] a00,a01,a10,a11,\n  output logic signed [15:0] b00,b01,b10,b11\n);\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      a00<='0;a01<='0;a10<='0;a11<='0;\n      b00<='0;b01<='0;b10<='0;b11<='0;\n    end else if (load) begin\n      a00<=a00_i;a01<=a01_i;a10<=a10_i;a11<=a11_i;\n      b00<=b00_i;b01<=b01_i;b10<=b10_i;b11<=b11_i;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Load-gated capture",
        "pattern": "else\\s+if\\s*\\(\\s*load\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Captures A tile",
        "pattern": "a00\\s*<=\\s*a00_i[\\s\\S]{0,140}a11\\s*<=\\s*a11_i",
        "flags": "i"
      },
      {
        "label": "Captures B tile",
        "pattern": "b00\\s*<=\\s*b00_i[\\s\\S]{0,140}b11\\s*<=\\s*b11_i",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "matrix-multiplication-accelerator",
    "id": "matmul-controller",
    "title": "Matrix Compute Controller",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "matrix multiply",
      "FSM",
      "control"
    ],
    "description": "Sequence input acceptance, one compute phase and output availability.",
    "task": "Implement IDLE, COMPUTE and DONE states. `start` leaves IDLE, COMPUTE lasts one cycle for a fully parallel 2x2 datapath, and DONE holds `out_valid` until `out_ready`.",
    "examples": [
      "start in IDLE → COMPUTE.",
      "COMPUTE → DONE.",
      "DONE + out_ready → IDLE."
    ],
    "constraints": [
      "Use an enumerated state type.",
      "Expose `busy` during COMPUTE.",
      "Hold `out_valid` during backpressure."
    ],
    "starterCode": "module matmul_ctrl(\n  input logic clk, reset, start, out_ready,\n  output logic compute, busy, out_valid\n);\n  // TODO: IDLE/COMPUTE/DONE controller\nendmodule\n",
    "solution": "module matmul_ctrl(\n  input logic clk, reset, start, out_ready,\n  output logic compute, busy, out_valid\n);\n  typedef enum logic [1:0] {IDLE,COMPUTE,DONE} state_t;\n  state_t state,next;\n\n  always_ff @(posedge clk) begin\n    if (reset) state <= IDLE;\n    else state <= next;\n  end\n\n  always_comb begin\n    next = state;\n    compute = 1'b0; busy = 1'b0; out_valid = 1'b0;\n    case(state)\n      IDLE: if (start) next = COMPUTE;\n      COMPUTE: begin compute=1'b1; busy=1'b1; next=DONE; end\n      DONE: begin out_valid=1'b1; if(out_ready) next=IDLE; end\n    endcase\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Three states",
        "pattern": "typedef\\s+enum[\\s\\S]{0,120}IDLE[\\s\\S]{0,80}COMPUTE[\\s\\S]{0,80}DONE",
        "flags": "i"
      },
      {
        "label": "Compute phase",
        "pattern": "COMPUTE\\s*:[\\s\\S]{0,120}compute\\s*=\\s*1'b1[\\s\\S]{0,120}next\\s*=\\s*DONE",
        "flags": "i"
      },
      {
        "label": "Output backpressure",
        "pattern": "DONE\\s*:[\\s\\S]{0,120}out_valid\\s*=\\s*1'b1[\\s\\S]{0,120}out_ready[\\s\\S]{0,80}next\\s*=\\s*IDLE",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "matrix-multiplication-accelerator",
    "id": "matmul-result-buffer",
    "title": "Matrix Result Buffer",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "matrix multiply",
      "buffer",
      "valid-ready"
    ],
    "description": "Store four result elements until the consumer accepts the complete output tile.",
    "task": "Capture C00..C11 on `capture`, assert `valid`, hold results under backpressure, and clear valid on `ready` handshake.",
    "examples": [
      "capture=1 stores all four results and valid=1.",
      "valid=1, ready=0 keeps results stable."
    ],
    "constraints": [
      "Capture atomically.",
      "Do not clear valid until ready.",
      "Synchronous reset."
    ],
    "starterCode": "module matmul_result_buf(\n  input logic clk, reset, capture, ready,\n  input logic signed [32:0] c00_i,c01_i,c10_i,c11_i,\n  output logic valid,\n  output logic signed [32:0] c00,c01,c10,c11\n);\n  // TODO: hold a completed result tile\nendmodule\n",
    "solution": "module matmul_result_buf(\n  input logic clk, reset, capture, ready,\n  input logic signed [32:0] c00_i,c01_i,c10_i,c11_i,\n  output logic valid,\n  output logic signed [32:0] c00,c01,c10,c11\n);\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      valid<=1'b0; c00<='0;c01<='0;c10<='0;c11<='0;\n    end else if (capture) begin\n      c00<=c00_i;c01<=c01_i;c10<=c10_i;c11<=c11_i;\n      valid<=1'b1;\n    end else if (valid && ready) begin\n      valid<=1'b0;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Capture four results",
        "pattern": "capture[\\s\\S]{0,120}c00\\s*<=\\s*c00_i[\\s\\S]{0,160}c11\\s*<=\\s*c11_i",
        "flags": "i"
      },
      {
        "label": "Capture raises valid",
        "pattern": "capture[\\s\\S]{0,260}valid\\s*<=\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Handshake clears valid",
        "pattern": "valid\\s*&&\\s*ready[\\s\\S]{0,100}valid\\s*<=\\s*1'b0",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "matrix-multiplication-accelerator",
    "id": "matmul-2x2-top",
    "title": "2x2 Matrix-Multiply Accelerator",
    "category": "Accelerators",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "matrix multiply",
      "accelerator",
      "integration"
    ],
    "description": "Integrate the complete parallel 2x2 matrix-multiplication datapath with input and output handshakes.",
    "task": "Accept a 2x2 A and B tile on `in_valid && in_ready`, compute all four dot products, register the four C elements, and hold `out_valid` until `out_ready`.",
    "examples": [
      "C00=A00*B00+A01*B10.",
      "C01=A00*B01+A01*B11.",
      "C10/C11 use the second row of A."
    ],
    "constraints": [
      "Do not accept new input while output is pending.",
      "Compute all four result elements.",
      "Hold output valid during backpressure."
    ],
    "starterCode": "module matmul2x2_accel(\n  input logic clk, reset,\n  input logic in_valid, output logic in_ready,\n  input logic signed [15:0] a00,a01,a10,a11,b00,b01,b10,b11,\n  output logic out_valid, input logic out_ready,\n  output logic signed [32:0] c00,c01,c10,c11\n);\n  // TODO: complete 2x2 accelerator\nendmodule\n",
    "solution": "module matmul2x2_accel(\n  input logic clk, reset,\n  input logic in_valid, output logic in_ready,\n  input logic signed [15:0] a00,a01,a10,a11,b00,b01,b10,b11,\n  output logic out_valid, input logic out_ready,\n  output logic signed [32:0] c00,c01,c10,c11\n);\n  assign in_ready = !out_valid;\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      out_valid<=1'b0;\n      c00<='0;c01<='0;c10<='0;c11<='0;\n    end else begin\n      if (in_valid && in_ready) begin\n        c00 <= a00*b00 + a01*b10;\n        c01 <= a00*b01 + a01*b11;\n        c10 <= a10*b00 + a11*b10;\n        c11 <= a10*b01 + a11*b11;\n        out_valid <= 1'b1;\n      end else if (out_valid && out_ready) begin\n        out_valid <= 1'b0;\n      end\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Input backpressure",
        "pattern": "in_ready\\s*=\\s*!\\s*out_valid",
        "flags": "i"
      },
      {
        "label": "Computes first row",
        "pattern": "c00\\s*<=\\s*a00\\s*\\*\\s*b00\\s*\\+\\s*a01\\s*\\*\\s*b10[\\s\\S]{0,140}c01\\s*<=\\s*a00\\s*\\*\\s*b01\\s*\\+\\s*a01\\s*\\*\\s*b11",
        "flags": "i"
      },
      {
        "label": "Computes second row",
        "pattern": "c10\\s*<=\\s*a10\\s*\\*\\s*b00\\s*\\+\\s*a11\\s*\\*\\s*b10[\\s\\S]{0,140}c11\\s*<=\\s*a10\\s*\\*\\s*b01\\s*\\+\\s*a11\\s*\\*\\s*b11",
        "flags": "i"
      },
      {
        "label": "Holds valid until handshake",
        "pattern": "in_valid\\s*&&\\s*in_ready[\\s\\S]{0,420}out_valid\\s*<=\\s*1'b1[\\s\\S]{0,180}else\\s+if\\s*\\(\\s*out_valid\\s*&&\\s*out_ready\\s*\\)[\\s\\S]{0,100}out_valid\\s*<=\\s*1'b0",
        "flags": "i"
      }
    ]
  }
]

export default expansionGuidedProblems
