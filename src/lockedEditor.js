const MARKER = /\/\/\s*Your RTL here|--\s*Your RTL here/i

function getEditableRange(value) {
  const match = MARKER.exec(value)
  if (match) {
    const lineStart = value.lastIndexOf('\n', match.index - 1) + 1
    const markerLineEnd = value.indexOf('\n', match.index)
    const start = lineStart
    const endCandidates = [
      value.indexOf('\nendmodule', Math.max(markerLineEnd, match.index)),
      value.search(/\nend\s+architecture\b/i),
      value.indexOf('\nendinterface', Math.max(markerLineEnd, match.index)),
      value.indexOf('\nendclass', Math.max(markerLineEnd, match.index)),
      value.indexOf('\nendtask', Math.max(markerLineEnd, match.index)),
      value.indexOf('\nendproperty', Math.max(markerLineEnd, match.index))
    ].filter(i => i >= 0)
    return { start, end: endCandidates.length ? Math.min(...endCandidates) : value.length }
  }

  const endModule = value.indexOf('\nendmodule')
  if (endModule >= 0) {
    const headerEnd = value.indexOf(');')
    if (headerEnd >= 0 && headerEnd < endModule) return { start: headerEnd + 2, end: endModule }
  }

  const architectureBegin = value.search(/\bbegin\b/i)
  const endArchitecture = value.search(/\nend\s+architecture\b/i)
  if (architectureBegin >= 0 && endArchitecture > architectureBegin) return { start: architectureBegin, end: endArchitecture }
  return null
}

function isEditor(el) {
  return el instanceof HTMLTextAreaElement && el.classList.contains('ide-editor')
}

const snapshots = new WeakMap()

function captureSnapshot(el) {
  if (!isEditor(el)) return
  const range = getEditableRange(el.value)
  snapshots.set(el, {
    value: el.value,
    start: el.selectionStart,
    end: el.selectionEnd,
    prefix: range ? el.value.slice(0, range.start) : '',
    suffix: range ? el.value.slice(range.end) : ''
  })
}

function isAllowedChange(previous, next) {
  if (!previous) return true
  if (previous.prefix && !next.startsWith(previous.prefix)) return false
  if (previous.suffix && !next.endsWith(previous.suffix)) return false
  return true
}

function restoreSnapshot(el, snapshot) {
  if (!snapshot) return
  el.value = snapshot.value
  const pos = Math.min(snapshot.start, el.value.length)
  const end = Math.min(snapshot.end, el.value.length)
  el.setSelectionRange(pos, end)
}

function draftIdentity(value) {
  const patterns = [/\bmodule\s+([A-Za-z_][\w$]*)/i, /\binterface\s+([A-Za-z_][\w$]*)/i, /\bentity\s+([A-Za-z_][\w$]*)/i, /\bclass\s+([A-Za-z_][\w$]*)/i, /\bproperty\s+([A-Za-z_][\w$]*)/i, /\btask\s+([A-Za-z_][\w$]*)/i]
  for (const pattern of patterns) {
    const match = pattern.exec(value)
    if (match) return match[1].toLowerCase()
  }
  return null
}

function editorLanguage(el) {
  return el.closest('.editor-wrap')?.querySelector('.editor-toolbar span')?.textContent?.match(/·\s*(.+)$/)?.[1]?.trim() || 'SystemVerilog'
}

function draftKey(el) {
  const identity = draftIdentity(el.value)
  return identity ? `hdlforge-editor-draft-${identity}-${editorLanguage(el)}` : null
}

function persistDraft(el) {
  const key = draftKey(el)
  if (key) localStorage.setItem(key, el.value)
}

function restoreDraft(el) {
  const key = draftKey(el)
  if (!key) return
  const saved = localStorage.getItem(key)
  if (saved === null || saved === el.value) return
  const previous = snapshots.get(el)
  el.value = saved
  captureSnapshot(el)
  el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: null }))
  if (previous) persistDraft(el)
}

function smartEditorKeydown(event) {
  const el = event.target
  if (!isEditor(el) || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
  const range = getEditableRange(el.value)
  const start = el.selectionStart
  const end = el.selectionEnd
  if (range && (start < range.start || end > range.end)) return

  if (event.key === 'Enter') {
    event.preventDefault()
    const lineStart = el.value.lastIndexOf('\n', start - 1) + 1
    const indent = el.value.slice(lineStart, start).match(/^\s*/)?.[0] || ''
    const line = el.value.slice(lineStart, start).trim()
    const toolbar = el.closest('.editor-wrap')?.querySelector('.editor-toolbar span')?.textContent || ''
    const isVhdl = /VHDL/i.test(toolbar)
    const opens = isVhdl ? /\b(begin|then|loop|process|if|case)\b/i.test(line) && !/^end\b/i.test(line) : /\b(begin|case|fork|function|task|class|interface|generate)\b/.test(line) || /\b(else|always_(comb|ff)|always)\b/.test(line)
    const closes = isVhdl ? /^(end|elsif|else)\b/i.test(line) : /^(end|else|endcase|endfunction|endtask|endclass|endinterface)\b/.test(line)
    const nextIndent = closes ? indent.slice(0, Math.max(0, indent.length - 2)) : `${indent}${opens ? '  ' : ''}`
    const replacement = `\n${nextIndent}`
    el.setRangeText(replacement, start, end, 'end')
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertLineBreak', data: null }))
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    const selected = el.value.slice(start, end)
    const replacement = start === end ? '  ' : selected.split('\n').map(line => `  ${line}`).join('\n')
    el.setRangeText(replacement, start, end, 'end')
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: replacement }))
    return
  }

  const pairs = { '(': ')', '[': ']', '{': '}', "'": "'", '"': '"' }
  if (pairs[event.key]) {
    event.preventDefault()
    const selected = el.value.slice(start, end)
    if (!selected && el.value[start] === pairs[event.key]) {
      el.setSelectionRange(start + 1, start + 1)
      return
    }
    const replacement = event.key + selected + pairs[event.key]
    el.setRangeText(replacement, start, end, 'end')
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: replacement }))
    el.setSelectionRange(start + (selected ? 1 : 1), start + (selected ? 1 : 1))
    return
  }

  if ([')', ']', '}'].includes(event.key) && start === end && el.value[start] === event.key) {
    event.preventDefault()
    el.setSelectionRange(start + 1, start + 1)
    return
  }

  if (event.key === 'Backspace' && start === end && start >= 2 && ['()', '[]', '{}', "''", '""'].includes(el.value.slice(start - 2, start))) {
    event.preventDefault()
    el.setRangeText('', start - 2, start, 'end')
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward', data: null }))
  }
}

function handleInput(event) {
  const el = event.target
  if (!isEditor(el)) return
  const previous = snapshots.get(el)
  if (!isAllowedChange(previous, el.value)) {
    restoreSnapshot(el, previous)
    return
  }
  captureSnapshot(el)
  persistDraft(el)
}

document.addEventListener('focusin', event => { if (isEditor(event.target)) captureSnapshot(event.target) }, true)
document.addEventListener('input', handleInput, true)
document.addEventListener('keydown', smartEditorKeydown, true)
document.addEventListener('change', event => {
  const select = event.target
  if (!(select instanceof HTMLSelectElement) || !select.closest('.editor-language')) return
  const editor = document.querySelector('textarea.ide-editor')
  if (editor) persistDraft(editor)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const nextEditor = document.querySelector('textarea.ide-editor')
    if (nextEditor) {
      captureSnapshot(nextEditor)
      restoreDraft(nextEditor)
    }
  }))
}, true)
window.addEventListener('beforeunload', () => {
  const editor = document.querySelector('textarea.ide-editor')
  if (editor) persistDraft(editor)
})

const dropdownStyle = document.createElement('style')
dropdownStyle.textContent = `.editor-language{position:relative}.editor-language::after{content:'▾';position:absolute;right:14px;top:50%;transform:translateY(-55%);color:#aebdcd;font-size:11px;font-weight:700;line-height:1;pointer-events:none;z-index:2}.editor-language select{padding-right:30px;appearance:none;-webkit-appearance:none;cursor:pointer}`
document.head.appendChild(dropdownStyle)
