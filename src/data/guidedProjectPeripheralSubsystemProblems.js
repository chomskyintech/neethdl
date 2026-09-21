const guidedProjectPeripheralSubsystemProblems=[
  {
    "projectId": "soc-peripheral-subsystem",
    "id": "periph-reset-controller",
    "title": "Peripheral Reset Controller",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SoC",
      "reset",
      "integration"
    ],
    "description": "Generate a clean peripheral reset release from an asynchronous active-low external reset.",
    "task": "Synchronize reset deassertion through two flip-flops and keep periph_reset asserted until both stages have released.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module peripheral_reset_controller(input logic clk,ext_reset_n,output logic periph_reset);\n  // TODO\nendmodule",
    "solution": "module peripheral_reset_controller(input logic clk,ext_reset_n,output logic periph_reset);\n  logic sync1,sync2;\n  always_ff @(posedge clk or negedge ext_reset_n) begin\n    if(!ext_reset_n) begin sync1<=1'b0;sync2<=1'b0; end\n    else begin sync1<=1'b1;sync2<=sync1; end\n  end\n  assign periph_reset=!sync2;\nendmodule",
    "checks": [
      {
        "label": "Asynchronous assertion",
        "pattern": "posedge\\s+clk\\s+or\\s+negedge\\s+ext_reset_n",
        "flags": "i"
      },
      {
        "label": "Two-stage release",
        "pattern": "sync1\\s*<=\\s*1'b1[\\s\\S]*sync2\\s*<=\\s*sync1",
        "flags": "i"
      },
      {
        "label": "Peripheral reset output",
        "pattern": "periph_reset\\s*=\\s*!sync2",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "soc-peripheral-subsystem",
    "id": "periph-apb-decoder",
    "title": "APB Peripheral Decoder",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "APB",
      "SoC",
      "address map"
    ],
    "description": "Decode one APB request to GPIO, timer or UART.",
    "task": "Map PADDR[15:12]=0 to GPIO, 1 to TIMER, 2 to UART and assert no select for other regions.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module apb_peripheral_decoder(input logic psel,input logic [15:0] paddr,output logic gpio_sel,timer_sel,uart_sel);\n  // TODO\nendmodule",
    "solution": "module apb_peripheral_decoder(input logic psel,input logic [15:0] paddr,output logic gpio_sel,timer_sel,uart_sel);\n  always_comb begin\n    gpio_sel=psel && (paddr[15:12]==4'h0);\n    timer_sel=psel && (paddr[15:12]==4'h1);\n    uart_sel=psel && (paddr[15:12]==4'h2);\n  end\nendmodule",
    "checks": [
      {
        "label": "GPIO select",
        "pattern": "gpio_sel\\s*=\\s*psel\\s*&&\\s*\\(\\s*paddr\\s*\\[\\s*15\\s*:\\s*12\\s*\\]\\s*==\\s*4'h0\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Timer select",
        "pattern": "timer_sel[\\s\\S]*4'h1",
        "flags": "i"
      },
      {
        "label": "UART select",
        "pattern": "uart_sel[\\s\\S]*4'h2",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "soc-peripheral-subsystem",
    "id": "periph-apb-mux",
    "title": "APB Read/Response Multiplexer",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "APB",
      "mux",
      "SoC"
    ],
    "description": "Combine three APB slave responses onto one upstream interface.",
    "task": "Select PRDATA/PREADY/PSLVERR from GPIO, timer or UART according to the one-hot select inputs. Return ready with zero data when none are selected.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module apb_response_mux(\n input logic gpio_sel,timer_sel,uart_sel,\n input logic [31:0] gpio_rdata,timer_rdata,uart_rdata,\n input logic gpio_ready,timer_ready,uart_ready,gpio_err,timer_err,uart_err,\n output logic [31:0] prdata,output logic pready,output logic pslverr);\n  // TODO\nendmodule",
    "solution": "module apb_response_mux(\n input logic gpio_sel,timer_sel,uart_sel,\n input logic [31:0] gpio_rdata,timer_rdata,uart_rdata,\n input logic gpio_ready,timer_ready,uart_ready,gpio_err,timer_err,uart_err,\n output logic [31:0] prdata,output logic pready,output logic pslverr);\n  always_comb begin\n    prdata=32'b0;pready=1'b1;pslverr=1'b0;\n    if(gpio_sel) begin prdata=gpio_rdata;pready=gpio_ready;pslverr=gpio_err;end\n    else if(timer_sel) begin prdata=timer_rdata;pready=timer_ready;pslverr=timer_err;end\n    else if(uart_sel) begin prdata=uart_rdata;pready=uart_ready;pslverr=uart_err;end\n  end\nendmodule",
    "checks": [
      {
        "label": "GPIO response",
        "pattern": "if\\s*\\(\\s*gpio_sel\\s*\\)[\\s\\S]*prdata\\s*=\\s*gpio_rdata[\\s\\S]*pready\\s*=\\s*gpio_ready",
        "flags": "i"
      },
      {
        "label": "Timer response",
        "pattern": "else\\s+if\\s*\\(\\s*timer_sel\\s*\\)[\\s\\S]*timer_rdata",
        "flags": "i"
      },
      {
        "label": "UART response",
        "pattern": "else\\s+if\\s*\\(\\s*uart_sel\\s*\\)[\\s\\S]*uart_rdata",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "soc-peripheral-subsystem",
    "id": "periph-gpio-block",
    "title": "APB GPIO Peripheral",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "APB",
      "GPIO",
      "MMIO"
    ],
    "description": "Implement a 16-bit GPIO output register and sampled input register behind APB.",
    "task": "Write GPIO_OUT at offset 0x0 during APB enable phase. Read output at 0x0 and input at 0x4.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module apb_gpio(input logic clk,reset,psel,penable,pwrite,input logic [3:0] paddr,input logic [31:0] pwdata,input logic [15:0] gpio_in,output logic [15:0] gpio_out,output logic [31:0] prdata);\n  // TODO\nendmodule",
    "solution": "module apb_gpio(input logic clk,reset,psel,penable,pwrite,input logic [3:0] paddr,input logic [31:0] pwdata,input logic [15:0] gpio_in,output logic [15:0] gpio_out,output logic [31:0] prdata);\n  always_ff @(posedge clk) begin\n    if(reset) gpio_out<=16'b0;\n    else if(psel && penable && pwrite && paddr==4'h0) gpio_out<=pwdata[15:0];\n  end\n  always_comb begin\n    case(paddr)\n      4'h0:prdata={16'b0,gpio_out};\n      4'h4:prdata={16'b0,gpio_in};\n      default:prdata=32'b0;\n    endcase\n  end\nendmodule",
    "checks": [
      {
        "label": "APB write phase",
        "pattern": "psel\\s*&&\\s*penable\\s*&&\\s*pwrite[\\s\\S]*gpio_out\\s*<=\\s*pwdata\\s*\\[\\s*15\\s*:\\s*0\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Reads output",
        "pattern": "4'h0\\s*:\\s*prdata\\s*=\\s*\\{\\s*16'b0\\s*,\\s*gpio_out\\s*\\}",
        "flags": "i"
      },
      {
        "label": "Reads input",
        "pattern": "4'h4\\s*:\\s*prdata\\s*=\\s*\\{\\s*16'b0\\s*,\\s*gpio_in\\s*\\}",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "soc-peripheral-subsystem",
    "id": "periph-timer-block",
    "title": "APB Timer Peripheral",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "APB",
      "timer",
      "interrupt"
    ],
    "description": "Implement a programmable timer with compare interrupt behind APB.",
    "task": "Free-run a 32-bit counter. Writes to offset 0x4 load compare_value. IRQ is high when compare_value is nonzero and counter reaches/exceeds it.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module apb_timer(input logic clk,reset,psel,penable,pwrite,input logic [3:0] paddr,input logic [31:0] pwdata,output logic [31:0] counter,output logic irq);\n  // TODO\nendmodule",
    "solution": "module apb_timer(input logic clk,reset,psel,penable,pwrite,input logic [3:0] paddr,input logic [31:0] pwdata,output logic [31:0] counter,output logic irq);\n  logic [31:0] compare_value;\n  always_ff @(posedge clk) begin\n    if(reset) begin counter<=0;compare_value<=0;end\n    else begin\n      counter<=counter+1'b1;\n      if(psel && penable && pwrite && paddr==4'h4) compare_value<=pwdata;\n    end\n  end\n  assign irq=(compare_value!=0)&&(counter>=compare_value);\nendmodule",
    "checks": [
      {
        "label": "Counter runs",
        "pattern": "counter\\s*<=\\s*counter\\s*\\+\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "APB compare write",
        "pattern": "psel\\s*&&\\s*penable\\s*&&\\s*pwrite[\\s\\S]*compare_value\\s*<=\\s*pwdata",
        "flags": "i"
      },
      {
        "label": "IRQ threshold",
        "pattern": "irq\\s*=\\s*\\(\\s*compare_value\\s*!=\\s*0\\s*\\)\\s*&&\\s*\\(\\s*counter\\s*>=\\s*compare_value\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "soc-peripheral-subsystem",
    "id": "periph-uart-registers",
    "title": "UART Register Block",
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
      "APB",
      "MMIO"
    ],
    "description": "Expose transmit data and status as memory-mapped UART registers.",
    "task": "On APB write to 0x0 capture tx_data and pulse tx_start. Read busy in bit 0 at offset 0x4.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module apb_uart_regs(input logic clk,reset,psel,penable,pwrite,input logic [3:0] paddr,input logic [31:0] pwdata,input logic tx_busy,output logic [7:0] tx_data,output logic tx_start,output logic [31:0] prdata);\n  // TODO\nendmodule",
    "solution": "module apb_uart_regs(input logic clk,reset,psel,penable,pwrite,input logic [3:0] paddr,input logic [31:0] pwdata,input logic tx_busy,output logic [7:0] tx_data,output logic tx_start,output logic [31:0] prdata);\n  always_ff @(posedge clk) begin\n    if(reset) begin tx_data<=0;tx_start<=0;end\n    else begin\n      tx_start<=0;\n      if(psel && penable && pwrite && paddr==4'h0) begin tx_data<=pwdata[7:0];tx_start<=1;end\n    end\n  end\n  assign prdata=(paddr==4'h4)?{31'b0,tx_busy}:32'b0;\nendmodule",
    "checks": [
      {
        "label": "Captures TX byte",
        "pattern": "paddr\\s*==\\s*4'h0[\\s\\S]*tx_data\\s*<=\\s*pwdata\\s*\\[\\s*7\\s*:\\s*0\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Pulses TX start",
        "pattern": "tx_start\\s*<=\\s*1",
        "flags": "i"
      },
      {
        "label": "Reads busy status",
        "pattern": "paddr\\s*==\\s*4'h4[\\s\\S]*tx_busy",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "soc-peripheral-subsystem",
    "id": "periph-subsystem-top",
    "title": "APB Peripheral Subsystem Top",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SoC",
      "APB",
      "integration"
    ],
    "description": "Integrate APB decode and interrupt aggregation for GPIO, timer and UART peripherals.",
    "task": "Decode the three APB regions and produce cpu_irq from timer_irq, uart_irq or gpio_irq. Return a 2-bit interrupt cause with TIMER > UART > GPIO priority.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "module peripheral_subsystem_top(input logic psel,input logic [15:0] paddr,input logic timer_irq,uart_irq,gpio_irq,output logic gpio_sel,timer_sel,uart_sel,cpu_irq,output logic [1:0] irq_cause);\n  // TODO\nendmodule",
    "solution": "module peripheral_subsystem_top(input logic psel,input logic [15:0] paddr,input logic timer_irq,uart_irq,gpio_irq,output logic gpio_sel,timer_sel,uart_sel,cpu_irq,output logic [1:0] irq_cause);\n  always_comb begin\n    gpio_sel=psel&&(paddr[15:12]==4'h0);\n    timer_sel=psel&&(paddr[15:12]==4'h1);\n    uart_sel=psel&&(paddr[15:12]==4'h2);\n    cpu_irq=timer_irq|uart_irq|gpio_irq;\n    if(timer_irq) irq_cause=2'd3;\n    else if(uart_irq) irq_cause=2'd2;\n    else if(gpio_irq) irq_cause=2'd1;\n    else irq_cause=2'd0;\n  end\nendmodule",
    "checks": [
      {
        "label": "Decodes all peripherals",
        "pattern": "gpio_sel[\\s\\S]*4'h0[\\s\\S]*timer_sel[\\s\\S]*4'h1[\\s\\S]*uart_sel[\\s\\S]*4'h2",
        "flags": "i"
      },
      {
        "label": "Aggregates interrupts",
        "pattern": "cpu_irq\\s*=\\s*timer_irq\\s*\\|\\s*uart_irq\\s*\\|\\s*gpio_irq",
        "flags": "i"
      },
      {
        "label": "Priority cause",
        "pattern": "timer_irq[\\s\\S]*2'd3[\\s\\S]*uart_irq[\\s\\S]*2'd2[\\s\\S]*gpio_irq[\\s\\S]*2'd1",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectPeripheralSubsystemProblems
