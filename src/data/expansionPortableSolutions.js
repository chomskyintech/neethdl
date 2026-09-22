const expansionPortableSolutions = {
  "comb-decoder3to8": {
    Verilog: `module decoder3to8(input [2:0] a, output [7:0] y);
  assign y = 8'b00000001 << a;
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity decoder3to8 is
  port (
    a : in std_logic_vector(2 downto 0);
    y : out std_logic_vector(7 downto 0)
  );
end entity decoder3to8;

architecture rtl of decoder3to8 is
begin
  y <= std_logic_vector(shift_left(to_unsigned(1, 8), to_integer(unsigned(a))));
end architecture rtl;`
  },

  "comb-onehot-mux4": {
    Verilog: `module onehot_mux4(
  input [3:0] sel,
  input [7:0] d0, d1, d2, d3,
  output reg [7:0] y
);
always @(*) begin
  case (sel)
    4'b0001: y = d0;
    4'b0010: y = d1;
    4'b0100: y = d2;
    4'b1000: y = d3;
    default: y = 8'd0;
  endcase
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity onehot_mux4 is
  port (
    sel : in std_logic_vector(3 downto 0);
    d0, d1, d2, d3 : in std_logic_vector(7 downto 0);
    y : out std_logic_vector(7 downto 0)
  );
end entity onehot_mux4;

architecture rtl of onehot_mux4 is
begin
  process(sel, d0, d1, d2, d3)
  begin
    case sel is
      when "0001" => y <= d0;
      when "0010" => y <= d1;
      when "0100" => y <= d2;
      when "1000" => y <= d3;
      when others => y <= (others => '0');
    end case;
  end process;
end architecture rtl;`
  },

  "comb-comparator16": {
    Verilog: `module comparator16(input [15:0] a,b,output lt,eq,gt);
  assign lt = (a < b);
  assign eq = (a == b);
  assign gt = (a > b);
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity comparator16 is
  port (
    a, b : in std_logic_vector(15 downto 0);
    lt, eq, gt : out std_logic
  );
end entity comparator16;

architecture rtl of comparator16 is
begin
  lt <= '1' when unsigned(a) < unsigned(b) else '0';
  eq <= '1' when a = b else '0';
  gt <= '1' when unsigned(a) > unsigned(b) else '0';
end architecture rtl;`
  },

  "comb-barrel-shifter": {
    Verilog: `module barrel_shifter8(input [7:0] data,input [2:0] shamt,input dir,output reg [7:0] y);
always @(*) begin
  if (dir) y = data >> shamt;
  else y = data << shamt;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity barrel_shifter8 is
  port (
    data : in std_logic_vector(7 downto 0);
    shamt : in std_logic_vector(2 downto 0);
    dir : in std_logic;
    y : out std_logic_vector(7 downto 0)
  );
end entity barrel_shifter8;

architecture rtl of barrel_shifter8 is
begin
  process(data, shamt, dir)
  begin
    if dir = '1' then
      y <= std_logic_vector(shift_right(unsigned(data), to_integer(unsigned(shamt))));
    else
      y <= std_logic_vector(shift_left(unsigned(data), to_integer(unsigned(shamt))));
    end if;
  end process;
end architecture rtl;`
  },

  "comb-leading-zero": {
    Verilog: `module leading_zero8(input [7:0] data,output reg [3:0] count);
always @(*) begin
  casex (data)
    8'b1xxxxxxx: count=0;
    8'b01xxxxxx: count=1;
    8'b001xxxxx: count=2;
    8'b0001xxxx: count=3;
    8'b00001xxx: count=4;
    8'b000001xx: count=5;
    8'b0000001x: count=6;
    8'b00000001: count=7;
    default: count=8;
  endcase
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity leading_zero8 is
  port (
    data : in std_logic_vector(7 downto 0);
    count : out std_logic_vector(3 downto 0)
  );
end entity leading_zero8;

architecture rtl of leading_zero8 is
begin
  process(data)
    variable c : integer range 0 to 8;
    variable found : boolean;
  begin
    c := 8;
    found := false;
    for i in 7 downto 0 loop
      if not found and data(i) = '1' then
        c := 7 - i;
        found := true;
      end if;
    end loop;
    count <= std_logic_vector(to_unsigned(c, 4));
  end process;
end architecture rtl;`
  },

  "comb-popcount8": {
    Verilog: `module popcount8(input [7:0] data,output reg [3:0] count);
integer i;
always @(*) begin
  count=0;
  for(i=0;i<8;i=i+1) count=count+data[i];
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity popcount8 is
  port (
    data : in std_logic_vector(7 downto 0);
    count : out std_logic_vector(3 downto 0)
  );
end entity popcount8;

architecture rtl of popcount8 is
begin
  process(data)
    variable c : unsigned(3 downto 0);
  begin
    c := (others => '0');
    for i in data'range loop
      if data(i) = '1' then c := c + 1; end if;
    end loop;
    count <= std_logic_vector(c);
  end process;
end architecture rtl;`
  },

  "comb-minmax4": {
    Verilog: `module minmax4(input [7:0] a,b,c,d,output reg [7:0] min_value,max_value);
always @(*) begin
  min_value=a; max_value=a;
  if(b<min_value) min_value=b;
  if(c<min_value) min_value=c;
  if(d<min_value) min_value=d;
  if(b>max_value) max_value=b;
  if(c>max_value) max_value=c;
  if(d>max_value) max_value=d;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity minmax4 is
  port (
    a, b, c, d : in std_logic_vector(7 downto 0);
    min_value, max_value : out std_logic_vector(7 downto 0)
  );
end entity minmax4;

architecture rtl of minmax4 is
begin
  process(a, b, c, d)
    variable mn, mx : unsigned(7 downto 0);
  begin
    mn := unsigned(a);
    mx := unsigned(a);
    if unsigned(b) < mn then mn := unsigned(b); end if;
    if unsigned(c) < mn then mn := unsigned(c); end if;
    if unsigned(d) < mn then mn := unsigned(d); end if;
    if unsigned(b) > mx then mx := unsigned(b); end if;
    if unsigned(c) > mx then mx := unsigned(c); end if;
    if unsigned(d) > mx then mx := unsigned(d); end if;
    min_value <= std_logic_vector(mn);
    max_value <= std_logic_vector(mx);
  end process;
end architecture rtl;`
  },

  "comb-parity": {
    Verilog: `module even_parity(input [7:0] data,output parity);
  assign parity = ^data;
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity even_parity is
  port (
    data : in std_logic_vector(7 downto 0);
    parity : out std_logic
  );
end entity even_parity;

architecture rtl of even_parity is
begin
  parity <= xor data;
end architecture rtl;`
  },

  "seq-enable-reg": {
    Verilog: `module enable_reg(input clk,reset,enable,input [7:0] d,output reg [7:0] q);
always @(posedge clk) begin
  if(reset) q <= 8'd0;
  else if(enable) q <= d;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity enable_reg is
  port (
    clk, reset, enable : in std_logic;
    d : in std_logic_vector(7 downto 0);
    q : out std_logic_vector(7 downto 0)
  );
end entity enable_reg;

architecture rtl of enable_reg is
  signal q_r : std_logic_vector(7 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then q_r <= (others => '0');
      elsif enable = '1' then q_r <= d;
      end if;
    end if;
  end process;
  q <= q_r;
end architecture rtl;`
  },

  "seq-toggle-flop": {
    Verilog: `module toggle_ff(input clk,reset,toggle_en,output reg q);
always @(posedge clk) begin
  if(reset) q<=1'b0;
  else if(toggle_en) q<=~q;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity toggle_ff is
  port (
    clk, reset, toggle_en : in std_logic;
    q : out std_logic
  );
end entity toggle_ff;

architecture rtl of toggle_ff is
  signal q_r : std_logic := '0';
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then q_r <= '0';
      elsif toggle_en = '1' then q_r <= not q_r;
      end if;
    end if;
  end process;
  q <= q_r;
end architecture rtl;`
  },

  "seq-sticky-flag": {
    Verilog: `module sticky_flag(input clk,reset,clear,event_in,output reg flag);
always @(posedge clk) begin
  if(reset) flag<=1'b0;
  else if(clear) flag<=1'b0;
  else if(event_in) flag<=1'b1;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity sticky_flag is
  port (
    clk, reset, clear, event_in : in std_logic;
    flag : out std_logic
  );
end entity sticky_flag;

architecture rtl of sticky_flag is
  signal flag_r : std_logic := '0';
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then flag_r <= '0';
      elsif clear = '1' then flag_r <= '0';
      elsif event_in = '1' then flag_r <= '1';
      end if;
    end if;
  end process;
  flag <= flag_r;
end architecture rtl;`
  },

  "seq-pulse-stretcher": {
    Verilog: `module pulse_stretcher(input clk,reset,pulse_in,output pulse_out);
reg [2:0] count;
always @(posedge clk) begin
  if(reset) count<=0;
  else if(pulse_in) count<=3'd4;
  else if(count!=0) count<=count-1'b1;
end
assign pulse_out=(count!=0);
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity pulse_stretcher is
  port (
    clk, reset, pulse_in : in std_logic;
    pulse_out : out std_logic
  );
end entity pulse_stretcher;

architecture rtl of pulse_stretcher is
  signal count : unsigned(2 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then count <= (others => '0');
      elsif pulse_in = '1' then count <= to_unsigned(4, count'length);
      elsif count /= 0 then count <= count - 1;
      end if;
    end if;
  end process;
  pulse_out <= '1' when count /= 0 else '0';
end architecture rtl;`
  },

  "seq-delay-line": {
    Verilog: `module delay_line4(input clk,reset,input [7:0] din,output [7:0] dout);
reg [7:0] d0,d1,d2,d3;
always @(posedge clk) begin
  if(reset) begin d0<=0;d1<=0;d2<=0;d3<=0; end
  else begin d0<=din;d1<=d0;d2<=d1;d3<=d2; end
end
assign dout=d3;
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity delay_line4 is
  port (
    clk, reset : in std_logic;
    din : in std_logic_vector(7 downto 0);
    dout : out std_logic_vector(7 downto 0)
  );
end entity delay_line4;

architecture rtl of delay_line4 is
  signal d0, d1, d2, d3 : std_logic_vector(7 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        d0 <= (others => '0'); d1 <= (others => '0');
        d2 <= (others => '0'); d3 <= (others => '0');
      else
        d0 <= din; d1 <= d0; d2 <= d1; d3 <= d2;
      end if;
    end if;
  end process;
  dout <= d3;
end architecture rtl;`
  },

  "seq-serial-parallel": {
    Verilog: `module serial_to_parallel(input clk,reset,enable,serial_in,output reg [7:0] data,output reg valid);
reg [2:0] count;
always @(posedge clk) begin
  if(reset) begin data<=0;count<=0;valid<=0; end
  else begin
    valid<=0;
    if(enable) begin
      data<={data[6:0],serial_in};
      if(count==3'd7) begin count<=0;valid<=1; end
      else count<=count+1'b1;
    end
  end
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity serial_to_parallel is
  port (
    clk, reset, enable, serial_in : in std_logic;
    data : out std_logic_vector(7 downto 0);
    valid : out std_logic
  );
end entity serial_to_parallel;

architecture rtl of serial_to_parallel is
  signal data_r : std_logic_vector(7 downto 0) := (others => '0');
  signal count : unsigned(2 downto 0) := (others => '0');
  signal valid_r : std_logic := '0';
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        data_r <= (others => '0');
        count <= (others => '0');
        valid_r <= '0';
      else
        valid_r <= '0';
        if enable = '1' then
          data_r <= data_r(6 downto 0) & serial_in;
          if count = 7 then
            count <= (others => '0');
            valid_r <= '1';
          else
            count <= count + 1;
          end if;
        end if;
      end if;
    end if;
  end process;
  data <= data_r;
  valid <= valid_r;
end architecture rtl;`
  },

  "fsm-seq1011": {
    Verilog: `module seq1011(input clk,reset,bit_in,output reg match);
localparam S0=2'd0,S1=2'd1,S10=2'd2,S101=2'd3;
reg [1:0] state,next;
always @(*) begin
  next=state; match=0;
  case(state)
    S0: if(bit_in) next=S1; else next=S0;
    S1: if(bit_in) next=S1; else next=S10;
    S10: if(bit_in) next=S101; else next=S0;
    S101: if(bit_in) begin match=1;next=S1;end else next=S10;
  endcase
end
always @(posedge clk) begin
  if(reset) state<=S0; else state<=next;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity seq1011 is
  port (
    clk, reset, bit_in : in std_logic;
    match : out std_logic
  );
end entity seq1011;

architecture rtl of seq1011 is
  type state_t is (S0, S1, S10, S101);
  signal state, next_state : state_t := S0;
begin
  process(state, bit_in)
  begin
    next_state <= state;
    match <= '0';
    case state is
      when S0 => if bit_in='1' then next_state<=S1; else next_state<=S0; end if;
      when S1 => if bit_in='1' then next_state<=S1; else next_state<=S10; end if;
      when S10 => if bit_in='1' then next_state<=S101; else next_state<=S0; end if;
      when S101 =>
        if bit_in='1' then match<='1'; next_state<=S1;
        else next_state<=S10; end if;
    end case;
  end process;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then state<=S0; else state<=next_state; end if;
    end if;
  end process;
end architecture rtl;`
  },

  "fsm-handshake-controller": {
    Verilog: `module req_ack_ctrl(input clk,reset,start,ack,output reg req,done);
localparam IDLE=2'd0,REQUEST=2'd1,DONE=2'd2;
reg [1:0] state,next;
always @(*) begin
  next=state;req=0;done=0;
  case(state)
    IDLE: if(start) next=REQUEST;
    REQUEST: begin req=1;if(ack)next=DONE;end
    DONE: begin done=1;next=IDLE;end
  endcase
end
always @(posedge clk) begin
  if(reset) state<=IDLE; else state<=next;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity req_ack_ctrl is
  port (
    clk, reset, start, ack : in std_logic;
    req, done : out std_logic
  );
end entity req_ack_ctrl;

architecture rtl of req_ack_ctrl is
  type state_t is (IDLE, REQUEST_STATE, DONE_STATE);
  signal state, next_state : state_t := IDLE;
begin
  process(state, start, ack)
  begin
    next_state <= state; req <= '0'; done <= '0';
    case state is
      when IDLE => if start='1' then next_state<=REQUEST_STATE; end if;
      when REQUEST_STATE =>
        req <= '1';
        if ack='1' then next_state<=DONE_STATE; end if;
      when DONE_STATE => done<='1'; next_state<=IDLE;
    end case;
  end process;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then state<=IDLE; else state<=next_state; end if;
    end if;
  end process;
end architecture rtl;`
  },

  "fsm-pedestrian-light": {
    Verilog: `module pedestrian_fsm(input clk,reset,ped_request,timer_done,output reg car_green,car_red,walk);
localparam WAIT_ST=2'd0,STOP_ST=2'd1,WALK_ST=2'd2;
reg [1:0] state,next;
always @(*) begin
  next=state;car_green=0;car_red=0;walk=0;
  case(state)
    WAIT_ST: begin car_green=1;if(ped_request)next=STOP_ST;end
    STOP_ST: begin car_red=1;if(timer_done)next=WALK_ST;end
    WALK_ST: begin car_red=1;walk=1;if(timer_done)next=WAIT_ST;end
  endcase
end
always @(posedge clk) begin
  if(reset) state<=WAIT_ST; else state<=next;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity pedestrian_fsm is
  port (
    clk, reset, ped_request, timer_done : in std_logic;
    car_green, car_red, walk : out std_logic
  );
end entity pedestrian_fsm;

architecture rtl of pedestrian_fsm is
  type state_t is (WAIT_ST, STOP_ST, WALK_ST);
  signal state, next_state : state_t := WAIT_ST;
begin
  process(state, ped_request, timer_done)
  begin
    next_state<=state; car_green<='0'; car_red<='0'; walk<='0';
    case state is
      when WAIT_ST =>
        car_green<='1';
        if ped_request='1' then next_state<=STOP_ST; end if;
      when STOP_ST =>
        car_red<='1';
        if timer_done='1' then next_state<=WALK_ST; end if;
      when WALK_ST =>
        car_red<='1'; walk<='1';
        if timer_done='1' then next_state<=WAIT_ST; end if;
    end case;
  end process;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then state<=WAIT_ST; else state<=next_state; end if;
    end if;
  end process;
end architecture rtl;`
  },

  "fsm-timeout-retry": {
    Verilog: `module retry_fsm(input clk,reset,start,ack,timeout,output reg req,done,error);
localparam IDLE=3'd0,ISSUE=3'd1,WAIT_ST=3'd2,SUCCESS=3'd3,FAIL_ST=3'd4;
reg [2:0] state,next;
reg [1:0] attempts;
always @(*) begin
  next=state;req=0;done=0;error=0;
  case(state)
    IDLE: if(start) next=ISSUE;
    ISSUE: begin req=1;next=WAIT_ST;end
    WAIT_ST: begin
      if(ack) next=SUCCESS;
      else if(timeout) begin
        if(attempts==2) next=FAIL_ST; else next=ISSUE;
      end
    end
    SUCCESS: begin done=1;next=IDLE;end
    FAIL_ST: begin error=1;next=IDLE;end
  endcase
end
always @(posedge clk) begin
  if(reset) begin state<=IDLE;attempts<=0;end
  else begin
    state<=next;
    if(state==IDLE) attempts<=0;
    else if(state==WAIT_ST && timeout && attempts!=2) attempts<=attempts+1'b1;
  end
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity retry_fsm is
  port (
    clk, reset, start, ack, timeout : in std_logic;
    req, done, error : out std_logic
  );
end entity retry_fsm;

architecture rtl of retry_fsm is
  type state_t is (IDLE, ISSUE, WAIT_ST, SUCCESS, FAIL_ST);
  signal state, next_state : state_t := IDLE;
  signal attempts : unsigned(1 downto 0) := (others => '0');
begin
  process(state, start, ack, timeout, attempts)
  begin
    next_state<=state; req<='0'; done<='0'; error<='0';
    case state is
      when IDLE => if start='1' then next_state<=ISSUE; end if;
      when ISSUE => req<='1'; next_state<=WAIT_ST;
      when WAIT_ST =>
        if ack='1' then next_state<=SUCCESS;
        elsif timeout='1' then
          if attempts=2 then next_state<=FAIL_ST; else next_state<=ISSUE; end if;
        end if;
      when SUCCESS => done<='1'; next_state<=IDLE;
      when FAIL_ST => error<='1'; next_state<=IDLE;
    end case;
  end process;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then state<=IDLE; attempts<=(others=>'0');
      else
        state<=next_state;
        if state=IDLE then attempts<=(others=>'0');
        elsif state=WAIT_ST and timeout='1' and attempts/=2 then attempts<=attempts+1;
        end if;
      end if;
    end if;
  end process;
end architecture rtl;`
  },

  "fsm-packet-parser": {
    Verilog: `module packet_parser_fsm(input clk,reset,byte_valid,packet_done,output reg header_done,payload_phase);
localparam SYNC=3'd0,TYPE_ST=3'd1,LENGTH_ST=3'd2,FLAGS_ST=3'd3,PAYLOAD=3'd4;
reg [2:0] state,next;
always @(*) begin
  next=state;header_done=0;payload_phase=0;
  case(state)
    SYNC: if(byte_valid) next=TYPE_ST;
    TYPE_ST: if(byte_valid) next=LENGTH_ST;
    LENGTH_ST: if(byte_valid) next=FLAGS_ST;
    FLAGS_ST: if(byte_valid) begin header_done=1;next=PAYLOAD;end
    PAYLOAD: begin payload_phase=1;if(packet_done)next=SYNC;end
  endcase
end
always @(posedge clk) begin
  if(reset) state<=SYNC; else state<=next;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity packet_parser_fsm is
  port (
    clk, reset, byte_valid, packet_done : in std_logic;
    header_done, payload_phase : out std_logic
  );
end entity packet_parser_fsm;

architecture rtl of packet_parser_fsm is
  type state_t is (SYNC_ST, TYPE_ST, LENGTH_ST, FLAGS_ST, PAYLOAD_ST);
  signal state, next_state : state_t := SYNC_ST;
begin
  process(state, byte_valid, packet_done)
  begin
    next_state<=state;header_done<='0';payload_phase<='0';
    case state is
      when SYNC_ST => if byte_valid='1' then next_state<=TYPE_ST; end if;
      when TYPE_ST => if byte_valid='1' then next_state<=LENGTH_ST; end if;
      when LENGTH_ST => if byte_valid='1' then next_state<=FLAGS_ST; end if;
      when FLAGS_ST =>
        if byte_valid='1' then header_done<='1';next_state<=PAYLOAD_ST; end if;
      when PAYLOAD_ST =>
        payload_phase<='1';
        if packet_done='1' then next_state<=SYNC_ST; end if;
    end case;
  end process;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then state<=SYNC_ST; else state<=next_state; end if;
    end if;
  end process;
end architecture rtl;`
  },

  "fsm-burst-controller": {
    Verilog: `module burst4_ctrl(input clk,reset,start,ready,output valid,output reg done,output reg [1:0] beat);
localparam IDLE=1'b0,SEND=1'b1;
reg state;
always @(posedge clk) begin
  if(reset) begin state<=IDLE;beat<=0;done<=0;end
  else begin
    done<=0;
    case(state)
      IDLE: if(start) begin state<=SEND;beat<=0;end
      SEND: if(ready) begin
        if(beat==2'd3) begin state<=IDLE;done<=1;beat<=0;end
        else beat<=beat+1'b1;
      end
    endcase
  end
end
assign valid=(state==SEND);
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity burst4_ctrl is
  port (
    clk, reset, start, ready : in std_logic;
    valid, done : out std_logic;
    beat : out std_logic_vector(1 downto 0)
  );
end entity burst4_ctrl;

architecture rtl of burst4_ctrl is
  type state_t is (IDLE, SEND);
  signal state : state_t := IDLE;
  signal beat_r : unsigned(1 downto 0) := (others => '0');
  signal done_r : std_logic := '0';
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then
        state<=IDLE;beat_r<=(others=>'0');done_r<='0';
      else
        done_r<='0';
        case state is
          when IDLE =>
            if start='1' then state<=SEND;beat_r<=(others=>'0');end if;
          when SEND =>
            if ready='1' then
              if beat_r=3 then state<=IDLE;done_r<='1';beat_r<=(others=>'0');
              else beat_r<=beat_r+1;
              end if;
            end if;
        end case;
      end if;
    end if;
  end process;
  valid <= '1' when state=SEND else '0';
  done <= done_r;
  beat <= std_logic_vector(beat_r);
end architecture rtl;`
  },

  "fsm-vending-machine": {
    Verilog: `module vending_fsm(input clk,reset,coin5,coin10,output reg vend);
localparam C0=2'd0,C5=2'd1,C10=2'd2;
reg [1:0] state,next;
always @(*) begin
  next=state;vend=0;
  case(state)
    C0: if(coin10)next=C10; else if(coin5)next=C5;
    C5: if(coin10)begin vend=1;next=C0;end else if(coin5)next=C10;
    C10: if(coin5||coin10)begin vend=1;next=C0;end
  endcase
end
always @(posedge clk) begin
  if(reset) state<=C0; else state<=next;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity vending_fsm is
  port (
    clk, reset, coin5, coin10 : in std_logic;
    vend : out std_logic
  );
end entity vending_fsm;

architecture rtl of vending_fsm is
  type state_t is (C0, C5, C10);
  signal state, next_state : state_t := C0;
begin
  process(state, coin5, coin10)
  begin
    next_state<=state;vend<='0';
    case state is
      when C0 =>
        if coin10='1' then next_state<=C10;
        elsif coin5='1' then next_state<=C5; end if;
      when C5 =>
        if coin10='1' then vend<='1';next_state<=C0;
        elsif coin5='1' then next_state<=C10; end if;
      when C10 =>
        if coin5='1' or coin10='1' then vend<='1';next_state<=C0; end if;
    end case;
  end process;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then state<=C0; else state<=next_state; end if;
    end if;
  end process;
end architecture rtl;`
  },

  "fsm-start-busy-done": {
    Verilog: `module start_busy_done(input clk,reset,start,operation_done,output reg busy,done);
localparam IDLE=2'd0,BUSY_ST=2'd1,DONE_ST=2'd2;
reg [1:0] state,next;
always @(*) begin
  next=state;busy=0;done=0;
  case(state)
    IDLE: if(start)next=BUSY_ST;
    BUSY_ST: begin busy=1;if(operation_done)next=DONE_ST;end
    DONE_ST: begin done=1;next=IDLE;end
  endcase
end
always @(posedge clk) begin
  if(reset) state<=IDLE; else state<=next;
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity start_busy_done is
  port (
    clk, reset, start, operation_done : in std_logic;
    busy, done : out std_logic
  );
end entity start_busy_done;

architecture rtl of start_busy_done is
  type state_t is (IDLE, BUSY_ST, DONE_ST);
  signal state, next_state : state_t := IDLE;
begin
  process(state, start, operation_done)
  begin
    next_state<=state;busy<='0';done<='0';
    case state is
      when IDLE => if start='1' then next_state<=BUSY_ST; end if;
      when BUSY_ST => busy<='1';if operation_done='1' then next_state<=DONE_ST; end if;
      when DONE_ST => done<='1';next_state<=IDLE;
    end case;
  end process;

  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then state<=IDLE; else state<=next_state; end if;
    end if;
  end process;
end architecture rtl;`
  },

  "fifo-counted": {
    Verilog: `module counted_fifo(input clk,reset,wr_en,rd_en,input [7:0] din,output reg [7:0] dout,output reg [3:0] count,output full,empty);
reg [7:0] mem[0:7];
reg [2:0] wptr,rptr;
wire write_fire=wr_en && !full;
wire read_fire=rd_en && !empty;
always @(posedge clk) begin
  if(reset) begin wptr<=0;rptr<=0;count<=0;dout<=0;end
  else begin
    if(write_fire) begin mem[wptr]<=din;wptr<=wptr+1'b1;end
    if(read_fire) begin dout<=mem[rptr];rptr<=rptr+1'b1;end
    case({write_fire,read_fire})
      2'b10:count<=count+1'b1;
      2'b01:count<=count-1'b1;
      default:count<=count;
    endcase
  end
end
assign full=(count==8);
assign empty=(count==0);
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity counted_fifo is
  port (
    clk, reset, wr_en, rd_en : in std_logic;
    din : in std_logic_vector(7 downto 0);
    dout : out std_logic_vector(7 downto 0);
    count : out std_logic_vector(3 downto 0);
    full, empty : out std_logic
  );
end entity counted_fifo;

architecture rtl of counted_fifo is
  type mem_t is array (0 to 7) of std_logic_vector(7 downto 0);
  signal mem : mem_t := (others => (others => '0'));
  signal wptr, rptr : unsigned(2 downto 0) := (others => '0');
  signal count_r : unsigned(3 downto 0) := (others => '0');
  signal dout_r : std_logic_vector(7 downto 0) := (others => '0');
begin
  process(clk)
    variable wf, rf : boolean;
  begin
    if rising_edge(clk) then
      if reset='1' then
        wptr<=(others=>'0');rptr<=(others=>'0');count_r<=(others=>'0');dout_r<=(others=>'0');
      else
        wf := wr_en='1' and count_r<8;
        rf := rd_en='1' and count_r>0;
        if wf then mem(to_integer(wptr))<=din;wptr<=wptr+1;end if;
        if rf then dout_r<=mem(to_integer(rptr));rptr<=rptr+1;end if;
        if wf and not rf then count_r<=count_r+1;
        elsif rf and not wf then count_r<=count_r-1;
        end if;
      end if;
    end if;
  end process;
  dout<=dout_r;
  count<=std_logic_vector(count_r);
  full<='1' when count_r=8 else '0';
  empty<='1' when count_r=0 else '0';
end architecture rtl;`
  },

  "fifo-almost-flags": {
    Verilog: `module fifo_thresholds(input [4:0] count,output almost_full,almost_empty);
assign almost_full=(count>=14);
assign almost_empty=(count<=2);
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity fifo_thresholds is
  port (
    count : in std_logic_vector(4 downto 0);
    almost_full, almost_empty : out std_logic
  );
end entity fifo_thresholds;

architecture rtl of fifo_thresholds is
begin
  almost_full <= '1' when unsigned(count)>=14 else '0';
  almost_empty <= '1' when unsigned(count)<=2 else '0';
end architecture rtl;`
  },

  "fifo-fwft": {
    Verilog: `module fwft2(input clk,reset,wr_en,rd_en,input [7:0] din,output [7:0] dout,output empty,full);
reg [7:0] q0,q1;
reg [1:0] count;
always @(posedge clk) begin
  if(reset) count<=0;
  else begin
    if(wr_en && !full && !(rd_en && !empty)) begin
      if(count==0)q0<=din; else q1<=din;
      count<=count+1'b1;
    end else if(rd_en && !empty && !(wr_en && !full)) begin
      q0<=q1;count<=count-1'b1;
    end else if(wr_en && !full && rd_en && !empty) begin
      if(count==1) q0<=din;
      else begin q0<=q1;q1<=din;end
    end
  end
end
assign dout=q0;
assign empty=(count==0);
assign full=(count==2);
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity fwft2 is
  port (
    clk, reset, wr_en, rd_en : in std_logic;
    din : in std_logic_vector(7 downto 0);
    dout : out std_logic_vector(7 downto 0);
    empty, full : out std_logic
  );
end entity fwft2;

architecture rtl of fwft2 is
  signal q0, q1 : std_logic_vector(7 downto 0) := (others => '0');
  signal count : unsigned(1 downto 0) := (others => '0');
begin
  process(clk)
    variable can_write, can_read : boolean;
  begin
    if rising_edge(clk) then
      if reset='1' then count<=(others=>'0');
      else
        can_write := wr_en='1' and count<2;
        can_read := rd_en='1' and count>0;
        if can_write and not can_read then
          if count=0 then q0<=din; else q1<=din; end if;
          count<=count+1;
        elsif can_read and not can_write then
          q0<=q1;count<=count-1;
        elsif can_write and can_read then
          if count=1 then q0<=din;
          else q0<=q1;q1<=din;
          end if;
        end if;
      end if;
    end if;
  end process;
  dout<=q0;
  empty<='1' when count=0 else '0';
  full<='1' when count=2 else '0';
end architecture rtl;`
  },

  "fifo-overflow-underflow": {
    Verilog: `module fifo_error_flags(input clk,reset,clear,wr_en,rd_en,full,empty,output reg overflow,underflow);
always @(posedge clk) begin
  if(reset || clear) begin overflow<=0;underflow<=0;end
  else begin
    if(wr_en && full) overflow<=1;
    if(rd_en && empty) underflow<=1;
  end
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity fifo_error_flags is
  port (
    clk, reset, clear, wr_en, rd_en, full, empty : in std_logic;
    overflow, underflow : out std_logic
  );
end entity fifo_error_flags;

architecture rtl of fifo_error_flags is
  signal ov_r, un_r : std_logic := '0';
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' or clear='1' then ov_r<='0';un_r<='0';
      else
        if wr_en='1' and full='1' then ov_r<='1';end if;
        if rd_en='1' and empty='1' then un_r<='1';end if;
      end if;
    end if;
  end process;
  overflow<=ov_r;underflow<=un_r;
end architecture rtl;`
  },

  "fifo-two-entry-elastic": {
    Verilog: `module elastic2(input clk,reset,input in_valid,input [7:0] in_data,output in_ready,output out_valid,output [7:0] out_data,input out_ready);
reg [7:0] mem0,mem1;
reg [1:0] count;
wire push=in_valid && in_ready;
wire pop=out_valid && out_ready;
always @(posedge clk) begin
  if(reset) count<=0;
  else begin
    case({push,pop})
      2'b10: begin if(count==0)mem0<=in_data;else mem1<=in_data;count<=count+1'b1;end
      2'b01: begin mem0<=mem1;count<=count-1'b1;end
      2'b11: begin if(count==1)mem0<=in_data;else begin mem0<=mem1;mem1<=in_data;end end
    endcase
  end
end
assign in_ready=(count<2);
assign out_valid=(count!=0);
assign out_data=mem0;
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity elastic2 is
  port (
    clk, reset : in std_logic;
    in_valid : in std_logic;
    in_data : in std_logic_vector(7 downto 0);
    in_ready : out std_logic;
    out_valid : out std_logic;
    out_data : out std_logic_vector(7 downto 0);
    out_ready : in std_logic
  );
end entity elastic2;

architecture rtl of elastic2 is
  signal mem0, mem1 : std_logic_vector(7 downto 0) := (others => '0');
  signal count : unsigned(1 downto 0) := (others => '0');
  signal ready_i, valid_i : std_logic;
begin
  ready_i <= '1' when count<2 else '0';
  valid_i <= '1' when count/=0 else '0';
  in_ready<=ready_i;out_valid<=valid_i;out_data<=mem0;

  process(clk)
    variable push, pop : boolean;
  begin
    if rising_edge(clk) then
      if reset='1' then count<=(others=>'0');
      else
        push := in_valid='1' and ready_i='1';
        pop := valid_i='1' and out_ready='1';
        if push and not pop then
          if count=0 then mem0<=in_data; else mem1<=in_data; end if;
          count<=count+1;
        elsif pop and not push then
          mem0<=mem1;count<=count-1;
        elsif push and pop then
          if count=1 then mem0<=in_data;
          else mem0<=mem1;mem1<=in_data;
          end if;
        end if;
      end if;
    end if;
  end process;
end architecture rtl;`
  },

  "fifo-packet-boundary": {
    Verilog: `module packet_meta_fifo(input clk,reset,wr_en,rd_en,input [7:0] din,input last_in,output reg [7:0] dout,output reg last_out);
reg [7:0] data_mem[0:3];
reg last_mem[0:3];
reg [1:0] wptr,rptr;
always @(posedge clk) begin
  if(reset) begin wptr<=0;rptr<=0;dout<=0;last_out<=0;end
  else begin
    if(wr_en) begin data_mem[wptr]<=din;last_mem[wptr]<=last_in;wptr<=wptr+1'b1;end
    if(rd_en) begin dout<=data_mem[rptr];last_out<=last_mem[rptr];rptr<=rptr+1'b1;end
  end
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity packet_meta_fifo is
  port (
    clk, reset, wr_en, rd_en : in std_logic;
    din : in std_logic_vector(7 downto 0);
    last_in : in std_logic;
    dout : out std_logic_vector(7 downto 0);
    last_out : out std_logic
  );
end entity packet_meta_fifo;

architecture rtl of packet_meta_fifo is
  type data_mem_t is array (0 to 3) of std_logic_vector(7 downto 0);
  type last_mem_t is array (0 to 3) of std_logic;
  signal data_mem : data_mem_t := (others => (others => '0'));
  signal last_mem : last_mem_t := (others => '0');
  signal wptr, rptr : unsigned(1 downto 0) := (others => '0');
  signal dout_r : std_logic_vector(7 downto 0) := (others => '0');
  signal last_r : std_logic := '0';
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then
        wptr<=(others=>'0');rptr<=(others=>'0');dout_r<=(others=>'0');last_r<='0';
      else
        if wr_en='1' then
          data_mem(to_integer(wptr))<=din;last_mem(to_integer(wptr))<=last_in;wptr<=wptr+1;
        end if;
        if rd_en='1' then
          dout_r<=data_mem(to_integer(rptr));last_r<=last_mem(to_integer(rptr));rptr<=rptr+1;
        end if;
      end if;
    end if;
  end process;
  dout<=dout_r;last_out<=last_r;
end architecture rtl;`
  },

  "fifo-circular-buffer": {
    Verilog: `module circular_buffer8(input clk,reset,enable,input [7:0] sample,output reg [2:0] wr_ptr);
reg [7:0] mem[0:7];
always @(posedge clk) begin
  if(reset) wr_ptr<=0;
  else if(enable) begin mem[wr_ptr]<=sample;wr_ptr<=wr_ptr+1'b1;end
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity circular_buffer8 is
  port (
    clk, reset, enable : in std_logic;
    sample : in std_logic_vector(7 downto 0);
    wr_ptr : out std_logic_vector(2 downto 0)
  );
end entity circular_buffer8;

architecture rtl of circular_buffer8 is
  type mem_t is array (0 to 7) of std_logic_vector(7 downto 0);
  signal mem : mem_t := (others => (others => '0'));
  signal ptr : unsigned(2 downto 0) := (others => '0');
begin
  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then ptr<=(others=>'0');
      elsif enable='1' then mem(to_integer(ptr))<=sample;ptr<=ptr+1;
      end if;
    end if;
  end process;
  wr_ptr<=std_logic_vector(ptr);
end architecture rtl;`
  },

  "fifo-bypass-buffer": {
    Verilog: `module bypass_buffer(input clk,reset,input in_valid,input [7:0] in_data,output in_ready,output out_valid,output [7:0] out_data,input out_ready);
reg stored_valid;
reg [7:0] stored_data;
assign out_valid=stored_valid?1'b1:in_valid;
assign out_data=stored_valid?stored_data:in_data;
assign in_ready=!stored_valid && out_ready;
always @(posedge clk) begin
  if(reset) stored_valid<=0;
  else begin
    if(!stored_valid && in_valid && !out_ready) begin stored_valid<=1;stored_data<=in_data;end
    else if(stored_valid && out_ready) stored_valid<=0;
  end
end
endmodule`,
    VHDL: `library ieee;
use ieee.std_logic_1164.all;

entity bypass_buffer is
  port (
    clk, reset : in std_logic;
    in_valid : in std_logic;
    in_data : in std_logic_vector(7 downto 0);
    in_ready : out std_logic;
    out_valid : out std_logic;
    out_data : out std_logic_vector(7 downto 0);
    out_ready : in std_logic
  );
end entity bypass_buffer;

architecture rtl of bypass_buffer is
  signal stored_valid : std_logic := '0';
  signal stored_data : std_logic_vector(7 downto 0) := (others => '0');
begin
  out_valid <= '1' when stored_valid='1' else in_valid;
  out_data <= stored_data when stored_valid='1' else in_data;
  in_ready <= '1' when stored_valid='0' and out_ready='1' else '0';

  process(clk)
  begin
    if rising_edge(clk) then
      if reset='1' then stored_valid<='0';
      else
        if stored_valid='0' and in_valid='1' and out_ready='0' then
          stored_valid<='1';stored_data<=in_data;
        elsif stored_valid='1' and out_ready='1' then
          stored_valid<='0';
        end if;
      end if;
    end if;
  end process;
end architecture rtl;`
  }
};

export default expansionPortableSolutions;
