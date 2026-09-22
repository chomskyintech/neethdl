import additionalSolutions from './additionalSolutions.js'
import additionalVhdlSolutions from './additionalVhdlSolutions.js'
import expansionPortableSolutions from './expansionPortableSolutions.js'

const solutions = {
  ...additionalSolutions,
  'rtl-mux': {
    Verilog: `module mux2 (
  input a,
  input b,
  input sel,
  output reg y
);

always @(*) begin
  y = sel ? b : a;
end

endmodule`,
    SystemVerilog: `module mux2 (
  input logic a,
  input logic b,
  input logic sel,
  output logic y
);

always_comb begin
  y = sel ? b : a;
end

endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity mux2 is
  port (
    a   : in std_logic;
    b   : in std_logic;
    sel : in std_logic;
    y   : out std_logic
  );
end entity mux2;

architecture rtl of mux2 is
begin
  y <= b when sel = '1' else a;
end architecture rtl;`
  },

  'rtl-counter': {
    Verilog: `module counter #(
  parameter WIDTH = 8
) (
  input clk,
  input reset,
  output reg [WIDTH-1:0] count
);

always @(posedge clk) begin
  if (reset)
    count <= '0;
  else
    count <= count + 1'b1;
end

endmodule`,
    SystemVerilog: `module counter #(
  parameter WIDTH = 8
) (
  input logic clk,
  input logic reset,
  output logic [WIDTH-1:0] count
);

always_ff @(posedge clk) begin
  if (reset)
    count <= '0;
  else
    count <= count + 1'b1;
end

endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity counter is
  generic (
    WIDTH : positive := 8
  );
  port (
    clk   : in std_logic;
    reset : in std_logic;
    count : out std_logic_vector(WIDTH-1 downto 0)
  );
end entity counter;

architecture rtl of counter is
  signal count_r : unsigned(WIDTH-1 downto 0) :=
    (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        count_r <= (others => '0');
      else
        count_r <= count_r + 1;
      end if;
    end if;
  end process;

  count <= std_logic_vector(count_r);
end architecture rtl;`
  },

  'rtl-priority': {
    Verilog: `module priority_encoder (
  input [7:0] in,
  output reg [2:0] index,
  output reg valid
);

integer i;

always @(*) begin
  index = 3'd0;
  valid = 1'b0;

  for (i = 7; i >= 0; i = i - 1) begin
    if (in[i] && !valid) begin
      index = i[2:0];
      valid = 1'b1;
    end
  end
end

endmodule`,
    SystemVerilog: `module priority_encoder (
  input logic [7:0] in,
  output logic [2:0] index,
  output logic valid
);

always_comb begin
  index = 3'd0;
  valid = 1'b0;

  for (int i = 7; i >= 0; i--) begin
    if (in[i] && !valid) begin
      index = i[2:0];
      valid = 1'b1;
    end
  end
end

endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity priority_encoder is
  port (
    inp   : in std_logic_vector(7 downto 0);
    index : out std_logic_vector(2 downto 0);
    valid : out std_logic
  );
end entity priority_encoder;

architecture rtl of priority_encoder is
begin
  process(inp)
    variable found : boolean;
  begin
    index <= (others => '0');
    valid <= '0';
    found := false;

    for i in 7 downto 0 loop
      if inp(i) = '1' and not found then
        index <= std_logic_vector(to_unsigned(i, 3));
        valid <= '1';
        found := true;
      end if;
    end loop;
  end process;
end architecture rtl;`
  },

  'rtl-fifo': {
    Verilog: `module fifo #(
  parameter WIDTH = 8,
  parameter DEPTH = 16
) (
  input clk,
  input reset,
  input wr_en,
  input rd_en,
  input [WIDTH-1:0] din,
  output reg [WIDTH-1:0] dout,
  output reg full,
  output reg empty
);

reg [WIDTH-1:0] mem [0:DEPTH-1];
integer count;
integer wr_ptr;
integer rd_ptr;

always @(posedge clk) begin
  if (reset) begin
    count <= 0;
    wr_ptr <= 0;
    rd_ptr <= 0;
    dout <= 0;
  end else begin
    if (wr_en && !full) begin
      mem[wr_ptr] <= din;
      wr_ptr <= (wr_ptr + 1) % DEPTH;
    end

    if (rd_en && !empty) begin
      dout <= mem[rd_ptr];
      rd_ptr <= (rd_ptr + 1) % DEPTH;
    end

    case ({wr_en && !full, rd_en && !empty})
      2'b10: count <= count + 1;
      2'b01: count <= count - 1;
    endcase
  end
end

always @(*) begin
  full = (count == DEPTH);
  empty = (count == 0);
end

endmodule`,
    SystemVerilog: `module fifo #(
  parameter WIDTH = 8,
  parameter DEPTH = 16
) (
  input logic clk,
  input logic reset,
  input logic wr_en,
  input logic rd_en,
  input logic [WIDTH-1:0] din,
  output logic [WIDTH-1:0] dout,
  output logic full,
  output logic empty
);

logic [WIDTH-1:0] mem [DEPTH];
logic [$clog2(DEPTH)-1:0] wr_ptr;
logic [$clog2(DEPTH)-1:0] rd_ptr;
logic [$clog2(DEPTH+1)-1:0] count;

always_ff @(posedge clk) begin
  if (reset) begin
    count <= '0;
    wr_ptr <= '0;
    rd_ptr <= '0;
    dout <= '0;
  end else begin
    if (wr_en && !full) begin
      mem[wr_ptr] <= din;
      wr_ptr <= (wr_ptr + 1'b1) % DEPTH;
    end

    if (rd_en && !empty) begin
      dout <= mem[rd_ptr];
      rd_ptr <= (rd_ptr + 1'b1) % DEPTH;
    end

    case ({wr_en && !full, rd_en && !empty})
      2'b10: count <= count + 1'b1;
      2'b01: count <= count - 1'b1;
    endcase
  end
end

assign full = (count == DEPTH);
assign empty = (count == 0);

endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity fifo is
  generic (
    WIDTH : positive := 8;
    DEPTH : positive := 4
  );
  port (
    clk   : in std_logic;
    reset : in std_logic;
    wr_en : in std_logic;
    rd_en : in std_logic;
    din   : in std_logic_vector(WIDTH-1 downto 0);
    dout  : out std_logic_vector(WIDTH-1 downto 0);
    full  : out std_logic;
    empty : out std_logic
  );
end entity fifo;

architecture rtl of fifo is
  type mem_t is array (0 to DEPTH-1) of
    std_logic_vector(WIDTH-1 downto 0);

  signal mem : mem_t :=
    (others => (others => '0'));
  signal wr_ptr : integer range 0 to DEPTH-1 := 0;
  signal rd_ptr : integer range 0 to DEPTH-1 := 0;
  signal count : integer range 0 to DEPTH := 0;
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        wr_ptr <= 0;
        rd_ptr <= 0;
        count <= 0;
        dout <= (others => '0');
      else
        if wr_en = '1' and count < DEPTH then
          mem(wr_ptr) <= din;

          if wr_ptr = DEPTH-1 then
            wr_ptr <= 0;
          else
            wr_ptr <= wr_ptr + 1;
          end if;
        end if;

        if rd_en = '1' and count > 0 then
          dout <= mem(rd_ptr);

          if rd_ptr = DEPTH-1 then
            rd_ptr <= 0;
          else
            rd_ptr <= rd_ptr + 1;
          end if;
        end if;

        if wr_en = '1' and count < DEPTH and
           not (rd_en = '1' and count > 0) then
          count <= count + 1;
        elsif rd_en = '1' and count > 0 and
              not (wr_en = '1' and count < DEPTH) then
          count <= count - 1;
        end if;
      end if;
    end if;
  end process;

  full <= '1' when count = DEPTH else '0';
  empty <= '1' when count = 0 else '0';
end architecture rtl;`
  },

  'rtl-shift-register': {
    Verilog: `module shift_reg #(
  parameter WIDTH = 8
) (
  input clk,
  input reset,
  input shift_en,
  input din,
  output reg [WIDTH-1:0] dout
);

always @(posedge clk) begin
  if (reset)
    dout <= '0;
  else if (shift_en)
    dout <= {dout[WIDTH-2:0], din};
end

endmodule`,
    SystemVerilog: `module shift_reg #(
  parameter WIDTH = 8
) (
  input logic clk,
  input logic reset,
  input logic shift_en,
  input logic din,
  output logic [WIDTH-1:0] dout
);

always_ff @(posedge clk) begin
  if (reset)
    dout <= '0;
  else if (shift_en)
    dout <= {dout[WIDTH-2:0], din};
end

endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity shift_reg is
  generic (
    WIDTH : positive := 8
  );
  port (
    clk      : in std_logic;
    reset    : in std_logic;
    shift_en : in std_logic;
    din      : in std_logic;
    dout     : out std_logic_vector(WIDTH-1 downto 0)
  );
end entity shift_reg;

architecture rtl of shift_reg is
  signal q : std_logic_vector(WIDTH-1 downto 0) :=
    (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        q <= (others => '0');
      elsif shift_en = '1' then
        q <= q(WIDTH-2 downto 0) & din;
      end if;
    end if;
  end process;

  dout <= q;
end architecture rtl;`
  },

  'rtl-edge-detector': {
    Verilog: `module edge_detector (
  input clk,
  input reset,
  input signal_in,
  output reg rise
);

reg prev;

always @(posedge clk) begin
  if (reset) begin
    prev <= 1'b0;
    rise <= 1'b0;
  end else begin
    rise <= signal_in & ~prev;
    prev <= signal_in;
  end
end

endmodule`,
    SystemVerilog: `module edge_detector (
  input logic clk,
  input logic reset,
  input logic signal_in,
  output logic rise
);

logic prev;

always_ff @(posedge clk) begin
  if (reset) begin
    prev <= 1'b0;
    rise <= 1'b0;
  end else begin
    rise <= signal_in & ~prev;
    prev <= signal_in;
  end
end

endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity edge_detector is
  port (
    clk       : in std_logic;
    reset     : in std_logic;
    signal_in : in std_logic;
    rise      : out std_logic
  );
end entity edge_detector;

architecture rtl of edge_detector is
  signal prev : std_logic := '0';
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        prev <= '0';
        rise <= '0';
      else
        rise <= signal_in and not prev;
        prev <= signal_in;
      end if;
    end if;
  end process;
end architecture rtl;`
  },

  'rtl-arbiter': {
    Verilog: `module arbiter4 (
  input [3:0] req,
  output reg [3:0] grant
);

always @(*) begin
  grant = 4'b0000;

  if (req[3])
    grant = 4'b1000;
  else if (req[2])
    grant = 4'b0100;
  else if (req[1])
    grant = 4'b0010;
  else if (req[0])
    grant = 4'b0001;
end

endmodule`,
    SystemVerilog: `module arbiter4 (
  input logic [3:0] req,
  output logic [3:0] grant
);

always_comb begin
  grant = 4'b0000;

  if (req[3])
    grant = 4'b1000;
  else if (req[2])
    grant = 4'b0100;
  else if (req[1])
    grant = 4'b0010;
  else if (req[0])
    grant = 4'b0001;
end

endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity arbiter4 is
  port (
    req   : in std_logic_vector(3 downto 0);
    grant : out std_logic_vector(3 downto 0)
  );
end entity arbiter4;

architecture rtl of arbiter4 is
begin
  process(req)
  begin
    grant <= (others => '0');

    if req(3) = '1' then
      grant <= "1000";
    elsif req(2) = '1' then
      grant <= "0100";
    elsif req(1) = '1' then
      grant <= "0010";
    elsif req(0) = '1' then
      grant <= "0001";
    end if;
  end process;
end architecture rtl;`
  },

  'rtl-regfile': {
    Verilog: `module regfile4 (
  input clk,
  input reset,
  input we,
  input [1:0] waddr,
  input [1:0] raddr1,
  input [1:0] raddr2,
  input [7:0] wdata,
  output [7:0] rdata1,
  output [7:0] rdata2
);

reg [7:0] regs [0:3];
integer i;

always @(posedge clk) begin
  if (reset) begin
    for (i = 0; i < 4; i = i + 1)
      regs[i] <= 8'h00;
  end else if (we) begin
    regs[waddr] <= wdata;
  end
end

assign rdata1 = regs[raddr1];
assign rdata2 = regs[raddr2];

endmodule`,
    SystemVerilog: `module regfile4 (
  input logic clk,
  input logic reset,
  input logic we,
  input logic [1:0] waddr,
  input logic [1:0] raddr1,
  input logic [1:0] raddr2,
  input logic [7:0] wdata,
  output logic [7:0] rdata1,
  output logic [7:0] rdata2
);

logic [7:0] regs [0:3];

always_ff @(posedge clk) begin
  if (reset) begin
    foreach (regs[i])
      regs[i] <= 8'h00;
  end else if (we) begin
    regs[waddr] <= wdata;
  end
end

always_comb begin
  rdata1 = regs[raddr1];
  rdata2 = regs[raddr2];
end

endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity regfile4 is
  port (
    clk    : in std_logic;
    reset  : in std_logic;
    we     : in std_logic;
    waddr  : in std_logic_vector(1 downto 0);
    raddr1 : in std_logic_vector(1 downto 0);
    raddr2 : in std_logic_vector(1 downto 0);
    wdata  : in std_logic_vector(7 downto 0);
    rdata1 : out std_logic_vector(7 downto 0);
    rdata2 : out std_logic_vector(7 downto 0)
  );
end entity regfile4;

architecture rtl of regfile4 is
  type reg_array is array (0 to 3) of
    std_logic_vector(7 downto 0);

  signal regs : reg_array :=
    (others => (others => '0'));
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        regs <= (others => (others => '0'));
      elsif we = '1' then
        regs(to_integer(unsigned(waddr))) <= wdata;
      end if;
    end if;
  end process;

  rdata1 <= regs(to_integer(unsigned(raddr1)));
  rdata2 <= regs(to_integer(unsigned(raddr2)));
end architecture rtl;`
  },

  'rtl-lfsr': {
    Verilog: `module lfsr8 (
  input clk,
  input reset,
  input enable,
  output reg [7:0] state
);

wire feedback =
  state[7] ^ state[5] ^ state[4] ^ state[3];

always @(posedge clk) begin
  if (reset)
    state <= 8'h01;
  else if (enable)
    state <= {state[6:0], feedback};
end

endmodule`,
    SystemVerilog: `module lfsr8 (
  input logic clk,
  input logic reset,
  input logic enable,
  output logic [7:0] state
);

logic feedback;

always_comb begin
  feedback =
    state[7] ^ state[5] ^ state[4] ^ state[3];
end

always_ff @(posedge clk) begin
  if (reset)
    state <= 8'h01;
  else if (enable)
    state <= {state[6:0], feedback};
end

endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity lfsr8 is
  port (
    clk    : in std_logic;
    reset  : in std_logic;
    enable : in std_logic;
    state  : out std_logic_vector(7 downto 0)
  );
end entity lfsr8;

architecture rtl of lfsr8 is
  signal q : std_logic_vector(7 downto 0) := x"01";
begin
  process(clk)
    variable feedback : std_logic;
  begin
    if rising_edge(clk) then
      if reset = '1' then
        q <= x"01";
      elsif enable = '1' then
        feedback :=
          q(7) xor q(5) xor q(4) xor q(3);
        q <= q(6 downto 0) & feedback;
      end if;
    end if;
  end process;

  state <= q;
end architecture rtl;`
  },

  'rtl-clock-divider': {
    Verilog: `module clk_div #(
  parameter DIV = 2
) (
  input clk,
  input reset,
  input enable,
  output reg clk_out
);

integer count;

always @(posedge clk) begin
  if (reset) begin
    count <= 0;
    clk_out <= 1'b0;
  end else if (enable) begin
    if (count == DIV-1) begin
      count <= 0;
      clk_out <= ~clk_out;
    end else begin
      count <= count + 1;
    end
  end
end

endmodule`,
    SystemVerilog: `module clk_div #(
  parameter DIV = 2
) (
  input logic clk,
  input logic reset,
  input logic enable,
  output logic clk_out
);

integer count;

always_ff @(posedge clk) begin
  if (reset) begin
    count <= 0;
    clk_out <= 1'b0;
  end else if (enable) begin
    if (count == DIV-1) begin
      count <= 0;
      clk_out <= ~clk_out;
    end else begin
      count <= count + 1;
    end
  end
end

endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity clk_div is
  generic (
    DIV : positive := 2
  );
  port (
    clk     : in std_logic;
    reset   : in std_logic;
    enable  : in std_logic;
    clk_out : out std_logic
  );
end entity clk_div;

architecture rtl of clk_div is
  signal count : integer range 0 to DIV-1 := 0;
  signal q : std_logic := '0';
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        count <= 0;
        q <= '0';
      elsif enable = '1' then
        if count = DIV-1 then
          count <= 0;
          q <= not q;
        else
          count <= count + 1;
        end if;
      end if;
    end if;
  end process;

  clk_out <= q;
end architecture rtl;`
  }
}

const portableSolutions = { ...solutions }

for (const [problemId, vhdl] of Object.entries(additionalVhdlSolutions)) {
  portableSolutions[problemId] = {
    ...(portableSolutions[problemId] || {}),
    VHDL: vhdl,
  }
}

for (const [problemId, languages] of Object.entries(expansionPortableSolutions)) {
  portableSolutions[problemId] = {
    ...(portableSolutions[problemId] || {}),
    ...languages,
  }
}

export default portableSolutions
