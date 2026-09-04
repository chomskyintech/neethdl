const MARKER = /\/\/\s*Your RTL here|--\s*Your RTL here/i

function getEditableRange(value) {
  const match = MARKER.exec(value)
  if (match) {
    const lineStart = value.lastIndexOf('\n', match.index - 1) + 1
    const markerEnd = match.index + match[0].length
    const endModule = value.indexOf('\nendmodule', markerEnd)
    if (endModule >= 0) return { start: lineStart, end: endModule }
    const endArchitecture = value.search(/\nend\s+architecture\b/i)
    if (endArchitecture >= lineStart) return { start: lineStart, end: endArchitecture }
    const endInterface = value.indexOf('\nendinterface', markerEnd)
    if (endInterface >= 0) return { start: lineStart, end: endInterface }
    const endClass = value.indexOf('\nendclass', markerEnd)
    if (endClass >= 0) return { start: lineStart, end: endClass }
    const endTask = value.indexOf('\nendtask', markerEnd)
    if (endTask >= 0) return { start: lineStart, end: endTask }
    const endProperty = value.indexOf('\nendproperty', markerEnd)
    if (endProperty >= 0) return { start: lineStart, end: endProperty }
    return { start: lineStart, end: value.length }
  }

  // Keep the implementation region locked to the original module/architecture body
  // even after the user deletes the placeholder marker.
  const endModule = value.indexOf('\nendmodule')
  if (endModule >= 0) {
    const headerEnd = value.indexOf(');')
    if (headerEnd >= 0 && headerEnd < endModule) return { start: headerEnd + 2, end: endModule }
  }

  const architectureBegin = value.search(/\bbegin\b/i)
  const endArchitecture = value.search(/\nend\s+architecture\b/i)
  if (architectureBegin >= 0 && endArchitecture > architectureBegin) {
    return { start: architectureBegin, end: endArchitecture }
  }

  return null
}

function isEditor(el) {
  return el instanceof HTMLTextAreaElement && el.classList.contains('ide-editor')
}

function inEditableRange(el, start = el.selectionStart, end = el.selectionEnd) {
  const range = getEditableRange(el.value)
  if (!range) return true
  return start >= range.start && end <= range.end
}

function guard(event) {
  const el = event.target
  if (!isEditor(el)) return
  const range = getEditableRange(el.value)
  if (!range) return

  if (event.type === 'beforeinput' || event.type === 'paste') {
    if (!inEditableRange(el)) event.preventDefault()
    return
  }

  if (event.type === 'keydown') {
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
  const range = getEditableRange(el.value)
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
