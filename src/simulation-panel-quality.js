const q = (root, selector) => root?.querySelector(selector)
const qa = (root, selector) => [...(root?.querySelectorAll(selector) || [])]

let scheduled = false
const observedScrolls = new WeakSet()

function traceRight(svg) {
  let right = 0
  qa(svg, '.wave-digital').forEach(path => {
    const matches = [...String(path.getAttribute('d') || '').matchAll(/L\s+([0-9.]+)\s+[-0-9.]+/g)]
    const last = matches.at(-1)
    if (last) right = Math.max(right, Number(last[1]) || 0)
  })
  qa(svg, '.wave-bus').forEach(rect => {
    right = Math.max(right, (Number(rect.getAttribute('x')) || 0) + (Number(rect.getAttribute('width')) || 0))
  })
  return right || Number(q(svg, '.wave-axis-line')?.getAttribute('x2')) || Number(svg.getAttribute('width')) || 760
}

function rowSignature(group) {
  const name = q(group, '.wave-name')?.textContent?.trim() || ''
  const width = q(group, '.wave-width')?.textContent?.trim() || ''
  const digital = q(group, '.wave-digital')?.getAttribute('d') || ''
  const buses = qa(group, '.wave-bus').map(rect => `${rect.getAttribute('x')}:${rect.getAttribute('width')}`).join('|')
  return `${name}\u0000${width}\u0000${digital || buses}`
}

function compactDuplicateSignals(waveform) {
  const svg = q(waveform, 'svg.wave-svg')
  const panelRows = qa(waveform, '.sim-v2-signal-row')
  const groups = qa(svg, '.wave-name').map(node => node.closest('g')).filter(Boolean)
  if (!svg || !groups.length || panelRows.length < groups.length) return false

  const rowBottoms = groups
    .map(group => Number(q(group, '.wave-row')?.getAttribute('y1')))
    .filter(Number.isFinite)
  const differences = rowBottoms.slice(1).map((value, index) => value - rowBottoms[index]).filter(value => value > 0)
  const rowHeight = Math.min(...(differences.length ? differences : [42]))
  const axisTop = Number.isFinite(rowBottoms[0]) ? rowBottoms[0] - rowHeight + 1 : 30

  const seen = new Set()
  let kept = 0

  groups.forEach((group, index) => {
    const signature = rowSignature(group)
    const duplicate = seen.has(signature)
    if (!duplicate) seen.add(signature)

    group.dataset.simQualityDuplicate = duplicate ? 'true' : 'false'
    group.dataset.simQualityKept = duplicate ? 'false' : 'true'
    group.style.display = duplicate ? 'none' : ''

    const panelRow = panelRows[index]
    if (panelRow) {
      panelRow.dataset.simQualityDuplicate = duplicate ? 'true' : 'false'
      panelRow.dataset.simQualityKept = duplicate ? 'false' : 'true'
      panelRow.style.display = duplicate ? 'none' : ''
    }

    if (duplicate) return

    const rowBottom = Number(q(group, '.wave-row')?.getAttribute('y1'))
    const originalTop = Number.isFinite(rowBottom) ? rowBottom - rowHeight + 1 : axisTop + index * rowHeight
    const desiredTop = axisTop + kept * rowHeight
    group.setAttribute('transform', `translate(0 ${desiredTop - originalTop})`)
    kept += 1
  })

  const compactHeight = Math.max(axisTop + kept * rowHeight, axisTop + rowHeight)
  const viewBox = String(svg.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number)
  const viewWidth = Number(svg.dataset.simV2ViewWidth) || viewBox[2] || Number(svg.getAttribute('width')) || 760
  svg.dataset.simQualityViewHeight = String(compactHeight)
  if (svg.getAttribute('height') !== String(compactHeight)) svg.setAttribute('height', String(compactHeight))
  svg.setAttribute('viewBox', `0 0 ${viewWidth} ${compactHeight}`)
  svg.style.height = `${compactHeight}px`
  return true
}

function cropUnusedPlotTail(waveform) {
  const svg = q(waveform, 'svg.wave-svg')
  if (!svg) return false
  const right = traceRight(svg)
  if (!Number.isFinite(right) || right <= 0) return false

  if (!svg.dataset.simQualityOriginalViewWidth) {
    svg.dataset.simQualityOriginalViewWidth = svg.dataset.simV2ViewWidth || svg.getAttribute('width') || String(right)
  }

  const viewBox = String(svg.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number)
  const height = Number(svg.dataset.simQualityViewHeight) || viewBox[3] || Number(svg.getAttribute('height')) || 200
  svg.dataset.simV2ViewWidth = String(right)
  svg.setAttribute('viewBox', `0 0 ${right} ${height}`)
  return true
}

function fitIfAtHundredPercent(waveform) {
  const label = q(waveform, '.sim-v2-zoom-label')
  const fit = q(waveform, '.sim-v2-fit')
  if (!fit || label?.textContent?.trim() !== '100%') return
  requestAnimationFrame(() => fit.click())
}

function observeViewport(waveform) {
  const scroll = q(waveform, '.wave-scroll')
  if (!scroll || observedScrolls.has(scroll) || typeof ResizeObserver === 'undefined') return
  observedScrolls.add(scroll)
  let lastWidth = Math.round(scroll.clientWidth)
  const observer = new ResizeObserver(() => {
    const width = Math.round(scroll.clientWidth)
    if (Math.abs(width - lastWidth) < 2) return
    lastWidth = width
    fitIfAtHundredPercent(waveform)
  })
  observer.observe(scroll)
}

function applyWaveformQuality(waveform) {
  const svg = q(waveform, 'svg.wave-svg')
  const signalPanel = q(waveform, '.sim-v2-signal-panel')
  const fit = q(waveform, '.sim-v2-fit')
  if (!svg || !signalPanel || !fit) return

  compactDuplicateSignals(waveform)
  cropUnusedPlotTail(waveform)
  observeViewport(waveform)

  if (waveform.dataset.simQualityInitialFit !== 'true') {
    waveform.dataset.simQualityInitialFit = 'true'
    requestAnimationFrame(() => fit.click())
  }
}

function applyAll() {
  scheduled = false
  qa(document, '.waveform-v2').forEach(applyWaveformQuality)
}

function schedule() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => requestAnimationFrame(applyAll))
}

// Make the v2 Fit handler calculate against the real trace end instead of the
// unused SVG tail. Capture phase runs before simulation-panel-v2's click handler.
document.addEventListener('click', event => {
  const fit = event.target.closest?.('.sim-v2-fit')
  if (fit) {
    const waveform = fit.closest('.waveform-v2')
    if (waveform) {
      compactDuplicateSignals(waveform)
      cropUnusedPlotTail(waveform)
    }
  }

  if (event.target.closest?.('.sim-v2-signal-resizer,.sim-v2-name-value-resizer')) {
    requestAnimationFrame(schedule)
  }
}, true)

document.addEventListener('pointerup', event => {
  const resizer = event.target.closest?.('.sim-v2-signal-resizer')
  if (!resizer) return
  const waveform = resizer.closest('.waveform-v2')
  if (waveform) fitIfAtHundredPercent(waveform)
}, true)

new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('resize', schedule)
schedule()
