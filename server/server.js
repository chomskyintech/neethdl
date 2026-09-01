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

app.use(express.json({ limit: '32kb' }))
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const benches = {
  'rtl-mux': `module tb;\n  logic a,b,sel,y;\n  mux2 dut(.a(a),.b(b),.sel(sel),.y(y));\n  initial begin\n    a=0;b=0;sel=0; #1; if(y!==0) $fatal(1,"mux case 1");\n    a=0;b=1;sel=0; #1; if(y!==0) $fatal(1,"mux case 2");\n    a=0;b=1;sel=1; #1; if(y!==1) $fatal(1,"mux case 3");\n    a=1;b=0;sel=1; #1; if(y!==0) $fatal(1,"mux case 4");\n    $display("HDLFORGE_PASS"); $finish;\n  end\nendmodule`,
  'rtl-priority': `module tb;\n  logic [7:0] in; logic [2:0] index; logic valid;\n  priority_encoder dut(.in(in),.index(index),.valid(valid));\n  initial begin\n    in=0; #1; if(valid!==0) $fatal(1,"zero input");\n    in=8'b00101000; #1; if(valid!==1 || index!==5) $fatal(1,"priority 5");\n    in=8'b10001000; #1; if(valid!==1 || index!==7) $fatal(1,"priority 7");\n    $display("HDLFORGE_PASS"); $finish;\n  end\nendmodule`,
  'rtl-counter': `module tb;\n  logic clk=0,reset; logic [7:0] count;\n  counter #(.WIDTH(8)) dut(.clk(clk),.reset(reset),.count(count));\n  always #1 clk=~clk;\n  initial begin\n    reset=1; @(posedge clk); #0.1; if(count!==0) $fatal(1,"reset");\n    reset=0; @(posedge clk); #0.1; if(count!==1) $fatal(1,"increment 1");\n    @(posedge clk); #0.1; if(count!==2) $fatal(1,"increment 2");\n    $display("HDLFORGE_PASS"); $finish;\n  end\nendmodule`,
  'rtl-fifo': `module tb;\n  logic clk=0,reset,wr_en,rd_en; logic [7:0] din,dout; logic full,empty;\n  fifo #(.WIDTH(8),.DEPTH(4)) dut(.clk(clk),.reset(reset),.wr_en(wr_en),.rd_en(rd_en),.din(din),.dout(dout),.full(full),.empty(empty));\n  always #1 clk=~clk;\n  initial begin\n    reset=1; wr_en=0; rd_en=0; din=0; @(posedge clk); #0.1; if(!empty) $fatal(1,"not empty after reset");\n    reset=0; din=8'hA5; wr_en=1; @(posedge clk); #0.1; wr_en=0;\n    rd_en=1; @(posedge clk); #0.1; if(dout!==8'hA5) $fatal(1,"fifo data");\n    $display("HDLFORGE_PASS"); $finish;\n  end\nendmodule`
}

const allowed = new Set(Object.keys(benches))

app.get('/health', (_req, res) => res.json({ ok: true, simulator: 'verilator' }))

app.post('/run', async (req, res) => {
  const { problemId, source } = req.body || {}
  if (!allowed.has(problemId)) return res.status(400).json({ ok:false, error:'This problem does not have a simulator testbench yet.' })
  if (typeof source !== 'string' || source.length < 20) return res.status(400).json({ ok:false, error:'Source code is required.' })
  if (source.length > MAX_SOURCE) return res.status(413).json({ ok:false, error:'Source code is too large.' })

  let dir
  try {
    dir = await mkdtemp(join(tmpdir(), 'hdlforge-'))
    const top = join(dir, 'tb.sv')
    await writeFile(top, `${source}\n\n${benches[problemId]}\n`, 'utf8')
    const { stdout, stderr } = await execFileAsync('verilator', ['--binary', '--sv', '--timing', '--top-module', 'tb', top], { cwd: dir, timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 })
    const bin = join(dir, 'obj_dir', 'Vtb')
    const run = await execFileAsync(bin, [], { cwd: dir, timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 })
    const output = `${stdout}${stderr}${run.stdout}${run.stderr}`
    return res.json({ ok:true, passed: output.includes('HDLFORGE_PASS'), output })
  } catch (err) {
    const output = `${err.stdout || ''}${err.stderr || ''}${err.message || ''}`
    return res.json({ ok:true, passed:false, output })
  } finally {
    if (dir) await rm(dir, { recursive:true, force:true }).catch(() => {})
  }
})

app.listen(PORT, () => console.log(`HDLForge runner listening on ${PORT}`))
