const q = (root, selector) => root?.querySelector(selector)
const qa = (root, selector) => [...(root?.querySelectorAll(selector) || [])]

const initialized = new WeakSet()
let activeWaveformFullscreen = null

function injectStyles() {
  if (document.getElementById('sim-v2-behavior-styles')) return
  const style = document.createElement('style')
  style.id = 'sim-v2-behavior-styles'
  style.textContent = `
    .sim-v2-wave-toolbar .sim-v2-zoom-label{
      min-width:42px!important;
      margin:0!important;
      text-align:center!important;
      color:#aeb5bd!important;
      font:10px Consolas,monospace!important;
    }
    .waveform-v2.sim-v2-wave-only-fullscreen,
    .waveform-v2:fullscreen{
      position:fixed!important;
      inset:0!important;
      z-index:2147483000!important;
      width:100vw!important;
      height:100vh!important;
      max-width:none!important;
      max-height:none!important;
      margin:0!important;
      border-radius:0!important;
      background:#111!important;
      display:flex!important;
      flex-direction:column!important;
    }
    .waveform-v2.sim-v2-wave-only-fullscreen .wave-scroll,
    .waveform-v2:fullscreen .wave-scroll{
      flex:1 1 auto!important;
      min-height:0!important;
      height:auto!important;
    }
    body.sim-v2-wave-fullscreen-active{overflow:hidden!important}
  `
  document.head.appendChild(style)
}

function activeBottomTab(panel) {
  return qa(panel, '.bottom-tabs > button.active').find(button => !button.classList.contains('bottom-collapse'))
}

function editorForPanel(panel) {
  const workspace = panel?.closest('.ide-workspace')
  return q(workspace, '.editor-wrap') || q(workspace, '.editor-shell')
}

function showEditor(panel, visible) {
  const editor = editorForPanel(panel)
  if (!editor) return
  if (visible) {
    editor.style.removeProperty('display')
    delete editor.dataset.simV2Hidden
  } else {
    editor.dataset.simV2Hidden = 'true'
    editor.style.setProperty('display', 'none', 'important')
  }
}

function expandedHeight(panel) {
  const workspace = panel?.closest('.ide-workspace')
  const fileTabs = q(workspace, '.file-tabs')
  if (!workspace || !fileTabs) return 0
  return Math.max(180, workspace.getBoundingClientRect().height - fileTabs.getBoundingClientRect().height - 2)
}

function forcePanelExpanded(panel) {
  if (!panel || panel.classList.contains('collapsed')) return
  const height = expandedHeight(panel)
  if (!height) return

  panel.dataset.waveformMaximized = 'true'
  panel.dataset.simBehaviorKeepExpanded = 'true'
  panel.dataset.expandedHeight = String(height)
  panel.style.setProperty('height', `${height}px`, 'important')
  panel.style.setProperty('flex-basis', `${height}px`, 'important')
  panel.style.setProperty('max-height', `${height}px`, 'important')
  showEditor(panel, false)
}

function forcePanelCollapsed(panel) {
  if (!panel) return
  panel.dataset.waveformMaximized = 'false'
  panel.style.removeProperty('height')
  panel.style.removeProperty('flex-basis')
  panel.style.removeProperty('max-height')
  showEditor(panel, true)
  exitWaveformFullscreen()
}

function arrangeZoomControls(waveform) {
  const toolbar = q(waveform, '.sim-v2-wave-toolbar')
  const zoomOut = q(toolbar, '.sim-v2-zoom-out')
  const zoomIn = q(toolbar, '.sim-v2-zoom-in')
  const label = q(toolbar, '.sim-v2-zoom-label')
  if (!toolbar || !zoomOut || !zoomIn || !label) return
  if (zoomOut.nextElementSibling !== label || label.nextElementSibling !== zoomIn) {
    zoomOut.after(label)
    label.after(zoomIn)
  }
  toolbar.dataset.simBehaviorZoomOrder = 'minus-percent-plus'
}

function rulerContentWidth(waveform) {
  const scroll = q(waveform, '.wave-scroll')
  const svg = q(waveform, 'svg.wave-svg')
  if (!scroll || !svg) return 0
  const marginLeft = Number.parseFloat(getComputedStyle(svg).marginLeft) || 0
  return Math.max(scroll.clientWidth, marginLeft + svg.getBoundingClientRect().width)
}

function stabilizeHorizontalScroll(waveform) {
  const scroll = q(waveform, '.wave-scroll')
  const signalPanel = q(waveform, '.sim-v2-signal-panel')
  const ruler = q(waveform, '.sim-v2-ruler')
  if (!scroll || !signalPanel || !ruler) return

  const sync = () => {
    const x = scroll.scrollLeft
    signalPanel.style.transform = `translate3d(${x}px,0,0)`

    // The signal panel stays fixed, but the timeline must scroll with the
    // traces. The old implementation translated the ruler by +scrollLeft,
    // which made the timeline detach from the waveform when panning.
    ruler.style.setProperty('transform', 'none', 'important')
    ruler.style.left = '0px'
    ruler.style.right = 'auto'
    ruler.style.width = `${Math.ceil(rulerContentWidth(waveform))}px`
    ruler.dataset.simBehaviorScrollStable = 'true'
  }

  scroll.addEventListener('scroll', sync, { passive: true })
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(sync)
    observer.observe(scroll)
    observer.observe(q(waveform, 'svg.wave-svg'))
  }
  sync()
}

function cleanupFullscreen(waveform = activeWaveformFullscreen) {
  if (!waveform) return
  waveform.classList.remove('sim-v2-wave-only-fullscreen')
  document.body.classList.remove('sim-v2-wave-fullscreen-active')
  if (activeWaveformFullscreen === waveform) activeWaveformFullscreen = null
  requestAnimationFrame(() => q(waveform, '.sim-v2-fit')?.click())
}

async function exitWaveformFullscreen() {
  const waveform = activeWaveformFullscreen
  if (!waveform) return
  if (document.fullscreenElement === waveform) {
    try { await document.exitFullscreen() } catch {}
  }
  cleanupFullscreen(waveform)
}

async function toggleWaveformFullscreen(waveform) {
  if (!waveform) return
  const active = document.fullscreenElement === waveform || waveform.classList.contains('sim-v2-wave-only-fullscreen')
  if (active) {
    await exitWaveformFullscreen()
    return
  }

  activeWaveformFullscreen = waveform
  waveform.classList.add('sim-v2-wave-only-fullscreen')
  document.body.classList.add('sim-v2-wave-fullscreen-active')

  try {
    await waveform.requestFullscreen?.()
  } catch {
    // CSS fallback keeps only the waveform fixed to the viewport.
  }

  requestAnimationFrame(() => q(waveform, '.sim-v2-fit')?.click())
}

function initializeWaveform(waveform) {
  if (!waveform || initialized.has(waveform)) return
  const toolbar = q(waveform, '.sim-v2-wave-toolbar')
  const scroll = q(waveform, '.wave-scroll')
  const ruler = q(waveform, '.sim-v2-ruler')
  if (!toolbar || !scroll || !ruler) return

  initialized.add(waveform)
  arrangeZoomControls(waveform)

  // Attach after the v2 listeners so our final layout values win each scroll.
  requestAnimationFrame(() => stabilizeHorizontalScroll(waveform))
}

function initializeAll() {
  qa(document, '.waveform-v2').forEach(initializeWaveform)
}

injectStyles()
initializeAll()
new MutationObserver(initializeAll).observe(document.documentElement, { childList: true, subtree: true })

// Override the previous fullscreen handler before the event reaches it.
document.addEventListener('click', event => {
  const button = event.target.closest?.('.sim-v2-fullscreen')
  if (!button) return
  const waveform = button.closest('.waveform-v2')
  if (!waveform) return
  event.preventDefault()
  event.stopImmediatePropagation()
  toggleWaveformFullscreen(waveform)
}, true)

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement === activeWaveformFullscreen) return
  if (!document.fullscreenElement) cleanupFullscreen(activeWaveformFullscreen)
})

// Preserve the large panel when moving from Waveform to Console, but let the
// collapse control genuinely collapse the panel and restore the editor.
document.addEventListener('click', event => {
  const tab = event.target.closest?.('.bottom-tabs > button')
  if (!tab) return
  const panel = tab.closest('.ide-bottom')
  if (!panel) return

  const activeBefore = activeBottomTab(panel)?.textContent?.trim() || ''
  const clickedLabel = tab.textContent?.trim() || ''
  const isCollapse = tab.classList.contains('bottom-collapse')

  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (isCollapse) {
      if (panel.classList.contains('collapsed')) {
        forcePanelCollapsed(panel)
      } else if (panel.dataset.simBehaviorKeepExpanded === 'true') {
        forcePanelExpanded(panel)
      }
      return
    }

    if (/^Console$/i.test(clickedLabel) && /Waveform/i.test(activeBefore)) {
      forcePanelExpanded(panel)
      return
    }

    if (/Waveform/i.test(clickedLabel) && !panel.classList.contains('collapsed')) {
      panel.dataset.simBehaviorKeepExpanded = 'true'
      forcePanelExpanded(panel)
    }
  }))
})

window.addEventListener('resize', () => {
  initializeAll()
  qa(document, '.ide-bottom[data-sim-behavior-keep-expanded="true"]:not(.collapsed)').forEach(forcePanelExpanded)
})
