const MARKER = /\/\/\s*Your RTL here|--\s*Your RTL here/i

function getEditableRange(value) {
  const match = MARKER.exec(value)
  if (!match) return null
  const start = value.lastIndexOf('\n', match.index - 1) + 1
  const markerLineEnd = value.indexOf('\n', match.index)
  const afterMarker = markerLineEnd >= 0 ? markerLineEnd : value.length
  const endings = [value.indexOf('\nendmodule', afterMarker), value.search(/\nend\s+architecture\b/i), value.indexOf('\nendinterface', afterMarker), value.indexOf('\nendclass', afterMarker), value.indexOf('\nendtask', afterMarker), value.indexOf('\nendproperty', afterMarker)].filter(index => index >= 0)
  return { start, end: endings.length ? Math.min(...endings) : value.length }
}

function isEditor(element) { return element instanceof HTMLTextAreaElement && element.classList.contains('ide-editor') }
const snapshots = new WeakMap()

function saveSnapshot(editor) {
  const range = getEditableRange(editor.value)
  snapshots.set(editor, { value: editor.value, selectionStart: editor.selectionStart, selectionEnd: editor.selectionEnd, prefix: range ? editor.value.slice(0, range.start) : '', suffix: range ? editor.value.slice(range.end) : '' })
}

function validEdit(previous, next) { return !previous || (next.startsWith(previous.prefix) && next.endsWith(previous.suffix)) }

function restoreSnapshot(editor, snapshot) {
  if (!snapshot) return
  editor.value = snapshot.value
  editor.setSelectionRange(Math.min(snapshot.selectionStart, editor.value.length), Math.min(snapshot.selectionEnd, editor.value.length))
}

function draftKey(editor) {
  const identity = editor.value.match(/\b(?:module|interface|entity|class|property|task)\s+([A-Za-z_][\w$]*)/i)?.[1]
  if (!identity) return null
  const language = document.querySelector('.editor-language select')?.value || 'SystemVerilog'
  return `hdlforge-editor-draft-${identity.toLowerCase()}-${language}`
}

function persistDraft(editor) { const key = draftKey(editor); if (key) localStorage.setItem(key, editor.value) }

function setNativeValue(editor, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  if (setter) setter.call(editor, value)
  else editor.value = value
}

function restoreDraft(editor) {
  const key = draftKey(editor)
  if (!key) return
  const saved = localStorage.getItem(key)
  if (!saved || saved === editor.value) return
  const currentRange = getEditableRange(editor.value)
  if (!currentRange) return
  const currentPrefix = editor.value.slice(0, currentRange.start)
  const currentSuffix = editor.value.slice(currentRange.end)
  if (!saved.startsWith(currentPrefix) || !saved.endsWith(currentSuffix)) return
  const selectionStart = editor.selectionStart
  const selectionEnd = editor.selectionEnd
  setNativeValue(editor, saved)
  editor.setSelectionRange(Math.min(selectionStart, saved.length), Math.min(selectionEnd, saved.length))
  editor.dispatchEvent(new Event('input', { bubbles: true }))
  saveSnapshot(editor)
}

function escapeHtml(value) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') }

function highlightHDL(source, language) {
  const escaped = escapeHtml(source)
  const token = /(\/\/[^\n]*|--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:\\.|[^"])*"|`[A-Za-z_][\w$]*|\b\d+(?:'[bodhBODH][0-9a-fA-F_xXzZ]+)?\b|\b(?:always_ff|always_comb|always_latch|always|assign|begin|end|endmodule|module|interface|endinterface|class|endclass|function|endfunction|task|endtask|case|casex|casez|endcase|default|if|else|elseif|elsif|for|foreach|while|repeat|generate|endgenerate|genvar|wire|logic|reg|integer|time|parameter|localparam|input|output|inout|typedef|struct|enum|return|package|endpackage|import|export|library|use|entity|architecture|process|signal|variable|constant|generic|port|component|configuration|then|loop|endloop|record|end\s+if|end\s+process|end\s+case|std_logic|std_logic_vector|unsigned|signed|bit|boolean|integer|natural|positive|true|false|null)\b)/g
  let html = '', last = 0, match
  while ((match = token.exec(escaped))) {
    html += escaped.slice(last, match.index)
    const text = match[0]
    let cls = 'tok-plain'
    if (/^(\/\/|--|\/\*)/.test(text)) cls = 'tok-comment'
    else if (/^["'`]/.test(text)) cls = 'tok-string'
    else if (/^\d/.test(text)) cls = 'tok-number'
    else if (/^`/.test(text)) cls = 'tok-directive'
    else if (/^(std_logic|std_logic_vector|unsigned|signed|wire|logic|reg|integer|time|bit|boolean|natural|positive|true|false|null)$/.test(text)) cls = 'tok-type'
    else cls = 'tok-keyword'
    html += `<span class="${cls}">${text}</span>`
    last = match.index + text.length
  }
  return html + escaped.slice(last) + (source.endsWith('\n') ? ' ' : '')
}

const syntaxStates = new WeakMap()
function syncSyntaxLayer(editor) {
  if (!isEditor(editor)) return
  let layer = syntaxStates.get(editor)?.layer
  if (!layer) return
  layer.innerHTML = highlightHDL(editor.value, document.querySelector('.editor-language select')?.value || 'SystemVerilog')
  layer.scrollTop = editor.scrollTop
  layer.scrollLeft = editor.scrollLeft
}

function setupSyntaxLayer(editor) {
  if (!isEditor(editor) || syntaxStates.has(editor)) return
  const stage = editor.closest('.editor-stage')
  if (!stage) return
  const layer = document.createElement('pre')
  layer.className = 'syntax-layer'
  layer.setAttribute('aria-hidden', 'true')
  stage.insertBefore(layer, editor)
  syntaxStates.set(editor, { layer })
  editor.style.color = 'transparent'
  editor.style.webkitTextFillColor = 'transparent'
  editor.style.caretColor = '#f4fbff'
  const sync = () => syncSyntaxLayer(editor)
  editor.addEventListener('scroll', sync)
  syncSyntaxLayer(editor)
}

function setupAllSyntaxLayers() { document.querySelectorAll('textarea.ide-editor').forEach(setupSyntaxLayer) }

function smartKeydown(event) {
  const editor = event.target
  if (!isEditor(editor) || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
  const range = getEditableRange(editor.value)
  if (!range) return
  const start = editor.selectionStart, end = editor.selectionEnd
  if (start < range.start || end > range.end) return

  if (event.key === 'Enter') {
    event.preventDefault()
    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1
    const line = editor.value.slice(lineStart, start)
    const indent = line.match(/^\s*/)?.[0] || ''
    const language = document.querySelector('.editor-language select')?.value || 'SystemVerilog'
    const isVhdl = /VHDL/i.test(language)
    const opens = isVhdl ? /\b(begin|then|loop|process|if|case)\b/i.test(line) && !/^\s*end\b/i.test(line) : /\b(begin|case|fork|function|task|class|interface|generate)\b/.test(line) || /\b(else|always(?:_comb|_ff)?)\b/.test(line)
    const closes = /^\s*(?:end|else|elsif)\b/i.test(line)
    const nextIndent = closes ? indent.slice(0, Math.max(0, indent.length - 2)) : indent + (opens ? '  ' : '')
    editor.setRangeText(`\n${nextIndent}`, start, end, 'end')
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    const selected = editor.value.slice(start, end)
    const replacement = start === end ? '  ' : selected.split('\n').map(line => `  ${line}`).join('\n')
    editor.setRangeText(replacement, start, end, 'end')
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    return
  }

  const pairs = { '(': ')', '[': ']', '{': '}', "'": "'", '"': '"' }
  if (pairs[event.key]) {
    event.preventDefault()
    const selected = editor.value.slice(start, end)
    editor.setRangeText(event.key + selected + pairs[event.key], start, end, 'end')
    editor.setSelectionRange(start + 1, start + 1 + selected.length)
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    return
  }

  if ([')', ']', '}'].includes(event.key) && start === end && editor.value[start] === event.key) {
    event.preventDefault()
    editor.setSelectionRange(start + 1, start + 1)
  }
}

function handleInput(event) {
  const editor = event.target
  if (!isEditor(editor)) return
  const previous = snapshots.get(editor)
  if (!validEdit(previous, editor.value)) { restoreSnapshot(editor, previous); syncSyntaxLayer(editor); return }
  saveSnapshot(editor)
  persistDraft(editor)
  syncSyntaxLayer(editor)
}

document.addEventListener('focusin', event => { if (isEditor(event.target)) { setupSyntaxLayer(event.target); saveSnapshot(event.target) } }, true)
document.addEventListener('input', handleInput, true)
document.addEventListener('keydown', smartKeydown, true)
document.addEventListener('paste', event => {
  const editor = event.target
  if (!isEditor(editor)) return
  const range = getEditableRange(editor.value)
  if (!range || editor.selectionStart < range.start || editor.selectionEnd > range.end) { event.preventDefault(); return }
  const pasted = event.clipboardData?.getData('text/plain') || ''
  const next = editor.value.slice(0, editor.selectionStart) + pasted + editor.value.slice(editor.selectionEnd)
  if (!validEdit(snapshots.get(editor), next)) event.preventDefault()
}, true)
document.addEventListener('change', event => {
  const select = event.target
  if (!(select instanceof HTMLSelectElement) || !select.closest('.editor-language')) return
  requestAnimationFrame(() => {
    setupAllSyntaxLayers()
    const editor = document.querySelector('textarea.ide-editor')
    if (!editor) return
    saveSnapshot(editor)
    restoreDraft(editor)
    syncSyntaxLayer(editor)
  })
}, true)
window.addEventListener('beforeunload', () => { const editor = document.querySelector('textarea.ide-editor'); if (editor) persistDraft(editor) })

const syntaxStyle = document.createElement('style')
syntaxStyle.textContent = `.editor-stage{position:relative}.syntax-layer{position:absolute;z-index:0;left:48px;right:0;top:0;bottom:0;margin:0;padding:13px 16px;box-sizing:border-box;overflow:hidden;background:transparent;color:#dce8f3;font:13px/20.4px ui-monospace,SFMono-Regular,Consolas,monospace;font-variant-ligatures:none;white-space:pre;tab-size:2;pointer-events:none;user-select:none}.syntax-layer .tok-keyword{color:#c792ea}.syntax-layer .tok-type{color:#82aaff}.syntax-layer .tok-comment{color:#637083;font-style:italic}.syntax-layer .tok-string{color:#c3e88d}.syntax-layer .tok-number{color:#f78c6c}.syntax-layer .tok-directive{color:#89ddff}.ide-editor{position:relative;z-index:1;color:transparent!important;-webkit-text-fill-color:transparent!important;caret-color:#f4fbff!important;background:transparent!important}.ide-editor::selection{background:rgba(56,189,248,.24);color:transparent!important;-webkit-text-fill-color:transparent!important}`
document.head.appendChild(syntaxStyle)

const dropdownStyle = document.createElement('style')
dropdownStyle.textContent = `.editor-language{position:relative}.editor-language::after{content:'▾';position:absolute;right:14px;top:50%;transform:translateY(-55%);color:#aebdcd;font-size:11px;font-weight:700;line-height:1;pointer-events:none;z-index:2}.editor-language select{padding-right:30px;appearance:none;-webkit-appearance:none;cursor:pointer}`
document.head.appendChild(dropdownStyle)

const observer = new MutationObserver(() => setupAllSyntaxLayers())
observer.observe(document.body, { childList: true, subtree: true })
