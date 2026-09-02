import express from 'express'
import { execFile } from 'node:child_process'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const app = express()
const PORT = process.env.PORT || 8787
const MAX_SOURCE = 20000
const TIMEOUT_MS = 5000
const dangerous = /\$(system|popen|fopen|fwrite|fread|fclose|fseek|rewind)\b|`include\b|`system\b/i

app.use(express.json({ limit: '32kb' }))
app.use((req,res,next)=>{ res.setHeader('Access-Control-Allow-Origin',process.env.ALLOWED_ORIGIN||'*'); res.setHeader('Access-Control-Allow-Headers','Content-Type'); res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS'); if(req.method==='OPTIONS') return res.sendStatus(204); next() })

const benches = {
  'rtl-mux': `module tb;\nlogic a,b,sel,y; mux2 dut(.a(a),.b(b),.sel(sel),.y(y)); initial begin a=0;b=0;sel=0; #1; if(y!==0) $fatal(1,"mux case 1"); a=0;b=1;sel=0; #1; if(y!==0) $fatal(1,"mux case 2"); a=0;b=1;sel=1; #1; if(y!==1) $fatal(1,"mux case 3"); a=1;b=0;sel=1; #1; if(y!==0) $fatal(1,"mux case 4"); $display("HDLFORGE_PASS"); $finish; end endmodule`,
  'rtl-priority': `module tb;\nlogic [7:0] in; logic [2:0] index; logic valid; priority_encoder dut(.in(in),.index(index),.valid(valid)); initial begin in=0; #1; if(valid!==0) $fatal(1,"zero input"); in=8'b00101000; #1; if(valid!==1 || index!==5) $fatal(1,"priority 5"); in=8'b10001000; #1; if(valid!==1 || index!==7) $fatal(1,"priority 7"); $display("HDLFORGE_PASS"); $finish; end endmodule`,
  'rtl-counter': `module tb;\nlogic clk=0,reset; logic [7:0] count; counter #(.WIDTH(8)) dut(.clk(clk),.reset(reset),.count(count)); always #1 clk=~clk; initial begin reset=1; @(posedge clk); #0.1; if(count!==0) $fatal(1,"reset"); reset=0; @(posedge clk); #0.1; if(count!==1) $fatal(1,"increment 1"); @(posedge clk); #0.1; if(count!==2) $fatal(1,"increment 2"); reset=1; @(posedge clk); #0.1; if(count!==0) $fatal(1,"second reset"); $display("HDLFORGE_PASS"); $finish; end endmodule`,
  'rtl-fifo': `module tb;\nlogic clk=0,reset,wr_en,rd_en; logic [7:0] din,dout; logic full,empty; fifo #(.WIDTH(8),.DEPTH(4)) dut(.clk(clk),.reset(reset),.wr_en(wr_en),.rd_en(rd_en),.din(din),.dout(dout),.full(full),.empty(empty)); always #1 clk=~clk; initial begin reset=1; wr_en=0; rd_en=0; din=0; @(posedge clk); #0.1; if(!empty || full) $fatal(1,"reset flags"); reset=0; din=8'hA5; wr_en=1; @(posedge clk); din=8'h3C; @(posedge clk); din=8'h77; @(posedge clk); wr_en=0; if(!full) $fatal(1,"fifo should be full"); rd_en=1; @(posedge clk); #0.1; if(dout!==8'hA5) $fatal(1,"fifo first data"); @(posedge clk); #0.1; if(dout!==8'h3C) $fatal(1,"fifo second data"); @(posedge clk); #0.1; if(dout!==8'h77) $fatal(1,"fifo third data"); @(posedge clk); #0.1; if(!empty) $fatal(1,"fifo should be empty"); $display("HDLFORGE_PASS"); $finish; end endmodule`,
  'rtl-shift-register': `module tb;\nlogic clk=0,reset,shift_en,din; logic [7:0] dout; shift_reg #(.WIDTH(8)) dut(.clk(clk),.reset(reset),.shift_en(shift_en),.din(din),.dout(dout)); always #1 clk=~clk; initial begin reset=1; shift_en=0; din=0; @(posedge clk); #0.1; if(dout!==0) $fatal(1,"reset"); reset=0; shift_en=1; din=1; @(posedge clk); din=0; @(posedge clk); @(posedge clk); #0.1; if(dout!==8'h04) $fatal(1,"shift sequence"); shift_en=0; din=1; @(posedge clk); #0.1; if(dout!==8'h04) $fatal(1,"hold"); $display("HDLFORGE_PASS"); $finish; end endmodule`,
  'rtl-edge-detector': `module tb;\nlogic clk=0,reset,signal_in,rise; edge_detector dut(.clk(clk),.reset(reset),.signal_in(signal_in),.rise(rise)); always #1 clk=~clk; initial begin reset=1; signal_in=0; @(posedge clk); #0.1; if(rise!==0) $fatal(1,"reset"); reset=0; signal_in=1; @(posedge clk); #0.1; if(rise!==1) $fatal(1,"first edge"); @(posedge clk); #0.1; if(rise!==0) $fatal(1,"one cycle pulse"); signal_in=0; @(posedge clk); signal_in=1; @(posedge clk); #0.1; if(rise!==1) $fatal(1,"second edge"); $display("HDLFORGE_PASS"); $finish; end endmodule`,
  'rtl-arbiter': `module tb;\nlogic [3:0] req,grant; arbiter4 dut(.req(req),.grant(grant)); initial begin req=0; #1; if(grant!==0) $fatal(1,"zero"); req=4'b1111; #1; if(grant!==4'b1000) $fatal(1,"highest priority"); req=4'b0011; #1; if(grant!==4'b0010) $fatal(1,"priority 1"); req=4'b1001; #1; if(grant!==4'b1000) $fatal(1,"priority 3"); $display("HDLFORGE_PASS"); $finish; end endmodule`,
  'rtl-regfile': `module tb;\nlogic clk=0,reset,we; logic [1:0] waddr,raddr1,raddr2; logic [7:0] wdata,rdata1,rdata2; regfile4 dut(.clk(clk),.reset(reset),.we(we),.waddr(waddr),.raddr1(raddr1),.raddr2(raddr2),.wdata(wdata),.rdata1(rdata1),.rdata2(rdata2)); always #1 clk=~clk; initial begin reset=1; we=0; waddr=0; raddr1=0; raddr2=1; wdata=0; @(posedge clk); #0.1; if(rdata1!==0 || rdata2!==0) $fatal(1,"reset clear"); reset=0; we=1; waddr=2; wdata=8'h5A; @(posedge clk); we=0; raddr1=2; raddr2=0; #1; if(rdata1!==8'h5A || rdata2!==0) $fatal(1,"async readback"); waddr=1; wdata=8'hA6; we=1; @(posedge clk); we=0; raddr1=1; raddr2=2; #1; if(rdata1!==8'hA6 || rdata2!==8'h5A) $fatal(1,"two reads"); $display("HDLFORGE_PASS"); $finish; end endmodule`,
  'rtl-lfsr': `module tb;\nlogic clk=0,reset,enable; logic [7:0] state; lfsr8 dut(.clk(clk),.reset(reset),.enable(enable),.state(state)); always #1 clk=~clk; initial begin reset=1; enable=0; @(posedge clk); #0.1; if(state!==8'h01) $fatal(1,"seed"); reset=0; enable=1; repeat(4) @(posedge clk); #0.1; if(state!==8'h11) $fatal(1,"sequence"); enable=0; @(posedge clk); #0.1; if(state!==8'h11) $fatal(1,"enable hold"); $display("HDLFORGE_PASS"); $finish; end endmodule`,
  'rtl-clock-divider': `module tb;\nlogic clk=0,reset,enable,clk_out; clk_div #(.DIV(3)) dut(.clk(clk),.reset(reset),.enable(enable),.clk_out(clk_out)); always #1 clk=~clk; initial begin reset=1; enable=0; @(posedge clk); #0.1; if(clk_out!==0) $fatal(1,"reset"); reset=0; enable=1; @(posedge clk); #0.1; if(clk_out!==0) $fatal(1,"edge 1"); @(posedge clk); #0.1; if(clk_out!==0) $fatal(1,"edge 2"); @(posedge clk); #0.1; if(clk_out!==1) $fatal(1,"edge 3 toggle"); enable=0; @(posedge clk); #0.1; if(clk_out!==1) $fatal(1,"disabled hold"); $display("HDLFORGE_PASS"); $finish; end endmodule`
}

const allowed=new Set(Object.keys(benches))
app.get('/health',(_req,res)=>res.json({ok:true,simulator:'verilator'}))

async function runSimulation(source, bench) {
  let dir
  try {
    dir=await mkdtemp(join(tmpdir(),'hdlforge-'))
    const top=join(dir,'tb.sv')
    await writeFile(top,`${source}\n\n${bench}\n`,'utf8')
    const {stdout,stderr}=await execFileAsync('verilator',['--binary','--sv','--timing','--top-module','tb',top],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:1024*1024})
    const run=await execFileAsync(join(dir,'obj_dir','Vtb'),[],{cwd:dir,timeout:TIMEOUT_MS,maxBuffer:1024*1024})
    const output=`${stdout}${stderr}${run.stdout}${run.stderr}`
    return {passed:output.includes('HDLFORGE_PASS'),output}
  } catch(err) {
    return {passed:false,output:`${err.stdout||''}${err.stderr||''}${err.message||''}`}
  } finally { if(dir) await rm(dir,{recursive:true,force:true}).catch(()=>{}) }
}

app.post('/run',async(req,res)=>{
  const {problemId,source}=req.body||{}
  if(!allowed.has(problemId)) return res.status(400).json({ok:false,error:'This problem does not have a simulator testbench yet.'})
  if(typeof source!=='string'||source.length<20) return res.status(400).json({ok:false,error:'Source code is required.'})
  if(source.length>MAX_SOURCE) return res.status(413).json({ok:false,error:'Source code is too large.'})
  if(dangerous.test(source)) return res.status(400).json({ok:false,error:'This submission contains a blocked system/file operation.'})
  return res.json({ok:true,...await runSimulation(source,benches[problemId])})
})

// Hidden interview endpoint: testbenches are server-side and never returned to the browser.
app.post('/interview/run',async(req,res)=>{
  const {problemId,source}=req.body||{}
  if(!allowed.has(problemId)) return res.status(400).json({ok:false,error:'This interview problem is not an RTL question.'})
  if(typeof source!=='string'||source.length<20) return res.status(400).json({ok:false,error:'Source code is required.'})
  if(source.length>MAX_SOURCE) return res.status(413).json({ok:false,error:'Source code is too large.'})
  if(dangerous.test(source)) return res.status(400).json({ok:false,error:'This submission contains a blocked system/file operation.'})
  return res.json({ok:true,...await runSimulation(source,benches[problemId])})
})

app.listen(PORT,()=>console.log(`HDLForge runner listening on ${PORT}`))
