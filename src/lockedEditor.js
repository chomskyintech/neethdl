const MARKER = /\/\/\s*Your RTL here|--\s*Your RTL here/i

function getEditableRange(value) {
  const marker = value.search(MARKER)
  if (marker < 0) return null
  const markerEnd = value.indexOf('\n', marker)
  const bodyStart = markerEnd < 0 ? value.length : markerEnd + 1
  const endModule = value.indexOf('\nendmodule', bodyStart)
  if (endModule >= 0) return { start: bodyStart, end: endModule }
  const endArchitecture = value.search(/\nend\s+architecture\b/i)
  if (endArchitecture >= bodyStart) return { start: bodyStart, end: endArchitecture }
  const endInterface = value.indexOf('\nendinterface', bodyStart)
  if (endInterface >= 0) return { start: bodyStart, end: endInterface }
  const endClass = value.indexOf('\nendclass', bodyStart)
  if (endClass >= 0) return { start: bodyStart, end: endClass }
  const endTask = value.indexOf('\nendtask', bodyStart)
  if (endTask >= 0) return { start: bodyStart, end: endTask }
  const endProperty = value.indexOf('\nendproperty', bodyStart)
  if (endProperty >= 0) return { start: bodyStart, end: endProperty }
  return { start: bodyStart, end: value.length }
}

function allowed(el) {
  const range = getEditableRange(el.value)
  if (!range) return true
  return el.selectionStart >= range.start && el.selectionEnd <= range.end
}

function guard(event) {
  const el = event.target
  if (!(el instanceof HTMLTextAreaElement) || !el.classList.contains('ide-editor')) return
  if (event.type === 'beforeinput') {
    if (!allowed(el)) event.preventDefault()
    return
  }
  if (event.type === 'keydown') {
    const range = getEditableRange(el.value)
    if (!range) return
    if (el.selectionStart < range.start || el.selectionEnd > range.end) {
      const editingKey = event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Enter' || event.key === 'Tab'
      if (editingKey && !(event.ctrlKey || event.metaKey)) event.preventDefault()
    }
  }
}

document.addEventListener('beforeinput', guard, true)
document.addEventListener('keydown', guard, true)
