const guidedProjectFormalCacheProblems=[
  {
    "projectId": "formal-cache-verification",
    "id": "fcache-env-assumptions",
    "title": "Cache Formal Environment Assumptions",
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
      "cache",
      "assume property"
    ],
    "description": "Constrain request behavior for formal cache proofs.",
    "task": "Assume reset is initially active and assume req_valid remains asserted with a stable request address while req_ready is low.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module cache_formal_env(input logic clk,reset_n,req_valid,req_ready,input logic [31:0] req_addr);\n  // TODO\nendmodule",
    "solution": "module cache_formal_env(input logic clk,reset_n,req_valid,req_ready,input logic [31:0] req_addr);\n  initial assume(!reset_n);\n  property p_request_stable;\n    @(posedge clk) disable iff(!reset_n)\n      req_valid && !req_ready |=> req_valid && $stable(req_addr);\n  endproperty\n  assume property(p_request_stable);\nendmodule",
    "checks": [
      {
        "label": "Initial reset assumption",
        "pattern": "initial\\s+assume\\s*\\(\\s*!reset_n\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Stalled request antecedent",
        "pattern": "req_valid\\s*&&\\s*!req_ready",
        "flags": "i"
      },
      {
        "label": "Stable request address",
        "pattern": "\\$stable\\s*\\(\\s*req_addr\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-cache-verification",
    "id": "fcache-hit-correctness",
    "title": "Cache Hit Correctness Property",
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
      "cache",
      "hit"
    ],
    "description": "Prove that a reported cache hit corresponds to a valid matching tag.",
    "task": "Assert hit implies line_valid and stored_tag==request_tag on the same sampled cycle.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module cache_hit_props(input logic clk,reset_n,hit,line_valid,input logic [23:0] stored_tag,request_tag);\n  // TODO\nendmodule",
    "solution": "module cache_hit_props(input logic clk,reset_n,hit,line_valid,input logic [23:0] stored_tag,request_tag);\n  property p_hit_correct;\n    @(posedge clk) disable iff(!reset_n)\n      hit |-> line_valid && (stored_tag==request_tag);\n  endproperty\n  assert property(p_hit_correct);\nendmodule",
    "checks": [
      {
        "label": "Hit implication",
        "pattern": "hit\\s*\\|->\\s*line_valid",
        "flags": "i"
      },
      {
        "label": "Tag match",
        "pattern": "stored_tag\\s*==\\s*request_tag",
        "flags": "i"
      },
      {
        "label": "Assertion present",
        "pattern": "assert\\s+property\\s*\\(\\s*p_hit_correct\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-cache-verification",
    "id": "fcache-no-false-hit",
    "title": "No False Cache Hit",
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
      "cache",
      "validity"
    ],
    "description": "Prove that an invalid line or tag mismatch cannot produce a hit.",
    "task": "Assert !line_valid implies !hit and stored_tag!=request_tag implies !hit.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module cache_no_false_hit(input logic clk,reset_n,hit,line_valid,input logic [23:0] stored_tag,request_tag);\n  // TODO\nendmodule",
    "solution": "module cache_no_false_hit(input logic clk,reset_n,hit,line_valid,input logic [23:0] stored_tag,request_tag);\n  assert property(@(posedge clk) disable iff(!reset_n) !line_valid |-> !hit);\n  assert property(@(posedge clk) disable iff(!reset_n) stored_tag!=request_tag |-> !hit);\nendmodule",
    "checks": [
      {
        "label": "Invalid line cannot hit",
        "pattern": "!line_valid\\s*\\|->\\s*!hit",
        "flags": "i"
      },
      {
        "label": "Tag mismatch cannot hit",
        "pattern": "stored_tag\\s*!=\\s*request_tag\\s*\\|->\\s*!hit",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-cache-verification",
    "id": "fcache-dirty-eviction",
    "title": "Dirty Eviction Ordering Property",
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
      "cache",
      "writeback"
    ],
    "description": "Prove dirty misses write back the victim before refill starts.",
    "task": "When miss && victim_dirty occurs, assert writeback_start occurs before refill_start. Use a bounded two-step sequence.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module cache_dirty_props(input logic clk,reset_n,miss,victim_dirty,writeback_start,refill_start);\n  // TODO\nendmodule",
    "solution": "module cache_dirty_props(input logic clk,reset_n,miss,victim_dirty,writeback_start,refill_start);\n  property p_dirty_before_refill;\n    @(posedge clk) disable iff(!reset_n)\n      miss && victim_dirty |-> ##[0:1] writeback_start ##[1:8] refill_start;\n  endproperty\n  assert property(p_dirty_before_refill);\nendmodule",
    "checks": [
      {
        "label": "Dirty miss antecedent",
        "pattern": "miss\\s*&&\\s*victim_dirty",
        "flags": "i"
      },
      {
        "label": "Writeback precedes refill",
        "pattern": "writeback_start\\s*##\\s*\\[\\s*1\\s*:\\s*8\\s*\\]\\s*refill_start",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-cache-verification",
    "id": "fcache-refill-order",
    "title": "Refill Beat Ordering Property",
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
      "cache",
      "refill"
    ],
    "description": "Prove the four-beat refill index advances monotonically without skipping beats.",
    "task": "When refill_fire occurs and beat_index is below 3, require next-cycle beat_index == past beat_index + 1.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module cache_refill_props(input logic clk,reset_n,refill_fire,input logic [1:0] beat_index);\n  // TODO\nendmodule",
    "solution": "module cache_refill_props(input logic clk,reset_n,refill_fire,input logic [1:0] beat_index);\n  property p_refill_increments;\n    @(posedge clk) disable iff(!reset_n)\n      refill_fire && beat_index<2'd3 |=> beat_index==$past(beat_index)+1'b1;\n  endproperty\n  assert property(p_refill_increments);\nendmodule",
    "checks": [
      {
        "label": "Checks refill handshake",
        "pattern": "refill_fire\\s*&&\\s*beat_index\\s*<\\s*2'd3",
        "flags": "i"
      },
      {
        "label": "Next index increments",
        "pattern": "beat_index\\s*==\\s*\\$past\\s*\\(\\s*beat_index\\s*\\)\\s*\\+\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-cache-verification",
    "id": "fcache-progress",
    "title": "Bounded Cache Progress Property",
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
      "cache",
      "liveness"
    ],
    "description": "Prove every accepted request eventually produces a response within a bounded interval.",
    "task": "If req_valid && req_ready occurs, require resp_valid within 1 to 32 cycles.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module cache_progress_props(input logic clk,reset_n,req_valid,req_ready,resp_valid);\n  // TODO\nendmodule",
    "solution": "module cache_progress_props(input logic clk,reset_n,req_valid,req_ready,resp_valid);\n  property p_bounded_response;\n    @(posedge clk) disable iff(!reset_n)\n      req_valid && req_ready |-> ##[1:32] resp_valid;\n  endproperty\n  assert property(p_bounded_response);\nendmodule",
    "checks": [
      {
        "label": "Accepted request antecedent",
        "pattern": "req_valid\\s*&&\\s*req_ready",
        "flags": "i"
      },
      {
        "label": "Bounded response",
        "pattern": "##\\s*\\[\\s*1\\s*:\\s*32\\s*\\]\\s*resp_valid",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "formal-cache-verification",
    "id": "fcache-cover-scenarios",
    "title": "Cache Formal Cover Scenarios",
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
      "cache",
      "cover property"
    ],
    "description": "Add reachability goals for hit, clean miss and dirty eviction paths.",
    "task": "Write three cover properties: a hit, a miss with !victim_dirty, and a miss with victim_dirty followed eventually by writeback_start.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module cache_cover_props(input logic clk,reset_n,hit,miss,victim_dirty,writeback_start);\n  // TODO\nendmodule",
    "solution": "module cache_cover_props(input logic clk,reset_n,hit,miss,victim_dirty,writeback_start);\n  cover property(@(posedge clk) disable iff(!reset_n) hit);\n  cover property(@(posedge clk) disable iff(!reset_n) miss && !victim_dirty);\n  cover property(@(posedge clk) disable iff(!reset_n) miss && victim_dirty ##[1:8] writeback_start);\nendmodule",
    "checks": [
      {
        "label": "Covers hit",
        "pattern": "cover\\s+property[\\s\\S]*\\bhit\\b",
        "flags": "i"
      },
      {
        "label": "Covers clean miss",
        "pattern": "miss\\s*&&\\s*!victim_dirty",
        "flags": "i"
      },
      {
        "label": "Covers dirty writeback path",
        "pattern": "miss\\s*&&\\s*victim_dirty\\s*##\\s*\\[\\s*1\\s*:\\s*8\\s*\\]\\s*writeback_start",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectFormalCacheProblems
