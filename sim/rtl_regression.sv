`timescale 1ns/1ps

// HDLForge RTL regression suite.
// The sequential stimulus is driven away from the active clock edge so that
// the testbench does not race the DUT's always_ff blocks.

module rtl_mux(input logic a, b, sel, output logic y);
  always_comb y = sel ? b : a;
endmodule

module rtl_counter #(parameter WIDTH=8)(input logic clk, reset, enable, output logic [WIDTH-1:0] count);
  always_ff @(posedge clk) begin
    if (reset) count <= '0;
    else if (enable) count <= count + 1'b1;
  end
endmodule

module rtl_priority(input logic [7:0] req, output logic [2:0] grant, output logic valid);
  always_comb begin
    grant = 3'b000; valid = 1'b1;
    if (req[7]) grant=3'd7;
    else if (req[6]) grant=3'd6;
    else if (req[5]) grant=3'd5;
    else if (req[4]) grant=3'd4;
    else if (req[3]) grant=3'd3;
    else if (req[2]) grant=3'd2;
    else if (req[1]) grant=3'd1;
    else if (req[0]) grant=3'd0;
    else begin grant=3'b000; valid=1'b0; end
  end
endmodule

module rtl_fifo #(parameter WIDTH=8, DEPTH=4)(
  input logic clk, reset, enq, deq, input logic [WIDTH-1:0] din,
  output logic [WIDTH-1:0] dout, output logic full, empty
);
  logic [WIDTH-1:0] mem [0:DEPTH-1];
  integer wptr, rptr, count;
  always_comb begin full=(count==DEPTH); empty=(count==0); end
  always_ff @(posedge clk) begin
    if (reset) begin wptr<=0; rptr<=0; count<=0; dout<='0; end
    else begin
      if (enq && !full) begin mem[wptr]<=din; wptr <= (wptr+1)%DEPTH; end
      if (deq && !empty) begin dout<=mem[rptr]; rptr <= (rptr+1)%DEPTH; end
      case ({enq && !full,deq && !empty})
        2'b10: count<=count+1;
        2'b01: count<=count-1;
        default: count<=count;
      endcase
    end
  end
endmodule

module rtl_shift_register #(parameter WIDTH=8)(input logic clk, reset, shift_en, din, output logic [WIDTH-1:0] q);
  always_ff @(posedge clk) begin
    if (reset) q<='0;
    else if (shift_en) q <= {q[WIDTH-2:0],din};
  end
endmodule

module rtl_edge_detector(input logic clk, reset, signal_in, output logic pulse);
  logic prev;
  always_ff @(posedge clk) begin
    if (reset) begin prev<=0; pulse<=0; end
    else begin pulse <= signal_in & ~prev; prev <= signal_in; end
  end
endmodule

module rtl_arbiter(input logic [3:0] req, output logic [3:0] grant);
  always_comb begin
    grant=4'b0000;
    if (req[3]) grant=4'b1000;
    else if (req[2]) grant=4'b0100;
    else if (req[1]) grant=4'b0010;
    else if (req[0]) grant=4'b0001;
  end
endmodule

module rtl_regfile(input logic clk, reset, we, input logic [1:0] waddr, raddr_a, raddr_b,
                   input logic [7:0] wdata, output logic [7:0] rdata_a, rdata_b);
  logic [7:0] regs [0:3];
  integer i;
  always_ff @(posedge clk) begin
    if (reset) for (i=0;i<4;i=i+1) regs[i]<='0;
    else if (we) regs[waddr] <= wdata;
  end
  always_comb begin rdata_a=regs[raddr_a]; rdata_b=regs[raddr_b]; end
endmodule

module rtl_lfsr(input logic clk, reset, enable, output logic [7:0] state);
  logic feedback;
  always_ff @(posedge clk) begin
    if (reset) state<=8'h01;
    else if (enable) begin
      feedback = state[7]^state[5]^state[4]^state[3];
      state <= {state[6:0],feedback};
    end
  end
endmodule

module rtl_clock_divider #(parameter WIDTH=16)(input logic clk, reset, enable, input logic [WIDTH-1:0] divide_by, output logic out_clk);
  logic [WIDTH-1:0] count;
  always_ff @(posedge clk) begin
    if (reset) begin count<='0; out_clk<=0; end
    else if (!enable) begin count<='0; out_clk<=0; end
    else if (divide_by<=1) begin count<='0; out_clk<=~out_clk; end
    else if (count == divide_by-1) begin count<='0; out_clk<=~out_clk; end
    else count<=count+1'b1;
  end
endmodule

module test;
  integer errors=0;
  logic clk=0; always #5 clk=~clk;

  task automatic check(input logic condition, input string name);
    if (!condition) begin $display("FAIL: %s",name); errors=errors+1; end
    else $display("PASS: %s",name);
  endtask

  logic a,b,sel,y;
  rtl_mux u_mux(a,b,sel,y);

  logic reset,enable; logic [7:0] count;
  rtl_counter u_counter(clk,reset,enable,count);

  logic [7:0] req; logic [2:0] grant; logic valid;
  rtl_priority u_priority(req,grant,valid);

  logic enq,deq; logic [7:0] din,dout; logic full,empty;
  rtl_fifo u_fifo(clk,reset,enq,deq,din,dout,full,empty);

  logic shift_en,din_bit; logic [7:0] q;
  rtl_shift_register u_shift(clk,reset,shift_en,din_bit,q);

  logic signal_in,pulse;
  rtl_edge_detector u_edge(clk,reset,signal_in,pulse);

  logic [3:0] arb_req,arb_grant;
  rtl_arbiter u_arb(arb_req,arb_grant);

  logic we; logic [1:0] waddr,raddr_a,raddr_b; logic [7:0] wdata,rdata_a,rdata_b;
  rtl_regfile u_reg(clk,reset,we,waddr,raddr_a,raddr_b,wdata,rdata_a,rdata_b);

  logic lfsr_enable; logic [7:0] lfsr_state;
  rtl_lfsr u_lfsr(clk,reset,lfsr_enable,lfsr_state);

  logic div_enable; logic [7:0] divide_by; logic out_clk;
  rtl_clock_divider u_div(clk,reset,div_enable,divide_by,out_clk);

  initial begin
    // 1. 2:1 mux
    a=0;b=1;sel=0; #1; check(y===0,"rtl-mux sel=0");
    sel=1; #1; check(y===1,"rtl-mux sel=1");
    a=1;b=0;sel=0; #1; check(y===1,"rtl-mux alternate inputs");

    // 2. synchronous counter
    reset=1; enable=0; @(negedge clk); @(posedge clk); #1; check(count===0,"rtl-counter reset");
    reset=0; enable=1; repeat(3) @(posedge clk); #1; check(count===3,"rtl-counter increments");
    enable=0; @(negedge clk); @(posedge clk); #1; check(count===3,"rtl-counter holds");

    // 3. priority encoder, bit 7 highest
    req=8'b0; #1; check(!valid,"rtl-priority no request");
    req=8'b00101001; #1; check(valid && grant===3'd5,"rtl-priority highest active bit");
    req=8'b10000001; #1; check(grant===3'd7,"rtl-priority bit7 wins");

    // 4. FIFO: order, full and empty
    reset=1; enq=0; deq=0; din=0; @(negedge clk); @(posedge clk); #1; reset=0;
    check(empty && !full,"rtl-fifo initial flags");
    @(negedge clk); enq=1; din=8'hA1;
    @(posedge clk); @(negedge clk); din=8'hB2;
    @(posedge clk); @(negedge clk); enq=0;
    check(!empty && !full,"rtl-fifo enqueue flags");
    deq=1; @(posedge clk); #1; check(dout===8'hA1,"rtl-fifo first dequeue");
    @(negedge clk); @(posedge clk); #1; check(dout===8'hB2,"rtl-fifo second dequeue");
    @(negedge clk); deq=0; #1; check(empty,"rtl-fifo empty after dequeue");
    @(negedge clk); enq=1; din=8'h01;
    @(posedge clk); @(negedge clk); din=8'h02;
    @(posedge clk); @(negedge clk); din=8'h03;
    @(posedge clk); @(negedge clk); din=8'h04;
    @(posedge clk); @(negedge clk); enq=0;
    #1; check(full,"rtl-fifo full");

    // 5. shift register: din enters bit 0, shifts toward MSB
    reset=1; shift_en=0; din_bit=0; @(negedge clk); @(posedge clk); #1; reset=0;
    @(negedge clk); shift_en=1; din_bit=1;
    @(posedge clk); @(negedge clk); din_bit=0;
    @(posedge clk); #1; check(q===8'b00000010,"rtl-shift-register direction");
    @(negedge clk); shift_en=0; @(posedge clk); #1; check(q===8'b00000010,"rtl-shift-register hold");

    // 6. rising edge detector
    reset=1; signal_in=0; @(negedge clk); @(posedge clk); #1; reset=0; check(!pulse,"rtl-edge-detector reset");
    @(negedge clk); signal_in=1; @(posedge clk); #1; check(pulse,"rtl-edge-detector rising edge");
    @(negedge clk); @(posedge clk); #1; check(!pulse,"rtl-edge-detector one-cycle pulse");
    @(negedge clk); signal_in=0; @(posedge clk); #1; check(!pulse,"rtl-edge-detector falling edge");
    @(negedge clk); signal_in=1; @(posedge clk); #1; check(pulse,"rtl-edge-detector second rising edge");

    // 7. fixed-priority arbiter, request 3 highest
    arb_req=4'b0000; #1; check(arb_grant===0,"rtl-arbiter idle");
    arb_req=4'b1010; #1; check(arb_grant===4'b1000,"rtl-arbiter req3 priority");
    arb_req=4'b0011; #1; check(arb_grant===4'b0010,"rtl-arbiter req1 over req0");

    // 8. 4x8 register file: sync write, async reads
    reset=1; we=0; waddr=0; wdata=0; raddr_a=0; raddr_b=0; @(negedge clk); @(posedge clk); #1; reset=0;
    @(negedge clk); waddr=2; wdata=8'h5A; we=1;
    @(posedge clk); @(negedge clk); we=0; #1;
    raddr_a=2; raddr_b=0; #1; check(rdata_a===8'h5A && rdata_b===0,"rtl-regfile write/read");
    @(negedge clk); waddr=1; wdata=8'hC3; we=1;
    @(posedge clk); @(negedge clk); we=0; raddr_b=1; #1; check(rdata_b===8'hC3,"rtl-regfile second write");

    // 9. LFSR: reset seed and non-zero deterministic sequence
    reset=1; lfsr_enable=0; @(negedge clk); @(posedge clk); #1; check(lfsr_state===8'h01,"rtl-lfsr seed");
    reset=0; lfsr_enable=1; @(negedge clk); @(posedge clk); #1; check(lfsr_state===8'h02,"rtl-lfsr first step");
    @(negedge clk); @(posedge clk); #1; check(lfsr_state===8'h04,"rtl-lfsr second step");
    @(negedge clk); lfsr_enable=0; @(posedge clk); #1; check(lfsr_state===8'h04,"rtl-lfsr hold when disabled");

    // 10. programmable clock divider: divide-by-N toggles after N input clocks
    reset=1; div_enable=0; divide_by=3; @(negedge clk); @(posedge clk); #1; reset=0; div_enable=1;
    check(out_clk===0,"rtl-clock-divider reset");
    @(negedge clk); @(posedge clk); #1; check(out_clk===0,"rtl-clock-divider count1");
    @(negedge clk); @(posedge clk); #1; check(out_clk===0,"rtl-clock-divider count2");
    @(negedge clk); @(posedge clk); #1; check(out_clk===1,"rtl-clock-divider toggle");
    @(negedge clk); div_enable=0; @(posedge clk); #1; check(out_clk===0,"rtl-clock-divider disable");

    if (errors==0) begin
      $display("\nHDLForge RTL REGRESSION: PASS (10/10 problems exercised)\n");
      $finish;
    end else begin
      $display("\nHDLForge RTL REGRESSION: FAIL (%0d checks failed)\n",errors);
      $fatal(1);
    end
  end
endmodule
