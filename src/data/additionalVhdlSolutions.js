const additionalVhdlSolutions = {
  "accel-mac8": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity int8_mac is
  port (
    clk    : in std_logic;
    clear  : in std_logic;
    enable : in std_logic;
    a      : in signed(7 downto 0);
    b      : in signed(7 downto 0);
    acc    : out signed(31 downto 0)
  );
end entity int8_mac;

architecture rtl of int8_mac is
  signal acc_r : signed(31 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if clear = '1' then
        acc_r <= (others => '0');
      elsif enable = '1' then
        acc_r <= acc_r + resize(a * b, acc_r'length);
      end if;
    end if;
  end process;

  acc <= acc_r;
end architecture rtl;`,

  "accel-dot4": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity dot4_int8 is
  port (
    a0, a1, a2, a3 : in signed(7 downto 0);
    b0, b1, b2, b3 : in signed(7 downto 0);
    result : out signed(19 downto 0)
  );
end entity dot4_int8;

architecture rtl of dot4_int8 is
begin
  result <= resize(a0 * b0, 20) +
            resize(a1 * b1, 20) +
            resize(a2 * b2, 20) +
            resize(a3 * b3, 20);
end architecture rtl;`,

  "accel-reduction8": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity reduction8 is
  port (
    x0, x1, x2, x3 : in std_logic_vector(15 downto 0);
    x4, x5, x6, x7 : in std_logic_vector(15 downto 0);
    sum : out std_logic_vector(18 downto 0)
  );
end entity reduction8;

architecture rtl of reduction8 is
begin
  sum <= std_logic_vector(
    resize(unsigned(x0), 19) + resize(unsigned(x1), 19) +
    resize(unsigned(x2), 19) + resize(unsigned(x3), 19) +
    resize(unsigned(x4), 19) + resize(unsigned(x5), 19) +
    resize(unsigned(x6), 19) + resize(unsigned(x7), 19)
  );
end architecture rtl;`,

  "accel-relu-quant": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity relu_quant is
  port (
    x : in signed(15 downto 0);
    y : out std_logic_vector(7 downto 0)
  );
end entity relu_quant;

architecture rtl of relu_quant is
begin
  process(x)
  begin
    if x < 0 then
      y <= (others => '0');
    elsif x > to_signed(255, x'length) then
      y <= (others => '1');
    else
      y <= std_logic_vector(x(7 downto 0));
    end if;
  end process;
end architecture rtl;`,

  "accel-systolic-pe": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity systolic_pe is
  port (
    clk    : in std_logic;
    clear  : in std_logic;
    enable : in std_logic;
    a_in   : in signed(7 downto 0);
    b_in   : in signed(7 downto 0);
    a_out  : out signed(7 downto 0);
    b_out  : out signed(7 downto 0);
    acc    : out signed(31 downto 0)
  );
end entity systolic_pe;

architecture rtl of systolic_pe is
  signal a_r : signed(7 downto 0) := (others => '0');
  signal b_r : signed(7 downto 0) := (others => '0');
  signal acc_r : signed(31 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if clear = '1' then
        acc_r <= (others => '0');
      elsif enable = '1' then
        acc_r <= acc_r + resize(a_in * b_in, acc_r'length);
      end if;

      if enable = '1' then
        a_r <= a_in;
        b_r <= b_in;
      end if;
    end if;
  end process;

  a_out <= a_r;
  b_out <= b_r;
  acc <= acc_r;
end architecture rtl;`,

  "accel-pipelined-mul": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity pipelined_mul is
  port (
    clk       : in std_logic;
    reset     : in std_logic;
    in_valid  : in std_logic;
    a         : in signed(15 downto 0);
    b         : in signed(15 downto 0);
    out_valid : out std_logic;
    product   : out signed(31 downto 0)
  );
end entity pipelined_mul;

architecture rtl of pipelined_mul is
  signal valid_r : std_logic := '0';
  signal product_r : signed(31 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        valid_r <= '0';
        product_r <= (others => '0');
      else
        valid_r <= in_valid;
        if in_valid = '1' then
          product_r <= a * b;
        end if;
      end if;
    end if;
  end process;

  out_valid <= valid_r;
  product <= product_r;
end architecture rtl;`,

  "rtl-skid-buffer": `library ieee;
use ieee.std_logic_1164.all;

entity skid_buffer is
  generic ( WIDTH : positive := 8 );
  port (
    clk       : in std_logic;
    reset     : in std_logic;
    in_valid  : in std_logic;
    in_ready  : out std_logic;
    in_data   : in std_logic_vector(WIDTH-1 downto 0);
    out_valid : out std_logic;
    out_ready : in std_logic;
    out_data  : out std_logic_vector(WIDTH-1 downto 0)
  );
end entity skid_buffer;

architecture rtl of skid_buffer is
  signal valid_r : std_logic := '0';
  signal data_r : std_logic_vector(WIDTH-1 downto 0) := (others => '0');
  signal ready_i : std_logic;
begin
  ready_i <= (not valid_r) or out_ready;
  in_ready <= ready_i;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        valid_r <= '0';
        data_r <= (others => '0');
      elsif ready_i = '1' then
        valid_r <= in_valid;
        if in_valid = '1' then
          data_r <= in_data;
        end if;
      end if;
    end if;
  end process;

  out_valid <= valid_r;
  out_data <= data_r;
end architecture rtl;`,

  "rtl-pipeline-register": `library ieee;
use ieee.std_logic_1164.all;

entity pipeline_reg is
  generic ( WIDTH : positive := 8 );
  port (
    clk       : in std_logic;
    reset     : in std_logic;
    in_valid  : in std_logic;
    in_data   : in std_logic_vector(WIDTH-1 downto 0);
    out_valid : out std_logic;
    out_data  : out std_logic_vector(WIDTH-1 downto 0)
  );
end entity pipeline_reg;

architecture rtl of pipeline_reg is
  signal valid_r : std_logic := '0';
  signal data_r : std_logic_vector(WIDTH-1 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        valid_r <= '0';
        data_r <= (others => '0');
      else
        valid_r <= in_valid;
        if in_valid = '1' then
          data_r <= in_data;
        end if;
      end if;
    end if;
  end process;

  out_valid <= valid_r;
  out_data <= data_r;
end architecture rtl;`,

  "rtl-reset-synchronizer": `library ieee;
use ieee.std_logic_1164.all;

entity reset_sync is
  port (
    clk    : in std_logic;
    arst_n : in std_logic;
    rst_n  : out std_logic
  );
end entity reset_sync;

architecture rtl of reset_sync is
  signal sync : std_logic_vector(1 downto 0) := "00";
begin
  process(clk, arst_n)
  begin
    if arst_n = '0' then
      sync <= "00";
    elsif rising_edge(clk) then
      sync <= sync(0) & '1';
    end if;
  end process;

  rst_n <= sync(1);
end architecture rtl;`,

  "rtl-gray-counter": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity gray_counter is
  generic ( WIDTH : positive := 4 );
  port (
    clk    : in std_logic;
    reset  : in std_logic;
    enable : in std_logic;
    binary : out std_logic_vector(WIDTH-1 downto 0);
    gray   : out std_logic_vector(WIDTH-1 downto 0)
  );
end entity gray_counter;

architecture rtl of gray_counter is
  signal binary_r : unsigned(WIDTH-1 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        binary_r <= (others => '0');
      elsif enable = '1' then
        binary_r <= binary_r + 1;
      end if;
    end if;
  end process;

  binary <= std_logic_vector(binary_r);
  gray <= std_logic_vector(binary_r xor shift_right(binary_r, 1));
end architecture rtl;`,

  "rtl-dual-port-ram": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity simple_dpram is
  generic (
    WIDTH  : positive := 8;
    DEPTH  : positive := 16;
    ADDR_W : positive := 4
  );
  port (
    clk   : in std_logic;
    we    : in std_logic;
    waddr : in std_logic_vector(ADDR_W-1 downto 0);
    raddr : in std_logic_vector(ADDR_W-1 downto 0);
    wdata : in std_logic_vector(WIDTH-1 downto 0);
    rdata : out std_logic_vector(WIDTH-1 downto 0)
  );
end entity simple_dpram;

architecture rtl of simple_dpram is
  type mem_t is array (0 to DEPTH-1) of std_logic_vector(WIDTH-1 downto 0);
  signal mem : mem_t := (others => (others => '0'));
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if we = '1' then
        mem(to_integer(unsigned(waddr))) <= wdata;
      end if;
    end if;
  end process;

  rdata <= mem(to_integer(unsigned(raddr)));
end architecture rtl;`,

  "rtl-onehot-fsm": `library ieee;
use ieee.std_logic_1164.all;

entity traffic_fsm is
  port (
    clk     : in std_logic;
    reset   : in std_logic;
    advance : in std_logic;
    state   : out std_logic_vector(2 downto 0)
  );
end entity traffic_fsm;

architecture rtl of traffic_fsm is
  constant RED    : std_logic_vector(2 downto 0) := "001";
  constant GREEN  : std_logic_vector(2 downto 0) := "010";
  constant YELLOW : std_logic_vector(2 downto 0) := "100";
  signal state_r : std_logic_vector(2 downto 0) := RED;
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        state_r <= RED;
      elsif advance = '1' then
        case state_r is
          when RED => state_r <= GREEN;
          when GREEN => state_r <= YELLOW;
          when others => state_r <= RED;
        end case;
      end if;
    end if;
  end process;

  state <= state_r;
end architecture rtl;`,

  "proto-ready-valid-source": `library ieee;
use ieee.std_logic_1164.all;

entity rv_source is
  generic ( WIDTH : positive := 8 );
  port (
    clk       : in std_logic;
    reset     : in std_logic;
    load      : in std_logic;
    load_data : in std_logic_vector(WIDTH-1 downto 0);
    ready     : in std_logic;
    valid     : out std_logic;
    data      : out std_logic_vector(WIDTH-1 downto 0);
    can_load  : out std_logic
  );
end entity rv_source;

architecture rtl of rv_source is
  signal valid_r : std_logic := '0';
  signal data_r : std_logic_vector(WIDTH-1 downto 0) := (others => '0');
  signal can_load_i : std_logic;
begin
  can_load_i <= (not valid_r) or ready;
  can_load <= can_load_i;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        valid_r <= '0';
        data_r <= (others => '0');
      elsif can_load_i = '1' then
        if load = '1' then
          valid_r <= '1';
          data_r <= load_data;
        else
          valid_r <= '0';
        end if;
      end if;
    end if;
  end process;

  valid <= valid_r;
  data <= data_r;
end architecture rtl;`,

  "proto-apb-register": `library ieee;
use ieee.std_logic_1164.all;

entity apb_reg is
  port (
    PCLK    : in std_logic;
    PRESET  : in std_logic;
    PSEL    : in std_logic;
    PENABLE : in std_logic;
    PWRITE  : in std_logic;
    PADDR   : in std_logic_vector(3 downto 0);
    PWDATA  : in std_logic_vector(31 downto 0);
    PRDATA  : out std_logic_vector(31 downto 0);
    PREADY  : out std_logic;
    PSLVERR : out std_logic
  );
end entity apb_reg;

architecture rtl of apb_reg is
  signal reg0 : std_logic_vector(31 downto 0) := (others => '0');
begin
  process(PCLK)
  begin
    if rising_edge(PCLK) then
      if PRESET = '1' then
        reg0 <= (others => '0');
      elsif PSEL = '1' and PENABLE = '1' and PWRITE = '1' and PADDR = "0000" then
        reg0 <= PWDATA;
      end if;
    end if;
  end process;

  PRDATA <= reg0 when PADDR = "0000" else (others => '0');
  PREADY <= '1';
  PSLVERR <= '0';
end architecture rtl;`,

  "proto-axi-lite-write": `library ieee;
use ieee.std_logic_1164.all;

entity axi_lite_write_reg is
  port (
    clk     : in std_logic;
    reset   : in std_logic;
    awvalid : in std_logic;
    awaddr  : in std_logic_vector(3 downto 0);
    awready : out std_logic;
    wvalid  : in std_logic;
    wdata   : in std_logic_vector(31 downto 0);
    wready  : out std_logic;
    bvalid  : out std_logic;
    bready  : in std_logic;
    bresp   : out std_logic_vector(1 downto 0);
    reg0    : out std_logic_vector(31 downto 0)
  );
end entity axi_lite_write_reg;

architecture rtl of axi_lite_write_reg is
  signal aw_seen : std_logic := '0';
  signal w_seen : std_logic := '0';
  signal awaddr_hold : std_logic_vector(3 downto 0) := (others => '0');
  signal wdata_hold : std_logic_vector(31 downto 0) := (others => '0');
  signal bvalid_r : std_logic := '0';
  signal reg0_r : std_logic_vector(31 downto 0) := (others => '0');
  signal awready_i : std_logic;
  signal wready_i : std_logic;
begin
  awready_i <= (not aw_seen) and (not bvalid_r);
  wready_i <= (not w_seen) and (not bvalid_r);
  awready <= awready_i;
  wready <= wready_i;
  bvalid <= bvalid_r;
  bresp <= "00";
  reg0 <= reg0_r;

  process(clk)
    variable have_aw : boolean;
    variable have_w : boolean;
    variable addr_v : std_logic_vector(3 downto 0);
    variable data_v : std_logic_vector(31 downto 0);
  begin
    if rising_edge(clk) then
      if reset = '1' then
        aw_seen <= '0';
        w_seen <= '0';
        awaddr_hold <= (others => '0');
        wdata_hold <= (others => '0');
        bvalid_r <= '0';
        reg0_r <= (others => '0');
      else
        if awvalid = '1' and awready_i = '1' then
          aw_seen <= '1';
          awaddr_hold <= awaddr;
        end if;

        if wvalid = '1' and wready_i = '1' then
          w_seen <= '1';
          wdata_hold <= wdata;
        end if;

        have_aw := (aw_seen = '1') or (awvalid = '1' and awready_i = '1');
        have_w := (w_seen = '1') or (wvalid = '1' and wready_i = '1');

        if bvalid_r = '0' and have_aw and have_w then
          if aw_seen = '1' then addr_v := awaddr_hold; else addr_v := awaddr; end if;
          if w_seen = '1' then data_v := wdata_hold; else data_v := wdata; end if;

          if addr_v = "0000" then
            reg0_r <= data_v;
          end if;
          bvalid_r <= '1';
          aw_seen <= '0';
          w_seen <= '0';
        elsif bvalid_r = '1' and bready = '1' then
          bvalid_r <= '0';
        end if;
      end if;
    end if;
  end process;
end architecture rtl;`,

  "fpga-pwm": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity pwm is
  generic ( WIDTH : positive := 8 );
  port (
    clk     : in std_logic;
    reset   : in std_logic;
    duty    : in std_logic_vector(WIDTH-1 downto 0);
    pwm_out : out std_logic
  );
end entity pwm;

architecture rtl of pwm is
  signal counter : unsigned(WIDTH-1 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        counter <= (others => '0');
      else
        counter <= counter + 1;
      end if;
    end if;
  end process;

  pwm_out <= '1' when counter < unsigned(duty) else '0';
end architecture rtl;`,

  "fpga-pulse-sync": `library ieee;
use ieee.std_logic_1164.all;

entity pulse_sync is
  port (
    src_clk   : in std_logic;
    src_reset : in std_logic;
    src_pulse : in std_logic;
    dst_clk   : in std_logic;
    dst_reset : in std_logic;
    dst_pulse : out std_logic
  );
end entity pulse_sync;

architecture rtl of pulse_sync is
  signal src_toggle : std_logic := '0';
  signal sync1 : std_logic := '0';
  signal sync2 : std_logic := '0';
  signal sync2_d : std_logic := '0';
  signal dst_pulse_r : std_logic := '0';
begin
  process(src_clk)
  begin
    if rising_edge(src_clk) then
      if src_reset = '1' then
        src_toggle <= '0';
      elsif src_pulse = '1' then
        src_toggle <= not src_toggle;
      end if;
    end if;
  end process;

  process(dst_clk)
  begin
    if rising_edge(dst_clk) then
      if dst_reset = '1' then
        sync1 <= '0';
        sync2 <= '0';
        sync2_d <= '0';
        dst_pulse_r <= '0';
      else
        sync1 <= src_toggle;
        sync2 <= sync1;
        sync2_d <= sync2;
        dst_pulse_r <= sync2 xor sync2_d;
      end if;
    end if;
  end process;

  dst_pulse <= dst_pulse_r;
end architecture rtl;`,

  "fpga-clock-enable": `library ieee;
use ieee.std_logic_1164.all;

entity ce_reg is
  generic ( WIDTH : positive := 8 );
  port (
    clk   : in std_logic;
    reset : in std_logic;
    ce    : in std_logic;
    d     : in std_logic_vector(WIDTH-1 downto 0);
    q     : out std_logic_vector(WIDTH-1 downto 0)
  );
end entity ce_reg;

architecture rtl of ce_reg is
  signal q_r : std_logic_vector(WIDTH-1 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        q_r <= (others => '0');
      elsif ce = '1' then
        q_r <= d;
      end if;
    end if;
  end process;

  q <= q_r;
end architecture rtl;`,

  "accel-popcount32": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity popcount32 is
  port (
    x : in std_logic_vector(31 downto 0);
    count : out std_logic_vector(5 downto 0)
  );
end entity popcount32;

architecture rtl of popcount32 is
begin
  process(x)
    variable total : unsigned(5 downto 0);
  begin
    total := (others => '0');
    for i in x'range loop
      if x(i) = '1' then
        total := total + 1;
      end if;
    end loop;
    count <= std_logic_vector(total);
  end process;
end architecture rtl;`,

  "accel-vector-max4": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity vector_max4 is
  port (
    x0, x1, x2, x3 : in signed(15 downto 0);
    max_value : out signed(15 downto 0)
  );
end entity vector_max4;

architecture rtl of vector_max4 is
begin
  process(x0, x1, x2, x3)
    variable m : signed(15 downto 0);
  begin
    m := x0;
    if x1 > m then m := x1; end if;
    if x2 > m then m := x2; end if;
    if x3 > m then m := x3; end if;
    max_value <= m;
  end process;
end architecture rtl;`,

  "accel-fixed-mul": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity q17_mul is
  port (
    a : in signed(7 downto 0);
    b : in signed(7 downto 0);
    y : out signed(7 downto 0)
  );
end entity q17_mul;

architecture rtl of q17_mul is
  signal product : signed(15 downto 0);
begin
  product <= a * b;
  y <= resize(shift_right(product, 7), y'length);
end architecture rtl;`,

  "accel-stream-accum": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity stream_accum is
  port (
    clk      : in std_logic;
    reset    : in std_logic;
    clear    : in std_logic;
    in_valid : in std_logic;
    in_ready : out std_logic;
    in_data  : in signed(15 downto 0);
    acc      : out signed(31 downto 0)
  );
end entity stream_accum;

architecture rtl of stream_accum is
  signal acc_r : signed(31 downto 0) := (others => '0');
begin
  in_ready <= not reset;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' or clear = '1' then
        acc_r <= (others => '0');
      elsif in_valid = '1' and reset = '0' then
        acc_r <= acc_r + resize(in_data, acc_r'length);
      end if;
    end if;
  end process;

  acc <= acc_r;
end architecture rtl;`,

  "accel-matmul2": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity matmul2 is
  port (
    a00, a01, a10, a11 : in signed(7 downto 0);
    b00, b01, b10, b11 : in signed(7 downto 0);
    c00, c01, c10, c11 : out signed(17 downto 0)
  );
end entity matmul2;

architecture rtl of matmul2 is
begin
  c00 <= resize(a00 * b00, 18) + resize(a01 * b10, 18);
  c01 <= resize(a00 * b01, 18) + resize(a01 * b11, 18);
  c10 <= resize(a10 * b00, 18) + resize(a11 * b10, 18);
  c11 <= resize(a10 * b01, 18) + resize(a11 * b11, 18);
end architecture rtl;`,

  "accel-conv3": `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity conv3_int8 is
  port (
    x0, x1, x2 : in signed(7 downto 0);
    k0, k1, k2 : in signed(7 downto 0);
    y : out signed(17 downto 0)
  );
end entity conv3_int8;

architecture rtl of conv3_int8 is
begin
  y <= resize(x0 * k0, 18) +
       resize(x1 * k1, 18) +
       resize(x2 * k2, 18);
end architecture rtl;`
};

export default additionalVhdlSolutions;
