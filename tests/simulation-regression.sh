#!/usr/bin/env bash
set -euo pipefail

# Host-side regression for the ten browser-simulated RTL problems.
# The production benches live in src/browserSimulator.js; these golden designs
# exercise the same behavioural contracts under Icarus Verilog in CI.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

run_case() {
  local id="$1"
  local design="$2"
  local bench="$3"
  printf '  %-24s' "$id"
  printf '%s\n' "$design" > "$TMP/design.sv"
  printf '%s\n' "$bench" > "$TMP/tb.sv"
  iverilog -g2012 -s tb -o "$TMP/sim" "$TMP/design.sv" "$TMP/tb.sv"
  local output
  output="$(vvp "$TMP/sim" 2>&1)"
  if ! grep -q 'HDLFORGE_PASS' <<< "$output"; then
    echo "FAIL"
    echo "$output"
    exit 1
  fi
  echo "PASS"
}

run_case "rtl-mux" \
'module mux2(input logic a,b,sel, output logic y); assign y = sel ? b : a; endmodule' \
'module tb; logic a,b,sel,y; mux2 dut(.a(a),.b(b),.sel(sel),.y(y)); initial begin a=0;b=0;sel=0; #1; if(y!==0) $fatal; a=0;b=1;sel=0; #1; if(y!==0) $fatal; a=0;b=1;sel=1; #1; if(y!==1) $fatal; a=1;b=0;sel=1; #1; if(y!==0) $fatal; $display("HDLFORGE_PASS"); $finish; end endmodule'

run_case "rtl-counter" \
'module counter #(parameter WIDTH=8)(input logic clk,reset, output logic [WIDTH-1:0] count); always_ff @(posedge clk) begin if(reset) count <= ''0; else count <= count + 1''b1; end endmodule' \
'module tb; logic clk=0,reset; logic [7:0] count; counter #(.WIDTH(8)) dut(.clk(clk),.reset(reset),.count(count)); always #1 clk=~clk; initial begin reset=1; @(posedge clk); #0.1; if(count!==0) $fatal; reset=0; @(posedge clk); #0.1; if(count!==1) $fatal; @(posedge clk); #0.1; if(count!==2) $fatal; reset=1; @(posedge clk); #0.1; if(count!==0) $fatal; $display("HDLFORGE_PASS"); $finish; end endmodule'

run_case "rtl-priority" \
'module priority_encoder(input logic [7:0] in, output logic [2:0] index, output logic valid); always_comb begin index=0; valid=0; for(integer i=0;i<8;i=i+1) if(in[i]) begin index=i[2:0]; valid=1; end end endmodule' \
'module tb; logic [7:0] in; logic [2:0] index; logic valid; priority_encoder dut(.in(in),.index(index),.valid(valid)); initial begin in=0; #1; if(valid!==0) $fatal; in=8''b00101000; #1; if(valid!==1 || index!==5) $fatal; in=8''b10001000; #1; if(valid!==1 || index!==7) $fatal; in=8''b00000001; #1; if(valid!==1 || index!==0) $fatal; $display("HDLFORGE_PASS"); $finish; end endmodule'

run_case "rtl-fifo" \
'module fifo #(parameter WIDTH=8,DEPTH=4)(input logic clk,reset,wr_en,rd_en,input logic [WIDTH-1:0] din,output logic [WIDTH-1:0] dout,output logic full,empty); logic [WIDTH-1:0] mem[0:DEPTH-1]; integer count,wp,rp; always_comb begin empty=(count==0); full=(count==DEPTH); end always_ff @(posedge clk) begin if(reset) begin count<=0;wp<=0;rp<=0;dout<=''0; end else begin if(wr_en && !full) begin mem[wp]<=din; wp<=(wp+1)%DEPTH; end if(rd_en && !empty) begin dout<=mem[rp]; rp<=(rp+1)%DEPTH; end case ({wr_en&&!full,rd_en&&!empty}) 2''b10:count<=count+1;2''b01:count<=count-1;default:count<=count; endcase end end endmodule' \
'module tb; logic clk=0,reset,wr_en,rd_en; logic [7:0] din,dout; logic full,empty; fifo #(.WIDTH(8),.DEPTH(4)) dut(.clk(clk),.reset(reset),.wr_en(wr_en),.rd_en(rd_en),.din(din),.dout(dout),.full(full),.empty(empty)); always #1 clk=~clk; initial begin reset=1;wr_en=0;rd_en=0;din=0;@(posedge clk);#0.1;if(!empty||full)$fatal;reset=0;din=8''hA5;wr_en=1;@(posedge clk);#0.1;if(empty)$fatal;din=8''h3C;@(posedge clk);#0.1;if(empty)$fatal;wr_en=0;rd_en=1;@(posedge clk);#0.1;if(dout!==8''hA5)$fatal;@(posedge clk);#0.1;if(dout!==8''h3C)$fatal;@(posedge clk);#0.1;if(!empty)$fatal;$display("HDLFORGE_PASS");$finish;end endmodule'

run_case "rtl-shift-register" \
'module shift_reg #(parameter WIDTH=8)(input logic clk,reset,shift_en,din,output logic [WIDTH-1:0] dout); always_ff @(posedge clk) begin if(reset)dout<=''0; else if(shift_en)dout<={dout[WIDTH-2:0],din}; end endmodule' \
'module tb; logic clk=0,reset,shift_en,din; logic [7:0] dout; shift_reg #(.WIDTH(8)) dut(.clk(clk),.reset(reset),.shift_en(shift_en),.din(din),.dout(dout));always #1 clk=~clk;initial begin reset=1;shift_en=0;din=0;@(posedge clk);#0.1;if(dout!==0)$fatal;reset=0;shift_en=1;din=1;@(posedge clk);#0.1;if(dout!==8''h01)$fatal;din=0;@(posedge clk);#0.1;if(dout!==8''h02)$fatal;@(posedge clk);#0.1;if(dout!==8''h04)$fatal;shift_en=0;din=1;@(posedge clk);#0.1;if(dout!==8''h04)$fatal;$display("HDLFORGE_PASS");$finish;end endmodule'

run_case "rtl-edge-detector" \
'module edge_detector(input logic clk,reset,signal_in,output logic rise); logic prev; always_ff @(posedge clk) begin if(reset) begin prev<=0;rise<=0; end else begin rise<=signal_in & ~prev; prev<=signal_in; end end endmodule' \
'module tb;logic clk=0,reset,signal_in,rise;edge_detector dut(.clk(clk),.reset(reset),.signal_in(signal_in),.rise(rise));always #1 clk=~clk;initial begin reset=1;signal_in=0;@(posedge clk);#0.1;if(rise!==0)$fatal;reset=0;signal_in=0;@(posedge clk);#0.1;if(rise!==0)$fatal;signal_in=1;@(posedge clk);#0.1;if(rise!==1)$fatal;@(posedge clk);#0.1;if(rise!==0)$fatal;signal_in=0;@(posedge clk);#0.1;if(rise!==0)$fatal;signal_in=1;@(posedge clk);#0.1;if(rise!==1)$fatal;$display("HDLFORGE_PASS");$finish;end endmodule'

run_case "rtl-arbiter" \
'module arbiter4(input logic [3:0] req,output logic [3:0] grant);always_comb begin grant=0;for(integer i=3;i>=0;i=i-1) if(req[i] && grant==0) grant[i]=1;end endmodule' \
'module tb;logic[3:0]req,grant;arbiter4 dut(.req(req),.grant(grant));initial begin req=0;#1;if(grant!==0)$fatal;req=4''b0001;#1;if(grant!==4''b0001)$fatal;req=4''b0101;#1;if(grant!==4''b0100)$fatal;req=4''b1011;#1;if(grant!==4''b1000)$fatal;req=4''b0110;#1;if(grant!==4''b0100)$fatal;$display("HDLFORGE_PASS");$finish;end endmodule'

run_case "rtl-regfile" \
'module regfile4(input logic clk,reset,we,input logic[1:0]waddr,raddr1,raddr2,input logic[7:0]wdata,output logic[7:0]rdata1,rdata2);logic[7:0]regs[0:3];integer i;always_comb begin rdata1=regs[raddr1];rdata2=regs[raddr2];end always_ff @(posedge clk) begin if(reset) for(i=0;i<4;i=i+1) regs[i]<=''0; else if(we) regs[waddr]<=wdata; end endmodule' \
'module tb;logic clk=0,reset,we;logic[1:0]waddr,raddr1,raddr2;logic[7:0]wdata,rdata1,rdata2;regfile4 dut(.clk(clk),.reset(reset),.we(we),.waddr(waddr),.raddr1(raddr1),.raddr2(raddr2),.wdata(wdata),.rdata1(rdata1),.rdata2(rdata2));always #1 clk=~clk;initial begin reset=1;we=0;waddr=0;raddr1=0;raddr2=1;wdata=0;@(posedge clk);#0.1;if(rdata1!==0||rdata2!==0)$fatal;reset=0;we=1;waddr=2;wdata=8''h5A;@(posedge clk);#0.1;we=0;raddr1=2;raddr2=0;#1;if(rdata1!==8''h5A||rdata2!==0)$fatal;we=1;waddr=0;wdata=8''hC3;@(posedge clk);#0.1;we=0;raddr1=0;#1;if(rdata1!==8''hC3)$fatal;$display("HDLFORGE_PASS");$finish;end endmodule'

run_case "rtl-lfsr" \
'module lfsr8(input logic clk,reset,enable,output logic[7:0] state);logic feedback;assign feedback=state[7]^state[5]^state[4]^state[3];always_ff @(posedge clk) begin if(reset)state<=8''h01;else if(enable)state<={state[6:0],feedback};end endmodule' \
'module tb;logic clk=0,reset,enable;logic[7:0]state;lfsr8 dut(.clk(clk),.reset(reset),.enable(enable),.state(state));always #1 clk=~clk;initial begin reset=1;enable=0;@(posedge clk);#0.1;if(state!==8''h01)$fatal;reset=0;enable=1;@(posedge clk);#0.1;if(state!==8''h02)$fatal;@(posedge clk);#0.1;if(state!==8''h04)$fatal;@(posedge clk);#0.1;if(state!==8''h08)$fatal;@(posedge clk);#0.1;if(state!==8''h11)$fatal;enable=0;@(posedge clk);#0.1;if(state!==8''h11)$fatal;$display("HDLFORGE_PASS");$finish;end endmodule'

run_case "rtl-clock-divider" \
'module clk_div #(parameter DIV=2)(input logic clk,reset,enable,output logic clk_out);integer count;always_ff @(posedge clk) begin if(reset)begin count<=0;clk_out<=0;end else if(enable)begin if(count==DIV-1)begin count<=0;clk_out<=~clk_out;end else count<=count+1;end end endmodule' \
'module tb;logic clk=0,reset,enable,clk_out;clk_div #(.DIV(2)) dut(.clk(clk),.reset(reset),.enable(enable),.clk_out(clk_out));always #1 clk=~clk;initial begin reset=1;enable=0;@(posedge clk);#0.1;if(clk_out!==0)$fatal;reset=0;enable=1;@(posedge clk);#0.1;if(clk_out!==0)$fatal;@(posedge clk);#0.1;if(clk_out!==1)$fatal;@(posedge clk);#0.1;if(clk_out!==1)$fatal;@(posedge clk);#0.1;if(clk_out!==0)$fatal;enable=0;@(posedge clk);#0.1;if(clk_out!==0)$fatal;$display("HDLFORGE_PASS");$finish;end endmodule'

echo "All 10 HDLForge RTL regressions passed."
