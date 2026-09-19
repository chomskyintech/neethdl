import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import MonacoEditor,{loader}from'@monaco-editor/react'
import*as monaco from'monaco-editor/esm/vs/editor/editor.api'
import EditorWorker from'monaco-editor/esm/vs/editor/editor.worker?worker'
import'monaco-editor/esm/vs/editor/contrib/find/browser/findController'

globalThis.MonacoEnvironment={getWorker:()=>new EditorWorker()}
loader.config({monaco})

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


export function ReadOnlyHDLViewer({ code, language, formatMode = 'normal', formatColumn = 68, expanded = false }) {
  const lineCount = Math.max(1, (code || '').split('\n').length)
  const collapsedHeight = Math.min(520, Math.max(180, lineCount * 22 + 24))
  const height = expanded ? 'clamp(520px, 72vh, 860px)' : collapsedHeight
  return <div className="reference-monaco" style={{ height }} data-format-mode={formatMode} data-format-column={formatColumn} data-expanded={expanded?'true':'false'} aria-label={`${language} reference implementation`}>
    <MonacoEditor
      height="100%"
      value={code}
      language={languageIds[language] || 'systemverilog'}
      theme="hdlforge-dark"
      beforeMount={registerLanguages}
      options={{
        automaticLayout: true,
        readOnly: true,
        domReadOnly: true,
        fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
        fontSize: 13,
        lineHeight: 22,
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        minimap: { enabled: false },
        glyphMargin: false,
        folding: false,
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: false,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        wordWrap: 'off',
        renderLineHighlight: 'none',
        renderWhitespace: 'none',
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        padding: { top: 12, bottom: 12 },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        contextmenu: false,
        selectionHighlight: false,
        occurrencesHighlight: 'off',
        scrollbar: {
          horizontal: 'auto',
          vertical: 'auto',
          alwaysConsumeMouseWheel: false,
          horizontalScrollbarSize: 10,
          verticalScrollbarSize: 10
        }
      }}
    />
  </div>
}

export default function MonacoHDLEditor({ code, language, onChange, onRun }) {
  const editorRef = useRef(null)
  const [toolbarTarget, setToolbarTarget] = useState(null)
  const handleMount = (editor, monaco) => { editorRef.current = editor; editor.addAction({ id: 'hdlforge-run-tests', label: 'Run HDLForge tests', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], run: () => onRun() }); editor.focus() }
  const openFind = () => { editorRef.current?.getAction('actions.find')?.run() }

  useEffect(() => {
    setToolbarTarget(document.querySelector('.ide-page .file-tabs:has(.editor-language)'))
  }, [])

  const hiddenStatusStyle = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }

  return <><div className="editor-wrap monaco-editor-wrap" style={{ minHeight: 0 }}><span style={hiddenStatusStyle} aria-live="polite">HDL source · {language}</span><div className="monaco-editor-stage" aria-label={`${language} HDL source editor`} style={{ display: 'flex', flex: '1 1 auto', minWidth: 0, minHeight: 0, overflow: 'hidden', position: 'relative', background: 'var(--ide-editor)' }}><MonacoEditor height="100%" value={code} language={languageIds[language] || 'systemverilog'} theme="hdlforge-dark" beforeMount={registerLanguages} onMount={handleMount} onChange={value => onChange(value ?? '')} options={{ automaticLayout: true, fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace", fontSize: 16, lineHeight: 24, lineNumbers: 'on', minimap: { enabled: false }, tabSize: 2, insertSpaces: true, detectIndentation: false, scrollBeyondLastLine: false, smoothScrolling: true, wordWrap: 'off', bracketPairColorization: { enabled: true }, guides: { bracketPairs: true, indentation: true }, renderWhitespace: 'selection', padding: { top: 12, bottom: 12 }, fixedOverflowWidgets: true, find: { addExtraSpaceOnTop: false } }} /></div></div>{toolbarTarget && createPortal(<button className="editor-find-btn" title="Find" aria-label="Find in source" onClick={openFind}><Search size={14} /></button>, toolbarTarget)}</>
}
