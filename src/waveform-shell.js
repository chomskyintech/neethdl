let waveformShellScheduled = false

function positionRunProxy(panel) {
  const proxy = document.getElementById('hdlforge-console-run')
  const tabs = panel?.querySelector('.bottom-tabs')
  if (!proxy || !tabs) return
  const rect = tabs.getBoundingClientRect()
  const size = 30
  proxy.style.left = `${Math.max(8, rect.right - size - 12)}px`
  proxy.style.top = `${rect.top + Math.max(0, (rect.height - size) / 2)}px`
}

function setEditorHiddenForWaveform(workspace, hidden) {
  const editor = workspace?.querySelector('.editor-wrap') || workspace?.querySelector('.editor-shell')
  if (!editor) return

  if (hidden) {
    editor.dataset.waveformHidden = 'true'
    editor.style.setProperty('display', 'none', 'important')
    return
  }

  if (editor.dataset.waveformHidden === 'true') {
    editor.style.removeProperty('display')
    delete editor.dataset.waveformHidden
  }
}

function maximizeWaveformPanel(panel) {
  const workspace = panel?.closest('.ide-workspace')
  const fileTabs = workspace?.querySelector('.file-tabs')
  if (!panel || !workspace || !fileTabs || panel.classList.contains('collapsed')) return

  setEditorHiddenForWaveform(workspace, true)

  const workspaceHeight = workspace.getBoundingClientRect().height
  const fileTabsHeight = fileTabs.getBoundingClientRect().height
  const available = Math.max(160, workspaceHeight - fileTabsHeight - 2)

  if (panel.dataset.waveformMaximized !== 'true') {
    const current = Number.parseFloat(panel.dataset.expandedHeight) || panel.getBoundingClientRect().height
    panel.dataset.waveformPreviousHeight = String(current)
  }

  panel.dataset.waveformMaximized = 'true'
  panel.dataset.expandedHeight = String(available)
  panel.style.setProperty('height', `${available}px`, 'important')
  panel.style.setProperty('flex-basis', `${available}px`, 'important')
  panel.style.setProperty('max-height', `${available}px`, 'important')
  requestAnimationFrame(() => positionRunProxy(panel))
}

function restorePanelAfterWaveform(panel) {
  if (!panel || panel.dataset.waveformMaximized !== 'true') return
  const workspace = panel.closest('.ide-workspace')
  const workspaceHeight = workspace?.getBoundingClientRect().height || window.innerHeight
  const saved = Number.parseFloat(panel.dataset.waveformPreviousHeight)
  const restored = Number.isFinite(saved) ? Math.min(workspaceHeight * 0.7, Math.max(120, saved)) : 188

  panel.dataset.waveformMaximized = 'false'
  panel.dataset.expandedHeight = String(restored)
  panel.style.setProperty('height', `${restored}px`, 'important')
  panel.style.setProperty('flex-basis', `${restored}px`, 'important')
  panel.style.setProperty('max-height', `${restored}px`, 'important')
  setEditorHiddenForWaveform(workspace, false)
  requestAnimationFrame(() => positionRunProxy(panel))
}

function activeBottomTab(panel) {
  return [...(panel?.querySelectorAll('.bottom-tabs>button.active') || [])]
    .find(button => !button.classList.contains('bottom-collapse'))
}

function scheduleWaveformMaximize(panel) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const current = panel?.isConnected ? panel : document.querySelector('.hdlforge-ide-active .ide-bottom')
    if (!current || !/waveform/i.test(activeBottomTab(current)?.textContent || '')) return
    maximizeWaveformPanel(current)
  }))
}

function openWaveformInNewTab(waveform) {
  if (!waveform) return
  const clone = waveform.cloneNode(true)
  clone.classList.add('waveform-enhanced')
  clone.querySelector('.wave-enhance-toolbar')?.remove()
  clone.querySelector('.wave-tools')?.remove()
  clone.querySelectorAll('.wave-cursor-line,.wave-failure-marker,.wave-cursor').forEach(node => node.remove())
  const livePanel = clone.querySelector('.wave-live-panel')
  if (livePanel) livePanel.style.transform = 'translateX(0)'

  const popup = window.open('', '_blank')
  if (!popup) return

  const origin = window.location.origin
  popup.document.open()
  popup.document.write(`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HDLForge Waveform</title><link rel="stylesheet" href="${origin}/waveform-enhance.css"><link rel="stylesheet" href="${origin}/waveform-shell.css"></head><body class="hdlforge-ide-active waveform-popout-body"><header class="waveform-popout-header"><strong>HDLForge Waveform</strong><span>Simulation snapshot</span></header><main id="waveform-popout-root" class="waveform-popout-root"></main></body></html>`)
  popup.document.close()
  const root = popup.document.getElementById('waveform-popout-root')
  if (root) root.appendChild(popup.document.importNode(clone, true))
  try { popup.opener = null } catch {}
}

function ensurePopoutButton(waveform) {
  const toolbar = waveform?.querySelector('.wave-enhance-toolbar')
  if (!toolbar || toolbar.querySelector('.wave-open-tab')) return

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'wave-open-tab'
  button.title = 'Open waveform in a new tab'
  button.setAttribute('aria-label', 'Open waveform in new tab')
  button.textContent = 'Open ↗'
  button.addEventListener('click', event => {
    event.stopPropagation()
    openWaveformInNewTab(waveform)
  })

  const readouts = toolbar.querySelector('.wave-readouts')
  toolbar.insertBefore(button, readouts || null)
}

function ensureWaveformShell() {
  waveformShellScheduled = false
  document.querySelectorAll('.waveform.waveform-enhanced').forEach(ensurePopoutButton)
}

function scheduleWaveformShell() {
  if (waveformShellScheduled) return
  waveformShellScheduled = true
  requestAnimationFrame(ensureWaveformShell)
}

document.addEventListener('click', event => {
  const tab = event.target.closest?.('.bottom-tabs>button')
  if (!tab) return
  const panel = tab.closest('.ide-bottom')
  if (!panel) return

  if (tab.classList.contains('bottom-collapse')) {
    requestAnimationFrame(() => {
      if (!panel.classList.contains('collapsed') && /waveform/i.test(activeBottomTab(panel)?.textContent || '')) {
        scheduleWaveformMaximize(panel)
      }
    })
    return
  }

  const label = tab.textContent || ''
  if (/waveform/i.test(label)) scheduleWaveformMaximize(panel)
  else if (/console|testbench|evaluation/i.test(label)) requestAnimationFrame(() => restorePanelAfterWaveform(panel))
})

new MutationObserver(() => scheduleWaveformShell()).observe(document.documentElement, { childList: true, subtree: true })

window.addEventListener('resize', () => {
  const panel = document.querySelector('.hdlforge-ide-active .ide-bottom')
  if (panel?.dataset.waveformMaximized === 'true' && /waveform/i.test(activeBottomTab(panel)?.textContent || '')) {
    requestAnimationFrame(() => maximizeWaveformPanel(panel))
  }
  scheduleWaveformShell()
})

scheduleWaveformShell()