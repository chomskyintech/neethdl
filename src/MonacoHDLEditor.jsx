import React, { useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'

const languageIds = {
  Verilog: 'verilog',
  SystemVerilog: 'systemverilog',
  VHDL: 'vhdl'
}

const verilogKeywords = [
  'always','always_comb','always_ff','always_latch','assign','automatic','begin','bit','case','casex','casez','class','clocking','const','constraint','cover','covergroup','coverpoint','default','disable','do','else','end','endcase','endclass','endfunction','endgenerate','endgroup','endinterface','endmodule','endpackage','endproperty','endsequence','endtask','enum','event','for','foreach','forever','fork','function','generate','genvar','if','initial','inout','input','int','integer','interface','localparam','logic','longint','modport','module','package','parameter','property','rand','randc','reg','repeat','return','sequence','shortint','signed','static','struct','task','time','typedef','union','unsigned','var','virtual','void','wait','while','wire'
]

const vhdlKeywords = [
  'abs','access','after','alias','all','and','architecture','array','assert','attribute','begin','block','body','buffer','bus','case','component','configuration','constant','disconnect','downto','else','elsif','end','entity','exit','file','for','function','generate','generic','group','guarded','if','impure','in','inertial','inout','is','label','library','linkage','literal','loop','map','mod','nand','new','next','nor','not','null','of','on','open','or','others','out','package','port','postponed','procedure','process','pure','range','record','register','reject','rem','report','return','rol','ror','select','severity','signal','shared','sla','sll','sra','srl','subtype','then','to','transport','type','unaffected','units','until','use','variable','wait','when','while','with','xnor','xor'
]

function registerLanguages(monaco) {
  if (!monaco.languages.getLanguages().some(item => item.id === 'verilog')) {
    monaco.languages.register({ id: 'verilog' })
    monaco.languages.setMonarchTokensProvider('verilog', {
      defaultToken: '', tokenPostfix: '.v', keywords: verilogKeywords,
      tokenizer: { root: [[/\/\*/, 'comment', '@comment'], [/\/\/.*$/, 'comment'], [/"([^"\\]|\\.)*$/, 'string.invalid'], [/"/, 'string', '@string'], [/\b\d+'[sS]?[bBoOdDhH][0-9a-fA-F_xXzZ?]+\b/, 'number'], [/\b\d+\b/, 'number'], [/[a-zA-Z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }], [/[{}()\[\]]/, '@brackets'], [/[<>]=?|==?=?|!=?=?|&&|\|\||[+\-*\/%&|^~?:]/, 'operator']], comment: [[/[^/*]+/, 'comment'], [/\*\//, 'comment', '@pop'], [/[/*]/, 'comment']], string: [[/[^\\"]+/, 'string'], [/\\./, 'string.escape'], [/"/, 'string', '@pop']] }
    })
  }
  if (!monaco.languages.getLanguages().some(item => item.id === 'systemverilog')) {
    monaco.languages.register({ id: 'systemverilog' })
    monaco.languages.setMonarchTokensProvider('systemverilog', {
      defaultToken: '', tokenPostfix: '.sv', keywords: verilogKeywords,
      tokenizer: { root: [[/\/\*/, 'comment', '@comment'], [/\/\/.*$/, 'comment'], [/"([^"\\]|\\.)*$/, 'string.invalid'], [/"/, 'string', '@string'], [/\b\d+'[sS]?[bBoOdDhH][0-9a-fA-F_xXzZ?]+\b/, 'number'], [/\b\d+\b/, 'number'], [/[a-zA-Z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }], [/[{}()\[\]]/, '@brackets'], [/[<>]=?|==?=?|!=?=?|&&|\|\||[+\-*\/%&|^~?:]/, 'operator']], comment: [[/[^/*]+/, 'comment'], [/\*\//, 'comment', '@pop'], [/[/*]/, 'comment']], string: [[/[^\\"]+/, 'string'], [/\\./, 'string.escape'], [/"/, 'string', '@pop']] }
    })
  }
  if (!monaco.languages.getLanguages().some(item => item.id === 'vhdl')) {
    monaco.languages.register({ id: 'vhdl' })
    monaco.languages.setMonarchTokensProvider('vhdl', {
      ignoreCase: true, defaultToken: '', tokenPostfix: '.vhd', keywords: vhdlKeywords,
      tokenizer: { root: [[/--.*$/, 'comment'], [/"/, 'string', '@string'], [/\b\d+(#[0-9a-fA-F_]+#)?\b/, 'number'], [/[a-zA-Z][\w]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }], [/[()\[\]]/, '@brackets'], [/:=|=>|<=|>=|\/=|[+\-*\/%&=<>]/, 'operator']], string: [[/[^\"]+/, 'string'], [/""/, 'string.escape'], [/"/, 'string', '@pop']] }
    })
  }

  monaco.editor.defineTheme('hdlforge-dark', {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'keyword', foreground: '8FAFA2' },
      { token: 'number', foreground: 'D8B4A0' },
      { token: 'comment', foreground: '6B706D', fontStyle: 'italic' },
      { token: 'string', foreground: '9FB9A8' },
      { token: 'operator', foreground: 'C7CBC8' }
    ],
    colors: {
      'editor.background': '#0D0D0D',
      'editor.foreground': '#E8E8E8',
      'editorLineNumber.foreground': '#5F6360',
      'editorLineNumber.activeForeground': '#A3A7A4',
      'editorCursor.foreground': '#7FA995',
      'editor.selectionBackground': '#2A3A33AA',
      'editor.inactiveSelectionBackground': '#2A3A3355',
      'editorIndentGuide.background1': '#242724',
      'editorIndentGuide.activeBackground1': '#3A403C'
    }
  })
}

export default function MonacoHDLEditor({ code, language, onChange, onRun }) {
  const editorRef = useRef(null)
  const handleMount = (editor, monaco) => { editorRef.current = editor; editor.addAction({ id: 'hdlforge-run-tests', label: 'Run HDLForge tests', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], run: () => onRun() }); editor.focus() }
  const openFind = () => { editorRef.current?.getAction('actions.find')?.run() }
  return <div className="editor-wrap monaco-editor-wrap" style={{ minHeight: 0 }}><div className="editor-toolbar"><span>HDL source · {language}</span><div className="editor-shortcuts"><span>Tab indent</span><span>Ctrl+Enter run</span><button title="Find" aria-label="Find in source" onClick={openFind}>⌕</button></div></div><div className="monaco-editor-stage" aria-label={`${language} HDL source editor`} style={{ display: 'flex', flex: '1 1 auto', minWidth: 0, minHeight: 0, overflow: 'hidden', position: 'relative', background: 'var(--ide-editor)' }}><MonacoEditor height="100%" value={code} language={languageIds[language] || 'systemverilog'} theme="hdlforge-dark" beforeMount={registerLanguages} onMount={handleMount} onChange={value => onChange(value ?? '')} options={{ automaticLayout: true, fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace", fontSize: 13, lineHeight: 20, lineNumbers: 'on', minimap: { enabled: false }, tabSize: 2, insertSpaces: true, detectIndentation: false, scrollBeyondLastLine: false, smoothScrolling: true, wordWrap: 'off', bracketPairColorization: { enabled: true }, guides: { bracketPairs: true, indentation: true }, renderWhitespace: 'selection', padding: { top: 12, bottom: 12 }, fixedOverflowWidgets: true, find: { addExtraSpaceOnTop: false } }} /></div></div>
}