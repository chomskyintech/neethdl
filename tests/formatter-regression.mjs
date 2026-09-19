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
    body:JSON.stringify({language:testCase.language,source:testCase.source}),
  })
  const data=await response.json()
  assert.equal(response.ok,true,`${testCase.language}: HTTP ${response.status} ${JSON.stringify(data)}`)
  assert.equal(data.ok,true,`${testCase.language}: formatter returned failure`)
  assert.equal(typeof data.formatted,'string')
  assert.ok(data.formatted.includes('\n'),`${testCase.language}: formatter did not introduce readable line structure`)
  assert.notEqual(data.formatted.trim(),testCase.source.trim(),`${testCase.language}: formatter returned unchanged dense source`)
  for(const fragment of testCase.mustContain) assert.ok(data.formatted.toLowerCase().includes(fragment.toLowerCase()),`${testCase.language}: formatted output lost ${fragment}`)
  console.log(`PASS ${testCase.language} via ${data.formatter}`)
}

console.log('All HDL formatter regression checks passed.')
