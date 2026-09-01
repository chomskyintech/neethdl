const titles = {
  'rtl-mux': '2:1 Multiplexer',
  'rtl-counter': 'Parameterized Counter',
  'rtl-priority': 'Priority Encoder',
  'rtl-fifo': 'Synchronous FIFO',
  'rtl-shift-register': 'Shift Register',
  'rtl-edge-detector': 'Rising Edge Detector',
  'rtl-arbiter': '4-Request Priority Arbiter',
  'rtl-regfile': 'Small Register File',
  'rtl-lfsr': '8-bit LFSR',
  'rtl-clock-divider': 'Programmable Clock Divider',
  'sv-always': 'always_comb vs always_ff',
  'sv-interface': 'SystemVerilog Interface',
  'sva-handshake': 'Valid Must Eventually Handshake',
  'sva-reset': 'Reset Clears State',
  'uvm-driver': 'Build a UVM Driver',
  'uvm-scoreboard': 'Reference Model Scoreboard',
  'arch-hazard': 'Pipeline Data Hazard',
  'arch-cache': 'Direct-Mapped Cache Indexing',
  'proto-uart': 'UART Transmitter',
  'proto-spi': 'SPI Master',
  'fpga-debounce': 'Button Debouncer',
  'fpga-fsm': 'Traffic Light FSM'
}

const problemId = new URLSearchParams(window.location.search).get('problem')
if (problemId && titles[problemId]) {
  const targetTitle = titles[problemId]
  let attempts = 0
  const timer = setInterval(() => {
    attempts += 1
    const problemButton = [...document.querySelectorAll('button.problem-main')]
      .find(button => button.textContent.includes(targetTitle))

    if (problemButton) {
      clearInterval(timer)
      problemButton.click()
      return
    }

    const problemsButton = [...document.querySelectorAll('.desktop-nav button')]
      .find(button => button.textContent.trim() === 'Problems')
    if (problemsButton) problemsButton.click()

    if (attempts >= 60) clearInterval(timer)
  }, 100)
}
