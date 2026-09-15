const DEFAULT_CONSOLE_HEIGHT = 188
const MIN_CONSOLE_HEIGHT = 120
const MAX_CONSOLE_RATIO = 0.7

let activePanel = null
let dragging = false

function setConsoleVariable(height) {
  document.documentElement.style.setProperty('--ide-console-height', `${Math.round(height)}px`)
}

function applyExpandedHeight(panel, height) {
  const workspace = panel.closest('.ide-workspace')
  const workspaceHeight = workspace?.getBoundingClientRect().height || window.innerHeight
  const maxHeight = Math.max(MIN_CONSOLE_HEIGHT, workspaceHeight * MAX_CONSOLE_RATIO)
  const nextHeight = Math.min(maxHeight, Math.max(MIN_CONSOLE_HEIGHT, height))

  panel.dataset.expandedHeight = String(nextHeight)
  panel.style.setProperty('height', `${nextHeight}px`, 'important')
  panel.style.setProperty('flex-basis', `${nextHeight}px`, 'important')
  panel.style.setProperty('max-height', `${nextHeight}px`, 'important')
  setConsoleVariable(nextHeight)
}

function syncPanel(panel) {
  if (!panel) return

  if (panel.classList.contains('collapsed')) {
    const currentInline = Number.parseFloat(panel.style.getPropertyValue('height'))
    if (Number.isFinite(currentInline) && currentInline > 40) {
      panel.dataset.expandedHeight = String(currentInline)
    } else if (!panel.dataset.expandedHeight) {
      panel.dataset.expandedHeight = String(DEFAULT_CONSOLE_HEIGHT)
    }

    panel.style.removeProperty('height')
    panel.style.removeProperty('flex-basis')
    panel.style.removeProperty('max-height')
    setConsoleVariable(34)
    return
  }

  const saved = Number.parseFloat(panel.dataset.expandedHeight)
  if (Number.isFinite(saved)) {
    applyExpandedHeight(panel, saved)
  } else {
    const measured = panel.getBoundingClientRect().height || DEFAULT_CONSOLE_HEIGHT
    panel.dataset.expandedHeight = String(measured)
    setConsoleVariable(measured)
  }
}

function syncCurrentPanel() {
  const panel = document.querySelector('.hdlforge-ide-active .ide-bottom')
  if (!panel) return
  activePanel = panel
  syncPanel(panel)
}

document.addEventListener('pointerdown', event => {
  const panel = event.target.closest?.('.ide-bottom')
  if (!panel || panel.classList.contains('collapsed')) return

  const rect = panel.getBoundingClientRect()
  if (event.clientY < rect.top || event.clientY > rect.top + 9) return

  activePanel = panel
  dragging = true
  panel.dataset.expandedHeight = String(rect.height)
  document.body.classList.add('ide-console-resizing')
  event.preventDefault()
})

document.addEventListener('pointermove', event => {
  if (!dragging || !activePanel) return
  const workspace = activePanel.closest('.ide-workspace')
  if (!workspace) return

  const rect = workspace.getBoundingClientRect()
  applyExpandedHeight(activePanel, rect.bottom - event.clientY)
  event.preventDefault()
})

function stopDragging() {
  if (!dragging) return
  dragging = false
  document.body.classList.remove('ide-console-resizing')
}

document.addEventListener('pointerup', stopDragging)
document.addEventListener('pointercancel', stopDragging)

new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes' && mutation.target.classList?.contains('ide-bottom')) {
      syncPanel(mutation.target)
      return
    }
  }
  syncCurrentPanel()
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })

window.addEventListener('resize', syncCurrentPanel)
syncCurrentPanel()
