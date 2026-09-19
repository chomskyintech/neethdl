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

const verilogControlKeywords = [
  'begin','break','case','casex','casez','continue','default','disable','do','else',
  'end','endcase','for','foreach','forever','fork','if','join','join_any','join_none',
  'negedge','posedge','repeat','return','wait','while'
]

const verilogDeclarationKeywords = [
  'always','always_comb','always_ff','always_latch','assign','automatic','class',
  'clocking','const','constraint','cover','covergroup','coverpoint','endclass',
  'endclocking','endfunction','endgenerate','endgroup','endinterface','endmodule',
  'endpackage','endprogram','endproperty','endsequence','endtask','enum','export',
  'function','generate','genvar','import','initial','inout','input','interface',
  'localparam','modport','module','package','parameter','program','property','rand',
  'randc','sequence','static','struct','task','typedef','union','var','virtual'
]

const verilogTypeKeywords = [
  'bit','byte','chandle','event','int','integer','logic','longint','real','realtime',
  'reg','shortint','shortreal','signed','string','time','tri','tri0','tri1',
  'unsigned','uwire','void','wand','wire','wor'
]

const vhdlControlKeywords = [
  'begin','case','downto','else','elsif','end','exit','for','if','loop','next',
  'return','then','to','until','wait','when','while'
]

const vhdlDeclarationKeywords = [
  'architecture','attribute','block','body','component','configuration','constant',
  'entity','file','function','generate','generic','group','impure','in','inout',
  'library','package','port','procedure','process','pure','signal','subtype','type',
  'units','use','variable'
]

const vhdlTypeKeywords = [
  'bit','bit_vector','boolean','character','integer','natural','positive','real',
  'signed','std_logic','std_logic_vector','string','time','unsigned'
]

const vhdlBuiltins = [
  'falling_edge','rising_edge','resize','std_logic_vector','to_integer',
  'to_signed','to_unsigned','unsigned','signed'
]

const identifier = /[a-zA-Z_$][\w$]*/
const vhdlIdentifier = /[a-zA-Z][\w]*/

function verilogTokenizer(tokenPostfix) {
  return {
    defaultToken: '',
    tokenPostfix,
    controlKeywords: verilogControlKeywords,
    declarationKeywords: verilogDeclarationKeywords,
    typeKeywords: verilogTypeKeywords,
    tokenizer: {
      root: [
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
        [/\`[a-zA-Z_$][\w$]*/, 'preprocessor'],
        [/\$[a-zA-Z_$][\w$]*/, 'support.function.system'],
        [new RegExp('\\b(module|interface|program|package|class)(\\s+)(' + identifier.source + ')'), ['keyword.declaration', '', 'entity.name.module']],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/\b\d+'[sS]?[bBoOdDhH][0-9a-fA-F_xXzZ?]+\b/, 'number'],
        [/'[01xXzZ]\b/, 'number'],
        [/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, 'number'],
        [/[A-Z][A-Z0-9_$]*/, 'variable.parameter'],
        [identifier, {
          cases: {
            '@controlKeywords': 'keyword.control',
            '@declarationKeywords': 'keyword.declaration',
            '@typeKeywords': 'type.identifier',
            '@default': 'identifier'
          }
        }],
        [/[{}()\[\]]/, '@brackets'],
        [/[<>]=?|==?=?|!=?=?|&&|\|\||<<<?|>>>?|[+\-*\/%&|^~?:]/, 'operator']
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment']
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop']
      ]
    }
  }
}

function vhdlTokenizer() {
  return {
    ignoreCase: true,
    defaultToken: '',
    tokenPostfix: '.vhd',
    controlKeywords: vhdlControlKeywords,
    declarationKeywords: vhdlDeclarationKeywords,
    typeKeywords: vhdlTypeKeywords,
    builtinFunctions: vhdlBuiltins,
    tokenizer: {
      root: [
        [/--.*$/, 'comment'],
        [new RegExp('\\b(entity|architecture|component|package)(\\s+)(' + vhdlIdentifier.source + ')', 'i'), ['keyword.declaration', '', 'entity.name.module']],
        [/[BOXbox]"[0-9a-fA-F_xXzZ]+"/, 'number'],
        [/'[^']'/, 'number'],
        [/"/, 'string', '@string'],
        [/\b\d+(?:#(?:[0-9a-fA-F_]+)#)?(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, 'number'],
        [/[A-Z][A-Z0-9_]*/, 'variable.parameter'],
        [vhdlIdentifier, {
          cases: {
            '@controlKeywords': 'keyword.control',
            '@declarationKeywords': 'keyword.declaration',
            '@typeKeywords': 'type.identifier',
            '@builtinFunctions': 'support.function.builtin',
            '@default': 'identifier'
          }
        }],
        [/[()\[\]]/, '@brackets'],
        [/:=|=>|<=|>=|\/=|\*\*|[+\-*\/%&=<>]/, 'operator']
      ],
      string: [
        [/[^"]+/, 'string'],
        [/""/, 'string.escape'],
        [/"/, 'string', '@pop']
      ]
    }
  }
}

function registerLanguages(monaco) {
  if (!monaco.languages.getLanguages().some(item => item.id === 'verilog')) {
    monaco.languages.register({ id: 'verilog' })
    monaco.languages.setMonarchTokensProvider('verilog', verilogTokenizer('.v'))
  }

  if (!monaco.languages.getLanguages().some(item => item.id === 'systemverilog')) {
    monaco.languages.register({ id: 'systemverilog' })
    monaco.languages.setMonarchTokensProvider('systemverilog', verilogTokenizer('.sv'))
  }

  if (!monaco.languages.getLanguages().some(item => item.id === 'vhdl')) {
    monaco.languages.register({ id: 'vhdl' })
    monaco.languages.setMonarchTokensProvider('vhdl', vhdlTokenizer())
  }

  monaco.editor.defineTheme('hdlforge-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword.control', foreground: '4B82AC' },
      { token: 'keyword.declaration', foreground: '419789' },
      { token: 'type.identifier', foreground: '419789' },
      { token: 'entity.name.module', foreground: 'AAA672' },
      { token: 'variable.parameter', foreground: 'C2C2C4' },
      { token: 'support.function.system', foreground: 'AAA672' },
      { token: 'support.function.builtin', foreground: 'AAA672' },
      { token: 'preprocessor', foreground: '4B82AC' },
      { token: 'number', foreground: 'C2C2C4' },
      { token: 'comment', foreground: '526F49', fontStyle: 'italic' },
      { token: 'string', foreground: 'A37261' },
      { token: 'string.escape', foreground: 'AAA672' },
      { token: 'operator', foreground: '9A9A9C' },
      { token: 'identifier', foreground: 'C2C2C4' }
    ],
    colors: {
      'editor.background': '#262527',
      'editor.foreground': '#C2C2C4',
      'editorLineNumber.foreground': '#76767A',
      'editorLineNumber.activeForeground': '#C2C2C4',
      'editorCursor.foreground': '#C2C2C4',
      'editor.selectionBackground': '#4B82AC38',
      'editor.inactiveSelectionBackground': '#4B82AC20',
      'editorIndentGuide.background1': '#302F32',
      'editorIndentGuide.activeBackground1': '#39393B',
      'editorBracketHighlight.foreground1': '#9A9A9C',
      'editorBracketHighlight.foreground2': '#9A9A9C',
      'editorBracketHighlight.foreground3': '#9A9A9C'
    }
  })
}

export function ReadOnlyHDLViewer({ code, language, formatMode = 'normal', formatColumn = 68 }) {
  const lineCount = Math.max(1, (code || '').split('\n').length)
  const height = Math.min(640, Math.max(180, lineCount * 22 + 24))
  return <div className="reference-monaco" style={{ height }} data-format-mode={formatMode} data-format-column={formatColumn} aria-label={`${language} reference implementation`}>
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

export default function MonacoHDLEditor({ code, language, onChange, onRun, onFormat, onLayoutColumnChange }) {
  const editorRef = useRef(null)
  const wrapRef = useRef(null)
  const layoutColumnRef = useRef(84)
  const formatRef = useRef(onFormat)
  const [layoutColumn,setLayoutColumn] = useState(84)
  const [toolbarTarget, setToolbarTarget] = useState(null)
  useEffect(()=>{ formatRef.current=onFormat },[onFormat])

  const handleMount = (editor, monaco) => {
    editorRef.current = editor
    editor.addAction({ id: 'hdlforge-run-tests', label: 'Run HDLForge tests', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], run: () => onRun() })
    editor.addAction({
      id: 'hdlforge-format-source',
      label: 'Format HDL source',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: async () => {
        if (!formatRef.current) return
        const before = editor.getValue()
        const formatted = await formatRef.current(before, layoutColumnRef.current)
        if (typeof formatted === 'string' && formatted && formatted !== before) editor.setValue(formatted)
      }
    })
    editor.focus()
  }
  const openFind = () => { editorRef.current?.getAction('actions.find')?.run() }

  useEffect(() => {
    setToolbarTarget(document.querySelector('.ide-page .file-tabs:has(.editor-language)'))
  }, [])

  useEffect(()=>{
    const element=wrapRef.current
    if(!element || typeof ResizeObserver==='undefined') return undefined
    const update=entries=>{
      const width=entries[0]?.contentRect?.width || element.clientWidth || 0
      if(!width) return
      const next=width>=900?100:width>=700?84:width>=520?68:52
      if(layoutColumnRef.current===next) return
      layoutColumnRef.current=next
      setLayoutColumn(next)
      onLayoutColumnChange?.(next)
    }
    const observer=new ResizeObserver(update)
    observer.observe(element)
    update([{contentRect:element.getBoundingClientRect()}])
    return ()=>observer.disconnect()
  },[onLayoutColumnChange])

  const hiddenStatusStyle = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }

  return <><div ref={wrapRef} className="editor-wrap monaco-editor-wrap" data-format-column={layoutColumn} style={{ minHeight: 0 }}><span style={hiddenStatusStyle} aria-live="polite">HDL source · {language}</span><div className="monaco-editor-stage" aria-label={`${language} HDL source editor`} style={{ display: 'flex', flex: '1 1 auto', minWidth: 0, minHeight: 0, overflow: 'hidden', position: 'relative', background: 'var(--ide-editor)' }}><MonacoEditor height="100%" value={code} language={languageIds[language] || 'systemverilog'} theme="hdlforge-dark" beforeMount={registerLanguages} onMount={handleMount} onChange={value => onChange(value ?? '')} options={{ automaticLayout: true, fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace", fontSize: 16, lineHeight: 24, lineNumbers: 'on', minimap: { enabled: false }, tabSize: 2, insertSpaces: true, detectIndentation: false, scrollBeyondLastLine: false, smoothScrolling: true, wordWrap: 'off', wordWrapColumn: layoutColumn, wrappingIndent: 'indent', wrappingStrategy: 'advanced', bracketPairColorization: { enabled: true }, guides: { bracketPairs: true, indentation: true }, renderWhitespace: 'selection', padding: { top: 12, bottom: 12 }, fixedOverflowWidgets: true, find: { addExtraSpaceOnTop: false } }} /></div></div>{toolbarTarget && createPortal(<button className="editor-find-btn" title="Find" aria-label="Find in source" onClick={openFind}><Search size={14} /></button>, toolbarTarget)}</>
}
