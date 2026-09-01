const SIM_BASE = 'https://senolgulgonul.github.io/verisim/'
const MAX_SOURCE = 20000

const benches = {
  'rtl-mux': `module tb;
logic a,b,sel,y; mux2 dut(.a(a),.b(b),.sel(sel),.y(y));
initial begin
  a=0;b=0;sel=0; #1; if(y!==0) $fatal(1,"mux case 1");
  a=0;b=1;sel=0; #1; if(y!==0) $fatal(1,"mux case 2");
  a=0;b=1;sel=1; #1; if(y!==1) $fatal(1,"mux case 3");
  a=1;b=0;sel=1; #1; if(y!==0) $fatal(1,"mux case 4");
  $display("HDLFORGE_PASS"); $finish;
end
endmodule`,
  'rtl-priority': `module tb;
logic [7:0] in; logic [2:0] index; logic valid;
priority_encoder dut(.in(in),.index(index),.valid(valid));
initial begin
  in=0; #1; if(valid!==0) $fatal(1,"zero input");
  in=8'b00101000; #1; if(valid!==1 || index!==5) $fatal(1,"priority 5");
  in=8'b10001000; #1; if(valid!==1 || index!==7) $fatal(1,"priority 7");
  $display("HDLFORGE_PASS"); $finish;
end
endmodule`,
  'rtl-counter': `module tb;
logic clk=0,reset; logic [7:0] count;
counter #(.WIDTH(8)) dut(.clk(clk),.reset(reset),.count(count));
always #1 clk=~clk;
initial begin
  reset=1; @(posedge clk); #0.1; if(count!==0) $fatal(1,"reset");
  reset=0; @(posedge clk); #0.1; if(count!==1) $fatal(1,"increment 1");
  @(posedge clk); #0.1; if(count!==2) $fatal(1,"increment 2");
  $display("HDLFORGE_PASS"); $finish;
end
endmodule`,
  'rtl-fifo': `module tb;
logic clk=0,reset,wr_en,rd_en; logic [7:0] din,dout; logic full,empty;
fifo #(.WIDTH(8),.DEPTH(4)) dut(.clk(clk),.reset(reset),.wr_en(wr_en),.rd_en(rd_en),.din(din),.dout(dout),.full(full),.empty(empty));
always #1 clk=~clk;
initial begin
  reset=1; wr_en=0; rd_en=0; din=0; @(posedge clk); #0.1; if(!empty) $fatal(1,"not empty after reset");
  reset=0; din=8'hA5; wr_en=1; @(posedge clk); #0.1;
  wr_en=0; rd_en=1; @(posedge clk); #0.1; if(dout!==8'hA5) $fatal(1,"fifo data");
  $display("HDLFORGE_PASS"); $finish;
end
endmodule`
}

const dangerous = /\$(system|popen|fopen|fwrite|fread|fclose|fseek|rewind)\b|`include\b|`system\b/i

let modulesPromise

async function loadModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import(/* @vite-ignore */ `${SIM_BASE}ivlpp.js`),
      import(/* @vite-ignore */ `${SIM_BASE}ivl.js`),
      import(/* @vite-ignore */ `${SIM_BASE}vvp.js`)
    ]).then(([ivlpp, ivl, vvp]) => ({
      initIvlpp: ivlpp.default,
      initIvl: ivl.default,
      initVvp: vvp.default
    }))
  }
  return modulesPromise
}

function sanitize(source) {
  return source
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
}

function ivlConfig(generation) {
  return `basedir:/
module:system.vpi
generation:${generation}
generation:no-specify
out:/out.vvp
iwidth:32
widthcap:65536
functor:cprop
functor:nodangle
flag:DLL=vvp.tgt
`
}

async function preprocess(initIvlpp, files) {
  const output = []
  const module = await initIvlpp({ print: text => output.push(text), printErr: () => {} })
  const args = ['-L']
  for (const file of files) {
    module.FS.writeFile(`/${file.name}`, file.src.endsWith('\n') ? file.src : `${file.src}\n`)
    args.push(`/${file.name}`)
  }
  module.callMain(args)
  return `${output.join('\n')}\n`
}

async function compile(initIvl, source, generation) {
  const errors = []
  const module = await initIvl({ print: () => {}, printErr: text => errors.push(text) })
  module.FS.writeFile('/ivl.conf', ivlConfig(generation))
  module.FS.writeFile('/src.v', source)
  module.callMain(['-C/ivl.conf', '--', '/src.v'])
  let vvp = null
  try { vvp = module.FS.readFile('/out.vvp') } catch {}
  return { vvp, errors: errors.join('\n') }
}

async function simulate(initVvp, bytes) {
  const output = []
  const module = await initVvp({ print: text => output.push(text), printErr: text => output.push(text) })
  module.FS.writeFile('/sim.vvp', bytes)
  module.callMain(['/sim.vvp'])
  return output.join('\n')
}

export async function runBrowserSimulation(problemId, source) {
  if (!benches[problemId]) throw new Error('This problem does not have a browser simulator testbench yet.')
  if (typeof source !== 'string' || source.trim().length < 20) throw new Error('Source code is required.')
  if (source.length > MAX_SOURCE) throw new Error('Source code is too large.')
  if (dangerous.test(source)) throw new Error('This submission contains a blocked system/file operation.')

  const { initIvlpp, initIvl, initVvp } = await loadModules()
  const design = sanitize(source)
  const testbench = benches[problemId]
  const preprocessed = await preprocess(initIvlpp, [
    { name: 'design.sv', src: design },
    { name: 'tb.sv', src: testbench }
  ])
  const compiled = await compile(initIvl, preprocessed, '2012')

  if (!compiled.vvp) {
    const diagnostic = compiled.errors
      .split('\n')
      .filter(line => !/system\.vpi|dynamic linking not enabled/.test(line))
      .join('\n')
      .trim()
    return { passed: false, output: diagnostic || 'Compilation failed.' }
  }

  const warnings = compiled.errors
    .split('\n')
    .filter(line => !/system\.vpi|dynamic linking not enabled/.test(line))
    .join('\n')
    .trim()
  const simulationOutput = await simulate(initVvp, compiled.vvp)
  const output = [warnings, simulationOutput].filter(Boolean).join('\n')

  return {
    passed: output.includes('HDLFORGE_PASS'),
    output: output || '(no simulator output)'
  }
}
