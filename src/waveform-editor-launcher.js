const q = (root, selector) => root?.querySelector(selector)
const qa = (root, selector) => [...(root?.querySelectorAll(selector) || [])]

const WAVE_ICON = `
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12h3l2.2-5 3.6 10 2.4-7 2 2H21" />
  </svg>`

function injectStyles() {
  if (document.getElementById('waveform-editor-launcher-styles')) return
  const style = document.createElement('style')
  style.id = 'waveform-editor-launcher-styles'
  style.textContent = `
    .bottom-tabs > .sim-bottom-waveform-trigger{
      display:none!important;
    }
    .file-tabs .sim-editor-waveform-launch{
      position:absolute!important;
      z-index:4!important;
      display:grid!important;
      place-items:center!important;
      width:28px!important;
      height:28px!important;
      min-width:28px!important;
      padding:0!important;
      border:1px solid transparent!important;
      border-radius:6px!important;
      background:#1f1f1f!important;
      color:#9ca3ad!important;
      cursor:pointer!important;
    }
    .file-tabs .sim-editor-waveform-launch:hover{
      color:#e4e7eb!important;
      background:#292929!important;
    }
    .file-tabs .sim-editor-waveform-launch.active{
      color:#8ee7a2!important;
      background:rgba(71,190,101,.12)!important;
      border-color:rgba(71,190,101,.28)!important;
    }
  `
  document.head.appendChild(style)
}

function waveformTab(panel) {
  return qa(panel, '.bottom-tabs > button').find(button => /^Waveform$/i.test(button.textContent?.trim() || '')) || null
}

function positionLauncher(fileTabs, reset, launcher) {
  const tabsStyle = getComputedStyle(fileTabs)
  if (tabsStyle.position === 'static') fileTabs.style.position = 'relative'

  // Because the launcher is absolutely positioned, it does not disturb the
  // existing Reset -> Find spacing. Keep it 8 px to the left of Reset.
  const left = Math.max(0, reset.offsetLeft - launcher.offsetWidth - 8)
  launcher.style.left = `${left}px`
  launcher.style.top = `${reset.offsetTop}px`
}

function syncWorkspace(workspace) {
  const fileTabs = q(workspace, '.file-tabs')
  const panel = q(workspace, '.ide-bottom')
  const reset = q(fileTabs, 'button[title="Reset editor"]')
  if (!fileTabs || !panel || !reset) return

  const source = waveformTab(panel)
  if (!source) return
  if (!source.classList.contains('sim-bottom-waveform-trigger')) source.classList.add('sim-bottom-waveform-trigger')
  if (source.getAttribute('aria-hidden') !== 'true') source.setAttribute('aria-hidden', 'true')
  if (source.tabIndex !== -1) source.tabIndex = -1

  let launcher = q(fileTabs, '.sim-editor-waveform-launch')
  if (!launcher) {
    launcher = document.createElement('button')
    launcher.type = 'button'
    launcher.className = 'sim-editor-waveform-launch'
    launcher.title = 'Waveform'
    launcher.setAttribute('aria-label', 'Waveform')
    launcher.setAttribute('aria-pressed', 'false')
    launcher.innerHTML = WAVE_ICON
    fileTabs.appendChild(launcher)

    launcher.addEventListener('click', () => {
      const currentPanel = q(workspace, '.ide-bottom')
      const currentSource = waveformTab(currentPanel)
      if (!currentPanel || !currentSource) return

      // Keep the React-owned waveform renderer and all of its current formatting.
      // The existing waveform behavior module expands the panel to the editor
      // workspace footprint and hides Monaco while the waveform is open.
      currentSource.click()
      requestAnimationFrame(() => requestAnimationFrame(syncAll))
    })
  }

  positionLauncher(fileTabs, reset, launcher)

  const active = source.classList.contains('active') && !panel.classList.contains('collapsed')
  if (launcher.classList.contains('active') !== active) launcher.classList.toggle('active', active)
  const pressed = String(active)
  if (launcher.getAttribute('aria-pressed') !== pressed) launcher.setAttribute('aria-pressed', pressed)
}

function syncAll() {
  qa(document, '.ide-workspace').forEach(syncWorkspace)
}

injectStyles()
syncAll()

// Initialization only needs DOM insertion/removal observation. Watching every
// class change in Monaco made the launcher run on thousands of unrelated editor
// mutations and slowed browser interactions significantly.
new MutationObserver(syncAll).observe(document.documentElement, {
  childList: true,
  subtree: true,
})

// React changes active/collapsed state in response to clicks; resync after those
// events instead of globally observing all class mutations.
document.addEventListener('click', () => {
  requestAnimationFrame(() => requestAnimationFrame(syncAll))
})
window.addEventListener('resize', syncAll)
