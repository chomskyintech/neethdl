const MARKER = /\/\/\s*Your RTL here|--\s*Your RTL here/i
const editorBounds = new WeakMap()

function getEditableRange(value, el = null) {
  const match = MARKER.exec(value)
  if (match) {
    const markerStart = match.index
    const markerEnd = match.index + match[0].length
    const newlineAfterMarker = value.indexOf('\n', markerEnd)
    const bodyStart = newlineAfterMarker < 0 ? markerEnd : newlineAfterMarker + 1
    const range = { start: markerStart, bodyStart }
    if (el) editorBounds.set(el, range)
    return finishRange(value, range)
  }

  // If the user has deleted/replaced the placeholder, keep the original
  // editable boundary for this textarea instead of unlocking the scaffold.
  const saved = el ? editorBounds.get(el) : null
  if (saved) return finishRange(value, saved)
  return null
}

function finishRange(value, range) {
  const bodyStart = range.bodyStart ?? range.start
  const endModule = value.indexOf('\nendmodule', bodyStart)
  if (endModule >= 0) return { start: range.start, end: endModule }
  const endArchitecture = value.search(/\nend\s+architecture\b/i)
  if (endArchitecture >= bodyStart) return { start: range.start, end: endArchitecture }
  const endInterface = value.indexOf('\nendinterface', bodyStart)
  if (endInterface >= 0) return { start: range.start, end: endInterface }
  const endClass = value.indexOf('\nendclass', bodyStart)
  if (endClass >= 0) return { start: range.start, end: endClass }
  const endTask = value.indexOf('\nendtask', bodyStart)
  if (endTask >= 0) return { start: range.start, end: endTask }
  const endProperty = value.indexOf('\nendproperty', bodyStart)
  if (endProperty >= 0) return { start: range.start, end: endProperty }
  const inlineEnd = value.indexOf('end;', bodyStart)
  if (inlineEnd >= 0) return { start: range.start, end: inlineEnd }
  return { start: range.start, end: value.length }
}

function isEditor(el) {
  return el instanceof HTMLTextAreaElement && el.classList.contains('ide-editor')
}

function inEditableRange(el, start = el.selectionStart, end = el.selectionEnd) {
  const range = getEditableRange(el.value, el)
  if (!range) return true
  return start >= range.start && end <= range.end
}

function allowed(el) {
  return inEditableRange(el)
}

function guard(event) {
  const el = event.target
  if (!isEditor(el)) return
  if (event.type === 'beforeinput') {
    if (!allowed(el)) event.preventDefault()
    return
  }
  if (event.type === 'paste') {
    if (!inEditableRange(el)) event.preventDefault()
    return
  }
  if (event.type === 'keydown') {
    const range = getEditableRange(el.value, el)
    if (!range) return
    if (el.selectionStart < range.start || el.selectionEnd > range.end) {
      const editingKey = event.key.length === 1 || ['Backspace', 'Delete', 'Enter', 'Tab'].includes(event.key)
      if (editingKey && !(event.ctrlKey || event.metaKey)) event.preventDefault()
    }
  }
}

function lineIndent(value, position) {
  const lineStart = value.lastIndexOf('\n', position - 1) + 1
  const line = value.slice(lineStart, position)
  return line.match(/^\s*/)?.[0] || ''
}

function nextNonSpace(value, position) {
  let i = position
  while (i < value.length && /\s/.test(value[i])) i += 1
  return value[i] || ''
}

function replaceSelection(el, replacement, caretOffset = replacement.length) {
  const start = el.selectionStart
  const end = el.selectionEnd
  el.setRangeText(replacement, start, end, 'end')
  el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: replacement }))
  requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + caretOffset })
}

function smartEditorKeydown(event) {
  const el = event.target
  if (!isEditor(el) || event.defaultPrevented) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const start = el.selectionStart
  const end = el.selectionEnd
  if (!inEditableRange(el, start, end)) return

  if (event.key === 'Enter') {
    event.preventDefault()
    const indent = lineIndent(el.value, start)
    const before = el.value.slice(0, start)
    const currentLine = before.slice(before.lastIndexOf('\n') + 1).trim()
    const toolbar = el.closest('.editor-wrap')?.querySelector('.editor-toolbar span')?.textContent || ''
    const isVhdl = /VHDL/i.test(toolbar)
    const opens = isVhdl
      ? /\b(begin|then|loop|process|if|case)\b/i.test(currentLine) && !/^end\b/i.test(currentLine)
      : /\b(begin|case|fork|function|task|class|interface|generate)\b/.test(currentLine) || /\b(else|always_(comb|ff)|always)\b/.test(currentLine)
    const closes = isVhdl ? /^(end|elsif|else)\b/i.test(currentLine) : /^(end|else|endcase|endfunction|endtask|endclass|endinterface)\b/.test(currentLine)
    const baseIndent = closes ? indent.slice(0, Math.max(0, indent.length - 2)) : indent
    replaceSelection(el, `\n${baseIndent}${opens && !closes ? '  ' : ''}`)
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    if (start !== end) {
      const selected = el.value.slice(start, end)
      const replacement = selected.split('\n').map(line => `  ${line}`).join('\n')
      replaceSelection(el, replacement)
    } else replaceSelection(el, '  ')
    return
  }

  const pairs = { '(': ')', '[': ']', '{': '}', "'": "'", '"': '"' }
  if (pairs[event.key]) {
    const closing = pairs[event.key]
    if (start === end && nextNonSpace(el.value, start) === closing) {
      event.preventDefault()
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 1 })
      return
    }
    event.preventDefault()
    const selected = el.value.slice(start, end)
    replaceSelection(el, event.key + selected + closing, selected.length + 1)
    return
  }

  if ([')', ']', '}'].includes(event.key) && start === end && nextNonSpace(el.value, start) === event.key) {
    event.preventDefault()
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 1 })
    return
  }

  if (event.key === 'Backspace' && start === end && start >= 2) {
    const pair = el.value.slice(start - 2, start)
    if (['()', '[]', '{}', "''", '""'].includes(pair)) {
      event.preventDefault()
      el.setRangeText('', start - 2, start, 'end')
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }))
    }
  }
}

function protectPaste(event) {
  const el = event.target
  if (!isEditor(el)) return
  const range = getEditableRange(el.value, el)
  if (!range) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const text = event.clipboardData?.getData('text') || ''
  if (!inEditableRange(el, start, end) || start + text.length - (end - start) > range.end) event.preventDefault()
}

document.addEventListener('beforeinput', guard, true)
document.addEventListener('paste', guard, true)
document.addEventListener('paste', protectPaste, true)
document.addEventListener('keydown', guard, true)
document.addEventListener('keydown', smartEditorKeydown, true)

const dropdownStyle = document.createElement('style')
dropdownStyle.textContent = `.editor-language{position:relative}.editor-language::after{content:'▾';position:absolute;right:14px;top:50%;transform:translateY(-55%);color:#aebdcd;font-size:11px;font-weight:700;line-height:1;pointer-events:none;z-index:2}.editor-language select{padding-right:30px;appearance:none;-webkit-appearance:none;cursor:pointer}`
document.head.appendChild(dropdownStyle)
