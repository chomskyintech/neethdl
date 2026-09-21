const guidedProjectCrossbarVerificationProblems=[
  {
    "projectId": "axi-crossbar-verification",
    "id": "xbarv-sequence-item",
    "title": "AXI Crossbar Sequence Item",
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
      "AXI",
      "transaction"
    ],
    "description": "Represent one AXI-Lite write request including source master and target address.",
    "task": "Create a UVM sequence item with randomized master_id, addr and data plus observed resp.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "class xbar_item extends uvm_sequence_item;\n  // TODO\nendclass",
    "solution": "class xbar_item extends uvm_sequence_item;\n  rand bit master_id;\n  rand bit [31:0] addr;\n  rand bit [31:0] data;\n       bit [1:0] resp;\n  `uvm_object_utils_begin(xbar_item)\n    `uvm_field_int(master_id,UVM_ALL_ON)\n    `uvm_field_int(addr,UVM_ALL_ON)\n    `uvm_field_int(data,UVM_ALL_ON)\n    `uvm_field_int(resp,UVM_ALL_ON)\n  `uvm_object_utils_end\n  function new(string name=\"xbar_item\"); super.new(name); endfunction\nendclass",
    "checks": [
      {
        "label": "Extends UVM sequence item",
        "pattern": "class\\s+xbar_item\\s+extends\\s+uvm_sequence_item",
        "flags": "i"
      },
      {
        "label": "Randomizes source and payload",
        "pattern": "rand\\s+bit\\s+master_id[\\s\\S]*rand\\s+bit\\s*\\[\\s*31\\s*:\\s*0\\s*\\]\\s*addr[\\s\\S]*rand\\s+bit\\s*\\[\\s*31\\s*:\\s*0\\s*\\]\\s*data",
        "flags": "i"
      },
      {
        "label": "Registers UVM fields",
        "pattern": "\\x60uvm_object_utils_begin\\s*\\(\\s*xbar_item\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi-crossbar-verification",
    "id": "xbarv-random-sequence",
    "title": "Constrained Crossbar Traffic Sequence",
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
      "constrained random",
      "AXI"
    ],
    "description": "Generate mapped and unmapped AXI-Lite write traffic from both masters.",
    "task": "Create 200 items. Constrain addr to the three mapped 64 KB windows or 0xF000_0000 for DECERR testing.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "class xbar_random_sequence extends uvm_sequence #(xbar_item);\n  `uvm_object_utils(xbar_random_sequence)\n  // TODO\nendclass",
    "solution": "class xbar_random_sequence extends uvm_sequence #(xbar_item);\n  `uvm_object_utils(xbar_random_sequence)\n  task body();\n    xbar_item tr;\n    repeat(200) begin\n      tr=xbar_item::type_id::create(\"tr\");\n      start_item(tr);\n      if(!tr.randomize() with {\n        addr inside {[32'h00000000:32'h0000ffff],\n                     [32'h10000000:32'h1000ffff],\n                     [32'h20000000:32'h2000ffff],\n                     32'hf0000000};\n      }) `uvm_fatal(\"RAND\",\"xbar randomization failed\")\n      finish_item(tr);\n    end\n  endtask\nendclass",
    "checks": [
      {
        "label": "Generates 200 items",
        "pattern": "repeat\\s*\\(\\s*200\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Covers three mapped windows",
        "pattern": "00000000[\\s\\S]*0000ffff[\\s\\S]*10000000[\\s\\S]*1000ffff[\\s\\S]*20000000[\\s\\S]*2000ffff",
        "flags": "i"
      },
      {
        "label": "Includes unmapped traffic",
        "pattern": "32'hf0000000",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi-crossbar-verification",
    "id": "xbarv-monitor",
    "title": "AXI Crossbar Monitor",
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
      "monitor",
      "AXI"
    ],
    "description": "Observe accepted AXI-Lite write transactions and publish them for checking.",
    "task": "When awvalid&&awready and wvalid&&wready are both true, capture master_id, address and data then write the transaction to an analysis port.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "class xbar_monitor extends uvm_monitor;\n  `uvm_component_utils(xbar_monitor)\n  // TODO\nendclass",
    "solution": "class xbar_monitor extends uvm_monitor;\n  `uvm_component_utils(xbar_monitor)\n  uvm_analysis_port #(xbar_item) ap;\n  virtual xbar_if vif;\n  function new(string name,uvm_component parent); super.new(name,parent); ap=new(\"ap\",this); endfunction\n  task run_phase(uvm_phase phase);\n    forever begin\n      @(posedge vif.clk);\n      if(vif.awvalid && vif.awready && vif.wvalid && vif.wready) begin\n        xbar_item tr=xbar_item::type_id::create(\"tr\");\n        tr.master_id=vif.master_id; tr.addr=vif.awaddr; tr.data=vif.wdata;\n        ap.write(tr);\n      end\n    end\n  endtask\nendclass",
    "checks": [
      {
        "label": "Analysis port",
        "pattern": "uvm_analysis_port\\s*#\\s*\\(\\s*xbar_item\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Checks address handshake",
        "pattern": "vif\\.awvalid\\s*&&\\s*vif\\.awready",
        "flags": "i"
      },
      {
        "label": "Checks data handshake",
        "pattern": "vif\\.wvalid\\s*&&\\s*vif\\.wready",
        "flags": "i"
      },
      {
        "label": "Publishes transaction",
        "pattern": "ap\\.write\\s*\\(\\s*tr\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi-crossbar-verification",
    "id": "xbarv-scoreboard",
    "title": "Crossbar Routing Scoreboard",
    "category": "Scoreboards",
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
      "routing"
    ],
    "description": "Predict the expected slave from the address and compare it with the observed routed slave.",
    "task": "Map the same three windows as the RTL. Unmapped addresses expect slave_id=3 for the DECERR path.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "class xbar_scoreboard extends uvm_scoreboard;\n  `uvm_component_utils(xbar_scoreboard)\n  // TODO\nendclass",
    "solution": "class xbar_scoreboard extends uvm_scoreboard;\n  `uvm_component_utils(xbar_scoreboard)\n  uvm_analysis_imp #(xbar_item,xbar_scoreboard) imp;\n  int observed_slave;\n  function new(string name,uvm_component parent); super.new(name,parent); imp=new(\"imp\",this); endfunction\n  function void write(xbar_item tr);\n    int expected_slave;\n    case(tr.addr[31:16])\n      16'h0000:expected_slave=0;\n      16'h1000:expected_slave=1;\n      16'h2000:expected_slave=2;\n      default:expected_slave=3;\n    endcase\n    if(observed_slave!=expected_slave)\n      `uvm_error(\"XBAR_SCB\",$sformatf(\"addr=%08h exp=%0d got=%0d\",tr.addr,expected_slave,observed_slave))\n  endfunction\nendclass",
    "checks": [
      {
        "label": "Analysis implementation",
        "pattern": "uvm_analysis_imp\\s*#\\s*\\(\\s*xbar_item\\s*,\\s*xbar_scoreboard\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Predicts three slaves",
        "pattern": "16'h0000[\\s\\S]*expected_slave\\s*=\\s*0[\\s\\S]*16'h1000[\\s\\S]*expected_slave\\s*=\\s*1[\\s\\S]*16'h2000[\\s\\S]*expected_slave\\s*=\\s*2",
        "flags": "i"
      },
      {
        "label": "Predicts DECERR path",
        "pattern": "default\\s*:\\s*expected_slave\\s*=\\s*3",
        "flags": "i"
      },
      {
        "label": "Reports mismatch",
        "pattern": "uvm_error\\s*\\(\\s*\"XBAR_SCB\"",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi-crossbar-verification",
    "id": "xbarv-contention-sequence",
    "title": "Crossbar Contention Sequence",
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
      "arbitration",
      "contention"
    ],
    "description": "Create sustained contention so both masters repeatedly target the same slave.",
    "task": "Generate 50 paired writes to slave 1's address region, alternating master_id between 0 and 1.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "class xbar_contention_sequence extends uvm_sequence #(xbar_item);\n  `uvm_object_utils(xbar_contention_sequence)\n  // TODO\nendclass",
    "solution": "class xbar_contention_sequence extends uvm_sequence #(xbar_item);\n  `uvm_object_utils(xbar_contention_sequence)\n  task body();\n    xbar_item tr;\n    repeat(50) begin\n      for(int m=0;m<2;m++) begin\n        tr=xbar_item::type_id::create($sformatf(\"tr%0d\",m));\n        start_item(tr);\n        tr.master_id=m;\n        tr.addr=32'h10000000;\n        tr.data=$urandom();\n        finish_item(tr);\n      end\n    end\n  endtask\nendclass",
    "checks": [
      {
        "label": "Fifty contention rounds",
        "pattern": "repeat\\s*\\(\\s*50\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Uses both masters",
        "pattern": "for\\s*\\(\\s*int\\s+m\\s*=\\s*0\\s*;\\s*m\\s*<\\s*2",
        "flags": "i"
      },
      {
        "label": "Targets same slave window",
        "pattern": "tr\\.addr\\s*=\\s*32'h10000000",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi-crossbar-verification",
    "id": "xbarv-assertions",
    "title": "AXI Crossbar Protocol Assertions",
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
      "AXI",
      "crossbar"
    ],
    "description": "Check grant exclusivity and stalled payload stability in the crossbar.",
    "task": "Assert grant is onehot0 and assert AWADDR remains stable while AWVALID is high and AWREADY is low.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module xbar_assertions(input logic clk,reset_n,input logic [1:0] grant,input logic awvalid,awready,input logic [31:0] awaddr);\n  // TODO\nendmodule",
    "solution": "module xbar_assertions(input logic clk,reset_n,input logic [1:0] grant,input logic awvalid,awready,input logic [31:0] awaddr);\n  assert property(@(posedge clk) disable iff(!reset_n) $onehot0(grant));\n  assert property(@(posedge clk) disable iff(!reset_n)\n    awvalid && !awready |=> awvalid && $stable(awaddr));\nendmodule",
    "checks": [
      {
        "label": "Onehot grant assertion",
        "pattern": "\\$onehot0\\s*\\(\\s*grant\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Stall antecedent",
        "pattern": "awvalid\\s*&&\\s*!awready",
        "flags": "i"
      },
      {
        "label": "Address stable",
        "pattern": "\\$stable\\s*\\(\\s*awaddr\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi-crossbar-verification",
    "id": "xbarv-coverage",
    "title": "Crossbar Functional Coverage",
    "category": "Functional Coverage",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "coverage",
      "AXI",
      "cross"
    ],
    "description": "Measure source-master, target-slave, response and contention scenarios.",
    "task": "Create coverpoints for master_id, slave_id, resp and both_requesting. Cross master_id with slave_id and slave_id with resp.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "class xbar_coverage extends uvm_subscriber #(xbar_item);\n  `uvm_component_utils(xbar_coverage)\n  // TODO\nendclass",
    "solution": "class xbar_coverage extends uvm_subscriber #(xbar_item);\n  `uvm_component_utils(xbar_coverage)\n  xbar_item tr;\n  int slave_id;\n  bit both_requesting;\n  covergroup cg;\n    cp_master: coverpoint tr.master_id;\n    cp_slave: coverpoint slave_id { bins s0={0}; bins s1={1}; bins s2={2}; bins decerr={3}; }\n    cp_resp: coverpoint tr.resp;\n    cp_contend: coverpoint both_requesting;\n    master_slave: cross cp_master,cp_slave;\n    slave_resp: cross cp_slave,cp_resp;\n  endgroup\n  function new(string name,uvm_component parent); super.new(name,parent); cg=new(); endfunction\n  function void write(xbar_item t); tr=t; cg.sample(); endfunction\nendclass",
    "checks": [
      {
        "label": "Master coverpoint",
        "pattern": "coverpoint\\s+tr\\.master_id",
        "flags": "i"
      },
      {
        "label": "Slave bins",
        "pattern": "bins\\s+s0[\\s\\S]*bins\\s+s1[\\s\\S]*bins\\s+s2[\\s\\S]*bins\\s+decerr",
        "flags": "i"
      },
      {
        "label": "Master-slave cross",
        "pattern": "cross\\s+cp_master\\s*,\\s*cp_slave",
        "flags": "i"
      },
      {
        "label": "Slave-response cross",
        "pattern": "cross\\s+cp_slave\\s*,\\s*cp_resp",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectCrossbarVerificationProblems
