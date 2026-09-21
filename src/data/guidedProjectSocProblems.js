const guidedProjectSocProblems=[
  {
    "projectId": "small-risc-v-soc",
    "id": "soc-address-decoder",
    "title": "SoC Address Decoder",
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
      "address map",
      "decode"
    ],
    "description": "Decode the processor address into ROM, RAM, UART, GPIO and timer chip-selects.",
    "task": "Use fixed 4 KB regions: ROM 0x0000_0000, RAM 0x1000_0000, UART 0x2000_0000, GPIO 0x2000_1000 and TIMER 0x2000_2000.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module soc_address_decoder(\n  input logic [31:0] addr,\n  output logic rom_sel,ram_sel,uart_sel,gpio_sel,timer_sel\n);\n  // TODO\nendmodule",
    "solution": "module soc_address_decoder(\n  input logic [31:0] addr,\n  output logic rom_sel,ram_sel,uart_sel,gpio_sel,timer_sel\n);\n  always_comb begin\n    rom_sel   = (addr[31:12] == 20'h00000);\n    ram_sel   = (addr[31:12] == 20'h10000);\n    uart_sel  = (addr[31:12] == 20'h20000);\n    gpio_sel  = (addr[31:12] == 20'h20001);\n    timer_sel = (addr[31:12] == 20'h20002);\n  end\nendmodule",
    "checks": [
      {
        "label": "ROM region",
        "pattern": "rom_sel\\s*=\\s*\\(\\s*addr\\s*\\[\\s*31\\s*:\\s*12\\s*\\]\\s*==\\s*20'h00000\\s*\\)",
        "flags": "i"
      },
      {
        "label": "RAM region",
        "pattern": "ram_sel\\s*=\\s*\\(\\s*addr\\s*\\[\\s*31\\s*:\\s*12\\s*\\]\\s*==\\s*20'h10000\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Peripheral regions",
        "pattern": "uart_sel[\\s\\S]*20'h20000[\\s\\S]*gpio_sel[\\s\\S]*20'h20001[\\s\\S]*timer_sel[\\s\\S]*20'h20002",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "small-risc-v-soc",
    "id": "soc-boot-rom",
    "title": "Boot ROM",
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "SoC",
      "ROM",
      "memory map"
    ],
    "description": "Provide a tiny combinational boot ROM addressed by word index.",
    "task": "Return four fixed 32-bit words for addresses 0,1,2,3 and a RISC-V NOP elsewhere.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module boot_rom(\n  input logic [3:0] word_addr,\n  output logic [31:0] rdata\n);\n  // TODO\nendmodule",
    "solution": "module boot_rom(\n  input logic [3:0] word_addr,\n  output logic [31:0] rdata\n);\n  always_comb begin\n    case(word_addr)\n      4'd0: rdata=32'h00500093;\n      4'd1: rdata=32'h00a00113;\n      4'd2: rdata=32'h002081b3;\n      4'd3: rdata=32'h00302023;\n      default: rdata=32'h00000013;\n    endcase\n  end\nendmodule",
    "checks": [
      {
        "label": "Four ROM words",
        "pattern": "4'd0[\\s\\S]*4'd1[\\s\\S]*4'd2[\\s\\S]*4'd3",
        "flags": "i"
      },
      {
        "label": "Default NOP",
        "pattern": "default\\s*:\\s*rdata\\s*=\\s*32'h00000013",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "small-risc-v-soc",
    "id": "soc-data-ram",
    "title": "Word-Addressed Data RAM",
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
      "RAM",
      "byte strobes"
    ],
    "description": "Implement a 1 KB data RAM with byte write enables.",
    "task": "Use 256 x 32-bit storage. Read combinationally and update selected bytes on the rising edge when write_enable is high.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module soc_ram(\n  input logic clk,write_enable,\n  input logic [7:0] word_addr,\n  input logic [3:0] wstrb,\n  input logic [31:0] wdata,\n  output logic [31:0] rdata\n);\n  // TODO\nendmodule",
    "solution": "module soc_ram(\n  input logic clk,write_enable,\n  input logic [7:0] word_addr,\n  input logic [3:0] wstrb,\n  input logic [31:0] wdata,\n  output logic [31:0] rdata\n);\n  logic [31:0] mem[0:255];\n  integer b;\n  always_ff @(posedge clk) begin\n    if(write_enable)\n      for(b=0;b<4;b=b+1)\n        if(wstrb[b]) mem[word_addr][8*b +: 8] <= wdata[8*b +: 8];\n  end\n  assign rdata=mem[word_addr];\nendmodule",
    "checks": [
      {
        "label": "256-word memory",
        "pattern": "logic\\s*\\[\\s*31\\s*:\\s*0\\s*\\]\\s*mem\\s*\\[\\s*0\\s*:\\s*255\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Byte strobes",
        "pattern": "wstrb\\s*\\[\\s*b\\s*\\][\\s\\S]*mem\\s*\\[\\s*word_addr\\s*\\]\\s*\\[\\s*8\\s*\\*\\s*b\\s*\\+\\:\\s*8\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Read port",
        "pattern": "rdata\\s*=\\s*mem\\s*\\[\\s*word_addr\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "small-risc-v-soc",
    "id": "soc-gpio",
    "title": "Memory-Mapped GPIO",
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
      "GPIO",
      "register interface"
    ],
    "description": "Create a memory-mapped GPIO peripheral with an output register and sampled input register.",
    "task": "Address offset 0 writes/reads gpio_out. Address offset 4 reads gpio_in. Writes occur only when sel, write and ready are asserted.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module soc_gpio(\n  input logic clk,reset,sel,write,ready,\n  input logic [3:0] addr,\n  input logic [31:0] wdata,\n  input logic [15:0] gpio_in,\n  output logic [15:0] gpio_out,\n  output logic [31:0] rdata\n);\n  // TODO\nendmodule",
    "solution": "module soc_gpio(\n  input logic clk,reset,sel,write,ready,\n  input logic [3:0] addr,\n  input logic [31:0] wdata,\n  input logic [15:0] gpio_in,\n  output logic [15:0] gpio_out,\n  output logic [31:0] rdata\n);\n  always_ff @(posedge clk) begin\n    if(reset) gpio_out<=16'b0;\n    else if(sel && write && ready && addr==4'h0) gpio_out<=wdata[15:0];\n  end\n  always_comb begin\n    case(addr)\n      4'h0: rdata={16'b0,gpio_out};\n      4'h4: rdata={16'b0,gpio_in};\n      default:rdata=32'b0;\n    endcase\n  end\nendmodule",
    "checks": [
      {
        "label": "Output write register",
        "pattern": "sel\\s*&&\\s*write\\s*&&\\s*ready[\\s\\S]*addr\\s*==\\s*4'h0[\\s\\S]*gpio_out\\s*<=\\s*wdata\\s*\\[\\s*15\\s*:\\s*0\\s*\\]",
        "flags": "i"
      },
      {
        "label": "GPIO output read",
        "pattern": "4'h0\\s*:\\s*rdata\\s*=\\s*\\{\\s*16'b0\\s*,\\s*gpio_out\\s*\\}",
        "flags": "i"
      },
      {
        "label": "GPIO input read",
        "pattern": "4'h4\\s*:\\s*rdata\\s*=\\s*\\{\\s*16'b0\\s*,\\s*gpio_in\\s*\\}",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "small-risc-v-soc",
    "id": "soc-timer",
    "title": "Machine Timer Peripheral",
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
      "timer",
      "interrupt"
    ],
    "description": "Implement a free-running 32-bit timer and programmable compare register.",
    "task": "Increment counter every cycle. A write to compare_load updates compare_value. Assert irq whenever counter is greater than or equal to compare_value and compare_value is nonzero.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module soc_timer(\n  input logic clk,reset,compare_load,\n  input logic [31:0] compare_wdata,\n  output logic [31:0] counter,\n  output logic irq\n);\n  // TODO\nendmodule",
    "solution": "module soc_timer(\n  input logic clk,reset,compare_load,\n  input logic [31:0] compare_wdata,\n  output logic [31:0] counter,\n  output logic irq\n);\n  logic [31:0] compare_value;\n  always_ff @(posedge clk) begin\n    if(reset) begin counter<=0;compare_value<=0; end\n    else begin\n      counter<=counter+1'b1;\n      if(compare_load) compare_value<=compare_wdata;\n    end\n  end\n  assign irq=(compare_value!=0) && (counter>=compare_value);\nendmodule",
    "checks": [
      {
        "label": "Free-running counter",
        "pattern": "counter\\s*<=\\s*counter\\s*\\+\\s*1'b1",
        "flags": "i"
      },
      {
        "label": "Programmable compare",
        "pattern": "if\\s*\\(\\s*compare_load\\s*\\)\\s*compare_value\\s*<=\\s*compare_wdata",
        "flags": "i"
      },
      {
        "label": "IRQ comparison",
        "pattern": "irq\\s*=\\s*\\(\\s*compare_value\\s*!=\\s*0\\s*\\)\\s*&&\\s*\\(\\s*counter\\s*>=\\s*compare_value\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "small-risc-v-soc",
    "id": "soc-interrupt-controller",
    "title": "Interrupt Controller",
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
      "interrupts",
      "priority encoder"
    ],
    "description": "Combine UART, GPIO and timer interrupt requests into one CPU interrupt plus a cause code.",
    "task": "Use fixed priority TIMER > UART > GPIO. Cause values are 3,2,1 respectively and zero when no interrupt is pending.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module soc_irq_controller(\n  input logic timer_irq,uart_irq,gpio_irq,\n  output logic cpu_irq,\n  output logic [1:0] cause\n);\n  // TODO\nendmodule",
    "solution": "module soc_irq_controller(\n  input logic timer_irq,uart_irq,gpio_irq,\n  output logic cpu_irq,\n  output logic [1:0] cause\n);\n  always_comb begin\n    cpu_irq=timer_irq|uart_irq|gpio_irq;\n    if(timer_irq) cause=2'd3;\n    else if(uart_irq) cause=2'd2;\n    else if(gpio_irq) cause=2'd1;\n    else cause=2'd0;\n  end\nendmodule",
    "checks": [
      {
        "label": "Combines requests",
        "pattern": "cpu_irq\\s*=\\s*timer_irq\\s*\\|\\s*uart_irq\\s*\\|\\s*gpio_irq",
        "flags": "i"
      },
      {
        "label": "Timer highest priority",
        "pattern": "if\\s*\\(\\s*timer_irq\\s*\\)\\s*cause\\s*=\\s*2'd3",
        "flags": "i"
      },
      {
        "label": "UART before GPIO",
        "pattern": "else\\s+if\\s*\\(\\s*uart_irq\\s*\\)\\s*cause\\s*=\\s*2'd2[\\s\\S]*else\\s+if\\s*\\(\\s*gpio_irq\\s*\\)\\s*cause\\s*=\\s*2'd1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "small-risc-v-soc",
    "id": "soc-top-integration",
    "title": "Small RISC-V SoC Integration",
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
      "RISC-V",
      "integration"
    ],
    "description": "Integrate memory-map decoding and response multiplexing for a small processor system.",
    "task": "Decode CPU addresses into ROM, RAM, UART, GPIO and timer regions. Multiplex read data by chip select and return zero for unmapped addresses.",
    "examples": [
      "Implement the required behavior and preserve it under the stated control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog unless this stage is verification-only."
    ],
    "starterCode": "module small_riscv_soc_bus(\n  input logic [31:0] cpu_addr,\n  input logic [31:0] rom_rdata,ram_rdata,uart_rdata,gpio_rdata,timer_rdata,\n  output logic rom_sel,ram_sel,uart_sel,gpio_sel,timer_sel,\n  output logic [31:0] cpu_rdata\n);\n  // TODO\nendmodule",
    "solution": "module small_riscv_soc_bus(\n  input logic [31:0] cpu_addr,\n  input logic [31:0] rom_rdata,ram_rdata,uart_rdata,gpio_rdata,timer_rdata,\n  output logic rom_sel,ram_sel,uart_sel,gpio_sel,timer_sel,\n  output logic [31:0] cpu_rdata\n);\n  always_comb begin\n    rom_sel=(cpu_addr[31:12]==20'h00000);\n    ram_sel=(cpu_addr[31:12]==20'h10000);\n    uart_sel=(cpu_addr[31:12]==20'h20000);\n    gpio_sel=(cpu_addr[31:12]==20'h20001);\n    timer_sel=(cpu_addr[31:12]==20'h20002);\n    cpu_rdata=32'b0;\n    if(rom_sel) cpu_rdata=rom_rdata;\n    else if(ram_sel) cpu_rdata=ram_rdata;\n    else if(uart_sel) cpu_rdata=uart_rdata;\n    else if(gpio_sel) cpu_rdata=gpio_rdata;\n    else if(timer_sel) cpu_rdata=timer_rdata;\n  end\nendmodule",
    "checks": [
      {
        "label": "Decodes memory regions",
        "pattern": "rom_sel[\\s\\S]*20'h00000[\\s\\S]*ram_sel[\\s\\S]*20'h10000[\\s\\S]*uart_sel[\\s\\S]*20'h20000",
        "flags": "i"
      },
      {
        "label": "Multiplexes ROM/RAM",
        "pattern": "if\\s*\\(\\s*rom_sel\\s*\\)\\s*cpu_rdata\\s*=\\s*rom_rdata[\\s\\S]*else\\s+if\\s*\\(\\s*ram_sel\\s*\\)\\s*cpu_rdata\\s*=\\s*ram_rdata",
        "flags": "i"
      },
      {
        "label": "Multiplexes peripherals",
        "pattern": "uart_sel[\\s\\S]*cpu_rdata\\s*=\\s*uart_rdata[\\s\\S]*gpio_sel[\\s\\S]*cpu_rdata\\s*=\\s*gpio_rdata[\\s\\S]*timer_sel[\\s\\S]*cpu_rdata\\s*=\\s*timer_rdata",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectSocProblems
