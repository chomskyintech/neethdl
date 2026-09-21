const guidedProjectCrossbarProblems=[
  {
    "projectId": "axi4-interconnect-crossbar",
    "id": "xbar-address-decode",
    "title": "AXI Crossbar Address Decoder",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI",
      "crossbar",
      "address decode"
    ],
    "description": "Decode a 32-bit request address to one of three AXI-Lite slaves.",
    "task": "Map 0x0000_0000-0x0000_FFFF to slave 0, 0x1000_0000-0x1000_FFFF to slave 1, 0x2000_0000-0x2000_FFFF to slave 2, otherwise assert decode_error.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module xbar_address_decode(input logic [31:0] addr,output logic [2:0] slave_sel,output logic decode_error);\n  // TODO\nendmodule",
    "solution": "module xbar_address_decode(input logic [31:0] addr,output logic [2:0] slave_sel,output logic decode_error);\n  always_comb begin\n    slave_sel=3'b000;\n    decode_error=1'b0;\n    case(addr[31:16])\n      16'h0000: slave_sel=3'b001;\n      16'h1000: slave_sel=3'b010;\n      16'h2000: slave_sel=3'b100;\n      default: decode_error=1'b1;\n    endcase\n  end\nendmodule",
    "checks": [
      {
        "label": "Slave zero decode",
        "pattern": "16'h0000\\s*:\\s*slave_sel\\s*=\\s*3'b001",
        "flags": "i"
      },
      {
        "label": "Slave one decode",
        "pattern": "16'h1000\\s*:\\s*slave_sel\\s*=\\s*3'b010",
        "flags": "i"
      },
      {
        "label": "Slave two decode",
        "pattern": "16'h2000\\s*:\\s*slave_sel\\s*=\\s*3'b100",
        "flags": "i"
      },
      {
        "label": "Decode error",
        "pattern": "default\\s*:\\s*decode_error\\s*=\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi4-interconnect-crossbar",
    "id": "xbar-round-robin",
    "title": "Two-Master Round-Robin Arbiter",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI",
      "arbitration",
      "round robin"
    ],
    "description": "Choose one of two requesting AXI masters fairly.",
    "task": "Grant one requester at a time. When both request, alternate priority using last_grant. Hold the selected grant while lock is high.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module xbar_rr_arbiter(input logic clk,reset,lock,input logic [1:0] req,output logic [1:0] grant);\n  // TODO\nendmodule",
    "solution": "module xbar_rr_arbiter(input logic clk,reset,lock,input logic [1:0] req,output logic [1:0] grant);\n  logic last_grant;\n  always_comb begin\n    grant=2'b00;\n    if(req==2'b01) grant=2'b01;\n    else if(req==2'b10) grant=2'b10;\n    else if(req==2'b11) grant=last_grant?2'b01:2'b10;\n  end\n  always_ff @(posedge clk) begin\n    if(reset) last_grant<=1'b0;\n    else if(!lock && grant[0]) last_grant<=1'b0;\n    else if(!lock && grant[1]) last_grant<=1'b1;\n  end\nendmodule",
    "checks": [
      {
        "label": "Onehot grant",
        "pattern": "grant\\s*=\\s*2'b00[\\s\\S]*2'b01[\\s\\S]*2'b10",
        "flags": "i"
      },
      {
        "label": "Alternates simultaneous requests",
        "pattern": "req\\s*==\\s*2'b11[\\s\\S]*last_grant\\s*\\?\\s*2'b01\\s*:\\s*2'b10",
        "flags": "i"
      },
      {
        "label": "Updates history only when unlocked",
        "pattern": "!lock\\s*&&\\s*grant\\s*\\[\\s*0\\s*\\][\\s\\S]*last_grant\\s*<=\\s*1'b0",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi4-interconnect-crossbar",
    "id": "xbar-request-route",
    "title": "AXI Request Router",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI",
      "routing",
      "ready-valid"
    ],
    "description": "Route one selected master's address and write data toward one selected slave.",
    "task": "Drive only the selected slave's AWVALID/WVALID. Return AWREADY/WREADY only to the granted master.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module xbar_request_route(\n  input logic [1:0] grant,input logic [2:0] slave_sel,\n  input logic [31:0] m0_awaddr,m1_awaddr,m0_wdata,m1_wdata,\n  input logic m0_awvalid,m1_awvalid,m0_wvalid,m1_wvalid,\n  input logic [2:0] s_awready,s_wready,\n  output logic [31:0] routed_awaddr,routed_wdata,\n  output logic [2:0] s_awvalid,s_wvalid,\n  output logic [1:0] m_awready,m_wready\n);\n  // TODO\nendmodule",
    "solution": "module xbar_request_route(\n  input logic [1:0] grant,input logic [2:0] slave_sel,\n  input logic [31:0] m0_awaddr,m1_awaddr,m0_wdata,m1_wdata,\n  input logic m0_awvalid,m1_awvalid,m0_wvalid,m1_wvalid,\n  input logic [2:0] s_awready,s_wready,\n  output logic [31:0] routed_awaddr,routed_wdata,\n  output logic [2:0] s_awvalid,s_wvalid,\n  output logic [1:0] m_awready,m_wready\n);\n  always_comb begin\n    routed_awaddr=grant[1]?m1_awaddr:m0_awaddr;\n    routed_wdata=grant[1]?m1_wdata:m0_wdata;\n    s_awvalid=3'b000; s_wvalid=3'b000; m_awready=2'b00; m_wready=2'b00;\n    if(grant[0]) begin\n      s_awvalid=slave_sel & {3{m0_awvalid}};\n      s_wvalid=slave_sel & {3{m0_wvalid}};\n      m_awready[0]=|(s_awready & slave_sel);\n      m_wready[0]=|(s_wready & slave_sel);\n    end else if(grant[1]) begin\n      s_awvalid=slave_sel & {3{m1_awvalid}};\n      s_wvalid=slave_sel & {3{m1_wvalid}};\n      m_awready[1]=|(s_awready & slave_sel);\n      m_wready[1]=|(s_wready & slave_sel);\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Routes master address",
        "pattern": "routed_awaddr\\s*=\\s*grant\\s*\\[\\s*1\\s*\\]\\s*\\?\\s*m1_awaddr\\s*:\\s*m0_awaddr",
        "flags": "i"
      },
      {
        "label": "Masks valid with selected slave",
        "pattern": "s_awvalid\\s*=\\s*slave_sel\\s*&\\s*\\{\\s*3\\s*\\{\\s*m0_awvalid\\s*\\}\\s*\\}",
        "flags": "i"
      },
      {
        "label": "Returns ready to master zero",
        "pattern": "m_awready\\s*\\[\\s*0\\s*\\]\\s*=\\s*\\|\\s*\\(\\s*s_awready\\s*&\\s*slave_sel\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Returns ready to master one",
        "pattern": "m_awready\\s*\\[\\s*1\\s*\\]\\s*=\\s*\\|\\s*\\(\\s*s_awready\\s*&\\s*slave_sel\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi4-interconnect-crossbar",
    "id": "xbar-write-lock",
    "title": "AXI Write Ownership Lock",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI",
      "ordering",
      "ownership"
    ],
    "description": "Remember which master owns a write transaction until its B response completes.",
    "task": "Capture owner on AW handshake when idle. Keep busy asserted until bvalid && bready, then release ownership.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module xbar_write_lock(input logic clk,reset,aw_fire,input logic grant_master,input logic bvalid,bready,output logic busy,output logic owner);\n  // TODO\nendmodule",
    "solution": "module xbar_write_lock(input logic clk,reset,aw_fire,input logic grant_master,input logic bvalid,bready,output logic busy,output logic owner);\n  always_ff @(posedge clk) begin\n    if(reset) begin busy<=1'b0; owner<=1'b0; end\n    else begin\n      if(!busy && aw_fire) begin busy<=1'b1; owner<=grant_master; end\n      else if(busy && bvalid && bready) busy<=1'b0;\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Captures owner",
        "pattern": "!busy\\s*&&\\s*aw_fire[\\s\\S]*busy\\s*<=\\s*1'b1[\\s\\S]*owner\\s*<=\\s*grant_master",
        "flags": "i"
      },
      {
        "label": "Releases on response",
        "pattern": "busy\\s*&&\\s*bvalid\\s*&&\\s*bready[\\s\\S]*busy\\s*<=\\s*1'b0",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi4-interconnect-crossbar",
    "id": "xbar-response-route",
    "title": "AXI Response Router",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI",
      "responses",
      "routing"
    ],
    "description": "Route one slave write response back to the master that owns the transaction.",
    "task": "Use owner to choose master BVALID/BRESP. Propagate BREADY only to the selected slave.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module xbar_bresp_route(\n input logic owner,input logic [2:0] slave_sel,input logic [2:0] s_bvalid,input logic [5:0] s_bresp,input logic [1:0] m_bready,\n output logic [1:0] m_bvalid,output logic [3:0] m_bresp,output logic [2:0] s_bready);\n  // TODO\nendmodule",
    "solution": "module xbar_bresp_route(\n input logic owner,input logic [2:0] slave_sel,input logic [2:0] s_bvalid,input logic [5:0] s_bresp,input logic [1:0] m_bready,\n output logic [1:0] m_bvalid,output logic [3:0] m_bresp,output logic [2:0] s_bready);\n  logic any_valid; logic [1:0] resp;\n  always_comb begin\n    any_valid=|(s_bvalid & slave_sel);\n    resp=slave_sel[0]?s_bresp[1:0]:slave_sel[1]?s_bresp[3:2]:s_bresp[5:4];\n    m_bvalid=2'b00; m_bresp=4'b0000; s_bready=3'b000;\n    if(owner) begin m_bvalid[1]=any_valid; m_bresp[3:2]=resp; s_bready=slave_sel & {3{m_bready[1]}}; end\n    else begin m_bvalid[0]=any_valid; m_bresp[1:0]=resp; s_bready=slave_sel & {3{m_bready[0]}}; end\n  end\nendmodule",
    "checks": [
      {
        "label": "Selects slave response",
        "pattern": "slave_sel\\s*\\[\\s*0\\s*\\]\\s*\\?\\s*s_bresp\\s*\\[\\s*1\\s*:\\s*0\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Routes response to owner one",
        "pattern": "if\\s*\\(\\s*owner\\s*\\)[\\s\\S]*m_bvalid\\s*\\[\\s*1\\s*\\]\\s*=\\s*any_valid",
        "flags": "i"
      },
      {
        "label": "Routes response to owner zero",
        "pattern": "else\\s+begin[\\s\\S]*m_bvalid\\s*\\[\\s*0\\s*\\]\\s*=\\s*any_valid",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi4-interconnect-crossbar",
    "id": "xbar-decode-error",
    "title": "AXI Decode Error Responder",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI",
      "DECERR",
      "error response"
    ],
    "description": "Generate an AXI DECERR response for unmapped accesses without contacting a slave.",
    "task": "Latch an unmapped request and assert bvalid with BRESP=2'b11 until bready.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module xbar_decerr(input logic clk,reset,request_unmapped,bready,output logic bvalid,output logic [1:0] bresp);\n  // TODO\nendmodule",
    "solution": "module xbar_decerr(input logic clk,reset,request_unmapped,bready,output logic bvalid,output logic [1:0] bresp);\n  always_ff @(posedge clk) begin\n    if(reset) bvalid<=1'b0;\n    else begin\n      if(request_unmapped && !bvalid) bvalid<=1'b1;\n      else if(bvalid && bready) bvalid<=1'b0;\n    end\n  end\n  assign bresp=2'b11;\nendmodule",
    "checks": [
      {
        "label": "Latches unmapped request",
        "pattern": "request_unmapped\\s*&&\\s*!bvalid[\\s\\S]*bvalid\\s*<=\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Holds until ready",
        "pattern": "bvalid\\s*&&\\s*bready[\\s\\S]*bvalid\\s*<=\\s*1'b0",
        "flags": "i"
      },
      {
        "label": "DECERR code",
        "pattern": "bresp\\s*=\\s*2'b11",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "axi4-interconnect-crossbar",
    "id": "xbar-top",
    "title": "2x3 AXI-Lite Crossbar Top",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI",
      "crossbar",
      "integration"
    ],
    "description": "Integrate arbitration, address decode and transaction ownership for a two-master, three-slave AXI-Lite write crossbar.",
    "task": "Choose a master, decode its AW address, expose selected_master and selected_slave, and hold selection while a write transaction is outstanding.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module axi_lite_crossbar_top(\n input logic clk,reset,input logic [1:0] m_awvalid,input logic [31:0] m0_awaddr,m1_awaddr,input logic b_done,\n output logic [1:0] grant,output logic [2:0] slave_sel,output logic decode_error,output logic locked);\n  // TODO\nendmodule",
    "solution": "module axi_lite_crossbar_top(\n input logic clk,reset,input logic [1:0] m_awvalid,input logic [31:0] m0_awaddr,m1_awaddr,input logic b_done,\n output logic [1:0] grant,output logic [2:0] slave_sel,output logic decode_error,output logic locked);\n  logic owner;\n  logic [31:0] addr;\n  always_comb begin\n    grant=2'b00;\n    if(!locked) begin\n      if(m_awvalid[0]) grant=2'b01;\n      else if(m_awvalid[1]) grant=2'b10;\n    end else grant=owner?2'b10:2'b01;\n    addr=grant[1]?m1_awaddr:m0_awaddr;\n    slave_sel=3'b000; decode_error=1'b0;\n    case(addr[31:16])\n      16'h0000:slave_sel=3'b001;\n      16'h1000:slave_sel=3'b010;\n      16'h2000:slave_sel=3'b100;\n      default:decode_error=1'b1;\n    endcase\n  end\n  always_ff @(posedge clk) begin\n    if(reset) begin locked<=1'b0;owner<=1'b0; end\n    else begin\n      if(!locked && |grant) begin locked<=1'b1; owner<=grant[1]; end\n      else if(locked && b_done) locked<=1'b0;\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Two-master grant",
        "pattern": "grant\\s*=\\s*2'b00[\\s\\S]*m_awvalid\\s*\\[\\s*0\\s*\\][\\s\\S]*2'b01[\\s\\S]*m_awvalid\\s*\\[\\s*1\\s*\\][\\s\\S]*2'b10",
        "flags": "i"
      },
      {
        "label": "Decodes three slaves",
        "pattern": "16'h0000[\\s\\S]*3'b001[\\s\\S]*16'h1000[\\s\\S]*3'b010[\\s\\S]*16'h2000[\\s\\S]*3'b100",
        "flags": "i"
      },
      {
        "label": "Locks selected master",
        "pattern": "!locked\\s*&&\\s*\\|grant[\\s\\S]*locked\\s*<=\\s*1'b1[\\s\\S]*owner\\s*<=\\s*grant\\s*\\[\\s*1\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Unlocks on response",
        "pattern": "locked\\s*&&\\s*b_done[\\s\\S]*locked\\s*<=\\s*1'b0",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectCrossbarProblems
