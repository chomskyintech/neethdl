const guidedProjectFirmwareProblems=[
  {
    "projectId": "riscv-firmware-bringup",
    "id": "fw-mmio-access",
    "title": "Memory-Mapped I/O Accessors",
    "category": "Embedded Firmware",
    "difficulty": "Easy",
    "languages": [
      "C"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "C",
      "MMIO",
      "embedded"
    ],
    "description": "Create volatile 32-bit MMIO read/write helpers for bare-metal firmware.",
    "task": "Implement mmio_write32(addr,value) and mmio_read32(addr) using volatile uint32_t pointer casts.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "#include <stdint.h>\n\nstatic inline void mmio_write32(uint32_t addr, uint32_t value) {\n  /* TODO */\n}\n\nstatic inline uint32_t mmio_read32(uint32_t addr) {\n  /* TODO */\n}",
    "solution": "#include <stdint.h>\n\nstatic inline void mmio_write32(uint32_t addr, uint32_t value) {\n  *(volatile uint32_t *)addr = value;\n}\n\nstatic inline uint32_t mmio_read32(uint32_t addr) {\n  return *(volatile uint32_t *)addr;\n}",
    "checks": [
      {
        "label": "Volatile write",
        "pattern": "\\*\\s*\\(\\s*volatile\\s+uint32_t\\s*\\*\\s*\\)\\s*addr\\s*=\\s*value",
        "flags": "i"
      },
      {
        "label": "Volatile read",
        "pattern": "return\\s+\\*\\s*\\(\\s*volatile\\s+uint32_t\\s*\\*\\s*\\)\\s*addr",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "riscv-firmware-bringup",
    "id": "fw-gpio-driver",
    "title": "GPIO Bare-Metal Driver",
    "category": "Embedded Firmware",
    "difficulty": "Easy",
    "languages": [
      "C"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "C",
      "GPIO",
      "driver"
    ],
    "description": "Drive the memory-mapped GPIO peripheral from firmware.",
    "task": "Define GPIO_BASE=0x20001000, GPIO_OUT offset 0x0 and GPIO_IN offset 0x4. Implement gpio_write and gpio_read.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "#include <stdint.h>\n#define GPIO_BASE 0x20001000u\n\nvoid gpio_write(uint16_t value) {\n  /* TODO */\n}\n\nuint16_t gpio_read(void) {\n  /* TODO */\n}",
    "solution": "#include <stdint.h>\n#define GPIO_BASE 0x20001000u\n#define GPIO_OUT  (GPIO_BASE + 0x0u)\n#define GPIO_IN   (GPIO_BASE + 0x4u)\n\nvoid gpio_write(uint16_t value) {\n  *(volatile uint32_t *)GPIO_OUT = (uint32_t)value;\n}\n\nuint16_t gpio_read(void) {\n  return (uint16_t)(*(volatile uint32_t *)GPIO_IN);\n}",
    "checks": [
      {
        "label": "GPIO base",
        "pattern": "#define\\s+GPIO_BASE\\s+0x20001000u",
        "flags": "i"
      },
      {
        "label": "Output offset",
        "pattern": "GPIO_OUT[\\s\\S]*GPIO_BASE\\s*\\+\\s*0x0u",
        "flags": "i"
      },
      {
        "label": "Input offset",
        "pattern": "GPIO_IN[\\s\\S]*GPIO_BASE\\s*\\+\\s*0x4u",
        "flags": "i"
      },
      {
        "label": "Volatile GPIO access",
        "pattern": "volatile\\s+uint32_t",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "riscv-firmware-bringup",
    "id": "fw-uart-driver",
    "title": "Polling UART Driver",
    "category": "Embedded Firmware",
    "difficulty": "Medium",
    "languages": [
      "C"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "C",
      "UART",
      "polling"
    ],
    "description": "Implement a blocking transmit-byte routine for the memory-mapped UART.",
    "task": "Use UART_DATA at base+0x0 and UART_STATUS at base+0x4. Wait while status bit 0 indicates busy, then write the byte.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "#include <stdint.h>\n#define UART_BASE 0x20000000u\n\nvoid uart_putc(char c) {\n  /* TODO */\n}",
    "solution": "#include <stdint.h>\n#define UART_BASE   0x20000000u\n#define UART_DATA   (UART_BASE + 0x0u)\n#define UART_STATUS (UART_BASE + 0x4u)\n\nvoid uart_putc(char c) {\n  while ((*(volatile uint32_t *)UART_STATUS) & 1u) { }\n  *(volatile uint32_t *)UART_DATA = (uint32_t)(uint8_t)c;\n}",
    "checks": [
      {
        "label": "UART data register",
        "pattern": "UART_DATA[\\s\\S]*UART_BASE\\s*\\+\\s*0x0u",
        "flags": "i"
      },
      {
        "label": "UART status register",
        "pattern": "UART_STATUS[\\s\\S]*UART_BASE\\s*\\+\\s*0x4u",
        "flags": "i"
      },
      {
        "label": "Polls busy bit",
        "pattern": "while\\s*\\([\\s\\S]*UART_STATUS[\\s\\S]*&\\s*1u",
        "flags": "i"
      },
      {
        "label": "Writes character",
        "pattern": "UART_DATA[\\s\\S]*uint8_t\\s*\\)\\s*c",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "riscv-firmware-bringup",
    "id": "fw-timer-driver",
    "title": "Timer Compare Driver",
    "category": "Embedded Firmware",
    "difficulty": "Medium",
    "languages": [
      "C"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "C",
      "timer",
      "interrupt"
    ],
    "description": "Program the SoC timer compare register relative to the current counter.",
    "task": "Define TIMER_COUNTER at base+0x0 and TIMER_COMPARE at base+0x4. Implement timer_schedule(delta) by reading counter and writing counter+delta.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "#include <stdint.h>\n#define TIMER_BASE 0x20002000u\n\nvoid timer_schedule(uint32_t delta) {\n  /* TODO */\n}",
    "solution": "#include <stdint.h>\n#define TIMER_BASE    0x20002000u\n#define TIMER_COUNTER (TIMER_BASE + 0x0u)\n#define TIMER_COMPARE (TIMER_BASE + 0x4u)\n\nvoid timer_schedule(uint32_t delta) {\n  uint32_t now = *(volatile uint32_t *)TIMER_COUNTER;\n  *(volatile uint32_t *)TIMER_COMPARE = now + delta;\n}",
    "checks": [
      {
        "label": "Counter register",
        "pattern": "TIMER_COUNTER[\\s\\S]*TIMER_BASE\\s*\\+\\s*0x0u",
        "flags": "i"
      },
      {
        "label": "Compare register",
        "pattern": "TIMER_COMPARE[\\s\\S]*TIMER_BASE\\s*\\+\\s*0x4u",
        "flags": "i"
      },
      {
        "label": "Schedules relative deadline",
        "pattern": "TIMER_COMPARE[\\s\\S]*now\\s*\\+\\s*delta",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "riscv-firmware-bringup",
    "id": "fw-timer-isr",
    "title": "Timer Interrupt Service Routine",
    "category": "Embedded Firmware",
    "difficulty": "Medium",
    "languages": [
      "C"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "C",
      "ISR",
      "interrupt"
    ],
    "description": "Implement a timer ISR that records ticks, toggles one GPIO bit and schedules the next timer interrupt.",
    "task": "Increment a volatile tick counter, XOR GPIO bit 0, and call timer_schedule(1000).",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "#include <stdint.h>\n\nvolatile uint32_t ticks;\n\nvoid timer_isr(void) {\n  /* TODO */\n}",
    "solution": "#include <stdint.h>\n\nvolatile uint32_t ticks;\n\nextern uint16_t gpio_read(void);\nextern void gpio_write(uint16_t value);\nextern void timer_schedule(uint32_t delta);\n\nvoid timer_isr(void) {\n  ticks++;\n  gpio_write(gpio_read() ^ 0x0001u);\n  timer_schedule(1000u);\n}",
    "checks": [
      {
        "label": "Volatile tick count",
        "pattern": "volatile\\s+uint32_t\\s+ticks",
        "flags": "i"
      },
      {
        "label": "Increments ticks",
        "pattern": "ticks\\s*\\+\\+",
        "flags": "i"
      },
      {
        "label": "Toggles GPIO bit zero",
        "pattern": "gpio_write\\s*\\(\\s*gpio_read\\s*\\(\\s*\\)\\s*\\^\\s*0x0001u\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Schedules next tick",
        "pattern": "timer_schedule\\s*\\(\\s*1000u\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "riscv-firmware-bringup",
    "id": "fw-command-shell",
    "title": "Minimal UART Command Shell",
    "category": "Embedded Firmware",
    "difficulty": "Hard",
    "languages": [
      "C"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "C",
      "UART",
      "command parser"
    ],
    "description": "Dispatch simple one-character commands received from a UART console.",
    "task": "Implement handle_command(c): '1' writes GPIO=1, '0' writes GPIO=0, 't' transmits 'T', otherwise transmit '?'.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "void handle_command(char c) {\n  /* TODO */\n}",
    "solution": "extern void gpio_write(unsigned short value);\nextern void uart_putc(char c);\n\nvoid handle_command(char c) {\n  switch (c) {\n    case '1': gpio_write(1u); break;\n    case '0': gpio_write(0u); break;\n    case 't': uart_putc('T'); break;\n    default: uart_putc('?'); break;\n  }\n}",
    "checks": [
      {
        "label": "GPIO set command",
        "pattern": "case\\s+'1'\\s*:\\s*gpio_write\\s*\\(\\s*1u\\s*\\)",
        "flags": "i"
      },
      {
        "label": "GPIO clear command",
        "pattern": "case\\s+'0'\\s*:\\s*gpio_write\\s*\\(\\s*0u\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Timer/status command",
        "pattern": "case\\s+'t'\\s*:\\s*uart_putc\\s*\\(\\s*'T'\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Default response",
        "pattern": "default\\s*:\\s*uart_putc\\s*\\(\\s*'\\?'\\s*\\)",
        "flags": "i"
      }
    ]
  },
  {
    "projectId": "riscv-firmware-bringup",
    "id": "fw-bringup-main",
    "title": "RISC-V SoC Bring-Up Main",
    "category": "Embedded Firmware",
    "difficulty": "Hard",
    "languages": [
      "C"
    ],
    "evaluation": {
      "type": "pattern"
    },
    "tags": [
      "C",
      "bring-up",
      "SoC"
    ],
    "description": "Write the bare-metal bring-up sequence for GPIO, UART and timer.",
    "task": "In main(), clear GPIO, transmit 'B', schedule the first timer interrupt for 1000 cycles and then remain in an infinite loop.",
    "examples": [
      "Implement the required behavior and preserve it under the stated interface/control conditions."
    ],
    "constraints": [
      "Keep the implementation deterministic and consistent with the interface contract described in the task."
    ],
    "starterCode": "int main(void) {\n  /* TODO */\n}",
    "solution": "extern void gpio_write(unsigned short value);\nextern void uart_putc(char c);\nextern void timer_schedule(unsigned int delta);\n\nint main(void) {\n  gpio_write(0u);\n  uart_putc('B');\n  timer_schedule(1000u);\n  for (;;) {\n    /* wait for interrupts / future work */\n  }\n  return 0;\n}",
    "checks": [
      {
        "label": "Clears GPIO",
        "pattern": "gpio_write\\s*\\(\\s*0u\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Emits bring-up marker",
        "pattern": "uart_putc\\s*\\(\\s*'B'\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Schedules timer",
        "pattern": "timer_schedule\\s*\\(\\s*1000u\\s*\\)",
        "flags": "i"
      },
      {
        "label": "Infinite main loop",
        "pattern": "for\\s*\\(\\s*;\\s*;\\s*\\)",
        "flags": "i"
      }
    ]
  }
]

export default guidedProjectFirmwareProblems
