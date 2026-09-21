const guidedProjectFormalProblems=[
  {
    "projectId": "formal-verification-rtl",
    "id": "formal-reset-assumption",
    "title": "Formal Reset Assumptions",
    "category": "Formal Verification",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "formal",
      "assume property",
      "reset"
    ],
    "description": "Constrain the formal environment so reset is asserted initially and then released.",
    "task": "Write one initial-state assumption requiring reset low at time zero and another property preventing reset from reasserting after it has been released.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module formal_reset_env(input logic clk,reset_n);\n  // TODO\nendmodule",
    "solution": "module formal_reset_env(input logic clk,reset_n);\n  initial assume(!reset_n);\n  property p_reset_stays_released;\n    @(posedge clk) $past(reset_n) |-> reset_n;\n  endproperty\n  assume property(p_reset_stays_released);\nendmodule",
    "checks": [
      {
        "label": "Initial reset assumption",
        "pattern": "initial\\s+assume\\s*\\(\\s*!reset_n\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Past reset property",
        "pattern": "\\$past\\s*\\(\\s*reset_n\\s*\\)\\s*\\|->\\s*reset_n",
        "flags": "i"
      },
      {
        "label": "Uses assume property",
        "pattern": "assume\\s+property\\s*\\(\\s*p_reset_stays_released\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-verification-rtl",
    "id": "formal-fifo-bounds",
    "title": "FIFO Safety Properties",
    "category": "Formal Verification",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "formal",
      "FIFO",
      "SVA"
    ],
    "description": "Prove that FIFO occupancy never leaves its legal range.",
    "task": "For a FIFO with DEPTH=8 and a 4-bit count, assert count <= DEPTH and assert that full exactly matches count==DEPTH.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module fifo_formal_props(\n  input logic clk,reset_n,\n  input logic [3:0] count,\n  input logic full\n);\n  // TODO\nendmodule",
    "solution": "module fifo_formal_props(\n  input logic clk,reset_n,\n  input logic [3:0] count,\n  input logic full\n);\n  property p_count_bounded;\n    @(posedge clk) disable iff(!reset_n) count<=4'd8;\n  endproperty\n  assert property(p_count_bounded);\n\n  property p_full_exact;\n    @(posedge clk) disable iff(!reset_n) full == (count==4'd8);\n  endproperty\n  assert property(p_full_exact);\nendmodule",
    "checks": [
      {
        "label": "Count bounded",
        "pattern": "count\\s*<=\\s*4'd8",
        "flags": "i"
      },
      {
        "label": "Full matches depth",
        "pattern": "full\\s*==\\s*\\(\\s*count\\s*==\\s*4'd8\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Assertions present",
        "pattern": "assert\\s+property\\s*\\(\\s*p_count_bounded\\s*\\)[\\s\\S]*assert\\s+property\\s*\\(\\s*p_full_exact\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-verification-rtl",
    "id": "formal-fifo-order",
    "title": "FIFO Ordering Property",
    "category": "Formal Verification",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "formal",
      "FIFO",
      "ordering"
    ],
    "description": "Track one symbolic item and prove that the FIFO cannot reorder it.",
    "task": "Assume tracked_valid identifies an accepted symbolic input. Assert that when tracked_reaches_head is true and a read occurs, the output data equals tracked_data.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module fifo_order_property(\n  input logic clk,reset_n,\n  input logic read_fire,tracked_reaches_head,\n  input logic [31:0] tracked_data,rdata\n);\n  // TODO\nendmodule",
    "solution": "module fifo_order_property(\n  input logic clk,reset_n,\n  input logic read_fire,tracked_reaches_head,\n  input logic [31:0] tracked_data,rdata\n);\n  property p_tracked_order;\n    @(posedge clk) disable iff(!reset_n)\n      tracked_reaches_head && read_fire |-> rdata==tracked_data;\n  endproperty\n  assert property(p_tracked_order);\nendmodule",
    "checks": [
      {
        "label": "Triggers at tracked head",
        "pattern": "tracked_reaches_head\\s*&&\\s*read_fire",
        "flags": "i"
      },
      {
        "label": "Checks output equality",
        "pattern": "rdata\\s*==\\s*tracked_data",
        "flags": "i"
      },
      {
        "label": "Asserts ordering",
        "pattern": "assert\\s+property\\s*\\(\\s*p_tracked_order\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-verification-rtl",
    "id": "formal-arbiter-onehot",
    "title": "Arbiter Mutual Exclusion",
    "category": "Formal Verification",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "formal",
      "arbiter",
      "onehot"
    ],
    "description": "Prove that an arbiter never grants more than one requester simultaneously.",
    "task": "Assert $onehot0(grant) on every active cycle and assert grant implies a corresponding request.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module arbiter_formal_props(\n  input logic clk,reset_n,\n  input logic [3:0] req,grant\n);\n  // TODO\nendmodule",
    "solution": "module arbiter_formal_props(\n  input logic clk,reset_n,\n  input logic [3:0] req,grant\n);\n  property p_onehot;\n    @(posedge clk) disable iff(!reset_n) $onehot0(grant);\n  endproperty\n  assert property(p_onehot);\n\n  property p_grant_requested;\n    @(posedge clk) disable iff(!reset_n) (grant & ~req)==4'b0000;\n  endproperty\n  assert property(p_grant_requested);\nendmodule",
    "checks": [
      {
        "label": "Onehot-or-zero grant",
        "pattern": "\\$onehot0\\s*\\(\\s*grant\\s*\\)",
        "flags": "i"
      },
      {
        "label": "No unrequested grant",
        "pattern": "\\(\\s*grant\\s*&\\s*~req\\s*\\)\\s*==\\s*4'b0000",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-verification-rtl",
    "id": "formal-arbiter-liveness",
    "title": "Bounded Arbiter Liveness",
    "category": "Formal Verification",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "formal",
      "liveness",
      "arbiter"
    ],
    "description": "Prove a bounded progress guarantee for a requester that stays asserted.",
    "task": "If req[0] remains asserted, require grant[0] within four cycles.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module arbiter_liveness(\n  input logic clk,reset_n,\n  input logic [3:0] req,grant\n);\n  // TODO\nendmodule",
    "solution": "module arbiter_liveness(\n  input logic clk,reset_n,\n  input logic [3:0] req,grant\n);\n  property p_req0_progress;\n    @(posedge clk) disable iff(!reset_n)\n      req[0] |-> ##[0:4] grant[0];\n  endproperty\n  assert property(p_req0_progress);\nendmodule",
    "checks": [
      {
        "label": "Request zero antecedent",
        "pattern": "req\\s*\\[\\s*0\\s*\\]\\s*\\|->",
        "flags": "i"
      },
      {
        "label": "Bounded response",
        "pattern": "##\\s*\\[\\s*0\\s*:\\s*4\\s*\\]\\s*grant\\s*\\[\\s*0\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-verification-rtl",
    "id": "formal-ready-valid",
    "title": "Ready/Valid Stability Proof",
    "category": "Formal Verification",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "formal",
      "ready-valid",
      "SVA"
    ],
    "description": "Prove that a source obeys ready/valid backpressure semantics.",
    "task": "When valid is high and ready is low, assert valid remains high and payload remains stable on the next cycle.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module ready_valid_formal(\n  input logic clk,reset_n,\n  input logic valid,ready,\n  input logic [31:0] data\n);\n  // TODO\nendmodule",
    "solution": "module ready_valid_formal(\n  input logic clk,reset_n,\n  input logic valid,ready,\n  input logic [31:0] data\n);\n  property p_hold_stalled;\n    @(posedge clk) disable iff(!reset_n)\n      valid && !ready |=> valid && $stable(data);\n  endproperty\n  assert property(p_hold_stalled);\nendmodule",
    "checks": [
      {
        "label": "Stall antecedent",
        "pattern": "valid\\s*&&\\s*!ready",
        "flags": "i"
      },
      {
        "label": "Valid held",
        "pattern": "\\|=>\\s*valid",
        "flags": "i"
      },
      {
        "label": "Payload stable",
        "pattern": "\\$stable\\s*\\(\\s*data\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-verification-rtl",
    "id": "formal-cover-progress",
    "title": "Formal Cover Goals",
    "category": "Formal Verification",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "formal",
      "cover property",
      "reachability"
    ],
    "description": "Use cover properties to prove interesting states are reachable, not merely safe.",
    "task": "Add cover goals for a full FIFO state and for two consecutive successful ready/valid transfers.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module formal_cover_goals(\n  input logic clk,reset_n,\n  input logic fifo_full,valid,ready\n);\n  // TODO\nendmodule",
    "solution": "module formal_cover_goals(\n  input logic clk,reset_n,\n  input logic fifo_full,valid,ready\n);\n  cover property(@(posedge clk) disable iff(!reset_n) fifo_full);\n  cover property(@(posedge clk) disable iff(!reset_n)\n    (valid && ready) ##1 (valid && ready));\nendmodule",
    "checks": [
      {
        "label": "Covers full FIFO",
        "pattern": "cover\\s+property[\\s\\S]*fifo_full",
        "flags": "i"
      },
      {
        "label": "Covers consecutive transfers",
        "pattern": "valid\\s*&&\\s*ready\\s*\\)\\s*##1\\s*\\(\\s*valid\\s*&&\\s*ready",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectFormalProblems
