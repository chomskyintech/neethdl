const DEFAULT_CONSOLE_HEIGHT = 188
const MIN_CONSOLE_HEIGHT = 120
const MAX_CONSOLE_RATIO = 0.7
const CONSOLE_HANDLE_HEIGHT = 14

let activePanel = null
let dragging = false
let runProxy = null

function applyExpandedHeight(panel, height) {
  const workspace = panel.closest('.ide-workspace')
  const workspaceHeight = workspace?.getBoundingClientRect().height || window.innerHeight
  const maxHeight = Math.max(MIN_CONSOLE_HEIGHT, workspaceHeight * MAX_CONSOLE_RATIO)
  const nextHeight = Math.min(maxHeight, Math.max(MIN_CONSOLE_HEIGHT, height))

  panel.dataset.expandedHeight = String(nextHeight)
  panel.style.setProperty('height', `${nextHeight}px`, 'important')
  panel.style.setProperty('flex-basis', `${nextHeight}px`, 'important')
  panel.style.setProperty('max-height', `${nextHeight}px`, 'important')
  positionRunProxy()
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
    requestAnimationFrame(positionRunProxy)
    return
  }

  const saved = Number.parseFloat(panel.dataset.expandedHeight)
  applyExpandedHeight(panel, Number.isFinite(saved) ? saved : DEFAULT_CONSOLE_HEIGHT)
}

function getOriginalRunButton() {
  return document.querySelector('.hdlforge-ide-active .ide-actions .primary')
}

function ensureRunProxy() {
  const original = getOriginalRunButton()
  const tabs = document.querySelector('.hdlforge-ide-active .ide-bottom .bottom-tabs')

  if (!original || !tabs) {
    if (runProxy) runProxy.style.display = 'none'
    return
  }

  if (!runProxy) {
    runProxy = document.createElement('button')
    runProxy.type = 'button'
    runProxy.id = 'hdlforge-console-run'
    runProxy.className = 'ide-console-run-proxy'
    runProxy.title = 'Run tests'
    runProxy.addEventListener('click', () => {
      const source = getOriginalRunButton()
      if (!source || source.disabled) return
      runProxy.disabled = true
      source.click()
      window.setTimeout(ensureRunProxy, 0)
    })
    document.body.appendChild(runProxy)
  }

  runProxy.style.display = 'grid'
  if (runProxy.disabled !== original.disabled) runProxy.disabled = original.disabled
  const conceptual = /evaluate/i.test(original.textContent || '')
  const label = conceptual ? 'Evaluate' : 'Run tests'
  if (runProxy.getAttribute('aria-label') !== label) runProxy.setAttribute('aria-label', label)
  if (runProxy.title !== label) runProxy.title = label
  positionRunProxy()
}

function positionRunProxy() {
  if (!runProxy || runProxy.style.display === 'none') return
  const tabs = document.querySelector('.hdlforge-ide-active .ide-bottom .bottom-tabs')
  if (!tabs) return

  const rect = tabs.getBoundingClientRect()
  const size = 30
  runProxy.style.left = `${Math.max(8, rect.right - size - 12)}px`
  runProxy.style.top = `${rect.top + Math.max(0, (rect.height - size) / 2)}px`
}

function syncCurrentPanel() {
  const panel = document.querySelector('.hdlforge-ide-active .ide-bottom')
  if (!panel) {
    if (runProxy) runProxy.style.display = 'none'
    return
  }
  activePanel = panel
  syncPanel(panel)
  ensureRunProxy()
}

function isOnConsoleHandle(panel, clientY) {
  const rect = panel.getBoundingClientRect()
  return clientY >= rect.top && clientY <= rect.top + CONSOLE_HANDLE_HEIGHT
}

document.addEventListener('pointerdown', event => {
  const panel = event.target.closest?.('.ide-bottom')
  if (!panel || panel.classList.contains('collapsed') || !isOnConsoleHandle(panel, event.clientY)) return

  const rect = panel.getBoundingClientRect()
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
  positionRunProxy()
}

document.addEventListener('pointerup', stopDragging)
document.addEventListener('pointercancel', stopDragging)

// Double-clicking the visible top-edge handle gives the same quick collapse/restore
// behaviour as the Console chevron without adding DOM inside React-owned markup.
document.addEventListener('dblclick', event => {
  const panel = event.target.closest?.('.ide-bottom')
  if (!panel || !isOnConsoleHandle(panel, event.clientY)) return
  panel.querySelector('.bottom-collapse')?.click()
  event.preventDefault()
})

new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (mutation.target === runProxy) continue
    if (mutation.type === 'attributes' && mutation.target.classList?.contains('ide-bottom')) {
      syncPanel(mutation.target)
    }
  }
  syncCurrentPanel()
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })

window.addEventListener('resize', () => {
  syncCurrentPanel()
  positionRunProxy()
})

syncCurrentPanel()
