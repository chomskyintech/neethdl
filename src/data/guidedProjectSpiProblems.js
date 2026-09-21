const guidedProjectSpiProblems=[
  {
    "projectId": "spi-controller",
    "id": "spi-clock-divider",
    "title": "SPI Clock Divider",
    "category": "FPGA",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SPI",
      "clock divider",
      "serial"
    ],
    "description": "Generate a programmable SPI clock-enable tick from the system clock.",
    "task": "Count from zero to DIV-1 and pulse tick for one cycle, then restart from zero.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module spi_clock_divider #(parameter DIV=4)(\n  input logic clk,reset,enable,\n  output logic tick\n);\n  // TODO\nendmodule",
    "solution": "module spi_clock_divider #(parameter DIV=4)(\n  input logic clk,reset,enable,\n  output logic tick\n);\n  logic [$clog2(DIV)-1:0] count;\n  always_ff @(posedge clk) begin\n    if(reset) begin count<='0;tick<=1'b0; end\n    else begin\n      tick<=1'b0;\n      if(enable) begin\n        if(count==DIV-1) begin count<='0;tick<=1'b1; end\n        else count<=count+1'b1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Terminal count",
        "pattern": "count\\s*==\\s*DIV\\s*-\\s*1",
        "flags": "i"
      },
      {
        "label": "Tick pulse",
        "pattern": "tick\\s*<=\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Counter wraps",
        "pattern": "count\\s*<=\\s*'0",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "spi-controller",
    "id": "spi-sclk-generator",
    "title": "SPI SCLK Generator",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SPI",
      "CPOL",
      "clocking"
    ],
    "description": "Generate SCLK with programmable idle polarity.",
    "task": "When active and tick is asserted, toggle SCLK. When inactive, force SCLK to CPOL.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module spi_sclk_gen(\n  input logic clk,reset,active,tick,cpol,\n  output logic sclk\n);\n  // TODO\nendmodule",
    "solution": "module spi_sclk_gen(\n  input logic clk,reset,active,tick,cpol,\n  output logic sclk\n);\n  always_ff @(posedge clk) begin\n    if(reset) sclk<=1'b0;\n    else if(!active) sclk<=cpol;\n    else if(tick) sclk<=~sclk;\n  end\nendmodule",
    "checks": [
      {
        "label": "Idle polarity",
        "pattern": "!active[\\s\\S]*sclk\\s*<=\\s*cpol",
        "flags": "i"
      },
      {
        "label": "Toggles on tick",
        "pattern": "else\\s+if\\s*\\(\\s*tick\\s*\\)\\s*sclk\\s*<=\\s*~sclk",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "spi-controller",
    "id": "spi-edge-classifier",
    "title": "SPI Sample / Shift Edge Classifier",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SPI",
      "CPHA",
      "timing"
    ],
    "description": "Classify each SCLK transition as a sample edge or a shift edge using CPHA.",
    "task": "For CPHA=0, the leading edge samples and trailing edge shifts. For CPHA=1, leading shifts and trailing samples.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module spi_edge_classifier(\n  input logic cpha,leading_edge,trailing_edge,\n  output logic sample_edge,shift_edge\n);\n  // TODO\nendmodule",
    "solution": "module spi_edge_classifier(\n  input logic cpha,leading_edge,trailing_edge,\n  output logic sample_edge,shift_edge\n);\n  always_comb begin\n    if(!cpha) begin\n      sample_edge=leading_edge;\n      shift_edge=trailing_edge;\n    end else begin\n      sample_edge=trailing_edge;\n      shift_edge=leading_edge;\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Mode zero phase",
        "pattern": "if\\s*\\(\\s*!cpha\\s*\\)[\\s\\S]*sample_edge\\s*=\\s*leading_edge[\\s\\S]*shift_edge\\s*=\\s*trailing_edge",
        "flags": "i"
      },
      {
        "label": "Mode one phase",
        "pattern": "else[\\s\\S]*sample_edge\\s*=\\s*trailing_edge[\\s\\S]*shift_edge\\s*=\\s*leading_edge",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "spi-controller",
    "id": "spi-tx-shifter",
    "title": "SPI MOSI Shift Register",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SPI",
      "MOSI",
      "shift register"
    ],
    "description": "Serialize one configurable-width transmit word MSB-first.",
    "task": "Load tx_data when load is high. On each shift_edge, shift left and present the current MSB on MOSI.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module spi_tx_shifter #(parameter WIDTH=8)(\n  input logic clk,reset,load,shift_edge,\n  input logic [WIDTH-1:0] tx_data,\n  output logic mosi\n);\n  // TODO\nendmodule",
    "solution": "module spi_tx_shifter #(parameter WIDTH=8)(\n  input logic clk,reset,load,shift_edge,\n  input logic [WIDTH-1:0] tx_data,\n  output logic mosi\n);\n  logic [WIDTH-1:0] shreg;\n  always_ff @(posedge clk) begin\n    if(reset) shreg<='0;\n    else if(load) shreg<=tx_data;\n    else if(shift_edge) shreg<={shreg[WIDTH-2:0],1'b0};\n  end\n  assign mosi=shreg[WIDTH-1];\nendmodule",
    "checks": [
      {
        "label": "Loads transmit data",
        "pattern": "else\\s+if\\s*\\(\\s*load\\s*\\)\\s*shreg\\s*<=\\s*tx_data",
        "flags": "i"
      },
      {
        "label": "Shifts MSB first",
        "pattern": "shreg\\s*<=\\s*\\{\\s*shreg\\s*\\[\\s*WIDTH-2\\s*:\\s*0\\s*\\]\\s*,\\s*1'b0\\s*\\}",
        "flags": "i"
      },
      {
        "label": "MOSI uses MSB",
        "pattern": "mosi\\s*=\\s*shreg\\s*\\[\\s*WIDTH-1\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "spi-controller",
    "id": "spi-rx-shifter",
    "title": "SPI MISO Receive Register",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SPI",
      "MISO",
      "sampling"
    ],
    "description": "Capture one receive word MSB-first from MISO.",
    "task": "On each sample_edge, shift the existing register left and append the MISO bit at bit 0.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module spi_rx_shifter #(parameter WIDTH=8)(\n  input logic clk,reset,sample_edge,miso,\n  output logic [WIDTH-1:0] rx_data\n);\n  // TODO\nendmodule",
    "solution": "module spi_rx_shifter #(parameter WIDTH=8)(\n  input logic clk,reset,sample_edge,miso,\n  output logic [WIDTH-1:0] rx_data\n);\n  always_ff @(posedge clk) begin\n    if(reset) rx_data<='0;\n    else if(sample_edge) rx_data<={rx_data[WIDTH-2:0],miso};\n  end\nendmodule",
    "checks": [
      {
        "label": "Samples on sample edge",
        "pattern": "sample_edge[\\s\\S]*rx_data\\s*<=",
        "flags": "i"
      },
      {
        "label": "Appends MISO",
        "pattern": "rx_data\\s*<=\\s*\\{\\s*rx_data\\s*\\[\\s*WIDTH-2\\s*:\\s*0\\s*\\]\\s*,\\s*miso\\s*\\}",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "spi-controller",
    "id": "spi-chip-select",
    "title": "SPI Chip-Select Controller",
    "category": "FPGA",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SPI",
      "chip select",
      "transaction"
    ],
    "description": "Control an active-low SPI chip-select around a transfer.",
    "task": "Drive cs_n low while active is high and high otherwise.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module spi_cs_control(\n  input logic active,\n  output logic cs_n\n);\n  // TODO\nendmodule",
    "solution": "module spi_cs_control(\n  input logic active,\n  output logic cs_n\n);\n  assign cs_n=~active;\nendmodule",
    "checks": [
      {
        "label": "Active-low chip select",
        "pattern": "cs_n\\s*=\\s*~active",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "spi-controller",
    "id": "spi-bit-counter",
    "title": "SPI Transfer Bit Counter",
    "category": "FPGA",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SPI",
      "counter",
      "word length"
    ],
    "description": "Track how many sample edges have occurred in a configurable transfer.",
    "task": "Load bit_count=0 on start. Increment on sample_edge. Pulse done when the final bit index WORD_BITS-1 is sampled.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module spi_bit_counter #(parameter WORD_BITS=8)(\n  input logic clk,reset,start,sample_edge,\n  output logic [$clog2(WORD_BITS)-1:0] bit_count,\n  output logic done\n);\n  // TODO\nendmodule",
    "solution": "module spi_bit_counter #(parameter WORD_BITS=8)(\n  input logic clk,reset,start,sample_edge,\n  output logic [$clog2(WORD_BITS)-1:0] bit_count,\n  output logic done\n);\n  always_ff @(posedge clk) begin\n    if(reset || start) begin bit_count<='0;done<=1'b0; end\n    else begin\n      done<=1'b0;\n      if(sample_edge) begin\n        if(bit_count==WORD_BITS-1) begin bit_count<='0;done<=1'b1; end\n        else bit_count<=bit_count+1'b1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Resets at start",
        "pattern": "reset\\s*\\|\\|\\s*start[\\s\\S]*bit_count\\s*<=\\s*'0",
        "flags": "i"
      },
      {
        "label": "Final bit detect",
        "pattern": "bit_count\\s*==\\s*WORD_BITS\\s*-\\s*1",
        "flags": "i"
      },
      {
        "label": "Done pulse",
        "pattern": "done\\s*<=\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "spi-controller",
    "id": "spi-master-top",
    "title": "Configurable SPI Master",
    "category": "FPGA",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SPI",
      "CPOL",
      "CPHA",
      "master"
    ],
    "description": "Integrate a configurable SPI master supporting all four CPOL/CPHA modes.",
    "task": "On start, assert CS, load tx_data and begin toggling SCLK. Generate sample/shift events from leading/trailing edges, capture MISO, and deassert CS with done after WORD_BITS samples.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module spi_master #(parameter WORD_BITS=8, DIV=4)(\n  input logic clk,reset,start,cpol,cpha,miso,\n  input logic [WORD_BITS-1:0] tx_data,\n  output logic sclk,mosi,cs_n,busy,done,\n  output logic [WORD_BITS-1:0] rx_data\n);\n  // TODO\nendmodule",
    "solution": "module spi_master #(parameter WORD_BITS=8, DIV=4)(\n  input logic clk,reset,start,cpol,cpha,miso,\n  input logic [WORD_BITS-1:0] tx_data,\n  output logic sclk,mosi,cs_n,busy,done,\n  output logic [WORD_BITS-1:0] rx_data\n);\n  logic [$clog2(DIV)-1:0] divcnt;\n  logic [$clog2(WORD_BITS)-1:0] bitcnt;\n  logic [WORD_BITS-1:0] tx_shift;\n  logic phase;\n  always_ff @(posedge clk) begin\n    if(reset) begin\n      sclk<=1'b0;cs_n<=1'b1;busy<=1'b0;done<=1'b0;\n      divcnt<='0;bitcnt<='0;tx_shift<='0;rx_data<='0;phase<=1'b0;\n    end else begin\n      done<=1'b0;\n      if(start && !busy) begin\n        busy<=1'b1;cs_n<=1'b0;sclk<=cpol;tx_shift<=tx_data;bitcnt<='0;divcnt<='0;phase<=1'b0;\n      end else if(busy) begin\n        if(divcnt==DIV-1) begin\n          divcnt<='0;\n          sclk<=~sclk;\n          phase<=~phase;\n          if((!cpha && !phase) || (cpha && phase)) begin\n            rx_data<={rx_data[WORD_BITS-2:0],miso};\n            if(bitcnt==WORD_BITS-1) begin\n              busy<=1'b0;cs_n<=1'b1;done<=1'b1;sclk<=cpol;\n            end else bitcnt<=bitcnt+1'b1;\n          end else begin\n            tx_shift<={tx_shift[WORD_BITS-2:0],1'b0};\n          end\n        end else divcnt<=divcnt+1'b1;\n      end\n    end\n  end\n  assign mosi=tx_shift[WORD_BITS-1];\nendmodule",
    "checks": [
      {
        "label": "Asserts chip select on start",
        "pattern": "start\\s*&&\\s*!busy[\\s\\S]*cs_n\\s*<=\\s*1'b0",
        "flags": "i"
      },
      {
        "label": "Uses CPOL idle clock",
        "pattern": "sclk\\s*<=\\s*cpol",
        "flags": "i"
      },
      {
        "label": "Uses CPHA in edge behavior",
        "pattern": "\\(!cpha\\s*&&\\s*!phase\\)\\s*\\|\\|\\s*\\(cpha\\s*&&\\s*phase\\)",
        "flags": "i"
      },
      {
        "label": "Captures MISO",
        "pattern": "rx_data\\s*<=\\s*\\{\\s*rx_data\\s*\\[\\s*WORD_BITS-2\\s*:\\s*0\\s*\\]\\s*,\\s*miso\\s*\\}",
        "flags": "i"
      },
      {
        "label": "Completes transfer",
        "pattern": "bitcnt\\s*==\\s*WORD_BITS\\s*-\\s*1[\\s\\S]*busy\\s*<=\\s*1'b0[\\s\\S]*cs_n\\s*<=\\s*1'b1[\\s\\S]*done\\s*<=\\s*1'b1",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectSpiProblems
