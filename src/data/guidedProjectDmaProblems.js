const guidedProjectDmaProblems=[
  {
    "projectId": "dma-engine",
    "id": "dma-control-registers",
    "title": "DMA Control Registers",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DMA",
      "register map",
      "SoC"
    ],
    "description": "Implement programmable source, destination and transfer-length registers.",
    "task": "Provide writes at offsets 0x0 source, 0x4 destination, 0x8 length and 0xC control. Pulse start when bit 0 of the control word is written high.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module dma_registers(\n  input logic clk,reset,write,\n  input logic [3:0] addr,\n  input logic [31:0] wdata,\n  output logic [31:0] src_addr,dst_addr,length,\n  output logic start\n);\n  // TODO\nendmodule",
    "solution": "module dma_registers(\n  input logic clk,reset,write,\n  input logic [3:0] addr,\n  input logic [31:0] wdata,\n  output logic [31:0] src_addr,dst_addr,length,\n  output logic start\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin src_addr<=0;dst_addr<=0;length<=0;start<=0; end\n    else begin\n      start<=0;\n      if(write) case(addr)\n        4'h0:src_addr<=wdata;\n        4'h4:dst_addr<=wdata;\n        4'h8:length<=wdata;\n        4'hC:if(wdata[0]) start<=1;\n      endcase\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Source register",
        "pattern": "4'h0\\s*:\\s*src_addr\\s*<=\\s*wdata",
        "flags": "i"
      },
      {
        "label": "Destination register",
        "pattern": "4'h4\\s*:\\s*dst_addr\\s*<=\\s*wdata",
        "flags": "i"
      },
      {
        "label": "Length register",
        "pattern": "4'h8\\s*:\\s*length\\s*<=\\s*wdata",
        "flags": "i"
      },
      {
        "label": "Start pulse",
        "pattern": "4'hC[\\s\\S]*wdata\\s*\\[\\s*0\\s*\\][\\s\\S]*start\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "dma-engine",
    "id": "dma-address-generator",
    "title": "DMA Address Generator",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DMA",
      "address generation",
      "datapath"
    ],
    "description": "Track source and destination word addresses during a transfer.",
    "task": "Load base addresses on start. On each beat_done increment source and destination by four bytes.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module dma_addr_gen(\n  input logic clk,reset,start,beat_done,\n  input logic [31:0] src_base,dst_base,\n  output logic [31:0] src_addr,dst_addr\n);\n  // TODO\nendmodule",
    "solution": "module dma_addr_gen(\n  input logic clk,reset,start,beat_done,\n  input logic [31:0] src_base,dst_base,\n  output logic [31:0] src_addr,dst_addr\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin src_addr<=0;dst_addr<=0; end\n    else if(start) begin src_addr<=src_base;dst_addr<=dst_base; end\n    else if(beat_done) begin src_addr<=src_addr+32'd4;dst_addr<=dst_addr+32'd4; end\n  end\nendmodule",
    "checks": [
      {
        "label": "Loads base addresses",
        "pattern": "else\\s+if\\s*\\(\\s*start\\s*\\)[\\s\\S]*src_addr\\s*<=\\s*src_base[\\s\\S]*dst_addr\\s*<=\\s*dst_base",
        "flags": "i"
      },
      {
        "label": "Advances both addresses",
        "pattern": "beat_done[\\s\\S]*src_addr\\s*<=\\s*src_addr\\s*\\+\\s*32'd4[\\s\\S]*dst_addr\\s*<=\\s*dst_addr\\s*\\+\\s*32'd4",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "dma-engine",
    "id": "dma-read-engine",
    "title": "DMA Read Channel",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DMA",
      "ready-valid",
      "read"
    ],
    "description": "Issue one memory read request and hold it until accepted.",
    "task": "When request is asserted, raise read_valid with the address. Keep both stable until read_ready, then pulse accepted.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module dma_read_engine(\n  input logic clk,reset,request,read_ready,\n  input logic [31:0] address,\n  output logic read_valid,\n  output logic [31:0] read_addr,\n  output logic accepted\n);\n  // TODO\nendmodule",
    "solution": "module dma_read_engine(\n  input logic clk,reset,request,read_ready,\n  input logic [31:0] address,\n  output logic read_valid,\n  output logic [31:0] read_addr,\n  output logic accepted\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin read_valid<=0;read_addr<=0;accepted<=0; end\n    else begin\n      accepted<=0;\n      if(request && !read_valid) begin read_valid<=1;read_addr<=address; end\n      if(read_valid && read_ready) begin read_valid<=0;accepted<=1; end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Launches read request",
        "pattern": "request\\s*&&\\s*!read_valid[\\s\\S]*read_valid\\s*<=\\s*1[\\s\\S]*read_addr\\s*<=\\s*address",
        "flags": "i"
      },
      {
        "label": "Completes on handshake",
        "pattern": "read_valid\\s*&&\\s*read_ready[\\s\\S]*read_valid\\s*<=\\s*0[\\s\\S]*accepted\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "dma-engine",
    "id": "dma-write-engine",
    "title": "DMA Write Channel",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DMA",
      "ready-valid",
      "write"
    ],
    "description": "Buffer a read result and hold the write request until the destination accepts it.",
    "task": "On load_data capture data and address and assert write_valid. Keep them stable until write_ready, then pulse accepted.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module dma_write_engine(\n  input logic clk,reset,load_data,write_ready,\n  input logic [31:0] address,data_in,\n  output logic write_valid,\n  output logic [31:0] write_addr,write_data,\n  output logic accepted\n);\n  // TODO\nendmodule",
    "solution": "module dma_write_engine(\n  input logic clk,reset,load_data,write_ready,\n  input logic [31:0] address,data_in,\n  output logic write_valid,\n  output logic [31:0] write_addr,write_data,\n  output logic accepted\n);\n  always_ff @(posedge clk) begin\n    if(reset) begin write_valid<=0;write_addr<=0;write_data<=0;accepted<=0; end\n    else begin\n      accepted<=0;\n      if(load_data && !write_valid) begin\n        write_valid<=1;write_addr<=address;write_data<=data_in;\n      end\n      if(write_valid && write_ready) begin write_valid<=0;accepted<=1; end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Buffers address and data",
        "pattern": "load_data\\s*&&\\s*!write_valid[\\s\\S]*write_addr\\s*<=\\s*address[\\s\\S]*write_data\\s*<=\\s*data_in",
        "flags": "i"
      },
      {
        "label": "Completes on handshake",
        "pattern": "write_valid\\s*&&\\s*write_ready[\\s\\S]*accepted\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "dma-engine",
    "id": "dma-transfer-counter",
    "title": "DMA Transfer Counter",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DMA",
      "counter",
      "length"
    ],
    "description": "Track remaining bytes and detect the final word transfer.",
    "task": "Load remaining from length on start. Subtract four on each beat_done. Assert last_beat whenever remaining is four or less and nonzero.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module dma_transfer_counter(\n  input logic clk,reset,start,beat_done,\n  input logic [31:0] length,\n  output logic [31:0] remaining,\n  output logic last_beat\n);\n  // TODO\nendmodule",
    "solution": "module dma_transfer_counter(\n  input logic clk,reset,start,beat_done,\n  input logic [31:0] length,\n  output logic [31:0] remaining,\n  output logic last_beat\n);\n  always_ff @(posedge clk) begin\n    if(reset) remaining<=0;\n    else if(start) remaining<=length;\n    else if(beat_done && remaining!=0)\n      remaining <= (remaining<=4)?0:remaining-4;\n  end\n  assign last_beat=(remaining!=0)&&(remaining<=4);\nendmodule",
    "checks": [
      {
        "label": "Loads length",
        "pattern": "else\\s+if\\s*\\(\\s*start\\s*\\)\\s*remaining\\s*<=\\s*length",
        "flags": "i"
      },
      {
        "label": "Subtracts four bytes",
        "pattern": "remaining\\s*<=\\s*4\\s*\\)\\s*\\?\\s*0\\s*:\\s*remaining\\s*-\\s*4",
        "flags": "i"
      },
      {
        "label": "Last-beat detect",
        "pattern": "last_beat\\s*=\\s*\\(\\s*remaining\\s*!=\\s*0\\s*\\)\\s*&&\\s*\\(\\s*remaining\\s*<=\\s*4\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "dma-engine",
    "id": "dma-controller",
    "title": "DMA Transfer Controller",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DMA",
      "FSM",
      "control"
    ],
    "description": "Sequence one read and one write for each copied word.",
    "task": "Implement IDLE, READ, WRITE and DONE states. Start enters READ; read_done enters WRITE; write_done either loops to READ or enters DONE on last_beat.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module dma_controller(\n  input logic clk,reset,start,read_done,write_done,last_beat,\n  output logic issue_read,issue_write,busy,done\n);\n  // TODO\nendmodule",
    "solution": "module dma_controller(\n  input logic clk,reset,start,read_done,write_done,last_beat,\n  output logic issue_read,issue_write,busy,done\n);\n  typedef enum logic [1:0] {IDLE,READ,WRITE,DONE} state_t;\n  state_t state,next;\n  always_ff @(posedge clk) begin\n    if(reset) state<=IDLE; else state<=next;\n  end\n  always_comb begin\n    next=state;issue_read=0;issue_write=0;busy=0;done=0;\n    case(state)\n      IDLE:if(start) next=READ;\n      READ:begin busy=1;issue_read=1;if(read_done) next=WRITE;end\n      WRITE:begin busy=1;issue_write=1;if(write_done) next=last_beat?DONE:READ;end\n      DONE:begin done=1;next=IDLE;end\n    endcase\n  end\nendmodule",
    "checks": [
      {
        "label": "Four controller states",
        "pattern": "IDLE[\\s\\S]*READ[\\s\\S]*WRITE[\\s\\S]*DONE",
        "flags": "i"
      },
      {
        "label": "Read then write",
        "pattern": "READ[\\s\\S]*read_done[\\s\\S]*next\\s*=\\s*WRITE",
        "flags": "i"
      },
      {
        "label": "Loops or finishes",
        "pattern": "write_done[\\s\\S]*last_beat\\s*\\?\\s*DONE\\s*:\\s*READ",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "dma-engine",
    "id": "dma-top",
    "title": "Memory-Copy DMA Engine",
    "category": "Accelerators",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "DMA",
      "SoC",
      "integration"
    ],
    "description": "Integrate control, address progression and transfer counting for a programmable word-copy engine.",
    "task": "Expose source/destination read/write requests. Start from programmed addresses and length, advance after each completed write, and pulse irq when the final beat completes.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module dma_engine_top(\n  input logic clk,reset,start,\n  input logic [31:0] src_base,dst_base,length,\n  input logic read_ready,write_ready,\n  output logic read_valid,write_valid,\n  output logic [31:0] read_addr,write_addr,\n  output logic busy,irq\n);\n  // TODO\nendmodule",
    "solution": "module dma_engine_top(\n  input logic clk,reset,start,\n  input logic [31:0] src_base,dst_base,length,\n  input logic read_ready,write_ready,\n  output logic read_valid,write_valid,\n  output logic [31:0] read_addr,write_addr,\n  output logic busy,irq\n);\n  logic [31:0] remaining;\n  logic have_read;\n  always_ff @(posedge clk) begin\n    if(reset) begin\n      read_addr<=0;write_addr<=0;remaining<=0;\n      read_valid<=0;write_valid<=0;have_read<=0;busy<=0;irq<=0;\n    end else begin\n      irq<=0;\n      if(start && !busy) begin\n        read_addr<=src_base;write_addr<=dst_base;remaining<=length;\n        read_valid<=1;write_valid<=0;busy<=1;have_read<=0;\n      end\n      if(read_valid && read_ready) begin\n        read_valid<=0;write_valid<=1;have_read<=1;\n      end\n      if(write_valid && write_ready && have_read) begin\n        write_valid<=0;have_read<=0;\n        if(remaining<=4) begin remaining<=0;busy<=0;irq<=1; end\n        else begin\n          remaining<=remaining-4;\n          read_addr<=read_addr+4;\n          write_addr<=write_addr+4;\n          read_valid<=1;\n        end\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Starts programmed transfer",
        "pattern": "start\\s*&&\\s*!busy[\\s\\S]*read_addr\\s*<=\\s*src_base[\\s\\S]*write_addr\\s*<=\\s*dst_base[\\s\\S]*remaining\\s*<=\\s*length",
        "flags": "i"
      },
      {
        "label": "Read-to-write sequencing",
        "pattern": "read_valid\\s*&&\\s*read_ready[\\s\\S]*write_valid\\s*<=\\s*1",
        "flags": "i"
      },
      {
        "label": "Advances addresses",
        "pattern": "read_addr\\s*<=\\s*read_addr\\s*\\+\\s*4[\\s\\S]*write_addr\\s*<=\\s*write_addr\\s*\\+\\s*4",
        "flags": "i"
      },
      {
        "label": "Final beat raises IRQ",
        "pattern": "remaining\\s*<=\\s*4[\\s\\S]*busy\\s*<=\\s*0[\\s\\S]*irq\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectDmaProblems
