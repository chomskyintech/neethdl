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

function proposedValueFits(el, replacement = '') {
  const range = getEditableRange(el.value)
  if (!range) return true
  const start = el.selectionStart
  const end = el.selectionEnd
  if (start < range.start || end > range.end) return false
  return start + replacement.length - (end - start) <= range.end
}

function guard(event) {
  const el = event.target
  if (!isEditor(el)) return
  const range = getEditableRange(el.value)
  if (!range) return

  if (event.type === 'beforeinput') {
    const destructive = /delete/i.test(event.inputType || '')
    const replacement = destructive ? '' : (event.data || '')
    if (!inEditableRange(el) || (!destructive && !proposedValueFits(el, replacement))) event.preventDefault()
    return
  }

  if (event.type === 'paste') {
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
  if (!proposedValueFits(el, replacement)) return
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
  if (!inEditableRange(el, start, end) || !proposedValueFits(el, text)) event.preventDefault()
}

function editorIdentity(value) {
  const patterns = [
    /\bmodule\s+([A-Za-z_][\w$]*)/i,
    /\binterface\s+([A-Za-z_][\w$]*)/i,
    /\bentity\s+([A-Za-z_][\w$]*)/i,
    /\bclass\s+([A-Za-z_][\w$]*)/i,
    /\bproperty\s+([A-Za-z_][\w$]*)/i,
    /\btask\s+([A-Za-z_][\w$]*)/i,
  ]
  for (const pattern of patterns) {
    const match = pattern.exec(value)
    if (match) return match[1].toLowerCase()
  }
  return null
}

function editorLanguage(el) {
  return el.closest('.editor-wrap')?.querySelector('.editor-toolbar span')?.textContent?.match(/·\s*(.+)$/)?.[1]?.trim() || 'SystemVerilog'
}

function draftKey(el, language = editorLanguage(el)) {
  const identity = editorIdentity(el.value)
  return identity ? `hdlforge-editor-draft-${identity}-${language}` : null
}

function persistLanguageDraft(el) {
  if (!isEditor(el)) return
  const key = draftKey(el)
  if (key) localStorage.setItem(key, el.value)
}

function restoreLanguageDraft(el, language = editorLanguage(el)) {
  if (!isEditor(el)) return false
  const key = draftKey(el, language)
  if (!key) return false
  const saved = localStorage.getItem(key)
  if (saved === null || saved === el.value) return false
  el.value = saved
  el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: null }))
  return true
}

function syncLanguageDrafts() {
  const editors = document.querySelectorAll('textarea.ide-editor')
  editors.forEach(persistLanguageDraft)
}

function setupDraftPersistence() {
  document.addEventListener('input', event => {
    if (isEditor(event.target)) persistLanguageDraft(event.target)
  }, true)

  document.addEventListener('change', event => {
    const select = event.target
    if (!(select instanceof HTMLSelectElement) || !select.closest('.editor-language')) return
    const editor = document.querySelector('textarea.ide-editor')
    if (editor) persistLanguageDraft(editor)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const nextEditor = document.querySelector('textarea.ide-editor')
      if (nextEditor) restoreLanguageDraft(nextEditor)
    }))
  }, true)

  const observer = new MutationObserver(() => {
    const editor = document.querySelector('textarea.ide-editor')
    if (!editor) return
    requestAnimationFrame(() => restoreLanguageDraft(editor))
  })
  observer.observe(document.body, { childList: true, subtree: true })

  window.addEventListener('beforeunload', syncLanguageDrafts)
}

document.addEventListener('beforeinput', guard, true)
document.addEventListener('paste', guard, true)
document.addEventListener('paste', protectPaste, true)
document.addEventListener('keydown', guard, true)
document.addEventListener('keydown', smartEditorKeydown, true)
setupDraftPersistence()

const dropdownStyle = document.createElement('style')
dropdownStyle.textContent = `.editor-language{position:relative}.editor-language::after{content:'▾';position:absolute;right:14px;top:50%;transform:translateY(-55%);color:#aebdcd;font-size:11px;font-weight:700;line-height:1;pointer-events:none;z-index:2}.editor-language select{padding-right:30px;appearance:none;-webkit-appearance:none;cursor:pointer}`
document.head.appendChild(dropdownStyle)
