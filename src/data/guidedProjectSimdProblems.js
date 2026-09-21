const guidedProjectSimdProblems=[
  {
    "projectId": "simd-vector-unit",
    "id": "simd-lane-alu",
    "title": "SIMD Lane ALU",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SIMD",
      "ALU",
      "vector"
    ],
    "description": "Implement one 32-bit SIMD lane with add, subtract, minimum and maximum operations.",
    "task": "Use a 2-bit op: 00 add, 01 subtract, 10 signed min, 11 signed max.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module simd_lane_alu(\n  input logic signed [31:0] a,b,\n  input logic [1:0] op,\n  output logic signed [31:0] y\n);\n  // TODO\nendmodule",
    "solution": "module simd_lane_alu(\n  input logic signed [31:0] a,b,\n  input logic [1:0] op,\n  output logic signed [31:0] y\n);\n  always_comb begin\n    case(op)\n      2'b00:y=a+b;\n      2'b01:y=a-b;\n      2'b10:y=(a<b)?a:b;\n      2'b11:y=(a>b)?a:b;\n    endcase\n  end\nendmodule",
    "checks": [
      {
        "label": "Add operation",
        "pattern": "2'b00\\s*:\\s*y\\s*=\\s*a\\s*\\+\\s*b",
        "flags": "i"
      },
      {
        "label": "Subtract operation",
        "pattern": "2'b01\\s*:\\s*y\\s*=\\s*a\\s*-\\s*b",
        "flags": "i"
      },
      {
        "label": "Min and max",
        "pattern": "2'b10[\\s\\S]*a\\s*<\\s*b[\\s\\S]*2'b11[\\s\\S]*a\\s*>\\s*b",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "simd-vector-unit",
    "id": "simd-four-lanes",
    "title": "Four-Lane SIMD Datapath",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SIMD",
      "parallel lanes",
      "datapath"
    ],
    "description": "Apply the same arithmetic operation independently to four 32-bit lanes.",
    "task": "Compute y0..y3 from a0..a3 and b0..b3 using the shared op encoding from the lane ALU.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module simd4(\n  input logic signed [31:0] a0,a1,a2,a3,b0,b1,b2,b3,\n  input logic [1:0] op,\n  output logic signed [31:0] y0,y1,y2,y3\n);\n  // TODO\nendmodule",
    "solution": "module simd4(\n  input logic signed [31:0] a0,a1,a2,a3,b0,b1,b2,b3,\n  input logic [1:0] op,\n  output logic signed [31:0] y0,y1,y2,y3\n);\n  always_comb begin\n    case(op)\n      2'b00: begin y0=a0+b0;y1=a1+b1;y2=a2+b2;y3=a3+b3; end\n      2'b01: begin y0=a0-b0;y1=a1-b1;y2=a2-b2;y3=a3-b3; end\n      2'b10: begin y0=(a0<b0)?a0:b0;y1=(a1<b1)?a1:b1;y2=(a2<b2)?a2:b2;y3=(a3<b3)?a3:b3; end\n      default: begin y0=(a0>b0)?a0:b0;y1=(a1>b1)?a1:b1;y2=(a2>b2)?a2:b2;y3=(a3>b3)?a3:b3; end\n    endcase\n  end\nendmodule",
    "checks": [
      {
        "label": "Four add lanes",
        "pattern": "y0\\s*=\\s*a0\\s*\\+\\s*b0[\\s\\S]*y1\\s*=\\s*a1\\s*\\+\\s*b1[\\s\\S]*y2\\s*=\\s*a2\\s*\\+\\s*b2[\\s\\S]*y3\\s*=\\s*a3\\s*\\+\\s*b3",
        "flags": "i"
      },
      {
        "label": "Four subtract lanes",
        "pattern": "y0\\s*=\\s*a0\\s*-\\s*b0[\\s\\S]*y3\\s*=\\s*a3\\s*-\\s*b3",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "simd-vector-unit",
    "id": "simd-mask",
    "title": "Vector Mask Merge",
    "category": "Accelerators",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SIMD",
      "mask",
      "merge"
    ],
    "description": "Selectively update SIMD lanes using a four-bit predicate mask.",
    "task": "For each lane, choose new_value when its mask bit is 1; otherwise preserve old_value.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module simd_mask_merge(\n  input logic [3:0] mask,\n  input logic [31:0] old0,old1,old2,old3,new0,new1,new2,new3,\n  output logic [31:0] out0,out1,out2,out3\n);\n  // TODO\nendmodule",
    "solution": "module simd_mask_merge(\n  input logic [3:0] mask,\n  input logic [31:0] old0,old1,old2,old3,new0,new1,new2,new3,\n  output logic [31:0] out0,out1,out2,out3\n);\n  assign out0=mask[0]?new0:old0;\n  assign out1=mask[1]?new1:old1;\n  assign out2=mask[2]?new2:old2;\n  assign out3=mask[3]?new3:old3;\nendmodule",
    "checks": [
      {
        "label": "Lane zero mask",
        "pattern": "out0\\s*=\\s*mask\\s*\\[\\s*0\\s*\\]\\s*\\?\\s*new0\\s*:\\s*old0",
        "flags": "i"
      },
      {
        "label": "Lane three mask",
        "pattern": "out3\\s*=\\s*mask\\s*\\[\\s*3\\s*\\]\\s*\\?\\s*new3\\s*:\\s*old3",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "simd-vector-unit",
    "id": "simd-reduction",
    "title": "Vector Reduction Unit",
    "category": "Accelerators",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SIMD",
      "reduction",
      "tree"
    ],
    "description": "Reduce four signed lanes to either their sum or maximum.",
    "task": "When op_max is zero output the sum of all lanes; when high output the signed maximum.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module simd_reduce4(\n  input logic signed [31:0] x0,x1,x2,x3,\n  input logic op_max,\n  output logic signed [33:0] result\n);\n  // TODO\nendmodule",
    "solution": "module simd_reduce4(\n  input logic signed [31:0] x0,x1,x2,x3,\n  input logic op_max,\n  output logic signed [33:0] result\n);\n  logic signed [31:0] m01,m23,m;\n  always_comb begin\n    m01=(x0>x1)?x0:x1;\n    m23=(x2>x3)?x2:x3;\n    m=(m01>m23)?m01:m23;\n    if(op_max) result={{2{m[31]}},m};\n    else result=x0+x1+x2+x3;\n  end\nendmodule",
    "checks": [
      {
        "label": "Four-lane sum",
        "pattern": "result\\s*=\\s*x0\\s*\\+\\s*x1\\s*\\+\\s*x2\\s*\\+\\s*x3",
        "flags": "i"
      },
      {
        "label": "Pairwise maxima",
        "pattern": "m01\\s*=\\s*\\(\\s*x0\\s*>\\s*x1\\s*\\)[\\s\\S]*m23\\s*=\\s*\\(\\s*x2\\s*>\\s*x3\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Selects max mode",
        "pattern": "if\\s*\\(\\s*op_max\\s*\\)\\s*result",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "simd-vector-unit",
    "id": "simd-register-file",
    "title": "Vector Register File",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SIMD",
      "register file",
      "vector"
    ],
    "description": "Store eight architectural vector registers, each containing four 32-bit lanes.",
    "task": "Provide two combinational read ports and one synchronous write port. Register zero must remain all zeros.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module vector_regfile(\n  input logic clk,we,\n  input logic [2:0] rs1,rs2,rd,\n  input logic [127:0] wdata,\n  output logic [127:0] rdata1,rdata2\n);\n  // TODO\nendmodule",
    "solution": "module vector_regfile(\n  input logic clk,we,\n  input logic [2:0] rs1,rs2,rd,\n  input logic [127:0] wdata,\n  output logic [127:0] rdata1,rdata2\n);\n  logic [127:0] regs[0:7];\n  always_ff @(posedge clk)\n    if(we && rd!=3'd0) regs[rd]<=wdata;\n  assign rdata1=(rs1==0)?128'b0:regs[rs1];\n  assign rdata2=(rs2==0)?128'b0:regs[rs2];\nendmodule",
    "checks": [
      {
        "label": "Eight vector registers",
        "pattern": "logic\\s*\\[\\s*127\\s*:\\s*0\\s*\\]\\s*regs\\s*\\[\\s*0\\s*:\\s*7\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Protects register zero",
        "pattern": "we\\s*&&\\s*rd\\s*!=\\s*3'd0",
        "flags": "i"
      },
      {
        "label": "Zero reads as zero",
        "pattern": "rdata1\\s*=\\s*\\(\\s*rs1\\s*==\\s*0\\s*\\)\\s*\\?\\s*128'b0",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "simd-vector-unit",
    "id": "simd-pipeline-register",
    "title": "SIMD Execute Pipeline Register",
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SIMD",
      "pipeline",
      "valid"
    ],
    "description": "Pipeline a 128-bit vector result and its validity bit.",
    "task": "Capture vector_in and in_valid every enabled cycle. Clear output valid on reset.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module simd_pipe_reg(\n  input logic clk,reset,enable,in_valid,\n  input logic [127:0] vector_in,\n  output logic out_valid,\n  output logic [127:0] vector_out\n);\n  // TODO\nendmodule",
    "solution": "module simd_pipe_reg(\n  input logic clk,reset,enable,in_valid,\n  input logic [127:0] vector_in,\n  output logic out_valid,\n  output logic [127:0] vector_out\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin out_valid<=0;vector_out<=0; end\n    else if(enable) begin vector_out<=vector_in;out_valid<=in_valid; end\n  end\nendmodule",
    "checks": [
      {
        "label": "Enabled vector capture",
        "pattern": "else\\s+if\\s*\\(\\s*enable\\s*\\)[\\s\\S]*vector_out\\s*<=\\s*vector_in",
        "flags": "i"
      },
      {
        "label": "Pipelines valid",
        "pattern": "out_valid\\s*<=\\s*in_valid",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "simd-vector-unit",
    "id": "simd-top",
    "title": "Four-Lane SIMD Execution Unit",
    "category": "Accelerators",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SIMD",
      "CPU",
      "vector unit"
    ],
    "description": "Integrate four arithmetic lanes with per-lane masking and a registered output.",
    "task": "Accept two 128-bit vectors, a 2-bit operation and 4-bit mask. Compute add/sub/min/max per lane, preserve masked-off lanes from src_a, and register the result when in_valid.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module simd_vector_unit(\n  input logic clk,reset,in_valid,\n  input logic [1:0] op,\n  input logic [3:0] mask,\n  input logic [127:0] src_a,src_b,\n  output logic out_valid,\n  output logic [127:0] result\n);\n  // TODO\nendmodule",
    "solution": "module simd_vector_unit(\n  input logic clk,reset,in_valid,\n  input logic [1:0] op,\n  input logic [3:0] mask,\n  input logic [127:0] src_a,src_b,\n  output logic out_valid,\n  output logic [127:0] result\n);\n  logic [127:0] calc,merged;\n  integer i;\n  logic signed [31:0] a,b,y;\n  always_comb begin\n    calc=0;merged=src_a;\n    for(i=0;i<4;i=i+1) begin\n      a=$signed(src_a[i*32 +: 32]);\n      b=$signed(src_b[i*32 +: 32]);\n      case(op)\n        2'b00:y=a+b;\n        2'b01:y=a-b;\n        2'b10:y=(a<b)?a:b;\n        default:y=(a>b)?a:b;\n      endcase\n      calc[i*32 +: 32]=y;\n      if(mask[i]) merged[i*32 +: 32]=y;\n    end\n  end\n  always_ff @(posedge clk) begin\n    if(reset) begin result<=0;out_valid<=0; end\n    else begin result<=merged;out_valid<=in_valid; end\n  end\nendmodule",
    "checks": [
      {
        "label": "Iterates four lanes",
        "pattern": "for\\s*\\(\\s*i\\s*=\\s*0\\s*;\\s*i\\s*<\\s*4",
        "flags": "i"
      },
      {
        "label": "Supports add/sub",
        "pattern": "2'b00\\s*:\\s*y\\s*=\\s*a\\s*\\+\\s*b[\\s\\S]*2'b01\\s*:\\s*y\\s*=\\s*a\\s*-\\s*b",
        "flags": "i"
      },
      {
        "label": "Applies mask",
        "pattern": "if\\s*\\(\\s*mask\\s*\\[\\s*i\\s*\\]\\s*\\)\\s*merged\\s*\\[\\s*i\\s*\\*\\s*32\\s*\\+\\:\\s*32\\s*\\]\\s*=\\s*y",
        "flags": "i"
      },
      {
        "label": "Registers result",
        "pattern": "result\\s*<=\\s*merged[\\s\\S]*out_valid\\s*<=\\s*in_valid",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectSimdProblems
