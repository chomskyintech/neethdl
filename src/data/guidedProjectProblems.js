const guidedProjectProblemsRaw=[
  {
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UART",
      "counter",
      "timing"
    ],
    "id": "uart-baud-tick",
    "title": "UART Baud Tick Generator",
    "projectId": "uart-controller",
    "description": "Create the timing pulse that advances the UART transmitter and receiver.",
    "task": "Build a parameterized baud-tick generator. It should emit a one-cycle `tick` every `DIV` input-clock cycles.",
    "examples": [
      "reset=1 → count returns to 0 and tick=0",
      "DIV=4 → tick pulses once every four rising edges"
    ],
    "constraints": [
      "Use synchronous active-high reset.",
      "`tick` must be high for exactly one clock cycle.",
      "The counter must restart after each tick."
    ],
    "starterCode": "module uart_baud_tick #(\n  parameter int DIV = 4\n) (\n  input  logic clk,\n  input  logic reset,\n  output logic tick\n);\n  // TODO: count input clocks and generate a one-cycle tick\nendmodule\n",
    "solution": "module uart_baud_tick #(\n  parameter int DIV = 4\n) (\n  input logic clk,\n  input logic reset,\n  output logic tick\n);\n  localparam int CW = (DIV <= 2) ? 1 : $clog2(DIV);\n  logic [CW-1:0] count;\n\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      count <= '0;\n      tick <= 1'b0;\n    end else if (count == DIV-1) begin\n      count <= '0;\n      tick <= 1'b1;\n    end else begin\n      count <= count + 1'b1;\n      tick <= 1'b0;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Clocked counter",
        "pattern": "always_ff\\s*@\\s*\\(\\s*posedge\\s+clk\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Synchronous reset",
        "pattern": "if\\s*\\(\\s*reset\\s*\\)[\\s\\S]{0,120}(count\\s*<=\\s*'0|count\\s*<=\\s*0)[\\s\\S]{0,120}tick\\s*<=\\s*1'b0",
        "flags": "i"
      },
      {
        "label": "Pulse at DIV",
        "pattern": "count\\s*==\\s*DIV\\s*-\\s*1[\\s\\S]{0,160}tick\\s*<=\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UART",
      "shift-register",
      "framing"
    ],
    "id": "uart-tx-shift",
    "title": "UART TX Frame Shifter",
    "projectId": "uart-controller",
    "description": "Build the shift register that serializes a UART frame.",
    "task": "Load a UART frame containing one start bit, eight data bits LSB-first, and one stop bit. While `shift` is high, advance the frame by one bit.",
    "examples": [
      "data_in=8'h41, load=1 → frame contains start + 8 data bits + stop",
      "shift=1 → the next serial bit moves to bit 0"
    ],
    "constraints": [
      "UART idles high.",
      "Start bit is 0 and stop bit is 1.",
      "Transmit data LSB-first."
    ],
    "starterCode": "module uart_tx_shift (\n  input  logic       clk,\n  input  logic       reset,\n  input  logic       load,\n  input  logic       shift,\n  input  logic [7:0] data_in,\n  output logic       bit_out\n);\n  logic [9:0] frame;\n  // TODO: load {stop,data,start} and shift toward bit 0\nendmodule\n",
    "solution": "module uart_tx_shift (\n  input logic clk, reset, load, shift,\n  input logic [7:0] data_in,\n  output logic bit_out\n);\n  logic [9:0] frame;\n  assign bit_out = frame[0];\n\n  always_ff @(posedge clk) begin\n    if (reset)\n      frame <= 10'h3FF;\n    else if (load)\n      frame <= {1'b1, data_in, 1'b0};\n    else if (shift)\n      frame <= {1'b1, frame[9:1]};\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Serial output from bit zero",
        "pattern": "bit_out\\s*=\\s*frame\\s*\\[\\s*0\\s*\\]",
        "flags": "i"
      },
      {
        "label": "UART frame load",
        "pattern": "frame\\s*<=\\s*\\{\\s*1'b1\\s*,\\s*data_in\\s*,\\s*1'b0\\s*\\}",
        "flags": "i"
      },
      {
        "label": "LSB-first shift",
        "pattern": "frame\\s*<=\\s*\\{\\s*1'b1\\s*,\\s*frame\\s*\\[\\s*9\\s*:\\s*1\\s*\\]\\s*\\}",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UART",
      "FSM",
      "control"
    ],
    "id": "uart-tx-control",
    "title": "UART Transmit Controller",
    "projectId": "uart-controller",
    "description": "Control when a byte is loaded, shifted, and reported complete.",
    "task": "Create the UART transmit controller. `start` begins a 10-bit frame, `baud_tick` advances one transmitted bit, `busy` remains high during the frame, and `done` pulses after the stop bit.",
    "examples": [
      "start=1 while idle → load=1 and busy=1",
      "10 baud ticks later → done=1 for one cycle"
    ],
    "constraints": [
      "Ignore a new start request while busy.",
      "Count exactly 10 transmitted bits.",
      "`done` is a one-cycle pulse."
    ],
    "starterCode": "module uart_tx_control (\n  input  logic clk,\n  input  logic reset,\n  input  logic start,\n  input  logic baud_tick,\n  output logic load,\n  output logic shift,\n  output logic busy,\n  output logic done\n);\n  logic [3:0] bit_count;\n  // TODO: control loading, shifting and completion\nendmodule\n",
    "solution": "module uart_tx_control (\n  input logic clk, reset, start, baud_tick,\n  output logic load, shift, busy, done\n);\n  logic [3:0] bit_count;\n\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      bit_count <= '0;\n      load <= 1'b0;\n      shift <= 1'b0;\n      busy <= 1'b0;\n      done <= 1'b0;\n    end else begin\n      load <= 1'b0;\n      shift <= 1'b0;\n      done <= 1'b0;\n      if (!busy && start) begin\n        busy <= 1'b1;\n        bit_count <= 4'd0;\n        load <= 1'b1;\n      end else if (busy && baud_tick) begin\n        if (bit_count == 4'd9) begin\n          busy <= 1'b0;\n          done <= 1'b1;\n        end else begin\n          bit_count <= bit_count + 1'b1;\n          shift <= 1'b1;\n        end\n      end\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Start loads frame",
        "pattern": "!\\s*busy\\s*&&\\s*start[\\s\\S]{0,180}load\\s*<=\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Baud tick advances bits",
        "pattern": "busy\\s*&&\\s*baud_tick[\\s\\S]{0,260}bit_count\\s*<=\\s*bit_count\\s*\\+\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Completes after bit 9",
        "pattern": "bit_count\\s*==\\s*4'd9[\\s\\S]{0,160}done\\s*<=\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UART",
      "receiver",
      "edge-detect"
    ],
    "id": "uart-rx-start",
    "title": "UART RX Start-Bit Detector",
    "projectId": "uart-controller",
    "description": "Detect the beginning of an incoming UART frame.",
    "task": "While idle, detect the serial line going low and assert a one-cycle `start_seen` pulse so the receiver can begin timing the frame.",
    "examples": [
      "rx=1 → receiver stays idle",
      "rx changes from 1 to 0 → start_seen=1 for one cycle"
    ],
    "constraints": [
      "Register the previous RX level.",
      "Reset initializes the previous value to idle-high.",
      "Do not repeatedly pulse while RX remains low."
    ],
    "starterCode": "module uart_rx_start (\n  input  logic clk,\n  input  logic reset,\n  input  logic rx,\n  output logic start_seen\n);\n  logic rx_prev;\n  // TODO: detect a high-to-low transition\nendmodule\n",
    "solution": "module uart_rx_start (\n  input logic clk, reset, rx,\n  output logic start_seen\n);\n  logic rx_prev;\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      rx_prev <= 1'b1;\n      start_seen <= 1'b0;\n    end else begin\n      start_seen <= rx_prev & ~rx;\n      rx_prev <= rx;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Stores previous RX",
        "pattern": "rx_prev\\s*<=\\s*rx",
        "flags": "i"
      },
      {
        "label": "Detects falling edge",
        "pattern": "start_seen\\s*<=\\s*rx_prev\\s*&\\s*~\\s*rx",
        "flags": "i"
      },
      {
        "label": "Reset to idle high",
        "pattern": "rx_prev\\s*<=\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UART",
      "receiver",
      "shift-register"
    ],
    "id": "uart-rx-shift",
    "title": "UART RX Data Shifter",
    "projectId": "uart-controller",
    "description": "Collect eight sampled serial data bits into a byte.",
    "task": "On each `sample` pulse, capture the current RX bit into an 8-bit register. UART arrives LSB-first, so the first sampled data bit becomes `data_out[0]`.",
    "examples": [
      "first sample rx=1 → data_out[0]=1",
      "eight samples reconstruct the received byte"
    ],
    "constraints": [
      "Capture only when `sample` is high.",
      "Track which bit position is being filled.",
      "Reset clears the data and bit index."
    ],
    "starterCode": "module uart_rx_shift (\n  input  logic       clk,\n  input  logic       reset,\n  input  logic       sample,\n  input  logic       rx,\n  output logic [7:0] data_out,\n  output logic [2:0] bit_index\n);\n  // TODO: sample RX LSB-first into data_out\nendmodule\n",
    "solution": "module uart_rx_shift (\n  input logic clk, reset, sample, rx,\n  output logic [7:0] data_out,\n  output logic [2:0] bit_index\n);\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      data_out <= '0;\n      bit_index <= '0;\n    end else if (sample) begin\n      data_out[bit_index] <= rx;\n      bit_index <= bit_index + 1'b1;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Samples selected bit",
        "pattern": "data_out\\s*\\[\\s*bit_index\\s*\\]\\s*<=\\s*rx",
        "flags": "i"
      },
      {
        "label": "Advances bit index",
        "pattern": "bit_index\\s*<=\\s*bit_index\\s*\\+\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Reset clears state",
        "pattern": "data_out\\s*<=\\s*'0[\\s\\S]{0,100}bit_index\\s*<=\\s*'0",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UART",
      "FSM",
      "receiver"
    ],
    "id": "uart-rx-control",
    "title": "UART Receive Controller",
    "projectId": "uart-controller",
    "description": "Coordinate start-bit detection, data sampling, and byte completion.",
    "task": "Create a receive controller that enters an active state after `start_seen`, emits one `sample` pulse for each of eight data bits on `baud_tick`, and asserts `data_valid` after the eighth sample.",
    "examples": [
      "start_seen=1 → active=1",
      "eighth baud tick → data_valid=1 and receiver returns idle"
    ],
    "constraints": [
      "Generate exactly eight sample pulses.",
      "`data_valid` is a one-cycle pulse.",
      "Ignore additional start pulses while active."
    ],
    "starterCode": "module uart_rx_control (\n  input  logic clk,\n  input  logic reset,\n  input  logic start_seen,\n  input  logic baud_tick,\n  output logic sample,\n  output logic active,\n  output logic data_valid\n);\n  logic [3:0] bit_count;\n  // TODO: sample eight data bits then pulse data_valid\nendmodule\n",
    "solution": "module uart_rx_control (\n  input logic clk, reset, start_seen, baud_tick,\n  output logic sample, active, data_valid\n);\n  logic [3:0] bit_count;\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      bit_count <= '0;\n      sample <= 1'b0;\n      active <= 1'b0;\n      data_valid <= 1'b0;\n    end else begin\n      sample <= 1'b0;\n      data_valid <= 1'b0;\n      if (!active && start_seen) begin\n        active <= 1'b1;\n        bit_count <= 4'd0;\n      end else if (active && baud_tick) begin\n        sample <= 1'b1;\n        if (bit_count == 4'd7) begin\n          active <= 1'b0;\n          data_valid <= 1'b1;\n        end else\n          bit_count <= bit_count + 1'b1;\n      end\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Starts receiver",
        "pattern": "!\\s*active\\s*&&\\s*start_seen[\\s\\S]{0,140}active\\s*<=\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Samples on baud tick",
        "pattern": "active\\s*&&\\s*baud_tick[\\s\\S]{0,100}sample\\s*<=\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Valid after eight bits",
        "pattern": "bit_count\\s*==\\s*4'd7[\\s\\S]{0,180}data_valid\\s*<=\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "UART",
      "integration",
      "top-level"
    ],
    "id": "uart-loopback",
    "title": "Integrate the UART Controller",
    "projectId": "uart-controller",
    "description": "Combine the UART transmitter and receiver into one reusable controller.",
    "task": "Build a top-level UART block that instantiates the baud generator, TX path, and RX path. Connect the transmitter output to `tx`, expose received bytes on `rx_data`, and pulse `rx_valid` when a byte completes.",
    "examples": [
      "tx_start with 8'h41 → transmitter begins a frame",
      "received frame → rx_data contains byte and rx_valid pulses"
    ],
    "constraints": [
      "Instantiate the project blocks rather than duplicating all logic.",
      "Share the baud timing source.",
      "Expose TX busy/done and RX data/valid signals."
    ],
    "starterCode": "module uart_controller (\n  input  logic       clk,\n  input  logic       reset,\n  input  logic       tx_start,\n  input  logic [7:0] tx_data,\n  input  logic       rx,\n  output logic       tx,\n  output logic       tx_busy,\n  output logic       tx_done,\n  output logic [7:0] rx_data,\n  output logic       rx_valid\n);\n  // TODO: instantiate and connect the UART blocks\nendmodule\n",
    "solution": "module uart_controller (\n  input logic clk, reset, tx_start,\n  input logic [7:0] tx_data,\n  input logic rx,\n  output logic tx, tx_busy, tx_done,\n  output logic [7:0] rx_data,\n  output logic rx_valid\n);\n  logic tick, load, shift, rx_start, sample, rx_active;\n  logic [2:0] rx_index;\n\n  uart_baud_tick u_baud(.clk, .reset, .tick);\n  uart_tx_control u_txc(.clk, .reset, .start(tx_start), .baud_tick(tick), .load, .shift, .busy(tx_busy), .done(tx_done));\n  uart_tx_shift u_txs(.clk, .reset, .load, .shift, .data_in(tx_data), .bit_out(tx));\n  uart_rx_start u_rxs(.clk, .reset, .rx, .start_seen(rx_start));\n  uart_rx_control u_rxc(.clk, .reset, .start_seen(rx_start), .baud_tick(tick), .sample, .active(rx_active), .data_valid(rx_valid));\n  uart_rx_shift u_rxd(.clk, .reset, .sample, .rx, .data_out(rx_data), .bit_index(rx_index));\nendmodule\n",
    "checks": [
      {
        "label": "Baud generator instance",
        "pattern": "uart_baud_tick\\s+\\w+",
        "flags": "i"
      },
      {
        "label": "Transmit path instances",
        "pattern": "uart_tx_control\\s+\\w+[\\s\\S]*uart_tx_shift\\s+\\w+",
        "flags": "i"
      },
      {
        "label": "Receive path instances",
        "pattern": "uart_rx_start\\s+\\w+[\\s\\S]*uart_rx_control\\s+\\w+[\\s\\S]*uart_rx_shift\\s+\\w+",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI4-Lite",
      "registers",
      "SoC"
    ],
    "id": "axi-reg-bank",
    "title": "AXI-Lite Register Bank",
    "projectId": "axi-lite-slave",
    "description": "Create the memory-mapped state that the AXI-Lite slave will expose.",
    "task": "Build four 32-bit registers. A write updates the selected register on the rising edge, and a read returns the selected register combinationally.",
    "examples": [
      "we=1, addr=1, wdata=32'h1234 → reg1 updates",
      "addr=2 on read port → rdata=reg2"
    ],
    "constraints": [
      "Use four 32-bit registers.",
      "Synchronous active-high reset clears all registers.",
      "Read path is combinational."
    ],
    "starterCode": "module axi_reg_bank (\n  input  logic        clk,\n  input  logic        reset,\n  input  logic        we,\n  input  logic [1:0]  addr,\n  input  logic [31:0] wdata,\n  output logic [31:0] rdata\n);\n  logic [31:0] regs [0:3];\n  // TODO: synchronous write and combinational read\nendmodule\n",
    "solution": "module axi_reg_bank (\n  input logic clk, reset, we,\n  input logic [1:0] addr,\n  input logic [31:0] wdata,\n  output logic [31:0] rdata\n);\n  logic [31:0] regs [0:3];\n  integer i;\n  always_ff @(posedge clk) begin\n    if (reset)\n      for (i=0;i<4;i=i+1) regs[i] <= 32'b0;\n    else if (we)\n      regs[addr] <= wdata;\n  end\n  always_comb rdata = regs[addr];\nendmodule\n",
    "checks": [
      {
        "label": "Four-register storage",
        "pattern": "logic\\s*\\[\\s*31\\s*:\\s*0\\s*\\]\\s+regs\\s*\\[\\s*0\\s*:\\s*3\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Clocked write",
        "pattern": "else\\s+if\\s*\\(\\s*we\\s*\\)[\\s\\S]{0,80}regs\\s*\\[\\s*addr\\s*\\]\\s*<=\\s*wdata",
        "flags": "i"
      },
      {
        "label": "Combinational read",
        "pattern": "rdata\\s*=\\s*regs\\s*\\[\\s*addr\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI4-Lite",
      "write-address",
      "handshake"
    ],
    "id": "axi-aw-capture",
    "title": "AXI-Lite AW Channel Capture",
    "projectId": "axi-lite-slave",
    "description": "Accept the write address independently from write data.",
    "task": "Capture `AWADDR` when `AWVALID && AWREADY` handshakes. Keep an `addr_pending` flag high until the write transaction consumes that saved address.",
    "examples": [
      "AWVALID=1 and AWREADY=1 → capture AWADDR",
      "AWVALID=0 → do not overwrite the saved address"
    ],
    "constraints": [
      "Address and data channels are independent.",
      "Only assert AWREADY when no address is already pending.",
      "Reset clears addr_pending."
    ],
    "starterCode": "module axi_aw_capture (\n  input  logic       clk,\n  input  logic       reset,\n  input  logic       awvalid,\n  input  logic [3:0] awaddr,\n  input  logic       consume,\n  output logic       awready,\n  output logic [3:0] saved_addr,\n  output logic       addr_pending\n);\n  // TODO: capture AW independently\nendmodule\n",
    "solution": "module axi_aw_capture (\n  input logic clk, reset, awvalid,\n  input logic [3:0] awaddr,\n  input logic consume,\n  output logic awready,\n  output logic [3:0] saved_addr,\n  output logic addr_pending\n);\n  assign awready = !addr_pending;\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      saved_addr <= '0;\n      addr_pending <= 1'b0;\n    end else begin\n      if (awvalid && awready) begin\n        saved_addr <= awaddr;\n        addr_pending <= 1'b1;\n      end\n      if (consume)\n        addr_pending <= 1'b0;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Ready follows capacity",
        "pattern": "awready\\s*=\\s*!\\s*addr_pending",
        "flags": "i"
      },
      {
        "label": "Address handshake capture",
        "pattern": "awvalid\\s*&&\\s*awready[\\s\\S]{0,140}saved_addr\\s*<=\\s*awaddr",
        "flags": "i"
      },
      {
        "label": "Pending flag",
        "pattern": "addr_pending\\s*<=\\s*1'b1[\\s\\S]{0,180}consume[\\s\\S]{0,80}addr_pending\\s*<=\\s*1'b0",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI4-Lite",
      "write-data",
      "handshake"
    ],
    "id": "axi-w-capture",
    "title": "AXI-Lite W Channel Capture",
    "projectId": "axi-lite-slave",
    "description": "Accept write data independently from the write address.",
    "task": "Capture `WDATA` and `WSTRB` when `WVALID && WREADY` handshakes. Keep a `data_pending` flag until the write is committed.",
    "examples": [
      "WVALID=1 and WREADY=1 → save WDATA/WSTRB",
      "AW can arrive before or after this handshake"
    ],
    "constraints": [
      "Do not require AWVALID at the same time.",
      "Only assert WREADY when no data is pending.",
      "Reset clears data_pending."
    ],
    "starterCode": "module axi_w_capture (\n  input  logic        clk,\n  input  logic        reset,\n  input  logic        wvalid,\n  input  logic [31:0] wdata,\n  input  logic [3:0]  wstrb,\n  input  logic        consume,\n  output logic        wready,\n  output logic [31:0] saved_data,\n  output logic [3:0]  saved_strb,\n  output logic        data_pending\n);\n  // TODO: capture W independently\nendmodule\n",
    "solution": "module axi_w_capture (\n  input logic clk, reset, wvalid,\n  input logic [31:0] wdata,\n  input logic [3:0] wstrb,\n  input logic consume,\n  output logic wready,\n  output logic [31:0] saved_data,\n  output logic [3:0] saved_strb,\n  output logic data_pending\n);\n  assign wready = !data_pending;\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      saved_data <= '0;\n      saved_strb <= '0;\n      data_pending <= 1'b0;\n    end else begin\n      if (wvalid && wready) begin\n        saved_data <= wdata;\n        saved_strb <= wstrb;\n        data_pending <= 1'b1;\n      end\n      if (consume)\n        data_pending <= 1'b0;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Ready follows capacity",
        "pattern": "wready\\s*=\\s*!\\s*data_pending",
        "flags": "i"
      },
      {
        "label": "Data handshake capture",
        "pattern": "wvalid\\s*&&\\s*wready[\\s\\S]{0,180}saved_data\\s*<=\\s*wdata[\\s\\S]{0,100}saved_strb\\s*<=\\s*wstrb",
        "flags": "i"
      },
      {
        "label": "Pending flag",
        "pattern": "data_pending\\s*<=\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI4-Lite",
      "write",
      "control"
    ],
    "id": "axi-write-commit",
    "title": "AXI-Lite Write Commit",
    "projectId": "axi-lite-slave",
    "description": "Pair independently captured AW and W payloads and commit one write.",
    "task": "Assert a one-cycle `write_en` pulse when both `addr_pending` and `data_pending` are true and no response is outstanding. Use the captured address and data for the write.",
    "examples": [
      "address pending only → no write",
      "address + data pending → write_en=1 for one cycle"
    ],
    "constraints": [
      "Never commit with only one channel captured.",
      "Use saved address/data, not live AXI inputs.",
      "Do not start a new commit while response_pending is high."
    ],
    "starterCode": "module axi_write_commit (\n  input  logic        clk,\n  input  logic        reset,\n  input  logic        addr_pending,\n  input  logic        data_pending,\n  input  logic        response_pending,\n  input  logic [3:0]  saved_addr,\n  input  logic [31:0] saved_data,\n  output logic        write_en,\n  output logic [3:0]  write_addr,\n  output logic [31:0] write_data\n);\n  // TODO: pair AW and W then commit one write\nendmodule\n",
    "solution": "module axi_write_commit (\n  input logic clk, reset, addr_pending, data_pending, response_pending,\n  input logic [3:0] saved_addr,\n  input logic [31:0] saved_data,\n  output logic write_en,\n  output logic [3:0] write_addr,\n  output logic [31:0] write_data\n);\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      write_en <= 1'b0;\n      write_addr <= '0;\n      write_data <= '0;\n    end else begin\n      write_en <= 1'b0;\n      if (addr_pending && data_pending && !response_pending) begin\n        write_en <= 1'b1;\n        write_addr <= saved_addr;\n        write_data <= saved_data;\n      end\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Requires both channels",
        "pattern": "addr_pending\\s*&&\\s*data_pending\\s*&&\\s*!\\s*response_pending",
        "flags": "i"
      },
      {
        "label": "One-cycle write pulse",
        "pattern": "write_en\\s*<=\\s*1'b0[\\s\\S]{0,180}write_en\\s*<=\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Uses captured payload",
        "pattern": "write_addr\\s*<=\\s*saved_addr[\\s\\S]{0,100}write_data\\s*<=\\s*saved_data",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI4-Lite",
      "write-response",
      "handshake"
    ],
    "id": "axi-b-response",
    "title": "AXI-Lite B Response Channel",
    "projectId": "axi-lite-slave",
    "description": "Return one write response and hold it until the master accepts it.",
    "task": "Assert `BVALID` when a write commits. Keep it asserted until `BREADY` handshakes. Drive `BRESP` to OKAY.",
    "examples": [
      "write_commit=1 → BVALID=1",
      "BVALID=1 and BREADY=0 → BVALID stays high"
    ],
    "constraints": [
      "BRESP must be 2'b00.",
      "Do not drop BVALID before BREADY.",
      "Reset clears BVALID."
    ],
    "starterCode": "module axi_b_response (\n  input  logic       clk,\n  input  logic       reset,\n  input  logic       write_commit,\n  input  logic       bready,\n  output logic       bvalid,\n  output logic [1:0] bresp\n);\n  // TODO: hold BVALID until BREADY\nendmodule\n",
    "solution": "module axi_b_response (\n  input logic clk, reset, write_commit, bready,\n  output logic bvalid,\n  output logic [1:0] bresp\n);\n  assign bresp = 2'b00;\n  always_ff @(posedge clk) begin\n    if (reset)\n      bvalid <= 1'b0;\n    else if (write_commit)\n      bvalid <= 1'b1;\n    else if (bvalid && bready)\n      bvalid <= 1'b0;\n  end\nendmodule\n",
    "checks": [
      {
        "label": "OKAY response",
        "pattern": "bresp\\s*=\\s*2'b00",
        "flags": "i"
      },
      {
        "label": "Response on commit",
        "pattern": "write_commit[\\s\\S]{0,80}bvalid\\s*<=\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Hold until handshake",
        "pattern": "bvalid\\s*&&\\s*bready[\\s\\S]{0,80}bvalid\\s*<=\\s*1'b0",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI4-Lite",
      "read-address",
      "handshake"
    ],
    "id": "axi-ar-capture",
    "title": "AXI-Lite AR Channel Capture",
    "projectId": "axi-lite-slave",
    "description": "Accept one AXI-Lite read address and preserve it while the read response is prepared.",
    "task": "Handshake `ARVALID/ARREADY`, save `ARADDR`, and mark the address pending until the read response consumes it.",
    "examples": [
      "ARVALID=1 and ARREADY=1 → save ARADDR",
      "pending read → ARREADY=0"
    ],
    "constraints": [
      "Allow one outstanding read.",
      "Reset clears read_pending.",
      "Do not overwrite a pending address."
    ],
    "starterCode": "module axi_ar_capture (\n  input  logic       clk,\n  input  logic       reset,\n  input  logic       arvalid,\n  input  logic [3:0] araddr,\n  input  logic       consume,\n  output logic       arready,\n  output logic [3:0] saved_addr,\n  output logic       read_pending\n);\n  // TODO: capture one read address\nendmodule\n",
    "solution": "module axi_ar_capture (\n  input logic clk, reset, arvalid,\n  input logic [3:0] araddr,\n  input logic consume,\n  output logic arready,\n  output logic [3:0] saved_addr,\n  output logic read_pending\n);\n  assign arready = !read_pending;\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      saved_addr <= '0;\n      read_pending <= 1'b0;\n    end else begin\n      if (arvalid && arready) begin\n        saved_addr <= araddr;\n        read_pending <= 1'b1;\n      end\n      if (consume)\n        read_pending <= 1'b0;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Ready when idle",
        "pattern": "arready\\s*=\\s*!\\s*read_pending",
        "flags": "i"
      },
      {
        "label": "Captures ARADDR",
        "pattern": "arvalid\\s*&&\\s*arready[\\s\\S]{0,140}saved_addr\\s*<=\\s*araddr",
        "flags": "i"
      },
      {
        "label": "Tracks pending read",
        "pattern": "read_pending\\s*<=\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI4-Lite",
      "read-data",
      "handshake"
    ],
    "id": "axi-r-response",
    "title": "AXI-Lite R Response Channel",
    "projectId": "axi-lite-slave",
    "description": "Return read data and keep it stable while the master applies backpressure.",
    "task": "When `read_start` is asserted, capture `read_data` into `RDATA` and raise `RVALID`. Keep both stable until `RREADY` completes the handshake.",
    "examples": [
      "read_start=1 → RVALID=1 and RDATA captures data",
      "RVALID=1, RREADY=0 → response remains unchanged"
    ],
    "constraints": [
      "RRESP must be OKAY.",
      "Hold RVALID until RREADY.",
      "Capture the payload before exposing it."
    ],
    "starterCode": "module axi_r_response (\n  input  logic        clk,\n  input  logic        reset,\n  input  logic        read_start,\n  input  logic [31:0] read_data,\n  input  logic        rready,\n  output logic        rvalid,\n  output logic [31:0] rdata,\n  output logic [1:0]  rresp\n);\n  // TODO: capture and hold the read response\nendmodule\n",
    "solution": "module axi_r_response (\n  input logic clk, reset, read_start,\n  input logic [31:0] read_data,\n  input logic rready,\n  output logic rvalid,\n  output logic [31:0] rdata,\n  output logic [1:0] rresp\n);\n  assign rresp = 2'b00;\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      rvalid <= 1'b0;\n      rdata <= '0;\n    end else if (read_start) begin\n      rvalid <= 1'b1;\n      rdata <= read_data;\n    end else if (rvalid && rready)\n      rvalid <= 1'b0;\n  end\nendmodule\n",
    "checks": [
      {
        "label": "OKAY response",
        "pattern": "rresp\\s*=\\s*2'b00",
        "flags": "i"
      },
      {
        "label": "Captures read data",
        "pattern": "read_start[\\s\\S]{0,120}rvalid\\s*<=\\s*1'b1[\\s\\S]{0,100}rdata\\s*<=\\s*read_data",
        "flags": "i"
      },
      {
        "label": "Completes on handshake",
        "pattern": "rvalid\\s*&&\\s*rready[\\s\\S]{0,80}rvalid\\s*<=\\s*1'b0",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "AXI4-Lite",
      "integration",
      "SoC"
    ],
    "id": "axi-lite-slave-top",
    "title": "Integrate the AXI4-Lite Slave",
    "projectId": "axi-lite-slave",
    "description": "Combine the independent AXI-Lite channels into a complete register-mapped slave.",
    "task": "Instantiate the address/data capture blocks, write commit logic, response channels, and register bank. Preserve independent AW/W handshakes and one outstanding read/write.",
    "examples": [
      "AW then W → one register write and one B response",
      "AR handshake → register data returned through R channel"
    ],
    "constraints": [
      "Do not require AW and W in the same cycle.",
      "Issue BVALID only after a committed write.",
      "Keep RDATA stable while RVALID && !RREADY."
    ],
    "starterCode": "module axi_lite_slave (\n  input logic ACLK, ARESET,\n  input logic AWVALID, input logic [3:0] AWADDR, output logic AWREADY,\n  input logic WVALID, input logic [31:0] WDATA, input logic [3:0] WSTRB, output logic WREADY,\n  output logic BVALID, input logic BREADY, output logic [1:0] BRESP,\n  input logic ARVALID, input logic [3:0] ARADDR, output logic ARREADY,\n  output logic RVALID, input logic RREADY, output logic [31:0] RDATA, output logic [1:0] RRESP\n);\n  // TODO: integrate the project blocks\nendmodule\n",
    "solution": "module axi_lite_slave (\n  input logic ACLK, ARESET,\n  input logic AWVALID, input logic [3:0] AWADDR, output logic AWREADY,\n  input logic WVALID, input logic [31:0] WDATA, input logic [3:0] WSTRB, output logic WREADY,\n  output logic BVALID, input logic BREADY, output logic [1:0] BRESP,\n  input logic ARVALID, input logic [3:0] ARADDR, output logic ARREADY,\n  output logic RVALID, input logic RREADY, output logic [31:0] RDATA, output logic [1:0] RRESP\n);\n  logic ap, dp, rp, commit, we;\n  logic [3:0] wa, ra, ws;\n  logic [31:0] wd, reg_rdata;\n\n  axi_aw_capture u_aw(.clk(ACLK),.reset(ARESET),.awvalid(AWVALID),.awaddr(AWADDR),.consume(commit),.awready(AWREADY),.saved_addr(wa),.addr_pending(ap));\n  axi_w_capture u_w(.clk(ACLK),.reset(ARESET),.wvalid(WVALID),.wdata(WDATA),.wstrb(WSTRB),.consume(commit),.wready(WREADY),.saved_data(wd),.saved_strb(ws),.data_pending(dp));\n  axi_write_commit u_commit(.clk(ACLK),.reset(ARESET),.addr_pending(ap),.data_pending(dp),.response_pending(BVALID),.saved_addr(wa),.saved_data(wd),.write_en(commit));\n  axi_b_response u_b(.clk(ACLK),.reset(ARESET),.write_commit(commit),.bready(BREADY),.bvalid(BVALID),.bresp(BRESP));\n  axi_ar_capture u_ar(.clk(ACLK),.reset(ARESET),.arvalid(ARVALID),.araddr(ARADDR),.consume(RVALID && RREADY),.arready(ARREADY),.saved_addr(ra),.read_pending(rp));\n  axi_reg_bank u_regs(.clk(ACLK),.reset(ARESET),.we(commit),.addr(commit ? wa[3:2] : ra[3:2]),.wdata(wd),.rdata(reg_rdata));\n  axi_r_response u_r(.clk(ACLK),.reset(ARESET),.read_start(rp && !RVALID),.read_data(reg_rdata),.rready(RREADY),.rvalid(RVALID),.rdata(RDATA),.rresp(RRESP));\nendmodule\n",
    "checks": [
      {
        "label": "Independent write-channel blocks",
        "pattern": "axi_aw_capture\\s+\\w+[\\s\\S]*axi_w_capture\\s+\\w+",
        "flags": "i"
      },
      {
        "label": "Write response path",
        "pattern": "axi_write_commit\\s+\\w+[\\s\\S]*axi_b_response\\s+\\w+",
        "flags": "i"
      },
      {
        "label": "Read path and register bank",
        "pattern": "axi_ar_capture\\s+\\w+[\\s\\S]*axi_reg_bank\\s+\\w+[\\s\\S]*axi_r_response\\s+\\w+",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "FIFO",
      "CDC",
      "memory"
    ],
    "id": "afifo-dual-port-ram",
    "title": "Async FIFO Dual-Port Memory",
    "projectId": "async-fifo",
    "description": "Create storage that can be written and read from different clock domains.",
    "task": "Build a small dual-port memory with a write port clocked by `wclk` and an independent read port clocked by `rclk`.",
    "examples": [
      "w_en=1 at wclk edge → memory location updates",
      "r_en=1 at rclk edge → rdata captures selected location"
    ],
    "constraints": [
      "Use separate always_ff blocks for the two clocks.",
      "Do not synchronize the payload bus through flip-flops.",
      "Parameterize width and address width."
    ],
    "starterCode": "module afifo_mem #(\n  parameter WIDTH = 8,\n  parameter ADDR_W = 3\n) (\n  input logic wclk, w_en,\n  input logic [ADDR_W-1:0] waddr,\n  input logic [WIDTH-1:0] wdata,\n  input logic rclk, r_en,\n  input logic [ADDR_W-1:0] raddr,\n  output logic [WIDTH-1:0] rdata\n);\n  logic [WIDTH-1:0] mem [0:(1<<ADDR_W)-1];\n  // TODO: separate write/read clocked ports\nendmodule\n",
    "solution": "module afifo_mem #(\n  parameter WIDTH=8, ADDR_W=3\n)(\n  input logic wclk,w_en,input logic [ADDR_W-1:0] waddr,input logic [WIDTH-1:0] wdata,\n  input logic rclk,r_en,input logic [ADDR_W-1:0] raddr,output logic [WIDTH-1:0] rdata\n);\n  logic [WIDTH-1:0] mem [0:(1<<ADDR_W)-1];\n  always_ff @(posedge wclk) if (w_en) mem[waddr] <= wdata;\n  always_ff @(posedge rclk) if (r_en) rdata <= mem[raddr];\nendmodule\n",
    "checks": [
      {
        "label": "Write clock domain",
        "pattern": "always_ff\\s*@\\s*\\(\\s*posedge\\s+wclk\\s*\\)[\\s\\S]{0,100}mem\\s*\\[\\s*waddr\\s*\\]\\s*<=\\s*wdata",
        "flags": "i"
      },
      {
        "label": "Read clock domain",
        "pattern": "always_ff\\s*@\\s*\\(\\s*posedge\\s+rclk\\s*\\)[\\s\\S]{0,100}rdata\\s*<=\\s*mem\\s*\\[\\s*raddr\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "FIFO",
      "pointer",
      "CDC"
    ],
    "id": "afifo-binary-pointers",
    "title": "Async FIFO Binary Pointers",
    "projectId": "async-fifo",
    "description": "Track independent write and read positions, including the wrap bit used by full detection.",
    "task": "Implement `(ADDR_W+1)`-bit write and read binary pointers. Increment `wbin` only on an accepted write and `rbin` only on an accepted read.",
    "examples": [
      "w_en && !full → wbin increments",
      "r_en && !empty → rbin increments"
    ],
    "constraints": [
      "Write pointer is clocked only by wclk.",
      "Read pointer is clocked only by rclk.",
      "The extra MSB tracks wraparound."
    ],
    "starterCode": "module afifo_binary_ptrs #(\n  parameter ADDR_W = 3\n)(\n  input logic wclk, wrst, w_en, full,\n  input logic rclk, rrst, r_en, empty,\n  output logic [ADDR_W:0] wbin,\n  output logic [ADDR_W:0] rbin\n);\n  // TODO: independent binary pointers\nendmodule\n",
    "solution": "module afifo_binary_ptrs #(parameter ADDR_W=3)(\n  input logic wclk,wrst,w_en,full,\n  input logic rclk,rrst,r_en,empty,\n  output logic [ADDR_W:0] wbin,rbin\n);\n  always_ff @(posedge wclk)\n    if (wrst) wbin <= '0;\n    else if (w_en && !full) wbin <= wbin + 1'b1;\n\n  always_ff @(posedge rclk)\n    if (rrst) rbin <= '0;\n    else if (r_en && !empty) rbin <= rbin + 1'b1;\nendmodule\n",
    "checks": [
      {
        "label": "Write pointer advance",
        "pattern": "posedge\\s+wclk[\\s\\S]{0,180}w_en\\s*&&\\s*!\\s*full[\\s\\S]{0,100}wbin\\s*<=\\s*wbin\\s*\\+\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Read pointer advance",
        "pattern": "posedge\\s+rclk[\\s\\S]{0,180}r_en\\s*&&\\s*!\\s*empty[\\s\\S]{0,100}rbin\\s*<=\\s*rbin\\s*\\+\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "CDC",
      "Gray-code",
      "FIFO"
    ],
    "id": "afifo-gray-converter",
    "title": "Binary-to-Gray Pointer Conversion",
    "projectId": "async-fifo",
    "description": "Convert a binary pointer to Gray code so only one bit changes per increment.",
    "task": "Drive `gray` from `binary` using the standard binary-to-Gray conversion.",
    "examples": [
      "binary=3'b011 → gray=3'b010",
      "binary=3'b100 → gray=3'b110"
    ],
    "constraints": [
      "Keep the logic purely combinational.",
      "Use `binary ^ (binary >> 1)`.",
      "Parameterize pointer width."
    ],
    "starterCode": "module bin_to_gray #(\n  parameter WIDTH = 4\n)(\n  input  logic [WIDTH-1:0] binary,\n  output logic [WIDTH-1:0] gray\n);\n  // TODO: binary to Gray conversion\nendmodule\n",
    "solution": "module bin_to_gray #(parameter WIDTH=4)(\n  input logic [WIDTH-1:0] binary,\n  output logic [WIDTH-1:0] gray\n);\n  assign gray = binary ^ (binary >> 1);\nendmodule\n",
    "checks": [
      {
        "label": "Gray conversion",
        "pattern": "gray\\s*=\\s*binary\\s*\\^\\s*\\(\\s*binary\\s*>>\\s*1\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "CDC",
      "synchronizer",
      "Gray-code"
    ],
    "id": "afifo-gray-sync",
    "title": "Synchronize Gray Pointers",
    "projectId": "async-fifo",
    "description": "Move a Gray-coded pointer safely into the opposite clock domain.",
    "task": "Build a parameterized two-flop synchronizer for a Gray pointer. Both synchronization stages must be clocked by the destination clock.",
    "examples": [
      "async_gray changes → sync_gray updates after two destination clocks"
    ],
    "constraints": [
      "Use two sequential stages.",
      "Reset both stages to zero.",
      "Do not combine this with payload-data synchronization."
    ],
    "starterCode": "module gray_sync #(\n  parameter WIDTH = 4\n)(\n  input  logic             clk,\n  input  logic             reset,\n  input  logic [WIDTH-1:0] async_gray,\n  output logic [WIDTH-1:0] sync_gray\n);\n  logic [WIDTH-1:0] stage1;\n  // TODO: two-flop synchronizer\nendmodule\n",
    "solution": "module gray_sync #(parameter WIDTH=4)(\n  input logic clk,reset,\n  input logic [WIDTH-1:0] async_gray,\n  output logic [WIDTH-1:0] sync_gray\n);\n  logic [WIDTH-1:0] stage1;\n  always_ff @(posedge clk) begin\n    if (reset) begin\n      stage1 <= '0;\n      sync_gray <= '0;\n    end else begin\n      stage1 <= async_gray;\n      sync_gray <= stage1;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "First synchronizer stage",
        "pattern": "stage1\\s*<=\\s*async_gray",
        "flags": "i"
      },
      {
        "label": "Second synchronizer stage",
        "pattern": "sync_gray\\s*<=\\s*stage1",
        "flags": "i"
      },
      {
        "label": "Destination clock",
        "pattern": "always_ff\\s*@\\s*\\(\\s*posedge\\s+clk\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "FIFO",
      "empty",
      "Gray-code"
    ],
    "id": "afifo-empty-detect",
    "title": "Async FIFO Empty Detection",
    "projectId": "async-fifo",
    "description": "Determine when the read pointer has caught up with the synchronized write pointer.",
    "task": "Assert `empty` when the read-domain Gray pointer equals the synchronized write Gray pointer.",
    "examples": [
      "rgray == wgray_sync → empty=1",
      "pointers differ → empty=0"
    ],
    "constraints": [
      "Perform the comparison in the read clock domain.",
      "Compare Gray pointers, not unsynchronized binary pointers."
    ],
    "starterCode": "module afifo_empty #(\n  parameter PTR_W = 4\n)(\n  input  logic [PTR_W-1:0] rgray,\n  input  logic [PTR_W-1:0] wgray_sync,\n  output logic             empty\n);\n  // TODO: empty comparison\nendmodule\n",
    "solution": "module afifo_empty #(parameter PTR_W=4)(\n  input logic [PTR_W-1:0] rgray,wgray_sync,\n  output logic empty\n);\n  assign empty = (rgray == wgray_sync);\nendmodule\n",
    "checks": [
      {
        "label": "Gray-pointer equality",
        "pattern": "empty\\s*=\\s*\\(\\s*rgray\\s*==\\s*wgray_sync\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "FIFO",
      "full",
      "Gray-code"
    ],
    "id": "afifo-full-detect",
    "title": "Async FIFO Full Detection",
    "projectId": "async-fifo",
    "description": "Detect the wraparound relationship that means the write pointer is one complete buffer ahead of the read pointer.",
    "task": "Assert `full` when the next write Gray pointer equals the synchronized read Gray pointer with its top two bits inverted.",
    "examples": [
      "next write catches synchronized read pointer after one wrap → full=1"
    ],
    "constraints": [
      "Use the next write pointer, not the current one.",
      "Invert the top two Gray bits for full comparison.",
      "Parameterize address width."
    ],
    "starterCode": "module afifo_full #(\n  parameter ADDR_W = 3\n)(\n  input  logic [ADDR_W:0] wgray_next,\n  input  logic [ADDR_W:0] rgray_sync,\n  output logic            full\n);\n  // TODO: Gray full comparison\nendmodule\n",
    "solution": "module afifo_full #(parameter ADDR_W=3)(\n  input logic [ADDR_W:0] wgray_next,rgray_sync,\n  output logic full\n);\n  assign full =\n    (wgray_next == {~rgray_sync[ADDR_W:ADDR_W-1],\n                    rgray_sync[ADDR_W-2:0]});\nendmodule\n",
    "checks": [
      {
        "label": "Next-write comparison",
        "pattern": "wgray_next\\s*==",
        "flags": "i"
      },
      {
        "label": "Inverts top Gray bits",
        "pattern": "~\\s*rgray_sync\\s*\\[\\s*ADDR_W\\s*:\\s*ADDR_W\\s*-\\s*1\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "CDC",
      "reset",
      "synchronizer"
    ],
    "id": "afifo-reset-sync",
    "title": "Per-Domain Reset Synchronizer",
    "projectId": "async-fifo",
    "description": "Release reset safely inside each asynchronous clock domain.",
    "task": "Create an active-low reset synchronizer with asynchronous assertion and two-clock synchronous deassertion.",
    "examples": [
      "arst_n=0 → srst_n becomes 0 immediately",
      "arst_n rises → srst_n becomes 1 after two clk edges"
    ],
    "constraints": [
      "Use `negedge arst_n` for asynchronous assertion.",
      "Use two stages for deassertion.",
      "Apply one instance per clock domain."
    ],
    "starterCode": "module reset_sync_n (\n  input  logic clk,\n  input  logic arst_n,\n  output logic srst_n\n);\n  logic stage1;\n  // TODO: async assert, sync deassert\nendmodule\n",
    "solution": "module reset_sync_n (\n  input logic clk, arst_n,\n  output logic srst_n\n);\n  logic stage1;\n  always_ff @(posedge clk or negedge arst_n) begin\n    if (!arst_n) begin\n      stage1 <= 1'b0;\n      srst_n <= 1'b0;\n    end else begin\n      stage1 <= 1'b1;\n      srst_n <= stage1;\n    end\n  end\nendmodule\n",
    "checks": [
      {
        "label": "Asynchronous assertion",
        "pattern": "posedge\\s+clk\\s+or\\s+negedge\\s+arst_n",
        "flags": "i"
      },
      {
        "label": "Reset clears stages",
        "pattern": "!\\s*arst_n[\\s\\S]{0,120}stage1\\s*<=\\s*1'b0[\\s\\S]{0,100}srst_n\\s*<=\\s*1'b0",
        "flags": "i"
      },
      {
        "label": "Synchronous release",
        "pattern": "stage1\\s*<=\\s*1'b1[\\s\\S]{0,100}srst_n\\s*<=\\s*stage1",
        "flags": "i"
      }
    ]
  },
  {
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "FIFO",
      "CDC",
      "integration"
    ],
    "id": "afifo-top",
    "title": "Integrate the Asynchronous FIFO",
    "projectId": "async-fifo",
    "description": "Combine memory, pointers, Gray conversion, synchronization, and status detection into a complete dual-clock FIFO.",
    "task": "Build the top-level asynchronous FIFO. Keep write logic in `wclk`, read logic in `rclk`, synchronize only Gray pointers across domains, and use the binary low bits to address memory.",
    "examples": [
      "accepted write advances only the write pointer",
      "accepted read advances only the read pointer",
      "synchronized pointer equality controls empty/full"
    ],
    "constraints": [
      "Never directly synchronize the multi-bit payload bus.",
      "Use Gray-code pointer synchronizers in both directions.",
      "Use separate reset synchronization for each domain."
    ],
    "starterCode": "module async_fifo #(\n  parameter WIDTH = 8,\n  parameter ADDR_W = 3\n)(\n  input logic wclk, wrst,\n  input logic w_en,\n  input logic [WIDTH-1:0] wdata,\n  output logic full,\n  input logic rclk, rrst,\n  input logic r_en,\n  output logic [WIDTH-1:0] rdata,\n  output logic empty\n);\n  // TODO: integrate memory, pointers, Gray CDC and flags\nendmodule\n",
    "solution": "module async_fifo #(parameter WIDTH=8, ADDR_W=3)(\n  input logic wclk,wrst,w_en,input logic [WIDTH-1:0] wdata,output logic full,\n  input logic rclk,rrst,r_en,output logic [WIDTH-1:0] rdata,output logic empty\n);\n  logic [ADDR_W:0] wbin,rbin,wgray,rgray,wgray_sync,rgray_sync,wgray_next;\n  logic [ADDR_W-1:0] waddr,raddr;\n  assign waddr = wbin[ADDR_W-1:0];\n  assign raddr = rbin[ADDR_W-1:0];\n\n  afifo_mem u_mem(.wclk,.w_en(w_en&&!full),.waddr,.wdata,.rclk,.r_en(r_en&&!empty),.raddr,.rdata);\n  afifo_binary_ptrs u_ptr(.wclk,.wrst,.w_en,.full,.rclk,.rrst,.r_en,.empty,.wbin,.rbin);\n  bin_to_gray #(.WIDTH(ADDR_W+1)) u_wgray(.binary(wbin),.gray(wgray));\n  bin_to_gray #(.WIDTH(ADDR_W+1)) u_rgray(.binary(rbin),.gray(rgray));\n  gray_sync #(.WIDTH(ADDR_W+1)) u_ws(.clk(rclk),.reset(rrst),.async_gray(wgray),.sync_gray(wgray_sync));\n  gray_sync #(.WIDTH(ADDR_W+1)) u_rs(.clk(wclk),.reset(wrst),.async_gray(rgray),.sync_gray(rgray_sync));\n  assign wgray_next = ((wbin + ((w_en&&!full)?1:0)) ^ ((wbin + ((w_en&&!full)?1:0)) >> 1));\n  afifo_empty #(.PTR_W(ADDR_W+1)) u_empty(.rgray,.wgray_sync,.empty);\n  afifo_full #(.ADDR_W(ADDR_W)) u_full(.wgray_next,.rgray_sync,.full);\nendmodule\n",
    "checks": [
      {
        "label": "Dual-clock memory",
        "pattern": "afifo_mem\\s+\\w+",
        "flags": "i"
      },
      {
        "label": "Pointer and Gray logic",
        "pattern": "afifo_binary_ptrs\\s+\\w+[\\s\\S]*bin_to_gray[\\s\\S]*bin_to_gray",
        "flags": "i"
      },
      {
        "label": "Two Gray synchronizers",
        "pattern": "gray_sync[\\s\\S]*async_gray\\s*\\(\\s*wgray\\s*\\)[\\s\\S]*gray_sync[\\s\\S]*async_gray\\s*\\(\\s*rgray\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Full and empty detection",
        "pattern": "afifo_empty\\s+[^;]+[\\s\\S]*afifo_full\\s+",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectProblemsRaw
