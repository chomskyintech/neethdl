export const legacyStarterCodeById = {
  "rtl-counter": "module counter #(parameter WIDTH=8) (input logic clk, reset, output logic [WIDTH-1:0] count);\n  // Your RTL here\nendmodule",
  "rtl-priority": "module priority_encoder(input logic [7:0] in, output logic [2:0] index, output logic valid);\n  // Your RTL here\nendmodule",
  "rtl-fifo": "module fifo #(parameter WIDTH=8, DEPTH=16) (input logic clk, reset, wr_en, rd_en, input logic [WIDTH-1:0] din, output logic [WIDTH-1:0] dout, output logic full, empty);\n  // Your RTL here\nendmodule",
  "rtl-shift-register": "module shift_reg #(parameter WIDTH=8) (input logic clk, reset, shift_en, din, output logic [WIDTH-1:0] dout);\n  // Your RTL here\nendmodule",
  "rtl-edge-detector": "module edge_detector(input logic clk, reset, signal_in, output logic rise);\n  // Your RTL here\nendmodule",
  "rtl-regfile": "module regfile4(input logic clk, reset, we, input logic [1:0] waddr, raddr1, raddr2, input logic [7:0] wdata, output logic [7:0] rdata1, rdata2);\n  // Your RTL here\nendmodule",
  "rtl-clock-divider": "module clk_div #(parameter DIV=2) (input logic clk, reset, enable, output logic clk_out);\n  // Your RTL here\nendmodule",
  "proto-uart": "module uart_tx #(parameter CLKS_PER_BIT=434) (input logic clk, reset, start, input logic [7:0] data, output logic tx, output logic busy);\n  // Your RTL here\nendmodule",
  "proto-spi": "module spi_master(input logic clk, reset, start, input logic [7:0] tx_data, input logic miso, output logic mosi, sclk, cs, output logic [7:0] rx_data, output logic done);\n  // Your RTL here\nendmodule",
  "fpga-debounce": "module debounce #(parameter COUNT_MAX=1000000) (input logic clk, reset, button, output logic press);\n  // Synchronizer + debounce logic\nendmodule",
  "rtl-skid-buffer": "module skid_buffer #(parameter WIDTH=8)(input clk, reset, input in_valid, output in_ready, input [WIDTH-1:0] in_data, output reg out_valid, input out_ready, output reg [WIDTH-1:0] out_data);\n  // Your RTL here\nendmodule",
  "rtl-pipeline-register": "module pipeline_reg #(parameter WIDTH=8)(input clk, reset, input in_valid, input [WIDTH-1:0] in_data, output reg out_valid, output reg [WIDTH-1:0] out_data);\n  // Your RTL here\nendmodule",
  "rtl-gray-counter": "module gray_counter #(parameter WIDTH=4)(input clk, reset, enable, output reg [WIDTH-1:0] binary, output [WIDTH-1:0] gray);\n  // Your RTL here\nendmodule",
  "rtl-dual-port-ram": "module simple_dpram #(parameter WIDTH=8, DEPTH=16, ADDR_W=4)(input clk, we, input [ADDR_W-1:0] waddr, raddr, input [WIDTH-1:0] wdata, output [WIDTH-1:0] rdata);\n  // Your RTL here\nendmodule",
  "proto-ready-valid-source": "module rv_source #(parameter WIDTH=8)(input clk, reset, load, input [WIDTH-1:0] load_data, input ready, output reg valid, output reg [WIDTH-1:0] data, output can_load);\n  // Your RTL here\nendmodule",
  "proto-apb-register": "module apb_reg(input PCLK, PRESET, input PSEL, PENABLE, PWRITE, input [3:0] PADDR, input [31:0] PWDATA, output [31:0] PRDATA, output PREADY, output PSLVERR);\n  // Your RTL here\nendmodule",
  "proto-axi-lite-write": "module axi_lite_write_reg(input clk, reset, input awvalid, input [3:0] awaddr, output reg awready, input wvalid, input [31:0] wdata, output reg wready, output reg bvalid, input bready, output [1:0] bresp, output reg [31:0] reg0);\n  // Your RTL here\nendmodule",
  "fpga-pwm": "module pwm #(parameter WIDTH=8)(input clk, reset, input [WIDTH-1:0] duty, output pwm_out);\n  // Your RTL here\nendmodule",
  "fpga-pulse-sync": "module pulse_sync(input src_clk, src_reset, src_pulse, input dst_clk, dst_reset, output reg dst_pulse);\n  // Your RTL here\nendmodule",
  "fpga-clock-enable": "module ce_reg #(parameter WIDTH=8)(input clk, reset, ce, input [WIDTH-1:0] d, output reg [WIDTH-1:0] q);\n  // Your RTL here\nendmodule",
  "accel-vector-max4": "module vector_max4(input signed [15:0] x0,x1,x2,x3, output reg signed [15:0] max_value);\n  // Your RTL here\nendmodule",
  "accel-stream-accum": "module stream_accum(input clk, reset, clear, input in_valid, output in_ready, input signed [15:0] in_data, output reg signed [31:0] acc);\n  // Your RTL here\nendmodule",
  "accel-matmul2": "module matmul2(input signed [7:0] a00,a01,a10,a11,b00,b01,b10,b11, output reg signed [17:0] c00,c01,c10,c11);\n  // Your RTL here\nendmodule",
  "accel-conv3": "module conv3_int8(input signed [7:0] x0,x1,x2,k0,k1,k2, output reg signed [17:0] y);\n  // Your RTL here\nendmodule"
}

export const vhdlStarters = {
  "rtl-mux": "library ieee;\nuse ieee.std_logic_1164.all;\n\nentity mux2 is\n  port (\n    a   : in std_logic;\n    b   : in std_logic;\n    sel : in std_logic;\n    y   : out std_logic\n  );\nend entity mux2;\n\narchitecture rtl of mux2 is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-counter": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity counter is\n  generic (\n    WIDTH : positive := 8\n  );\n  port (\n    clk   : in std_logic;\n    reset : in std_logic;\n    count : out std_logic_vector(WIDTH-1 downto 0)\n  );\nend entity counter;\n\narchitecture rtl of counter is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-priority": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity priority_encoder is\n  port (\n    inp   : in std_logic_vector(7 downto 0);\n    index : out std_logic_vector(2 downto 0);\n    valid : out std_logic\n  );\nend entity priority_encoder;\n\narchitecture rtl of priority_encoder is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-fifo": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity fifo is\n  generic (\n    WIDTH : positive := 8;\n    DEPTH : positive := 4\n  );\n  port (\n    clk   : in std_logic;\n    reset : in std_logic;\n    wr_en : in std_logic;\n    rd_en : in std_logic;\n    din   : in std_logic_vector(WIDTH-1 downto 0);\n    dout  : out std_logic_vector(WIDTH-1 downto 0);\n    full  : out std_logic;\n    empty : out std_logic\n  );\nend entity fifo;\n\narchitecture rtl of fifo is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-shift-register": "library ieee;\nuse ieee.std_logic_1164.all;\n\nentity shift_reg is\n  generic (\n    WIDTH : positive := 8\n  );\n  port (\n    clk      : in std_logic;\n    reset    : in std_logic;\n    shift_en : in std_logic;\n    din      : in std_logic;\n    dout     : out std_logic_vector(WIDTH-1 downto 0)\n  );\nend entity shift_reg;\n\narchitecture rtl of shift_reg is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-edge-detector": "library ieee;\nuse ieee.std_logic_1164.all;\n\nentity edge_detector is\n  port (\n    clk       : in std_logic;\n    reset     : in std_logic;\n    signal_in : in std_logic;\n    rise      : out std_logic\n  );\nend entity edge_detector;\n\narchitecture rtl of edge_detector is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-arbiter": "library ieee;\nuse ieee.std_logic_1164.all;\n\nentity arbiter4 is\n  port (\n    req   : in std_logic_vector(3 downto 0);\n    grant : out std_logic_vector(3 downto 0)\n  );\nend entity arbiter4;\n\narchitecture rtl of arbiter4 is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-regfile": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity regfile4 is\n  port (\n    clk    : in std_logic;\n    reset  : in std_logic;\n    we     : in std_logic;\n    waddr  : in std_logic_vector(1 downto 0);\n    raddr1 : in std_logic_vector(1 downto 0);\n    raddr2 : in std_logic_vector(1 downto 0);\n    wdata  : in std_logic_vector(7 downto 0);\n    rdata1 : out std_logic_vector(7 downto 0);\n    rdata2 : out std_logic_vector(7 downto 0)\n  );\nend entity regfile4;\n\narchitecture rtl of regfile4 is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-lfsr": "library ieee;\nuse ieee.std_logic_1164.all;\n\nentity lfsr8 is\n  port (\n    clk    : in std_logic;\n    reset  : in std_logic;\n    enable : in std_logic;\n    state  : out std_logic_vector(7 downto 0)\n  );\nend entity lfsr8;\n\narchitecture rtl of lfsr8 is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-clock-divider": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity clk_div is\n  generic (\n    DIV : positive := 2\n  );\n  port (\n    clk     : in std_logic;\n    reset   : in std_logic;\n    enable  : in std_logic;\n    clk_out : out std_logic\n  );\nend entity clk_div;\n\narchitecture rtl of clk_div is\nbegin\n  -- Your RTL here\nend architecture rtl;"
}

export const legacyVhdlStarters = {
  "rtl-mux": "library ieee;\nuse ieee.std_logic_1164.all;\n\nentity mux2 is\n  port(a, b, sel : in std_logic; y : out std_logic);\nend entity mux2;\n\narchitecture rtl of mux2 is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-counter": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity counter is\n  generic(WIDTH : positive := 8);\n  port(clk, reset : in std_logic; count : out std_logic_vector(WIDTH-1 downto 0));\nend entity counter;\n\narchitecture rtl of counter is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-priority": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity priority_encoder is\n  port(inp : in std_logic_vector(7 downto 0); index : out std_logic_vector(2 downto 0); valid : out std_logic);\nend entity priority_encoder;\n\narchitecture rtl of priority_encoder is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-fifo": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity fifo is\n  generic(WIDTH : positive := 8; DEPTH : positive := 4);\n  port(clk, reset, wr_en, rd_en : in std_logic;\n       din : in std_logic_vector(WIDTH-1 downto 0);\n       dout : out std_logic_vector(WIDTH-1 downto 0);\n       full, empty : out std_logic);\nend entity fifo;\n\narchitecture rtl of fifo is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-shift-register": "library ieee;\nuse ieee.std_logic_1164.all;\n\nentity shift_reg is\n  generic(WIDTH : positive := 8);\n  port(clk, reset, shift_en, din : in std_logic;\n       dout : out std_logic_vector(WIDTH-1 downto 0));\nend entity shift_reg;\n\narchitecture rtl of shift_reg is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-edge-detector": "library ieee;\nuse ieee.std_logic_1164.all;\n\nentity edge_detector is\n  port(clk, reset, signal_in : in std_logic; rise : out std_logic);\nend entity edge_detector;\n\narchitecture rtl of edge_detector is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-arbiter": "library ieee;\nuse ieee.std_logic_1164.all;\n\nentity arbiter4 is\n  port(req : in std_logic_vector(3 downto 0); grant : out std_logic_vector(3 downto 0));\nend entity arbiter4;\n\narchitecture rtl of arbiter4 is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-regfile": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity regfile4 is\n  port(clk, reset, we : in std_logic;\n       waddr, raddr1, raddr2 : in std_logic_vector(1 downto 0);\n       wdata : in std_logic_vector(7 downto 0);\n       rdata1, rdata2 : out std_logic_vector(7 downto 0));\nend entity regfile4;\n\narchitecture rtl of regfile4 is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-lfsr": "library ieee;\nuse ieee.std_logic_1164.all;\n\nentity lfsr8 is\n  port(clk, reset, enable : in std_logic; state : out std_logic_vector(7 downto 0));\nend entity lfsr8;\n\narchitecture rtl of lfsr8 is\nbegin\n  -- Your RTL here\nend architecture rtl;",
  "rtl-clock-divider": "library ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity clk_div is\n  generic(DIV : positive := 2);\n  port(clk, reset, enable : in std_logic; clk_out : out std_logic);\nend entity clk_div;\n\narchitecture rtl of clk_div is\nbegin\n  -- Your RTL here\nend architecture rtl;"
}

function verilogFromSystemVerilog(source = '') {
  return source
    .replace(/\blogic\b/g, 'reg')
    .replace(/\binput reg\b/g, 'input')
}

export function languageStarter(problem, language) {
  if (language === 'SystemVerilog') return problem.starterCode || ''
  if (language === 'Verilog') return verilogFromSystemVerilog(problem.starterCode || '')
  return vhdlStarters[problem.id] || `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity ${problem.id.replace(/-/g, '_')} is
end entity;

architecture rtl of ${problem.id.replace(/-/g, '_')} is
begin
  -- Your RTL here
end architecture rtl;`
}

function fingerprint(source = '') {
  return String(source).replace(/\s+/g, '')
}

function candidatesForProblem(problem) {
  const languages = problem.languages?.length ? problem.languages : ['SystemVerilog']
  const candidates = []

  for (const language of languages) {
    candidates.push({ language, source: languageStarter(problem, language), current: true })
  }

  const legacy = legacyStarterCodeById[problem.id]
  if (legacy) {
    candidates.push({ language: 'SystemVerilog', source: legacy, current: false })
    if (languages.includes('Verilog')) {
      candidates.push({ language: 'Verilog', source: verilogFromSystemVerilog(legacy), current: false })
    }
  }

  const legacyVhdl = legacyVhdlStarters[problem.id]
  if (legacyVhdl && languages.includes('VHDL')) {
    candidates.push({ language: 'VHDL', source: legacyVhdl, current: false })
  }

  return candidates
}

export function resolveInitialStarterDraft(problem, draft, fallbackLanguage) {
  const fallback = languageStarter(problem, fallbackLanguage)
  if (!draft) {
    return {
      code: fallback,
      language: fallbackLanguage,
      isStarter: true,
      migrated: false,
    }
  }

  const draftFingerprint = fingerprint(draft)
  for (const candidate of candidatesForProblem(problem)) {
    if (fingerprint(candidate.source) !== draftFingerprint) continue
    const current = languageStarter(problem, candidate.language)
    return {
      code: current,
      language: candidate.language,
      isStarter: true,
      migrated: String(draft) !== current,
    }
  }

  return {
    code: draft,
    language: fallbackLanguage,
    isStarter: false,
    migrated: false,
  }
}
