const guidedProjectI2cSlaveProblems=[
  {
    "projectId": "i2c-slave-peripheral",
    "id": "i2c-start-stop",
    "title": "I²C START / STOP Detector",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "I2C",
      "START",
      "STOP"
    ],
    "description": "Detect I²C START and STOP conditions from synchronized SDA/SCL samples.",
    "task": "START occurs when SDA falls while SCL is high. STOP occurs when SDA rises while SCL is high. Pulse each output for one cycle.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module i2c_start_stop(\n  input logic clk,reset,sda,scl,\n  output logic start_pulse,stop_pulse\n);\n  // TODO\nendmodule",
    "solution": "module i2c_start_stop(\n  input logic clk,reset,sda,scl,\n  output logic start_pulse,stop_pulse\n);\n  logic sda_d;\n  always_ff @(posedge clk) begin\n    if(reset) begin sda_d<=1'b1;start_pulse<=1'b0;stop_pulse<=1'b0; end\n    else begin\n      start_pulse<=sda_d && !sda && scl;\n      stop_pulse<=!sda_d && sda && scl;\n      sda_d<=sda;\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "START detection",
        "pattern": "start_pulse\\s*<=\\s*sda_d\\s*&&\\s*!sda\\s*&&\\s*scl",
        "flags": "i"
      },
      {
        "label": "STOP detection",
        "pattern": "stop_pulse\\s*<=\\s*!sda_d\\s*&&\\s*sda\\s*&&\\s*scl",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "i2c-slave-peripheral",
    "id": "i2c-address-match",
    "title": "I²C Address Matcher",
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "I2C",
      "address",
      "slave"
    ],
    "description": "Decode the first I²C byte into a 7-bit address and R/W bit.",
    "task": "Compare byte_in[7:1] with SLAVE_ADDR. Assert address_match on equality and expose read_not_write from bit 0.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module i2c_address_match #(parameter logic [6:0] SLAVE_ADDR=7'h42)(\n  input logic [7:0] byte_in,\n  output logic address_match,read_not_write\n);\n  // TODO\nendmodule",
    "solution": "module i2c_address_match #(parameter logic [6:0] SLAVE_ADDR=7'h42)(\n  input logic [7:0] byte_in,\n  output logic address_match,read_not_write\n);\n  assign address_match=(byte_in[7:1]==SLAVE_ADDR);\n  assign read_not_write=byte_in[0];\nendmodule",
    "checks": [
      {
        "label": "Compares seven-bit address",
        "pattern": "byte_in\\s*\\[\\s*7\\s*:\\s*1\\s*\\]\\s*==\\s*SLAVE_ADDR",
        "flags": "i"
      },
      {
        "label": "Extracts R/W bit",
        "pattern": "read_not_write\\s*=\\s*byte_in\\s*\\[\\s*0\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "i2c-slave-peripheral",
    "id": "i2c-rx-byte",
    "title": "I²C Byte Receiver",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "I2C",
      "receive",
      "shift register"
    ],
    "description": "Receive one I²C byte by sampling SDA on SCL rising-edge pulses.",
    "task": "Shift eight sampled bits MSB-first into byte_out and pulse byte_valid after the eighth sample.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module i2c_rx_byte(\n  input logic clk,reset,scl_rise,sda,\n  output logic [7:0] byte_out,\n  output logic byte_valid\n);\n  // TODO\nendmodule",
    "solution": "module i2c_rx_byte(\n  input logic clk,reset,scl_rise,sda,\n  output logic [7:0] byte_out,\n  output logic byte_valid\n);\n  logic [2:0] count;\n  always_ff @(posedge clk) begin\n    if(reset) begin count<=0;byte_out<=0;byte_valid<=0; end\n    else begin\n      byte_valid<=0;\n      if(scl_rise) begin\n        byte_out<={byte_out[6:0],sda};\n        if(count==3'd7) begin count<=0;byte_valid<=1; end\n        else count<=count+1'b1;\n      end\n    end\n  end\nendmodule",
    "checks": [
      {
        "label": "Samples SDA on SCL rise",
        "pattern": "scl_rise[\\s\\S]*byte_out\\s*<=\\s*\\{\\s*byte_out\\s*\\[\\s*6\\s*:\\s*0\\s*\\]\\s*,\\s*sda\\s*\\}",
        "flags": "i"
      },
      {
        "label": "Valid after eight bits",
        "pattern": "count\\s*==\\s*3'd7[\\s\\S]*byte_valid\\s*<=\\s*1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "i2c-slave-peripheral",
    "id": "i2c-ack-driver",
    "title": "I²C ACK / NACK Driver",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "I2C",
      "ACK",
      "open drain"
    ],
    "description": "Drive ACK using open-drain SDA behavior.",
    "task": "When ack_enable is high, pull SDA low. Otherwise release SDA to high impedance. Never actively drive SDA high.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module i2c_ack_driver(\n  input logic ack_enable,\n  output logic sda_drive_low\n);\n  // TODO\nendmodule",
    "solution": "module i2c_ack_driver(\n  input logic ack_enable,\n  output logic sda_drive_low\n);\n  assign sda_drive_low=ack_enable;\nendmodule",
    "checks": [
      {
        "label": "ACK pulls low",
        "pattern": "sda_drive_low\\s*=\\s*ack_enable",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "i2c-slave-peripheral",
    "id": "i2c-tx-byte",
    "title": "I²C Byte Transmitter",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "I2C",
      "transmit",
      "open drain"
    ],
    "description": "Transmit one byte MSB-first using open-drain SDA.",
    "task": "Load tx_data on load. On each scl_fall, advance to the next bit. Set sda_drive_low when the current transmit bit is zero.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module i2c_tx_byte(\n  input logic clk,reset,load,scl_fall,\n  input logic [7:0] tx_data,\n  output logic sda_drive_low,\n  output logic done\n);\n  // TODO\nendmodule",
    "solution": "module i2c_tx_byte(\n  input logic clk,reset,load,scl_fall,\n  input logic [7:0] tx_data,\n  output logic sda_drive_low,\n  output logic done\n);\n  logic [7:0] shreg;\n  logic [2:0] count;\n  always_ff @(posedge clk) begin\n    if(reset) begin shreg<=8'hff;count<=0;done<=0; end\n    else begin\n      done<=0;\n      if(load) begin shreg<=tx_data;count<=0; end\n      else if(scl_fall) begin\n        if(count==3'd7) begin count<=0;done<=1; end\n        else begin shreg<={shreg[6:0],1'b1};count<=count+1'b1; end\n      end\n    end\n  end\n  assign sda_drive_low=~shreg[7];\nendmodule",
    "checks": [
      {
        "label": "Loads TX data",
        "pattern": "if\\s*\\(\\s*load\\s*\\)[\\s\\S]*shreg\\s*<=\\s*tx_data",
        "flags": "i"
      },
      {
        "label": "Advances on SCL fall",
        "pattern": "scl_fall[\\s\\S]*shreg\\s*<=\\s*\\{\\s*shreg\\s*\\[\\s*6\\s*:\\s*0\\s*\\]\\s*,\\s*1'b1\\s*\\}",
        "flags": "i"
      },
      {
        "label": "Open-drain zero drive",
        "pattern": "sda_drive_low\\s*=\\s*~shreg\\s*\\[\\s*7\\s*\\]",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "i2c-slave-peripheral",
    "id": "i2c-register-pointer",
    "title": "I²C Register Pointer",
    "category": "RTL Design",
    "difficulty": "Medium",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "I2C",
      "register map",
      "pointer"
    ],
    "description": "Maintain the internal register address used by an I²C register peripheral.",
    "task": "Load pointer_value from received_byte when load_pointer is high. Increment it after each register read/write when advance is high.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module i2c_reg_pointer(\n  input logic clk,reset,load_pointer,advance,\n  input logic [7:0] received_byte,\n  output logic [7:0] pointer_value\n);\n  // TODO\nendmodule",
    "solution": "module i2c_reg_pointer(\n  input logic clk,reset,load_pointer,advance,\n  input logic [7:0] received_byte,\n  output logic [7:0] pointer_value\n);\n  always_ff @(posedge clk) begin\n    if(reset) pointer_value<=0;\n    else if(load_pointer) pointer_value<=received_byte;\n    else if(advance) pointer_value<=pointer_value+1'b1;\n  end\nendmodule",
    "checks": [
      {
        "label": "Loads register pointer",
        "pattern": "load_pointer[\\s\\S]*pointer_value\\s*<=\\s*received_byte",
        "flags": "i"
      },
      {
        "label": "Auto-increments",
        "pattern": "advance[\\s\\S]*pointer_value\\s*<=\\s*pointer_value\\s*\\+\\s*1'b1",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "i2c-slave-peripheral",
    "id": "i2c-clock-stretch",
    "title": "I²C Clock-Stretch Control",
    "category": "RTL Design",
    "difficulty": "Easy",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "I2C",
      "clock stretching",
      "open drain"
    ],
    "description": "Model clock stretching as an open-drain SCL request.",
    "task": "When stretch_request is high, assert scl_drive_low. Otherwise release SCL.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module i2c_clock_stretch(\n  input logic stretch_request,\n  output logic scl_drive_low\n);\n  // TODO\nendmodule",
    "solution": "module i2c_clock_stretch(\n  input logic stretch_request,\n  output logic scl_drive_low\n);\n  assign scl_drive_low=stretch_request;\nendmodule",
    "checks": [
      {
        "label": "Stretch pulls SCL low",
        "pattern": "scl_drive_low\\s*=\\s*stretch_request",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "i2c-slave-peripheral",
    "id": "i2c-slave-top",
    "title": "Memory-Mapped I²C Register Slave",
    "category": "RTL Design",
    "difficulty": "Hard",
    "languages": [
      "SystemVerilog"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "I2C",
      "slave",
      "register peripheral"
    ],
    "description": "Integrate a simplified I²C register peripheral with address matching, ACK generation, register writes and sequential register reads.",
    "task": "Use 7-bit address SLAVE_ADDR. After START, receive address+R/W and ACK matches. In write mode, the first data byte loads reg_ptr and following bytes write regs[reg_ptr] with auto-increment. In read mode, present regs[reg_ptr] on tx_data, pulse tx_load, and advance to the next register when read_next is asserted. STOP returns to idle.",
    "examples": [
      "Implement the required protocol behavior and preserve it across the stated timing/control conditions."
    ],
    "constraints": [
      "Use synthesizable SystemVerilog and synchronous state/control logic unless the task explicitly requires edge detection or open-drain behavior."
    ],
    "starterCode": "module i2c_register_slave #(parameter logic [6:0] SLAVE_ADDR=7'h42)(\n  input logic clk,reset,start_pulse,stop_pulse,byte_valid,read_next,\n  input logic [7:0] rx_byte,\n  output logic ack_enable,tx_load,\n  output logic [7:0] reg_ptr,tx_data,reg0\n);\n  // TODO\nendmodule",
    "solution": "module i2c_register_slave #(parameter logic [6:0] SLAVE_ADDR=7'h42)(\n  input logic clk,reset,start_pulse,stop_pulse,byte_valid,read_next,\n  input logic [7:0] rx_byte,\n  output logic ack_enable,tx_load,\n  output logic [7:0] reg_ptr,tx_data,reg0\n);\n  typedef enum logic [2:0] {IDLE,ADDRESS,REGADDR,WRITE_DATA,READ_DATA} state_t;\n  state_t state;\n  logic [7:0] regs[0:255];\n\n  always_ff @(posedge clk) begin\n    if(reset) begin\n      state<=IDLE;reg_ptr<=0;ack_enable<=0;tx_load<=0;tx_data<=0;\n    end else begin\n      ack_enable<=0;\n      tx_load<=0;\n\n      if(start_pulse) state<=ADDRESS;\n      else if(stop_pulse) state<=IDLE;\n      else begin\n        if(byte_valid) begin\n          case(state)\n            ADDRESS: begin\n              if(rx_byte[7:1]==SLAVE_ADDR) begin\n                ack_enable<=1;\n                if(rx_byte[0]) begin\n                  state<=READ_DATA;\n                  tx_data<=regs[reg_ptr];\n                  tx_load<=1;\n                end else state<=REGADDR;\n              end else state<=IDLE;\n            end\n            REGADDR: begin\n              reg_ptr<=rx_byte;\n              ack_enable<=1;\n              state<=WRITE_DATA;\n            end\n            WRITE_DATA: begin\n              regs[reg_ptr]<=rx_byte;\n              reg_ptr<=reg_ptr+1'b1;\n              ack_enable<=1;\n            end\n            default: ;\n          endcase\n        end\n\n        if(state==READ_DATA && read_next) begin\n          reg_ptr<=reg_ptr+1'b1;\n          tx_data<=regs[reg_ptr+1'b1];\n          tx_load<=1;\n        end\n      end\n    end\n  end\n\n  assign reg0=regs[0];\nendmodule",
    "checks": [
      {
        "label": "Matches slave address",
        "pattern": "rx_byte\\s*\\[\\s*7\\s*:\\s*1\\s*\\]\\s*==\\s*SLAVE_ADDR",
        "flags": "i"
      },
      {
        "label": "Separates read and write modes",
        "pattern": "if\\s*\\(\\s*rx_byte\\s*\\[\\s*0\\s*\\]\\s*\\)[\\s\\S]*state\\s*<=\\s*READ_DATA[\\s\\S]*else\\s+state\\s*<=\\s*REGADDR",
        "flags": "i"
      },
      {
        "label": "Loads register pointer",
        "pattern": "REGADDR[\\s\\S]*reg_ptr\\s*<=\\s*rx_byte",
        "flags": "i"
      },
      {
        "label": "Writes register data",
        "pattern": "WRITE_DATA[\\s\\S]*regs\\s*\\[\\s*reg_ptr\\s*\\]\\s*<=\\s*rx_byte",
        "flags": "i"
      },
      {
        "label": "Loads read data",
        "pattern": "READ_DATA[\\s\\S]*read_next[\\s\\S]*tx_data\\s*<=\\s*regs\\s*\\[\\s*reg_ptr\\s*\\+\\s*1'b1\\s*\\]",
        "flags": "i"
      },
      {
        "label": "Pulses transmit load",
        "pattern": "tx_load\\s*<=\\s*1",
        "flags": "i"
      },
      {
        "label": "Returns idle on STOP",
        "pattern": "stop_pulse[\\s\\S]*state\\s*<=\\s*IDLE",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectI2cSlaveProblems
