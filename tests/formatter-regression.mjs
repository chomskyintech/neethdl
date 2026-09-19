#!/usr/bin/env node
import assert from 'node:assert/strict'

const base=process.env.HDLFORGE_RUNNER_URL||'http://127.0.0.1:8787'
const cases=[
  {
    language:'Verilog',
    source:'module mux2(input a,input b,input sel,output y);assign y=sel?b:a;endmodule',
    mustContain:['module mux2','assign y'],
  },
  {
    language:'SystemVerilog',
    source:'module counter(input logic clk,input logic reset,output logic [7:0] count);always_ff @(posedge clk) begin if(reset) count<=\'0;else count<=count+1\'b1;end endmodule',
    mustContain:['always_ff','endmodule'],
  },
  {
    language:'VHDL',
    source:"library ieee; use ieee.std_logic_1164.all; entity mux2 is port(a,b,sel: in std_logic; y: out std_logic); end entity mux2; architecture rtl of mux2 is begin y <= b when sel='1' else a; end architecture rtl;",
    mustContain:['entity mux2','architecture rtl','end architecture rtl;'],
  },
]

for(const testCase of cases){
  const response=await fetch(`${base}/format`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({language:testCase.language,source:testCase.source,columnLimit:40}),
  })
  const data=await response.json()
  assert.equal(response.ok,true,`${testCase.language}: HTTP ${response.status} ${JSON.stringify(data)}`)
  assert.equal(data.ok,true,`${testCase.language}: formatter returned failure`)
  assert.equal(typeof data.formatted,'string')
  assert.equal(data.columnLimit,40)
  assert.ok(data.formatted.includes('\n'),`${testCase.language}: formatter did not introduce readable line structure`)
  assert.notEqual(data.formatted.trim(),testCase.source.trim(),`${testCase.language}: formatter returned unchanged dense source`)
  for(const fragment of testCase.mustContain) assert.ok(data.formatted.toLowerCase().includes(fragment.toLowerCase()),`${testCase.language}: formatted output lost ${fragment}`)
  if(testCase.language!=='VHDL'){
    const longest=Math.max(...data.formatted.split('\n').map(line=>line.length))
    assert.ok(longest<=55,`${testCase.language}: responsive column limit was not respected (longest line ${longest})`)
  }
  console.log(`PASS ${testCase.language} via ${data.formatter}`)
}

const denseVhdl="library ieee; use ieee.std_logic_1164.all; entity demo is port(clk,reset: in std_logic; q: out std_logic); end; architecture rtl of demo is begin process(clk) begin if rising_edge(clk) then if reset='1' then q<='0'; else q<='1'; end if; end if; end process; end architecture;"
const denseResponse=await fetch(`${base}/format`,{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({language:'VHDL',source:denseVhdl,columnLimit:40}),
})
const denseData=await denseResponse.json()
assert.equal(denseResponse.ok,true,JSON.stringify(denseData))
assert.match(denseData.formatted,/then\s*\n/i)
assert.match(denseData.formatted,/q\s*<=\s*'0';\s*\n/i)
assert.match(denseData.formatted,/else\s*\n/i)

console.log('All HDL formatter regression checks passed.')
