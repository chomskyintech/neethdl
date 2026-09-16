const LANGUAGE_TEXT_START = 51
const LANGUAGE_CHEVRON_GAP = 9

let measureCanvas = null

function measureSelectedLabel(select) {
  measureCanvas ||= document.createElement('canvas')
  const context = measureCanvas.getContext('2d')
  if (!context) return 80

  const style = getComputedStyle(select)
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const label = select.options[select.selectedIndex]?.textContent || select.value || ''
  return Math.ceil(context.measureText(label).width)
}

function syncLanguagePicker(picker) {
  const select = picker?.querySelector('select')
  if (!select) return
  const labelWidth = measureSelectedLabel(select)
  picker.style.setProperty('--hdl-language-chevron-left', `${LANGUAGE_TEXT_START + labelWidth + LANGUAGE_CHEVRON_GAP}px`)
}

function syncLanguagePickers() {
  document.querySelectorAll('.hdlforge-ide-active .editor-language').forEach(syncLanguagePicker)
}

document.addEventListener('change', event => {
  if (!event.target.matches?.('.editor-language select')) return
  requestAnimationFrame(() => syncLanguagePicker(event.target.closest('.editor-language')))
})

document.addEventListener('input', event => {
  if (!event.target.matches?.('.editor-language select')) return
  requestAnimationFrame(() => syncLanguagePicker(event.target.closest('.editor-language')))
})

// Observe only added/removed nodes. Updating the CSS variable does not retrigger this observer.
new MutationObserver(() => requestAnimationFrame(syncLanguagePickers))
  .observe(document.documentElement, { childList: true, subtree: true })

window.addEventListener('resize', syncLanguagePickers)
document.fonts?.ready?.then(syncLanguagePickers)
requestAnimationFrame(syncLanguagePickers)
