const MARKER = /\/\/\s*Your RTL here|--\s*Your RTL here/i

function getEditableRange(value) {
  const match = MARKER.exec(value)
  if (!match) return null
  const start = value.lastIndexOf('\n', match.index - 1) + 1
  const markerLineEnd = value.indexOf('\n', match.index)
  const afterMarker = markerLineEnd >= 0 ? markerLineEnd : value.length
  const endings = [
    value.indexOf('\nendmodule', afterMarker),
    value.search(/\nend\s+architecture\b/i),
    value.indexOf('\nendinterface', afterMarker),
    value.indexOf('\nendclass', afterMarker),
    value.indexOf('\nendtask', afterMarker),
    value.indexOf('\nendproperty', afterMarker)
  ].filter(index => index >= 0)
  return { start, end: endings.length ? Math.min(...endings) : value.length }
}

function isEditor(element) {
  return element instanceof HTMLTextAreaElement && element.classList.contains('ide-editor')
}

const snapshots = new WeakMap()

function saveSnapshot(editor) {
  const range = getEditableRange(editor.value)
  snapshots.set(editor, {
    value: editor.value,
    selectionStart: editor.selectionStart,
    selectionEnd: editor.selectionEnd,
    prefix: range ? editor.value.slice(0, range.start) : '',
    suffix: range ? editor.value.slice(range.end) : ''
  })
}

function validEdit(previous, next) {
  if (!previous) return true
  return next.startsWith(previous.prefix) && next.endsWith(previous.suffix)
}

function restoreSnapshot(editor, snapshot) {
  if (!snapshot) return
  editor.value = snapshot.value
  editor.setSelectionRange(
    Math.min(snapshot.selectionStart, editor.value.length),
    Math.min(snapshot.selectionEnd, editor.value.length)
  )
}

function draftKey(editor) {
  const identity = editor.value.match(/\b(?:module|interface|entity|class|property|task)\s+([A-Za-z_][\w$]*)/i)?.[1]
  if (!identity) return null
  const language = document.querySelector('.editor-language select')?.value || 'SystemVerilog'
  return `hdlforge-editor-draft-${identity.toLowerCase()}-${language}`
}

function persistDraft(editor) {
  const key = draftKey(editor)
  if (key) localStorage.setItem(key, editor.value)
}

function restoreDraft(editor) {
  const key = draftKey(editor)
  if (!key) return
  const saved = localStorage.getItem(key)
  if (!saved || saved === editor.value) return
  const currentRange = getEditableRange(editor.value)
  const savedRange = getEditableRange(saved)
  if (!currentRange || !savedRange) return
  if (saved.slice(0, savedRange.start) !== editor.value.slice(0, currentRange.start)) return
  if (saved.slice(savedRange.end) !== editor.value.slice(currentRange.end)) return
  editor.value = saved
  saveSnapshot(editor)
  editor.dispatchEvent(new Event('input', { bubbles: true }))
}

function smartKeydown(event) {
  const editor = event.target
  if (!isEditor(editor) || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
  const range = getEditableRange(editor.value)
  if (!range) return
  const start = editor.selectionStart
  const end = editor.selectionEnd
  if (start < range.start || end > range.end) return

  if (event.key === 'Enter') {
    event.preventDefault()
    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1
    const line = editor.value.slice(lineStart, start)
    const indent = line.match(/^\s*/)?.[0] || ''
    const language = document.querySelector('.editor-language select')?.value || 'SystemVerilog'
    const isVhdl = /VHDL/i.test(language)
    const opens = isVhdl
      ? /\b(begin|then|loop|process|if|case)\b/i.test(line) && !/^\s*end\b/i.test(line)
      : /\b(begin|case|fork|function|task|class|interface|generate)\b/.test(line) || /\b(else|always(?:_comb|_ff)?)\b/.test(line)
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
  if (!validEdit(previous, editor.value)) {
    restoreSnapshot(editor, previous)
    return
  }
  saveSnapshot(editor)
  persistDraft(editor)
}

document.addEventListener('focusin', event => {
  if (isEditor(event.target)) saveSnapshot(event.target)
}, true)
document.addEventListener('input', handleInput, true)
document.addEventListener('keydown', smartKeydown, true)
document.addEventListener('paste', event => {
  const editor = event.target
  if (!isEditor(editor)) return
  const range = getEditableRange(editor.value)
  if (!range || editor.selectionStart < range.start || editor.selectionEnd > range.end) {
    event.preventDefault()
    return
  }
  const pasted = event.clipboardData?.getData('text/plain') || ''
  const next = editor.value.slice(0, editor.selectionStart) + pasted + editor.value.slice(editor.selectionEnd)
  const previous = snapshots.get(editor)
  if (!validEdit(previous, next)) event.preventDefault()
}, true)
document.addEventListener('change', event => {
  const select = event.target
  if (!(select instanceof HTMLSelectElement) || !select.closest('.editor-language')) return
  requestAnimationFrame(() => {
    const editor = document.querySelector('textarea.ide-editor')
    if (!editor) return
    saveSnapshot(editor)
    restoreDraft(editor)
  })
}, true)
window.addEventListener('beforeunload', () => {
  const editor = document.querySelector('textarea.ide-editor')
  if (editor) persistDraft(editor)
})

const dropdownStyle = document.createElement('style')
dropdownStyle.textContent = `.editor-language{position:relative}.editor-language::after{content:'▾';position:absolute;right:14px;top:50%;transform:translateY(-55%);color:#aebdcd;font-size:11px;font-weight:700;line-height:1;pointer-events:none;z-index:2}.editor-language select{padding-right:30px;appearance:none;-webkit-appearance:none;cursor:pointer}`
document.head.appendChild(dropdownStyle)
