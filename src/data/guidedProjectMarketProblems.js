const guidedProjectMarketProblems=[
  {
    "projectId": "low-latency-market-data-parser",
    "id": "md-word-counter",
    "title": "Feed Word Counter",
    "category": "FPGA",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "HFT",
      "market data",
      "streaming"
    ],
    "description": "Track 32-bit word position inside each market-data message.",
    "task": "Reset the counter on start_msg and increment once per valid word.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module md_word_counter(\n  input logic clk,reset,start_msg,word_valid,\n  output logic [7:0] word_index\n);\n  // TODO\nendmodule",
    "solution": "module md_word_counter(\n  input logic clk,reset,start_msg,word_valid,\n  output logic [7:0] word_index\n);\n  always_ff @(posedge clk) begin\n    if(reset || start_msg) word_index<=0;\n    else if(word_valid) word_index<=word_index+1'b1;\n  end\nendmodule",
    "checks": [
      {
        "label": "Message start clears count",
        "pattern": "reset\\s*\\|\\|\\s*start_msg[\\s\\S]*word_index\\s*<=\\s*0",
        "flags": "i"
      },
      {
        "label": "Valid word increments",
        "pattern": "word_valid[\\s\\S]*word_index\\s*<=\\s*word_index\\s*\\+\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "low-latency-market-data-parser",
    "id": "md-header-decode",
    "title": "Market Message Header Decoder",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "HFT",
      "protocol decode",
      "message type"
    ],
    "description": "Decode a compact first-word header into message type and sequence number.",
    "task": "On header_valid, capture type from bits 31:24 and sequence from bits 23:0, and pulse decoded_valid.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module md_header_decode(\n  input logic clk,reset,header_valid,\n  input logic [31:0] word,\n  output logic [7:0] msg_type,\n  output logic [23:0] sequence,\n  output logic decoded_valid\n);\n  // TODO\nendmodule",
    "solution": "module md_header_decode(\n  input logic clk,reset,header_valid,\n  input logic [31:0] word,\n  output logic [7:0] msg_type,\n  output logic [23:0] sequence,\n  output logic decoded_valid\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin msg_type<=0;sequence<=0;decoded_valid<=0; end\n    else begin\n      decoded_valid<=0;\n      if(header_valid) begin\n        msg_type<=word[31:24];\n        sequence<=word[23:0];\n        decoded_valid<=1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Captures message type",
        "pattern": "msg_type\\s*<=\\s*word\\s*\\[\\s*31\\s*:\\s*24\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Captures sequence",
        "pattern": "sequence\\s*<=\\s*word\\s*\\[\\s*23\\s*:\\s*0\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Pulses valid",
        "pattern": "decoded_valid\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "low-latency-market-data-parser",
    "id": "md-symbol-filter",
    "title": "Symbol Filter",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "HFT",
      "symbol filter",
      "comparison"
    ],
    "description": "Discard messages that do not match a configured symbol ID.",
    "task": "Compare a 32-bit symbol_id against configured_symbol and assert match only when field_valid is high.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module md_symbol_filter(\n  input logic field_valid,\n  input logic [31:0] symbol_id,configured_symbol,\n  output logic match\n);\n  // TODO\nendmodule",
    "solution": "module md_symbol_filter(\n  input logic field_valid,\n  input logic [31:0] symbol_id,configured_symbol,\n  output logic match\n);\n  assign match=field_valid && (symbol_id==configured_symbol);\nendmodule",
    "checks": [
      {
        "label": "Requires valid field",
        "pattern": "match\\s*=\\s*field_valid\\s*&&",
        "flags": "i"
      },
      {
        "label": "Compares symbol IDs",
        "pattern": "symbol_id\\s*==\\s*configured_symbol",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "low-latency-market-data-parser",
    "id": "md-price-quantity",
    "title": "Price / Quantity Extractor",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "HFT",
      "field extraction",
      "price"
    ],
    "description": "Capture normalized price and quantity from consecutive feed words.",
    "task": "At word index 2 capture signed price; at index 3 capture quantity and pulse fields_valid.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module md_price_quantity(\n  input logic clk,reset,word_valid,\n  input logic [7:0] word_index,\n  input logic [31:0] word,\n  output logic signed [31:0] price,\n  output logic [31:0] quantity,\n  output logic fields_valid\n);\n  // TODO\nendmodule",
    "solution": "module md_price_quantity(\n  input logic clk,reset,word_valid,\n  input logic [7:0] word_index,\n  input logic [31:0] word,\n  output logic signed [31:0] price,\n  output logic [31:0] quantity,\n  output logic fields_valid\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin price<=0;quantity<=0;fields_valid<=0; end\n    else begin\n      fields_valid<=0;\n      if(word_valid && word_index==8'd2) price<=$signed(word);\n      if(word_valid && word_index==8'd3) begin\n        quantity<=word;\n        fields_valid<=1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Captures price at index 2",
        "pattern": "word_index\\s*==\\s*8'd2[\\s\\S]*price\\s*<=\\s*\\$signed\\s*\\(\\s*word\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Captures quantity at index 3",
        "pattern": "word_index\\s*==\\s*8'd3[\\s\\S]*quantity\\s*<=\\s*word",
        "flags": "i"
      },
      {
        "label": "Pulses fields valid",
        "pattern": "quantity\\s*<=\\s*word[\\s\\S]*fields_valid\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "low-latency-market-data-parser",
    "id": "md-message-classifier",
    "title": "Message Classifier",
    "category": "FPGA",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "HFT",
      "classification",
      "combinational"
    ],
    "description": "Classify three feed message types into add, update and delete operations.",
    "task": "Map type 0x01 to add, 0x02 to update and 0x03 to delete. All other types produce no class.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module md_classifier(\n  input logic [7:0] msg_type,\n  output logic is_add,is_update,is_delete\n);\n  // TODO\nendmodule",
    "solution": "module md_classifier(\n  input logic [7:0] msg_type,\n  output logic is_add,is_update,is_delete\n);\n  always_comb begin\n    is_add=0;is_update=0;is_delete=0;\n    case(msg_type)\n      8'h01:is_add=1;\n      8'h02:is_update=1;\n      8'h03:is_delete=1;\n    endcase\n  end\nendmodule",
    "checks": [
      {
        "label": "Add class",
        "pattern": "8'h01\\s*:\\s*is_add\\s*=\\s*1",
        "flags": "i"
      },
      {
        "label": "Update class",
        "pattern": "8'h02\\s*:\\s*is_update\\s*=\\s*1",
        "flags": "i"
      },
      {
        "label": "Delete class",
        "pattern": "8'h03\\s*:\\s*is_delete\\s*=\\s*1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "low-latency-market-data-parser",
    "id": "md-latency-meter",
    "title": "Feed Latency Meter",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "HFT",
      "latency",
      "timestamp"
    ],
    "description": "Measure cycle latency from message start to normalized output.",
    "task": "Increment a free-running cycle counter. Capture start timestamp on start_msg and output latency on normalized_valid.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module md_latency_meter(\n  input logic clk,reset,start_msg,normalized_valid,\n  output logic [31:0] latency_cycles\n);\n  // TODO\nendmodule",
    "solution": "module md_latency_meter(\n  input logic clk,reset,start_msg,normalized_valid,\n  output logic [31:0] latency_cycles\n);\n  logic [31:0] cycles,start_cycle;\n  always_ff @(posedge clk) begin\n    if(reset) begin cycles<=0;start_cycle<=0;latency_cycles<=0; end\n    else begin\n      cycles<=cycles+1'b1;\n      if(start_msg) start_cycle<=cycles;\n      if(normalized_valid) latency_cycles<=cycles-start_cycle;\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Free-running timestamp",
        "pattern": "cycles\\s*<=\\s*cycles\\s*\\+\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Captures start time",
        "pattern": "if\\s*\\(\\s*start_msg\\s*\\)\\s*start_cycle\\s*<=\\s*cycles",
        "flags": "i"
      },
      {
        "label": "Computes cycle difference",
        "pattern": "latency_cycles\\s*<=\\s*cycles\\s*-\\s*start_cycle",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "low-latency-market-data-parser",
    "id": "md-parser-top",
    "title": "Low-Latency Market Data Parser",
    "category": "FPGA",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "HFT",
      "streaming",
      "fixed latency"
    ],
    "description": "Integrate a simplified fixed-format feed parser that emits normalized add/update/delete messages.",
    "task": "Accept one 32-bit word per cycle. Decode type/sequence at word 0, symbol at word 1, price at word 2 and quantity at word 3. Emit normalized_valid after quantity.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module market_data_parser(\n  input logic clk,reset,start_msg,in_valid,\n  input logic [31:0] in_word,\n  output logic normalized_valid,\n  output logic [7:0] msg_type,\n  output logic [23:0] sequence,\n  output logic [31:0] symbol,quantity,\n  output logic signed [31:0] price\n);\n  // TODO\nendmodule",
    "solution": "module market_data_parser(\n  input logic clk,reset,start_msg,in_valid,\n  input logic [31:0] in_word,\n  output logic normalized_valid,\n  output logic [7:0] msg_type,\n  output logic [23:0] sequence,\n  output logic [31:0] symbol,quantity,\n  output logic signed [31:0] price\n);\n  logic [2:0] index;\n  always_ff @(posedge clk) begin\n    if(reset || start_msg) begin index<=0;normalized_valid<=0; end\n    else begin\n      normalized_valid<=0;\n      if(in_valid) begin\n        case(index)\n          3'd0: begin msg_type<=in_word[31:24];sequence<=in_word[23:0]; end\n          3'd1: symbol<=in_word;\n          3'd2: price<=$signed(in_word);\n          3'd3: begin quantity<=in_word;normalized_valid<=1; end\n        endcase\n        index<=index+1'b1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Header decode",
        "pattern": "3'd0[\\s\\S]*msg_type\\s*<=\\s*in_word\\s*\\[\\s*31\\s*:\\s*24\\s*\\][\\s\\S]*sequence\\s*<=\\s*in_word\\s*\\[\\s*23\\s*:\\s*0\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Symbol and price",
        "pattern": "3'd1\\s*:\\s*symbol\\s*<=\\s*in_word[\\s\\S]*3'd2\\s*:\\s*price\\s*<=\\s*\\$signed\\s*\\(\\s*in_word\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Quantity emits normalized message",
        "pattern": "3'd3[\\s\\S]*quantity\\s*<=\\s*in_word[\\s\\S]*normalized_valid\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectMarketProblems
