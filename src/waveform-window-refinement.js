const q = (root, selector) => root?.querySelector(selector)
const qa = (root, selector) => [...(root?.querySelectorAll(selector) || [])]

let scheduled = false

function simulationEndFor(windowNode) {
  const workspace = windowNode.closest('.ide-workspace')
  const consolePanel = q(workspace, '.ide-bottom')
  const end = Number(consolePanel?.dataset.simV2End)
  return Number.isFinite(end) && end > 0 ? end : 0
}

function ensureWaveformEndMarker(windowNode) {
  const waveform = q(windowNode, '.waveform-v2') || q(windowNode, '.waveform')
  const svg = q(waveform, 'svg.wave-svg')
  const end = simulationEndFor(windowNode)
  if (!waveform || !svg || end <= 0) return

  let marker = q(svg, '.waveform-window-end-marker')
  if (!marker) {
    marker = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    marker.setAttribute('class', 'wave-time waveform-window-end-marker')
    marker.setAttribute('aria-hidden', 'true')
    marker.setAttribute('display', 'none')
    svg.appendChild(marker)
  }

  const label = String(end)
  if (marker.textContent === label) return
  marker.textContent = label

  // simulation-panel-v2 derives its ruler range from .wave-time labels. The
  // standalone waveform window is no longer inside .ide-bottom, so expose the
  // console's real simulation end time here and immediately rebuild the ruler.
  requestAnimationFrame(() => q(waveform, '.sim-v2-fit')?.click())
}

function keepConsoleCollapseBesideConsole() {
  qa(document, '.bottom-tabs').forEach(tabs => {
    const collapse = q(tabs, '.bottom-collapse')
    const buttons = qa(tabs, ':scope > button:not(.bottom-collapse)')
    const consoleButton = buttons.find(button => /console/i.test(button.textContent || ''))
    if (!collapse || !consoleButton) return

    // Do not rely on CSS order here. Physically keep the chevron immediately
    // after Console so later stylesheet overrides cannot move it beside Testbench.
    if (consoleButton.nextElementSibling !== collapse) consoleButton.after(collapse)
  })
}

function refineWaveformWindows() {
  qa(document, '.waveform-window').forEach(ensureWaveformEndMarker)
  keepConsoleCollapseBesideConsole()
}

function scheduleRefine() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    refineWaveformWindows()
  })
}

new MutationObserver(scheduleRefine).observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('resize', scheduleRefine)
scheduleRefine()
