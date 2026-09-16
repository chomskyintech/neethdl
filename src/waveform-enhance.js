const failureTimesByPath = new Map()
const pendingJumpByPath = new Map()
let enhancementScheduled = false

function parseTime(text) {
  const match = String(text || '').match(/t\s*=\s*(-?\d+(?:\.\d+)?)/i)
  return match ? Number(match[1]) : null
}

function captureFailureTimes() {
  const failures = [...document.querySelectorAll('.test-case.fail .test-case-time')]
    .map(node => parseTime(node.textContent))
    .filter(Number.isFinite)
  if (failures.length) failureTimesByPath.set(window.location.pathname, [...new Set(failures)])
}

function numericValue(raw) {
  const value = String(raw || '').trim()
  if (!value || /[xz?]/i.test(value)) return null
  try {
    if (/^0x[0-9a-f]+$/i.test(value)) return BigInt(value)
    if (/^[01]+$/.test(value)) return BigInt(`0b${value}`)
    if (/^-?\d+$/.test(value)) return BigInt(value)
  } catch {}
  return null
}

function formatValue(raw, width, radix) {
  const clean = String(raw || '?').trim()
  if (width <= 1 || /[xz?]/i.test(clean)) return clean.toUpperCase()
  const value = numericValue(clean)
  if (value === null) return clean.toUpperCase()
  if (radix === 'bin') return value.toString(2).padStart(width, '0')
  if (radix === 'unsigned') return value.toString(10)
  if (radix === 'signed') {
    const bits = BigInt(Math.max(1, width))
    const full = 1n << bits
    const sign = 1n << (bits - 1n)
    const signed = (value & sign) ? value - full : value
    return signed.toString(10)
  }
  return `0x${value.toString(16).toUpperCase().padStart(Math.max(1, Math.ceil(width / 4)), '0')}`
}

function widthFromLabel(label) {
  const match = String(label || '').match(/\[(\d+)\s*:\s*(\d+)\]/)
  if (!match) return 1
  return Math.abs(Number(match[1]) - Number(match[2])) + 1
}

function axisInfo(svg) {
  const axis = svg.querySelector('.wave-axis-line')
  const labels = [...svg.querySelectorAll('.wave-time')]
  const end = labels.reduce((max, node) => Math.max(max, Number(node.textContent) || 0), 0)
  const left = Number(axis?.getAttribute('x1')) || 120
  const right = Number(axis?.getAttribute('x2')) || Number(svg.getAttribute('width')) || svg.clientWidth
  return { left, right, end: Math.max(end, 1) }
}

function xAtTime(svg, time) {
  const { left, right, end } = axisInfo(svg)
  return left + (Math.max(0, Math.min(end, time)) / end) * Math.max(1, right - left)
}

function timeAtX(svg, x) {
  const { left, right, end } = axisInfo(svg)
  const ratio = (Math.max(left, Math.min(right, x)) - left) / Math.max(1, right - left)
  return ratio * end
}

function contentLeftForSvgX(scroll, svg, svgX) {
  const scrollRect = scroll.getBoundingClientRect()
  const svgRect = svg.getBoundingClientRect()
  return scroll.scrollLeft + (svgRect.left - scrollRect.left) + svgX
}

function signalRows(svg) {
  return [...svg.querySelectorAll('.wave-name')].map((nameNode, index) => {
    const group = nameNode.closest('g')
    const widthNode = group?.querySelector('.wave-width')
    return {
      index,
      group,
      name: nameNode.textContent?.trim() || `signal_${index}`,
      width: widthFromLabel(widthNode?.textContent),
      widthLabel: widthNode?.textContent?.trim() || '1-bit'
    }
  }).filter(item => item.group)
}

function rawValueAt(row, svgX) {
  if (row.width <= 1) {
    const rowLine = row.group.querySelector('.wave-row')
    const rowBottom = Number(rowLine?.getAttribute('y1')) || 42 * (row.index + 1)
    const threshold = rowBottom - 22
    const transitions = [...row.group.querySelectorAll('.wave-transition')]
      .map(node => ({ x: Number(node.getAttribute('cx')), y: Number(node.getAttribute('cy')) }))
      .filter(point => Number.isFinite(point.x) && point.x <= svgX)
      .sort((a, b) => a.x - b.x)
    if (!transitions.length) return '?'
    return transitions.at(-1).y < threshold ? '1' : '0'
  }

  const buses = [...row.group.querySelectorAll('.wave-bus')]
  const labels = [...row.group.querySelectorAll('.wave-bus-text')]
  let selected = -1
  buses.forEach((rect, index) => {
    const x = Number(rect.getAttribute('x'))
    const width = Number(rect.getAttribute('width'))
    if (svgX >= x && svgX <= x + width) selected = index
  })
  const label = labels[selected] || labels.at(-1)
  if (!label) return '?'
  if (!label.dataset.rawValue) label.dataset.rawValue = label.textContent?.trim() || '?'
  return label.dataset.rawValue
}

function applyRadixToBusLabels(state) {
  const { svg, radix } = state
  for (const row of signalRows(svg)) {
    if (row.width <= 1) continue
    for (const label of row.group.querySelectorAll('.wave-bus-text')) {
      if (!label.dataset.rawValue) label.dataset.rawValue = label.textContent?.trim() || '?'
      label.textContent = formatValue(label.dataset.rawValue, row.width, radix)
    }
  }
}

function updatePanel(state) {
  const { svg, panel, cursorA, radix } = state
  if (!svg?.isConnected || !panel?.isConnected) return
  const svgX = xAtTime(svg, Number.isFinite(cursorA) ? cursorA : 0)
  const rows = signalRows(svg)
  panel.querySelectorAll('.wave-live-row').forEach((node, index) => {
    const row = rows[index]
    if (!row) return
    const value = formatValue(rawValueAt(row, svgX), row.width, radix)
    const valueNode = node.querySelector('.wave-live-value')
    if (valueNode) valueNode.textContent = value
  })
}

function updateReadout(state) {
  const a = state.toolbar?.querySelector('[data-wave-readout="a"]')
  const b = state.toolbar?.querySelector('[data-wave-readout="b"]')
  const delta = state.toolbar?.querySelector('[data-wave-readout="delta"]')
  if (a) a.textContent = `A ${Number.isFinite(state.cursorA) ? `${state.cursorA.toFixed(1)} ns` : '—'}`
  if (b) b.textContent = `B ${Number.isFinite(state.cursorB) ? `${state.cursorB.toFixed(1)} ns` : '—'}`
  if (delta) delta.textContent = `Δ ${Number.isFinite(state.cursorA) && Number.isFinite(state.cursorB) ? `${Math.abs(state.cursorB - state.cursorA).toFixed(1)} ns` : '—'}`
}

function ensureCursorLine(state, key) {
  const className = key === 'a' ? 'wave-cursor-line-a' : 'wave-cursor-line-b'
  let line = state.scroll.querySelector(`.${className}`)
  if (!line) {
    line = document.createElement('div')
    line.className = `wave-cursor-line ${className}`
    const badge = document.createElement('span')
    badge.textContent = key.toUpperCase()
    line.appendChild(badge)
    state.scroll.appendChild(line)
  }
  return line
}

function updateCursorLines(state) {
  const svg = state.scroll.querySelector('svg.wave-svg')
  if (!svg) return
  state.svg = svg
  const svgHeight = Number(svg.getAttribute('height')) || svg.getBoundingClientRect().height
  for (const [key, time] of [['a', state.cursorA], ['b', state.cursorB]]) {
    const line = ensureCursorLine(state, key)
    if (!Number.isFinite(time)) {
      line.hidden = true
      continue
    }
    line.hidden = false
    line.style.left = `${contentLeftForSvgX(state.scroll, svg, xAtTime(svg, time))}px`
    line.style.height = `${svgHeight}px`
  }
  updateReadout(state)
  updatePanel(state)
}

function renderFailureMarkers(state) {
  state.scroll.querySelectorAll('.wave-failure-marker').forEach(node => node.remove())
  const failures = failureTimesByPath.get(window.location.pathname) || []
  const svg = state.scroll.querySelector('svg.wave-svg')
  if (!svg || !failures.length) return
  const svgHeight = Number(svg.getAttribute('height')) || svg.getBoundingClientRect().height
  for (const time of failures) {
    const marker = document.createElement('button')
    marker.type = 'button'
    marker.className = 'wave-failure-marker'
    marker.title = `Failed test at t=${time}`
    marker.setAttribute('aria-label', `Jump to failed test at ${time} ns`)
    marker.style.left = `${contentLeftForSvgX(state.scroll, svg, xAtTime(svg, time))}px`
    marker.style.height = `${svgHeight}px`
    marker.innerHTML = '<span>!</span>'
    marker.addEventListener('click', event => {
      event.stopPropagation()
      state.cursorA = time
      updateCursorLines(state)
    })
    state.scroll.appendChild(marker)
  }
}

function buildSignalPanel(state) {
  const svg = state.scroll.querySelector('svg.wave-svg')
  if (!svg) return
  state.svg = svg
  let panel = state.scroll.querySelector('.wave-live-panel')
  if (!panel) {
    panel = document.createElement('div')
    panel.className = 'wave-live-panel'
    panel.innerHTML = '<div class="wave-live-header"><span>Signal</span><span>Value</span></div><div class="wave-live-list"></div>'
    state.scroll.appendChild(panel)
  }
  state.panel = panel
  const list = panel.querySelector('.wave-live-list')
  const rows = signalRows(svg)
  const existingNames = [...list.querySelectorAll('.wave-live-name')].map(node => node.textContent)
  if (existingNames.join('\u0000') !== rows.map(row => row.name).join('\u0000')) {
    list.replaceChildren(...rows.map(row => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'wave-live-row'
      item.dataset.signal = row.name.toLowerCase()
      item.innerHTML = `<span class="wave-live-signal"><strong class="wave-live-name"></strong><small></small></span><code class="wave-live-value">?</code>`
      item.querySelector('.wave-live-name').textContent = row.name
      item.querySelector('small').textContent = row.widthLabel
      item.addEventListener('click', event => {
        event.stopPropagation()
        list.querySelectorAll('.wave-live-row.selected').forEach(node => node.classList.remove('selected'))
        item.classList.add('selected')
      })
      return item
    }))
  }
  panel.style.height = `${Number(svg.getAttribute('height')) || svg.getBoundingClientRect().height}px`
  panel.style.transform = `translateX(${state.scroll.scrollLeft}px)`
  updatePanel(state)
}

function filterSignals(state, query) {
  const normalized = query.trim().toLowerCase()
  const rows = signalRows(state.svg)
  state.panel?.querySelectorAll('.wave-live-row').forEach((node, index) => {
    const match = !normalized || node.dataset.signal.includes(normalized)
    node.classList.toggle('dimmed', !match)
    if (rows[index]?.group) rows[index].group.style.opacity = match ? '' : '.18'
  })
}

function zoomTowardPointer(state, direction, clientX) {
  const svg = state.scroll.querySelector('svg.wave-svg')
  const button = state.waveform.querySelector(`.wave-tools button[title="Zoom ${direction > 0 ? 'in' : 'out'}"]`)
  if (!svg || !button) return
  const rect = svg.getBoundingClientRect()
  const localX = Math.max(0, Math.min(rect.width, clientX - rect.left))
  const time = timeAtX(svg, localX)
  button.click()
  requestAnimationFrame(() => {
    const nextSvg = state.scroll.querySelector('svg.wave-svg')
    if (!nextSvg) return
    state.svg = nextSvg
    const scrollRect = state.scroll.getBoundingClientRect()
    const target = contentLeftForSvgX(state.scroll, nextSvg, xAtTime(nextSvg, time))
    state.scroll.scrollLeft = Math.max(0, target - (clientX - scrollRect.left))
    ensureWaveform(state.waveform)
  })
}

function fitWaveform(state) {
  let attempts = 0
  const step = () => {
    const svg = state.scroll.querySelector('svg.wave-svg')
    const tools = state.waveform.querySelector('.wave-tools')
    if (!svg || !tools || attempts++ > 18) return
    const width = svg.getBoundingClientRect().width
    const target = Math.max(320, state.scroll.clientWidth - 28)
    const zoomIn = tools.querySelector('button[title="Zoom in"]')
    const zoomOut = tools.querySelector('button[title="Zoom out"]')
    if (width > target * 1.08 && zoomOut) {
      zoomOut.click(); requestAnimationFrame(step); return
    }
    if (width < target * .72 && zoomIn) {
      zoomIn.click(); requestAnimationFrame(step); return
    }
    state.scroll.scrollLeft = 0
    ensureWaveform(state.waveform)
  }
  step()
}

function buildToolbar(state) {
  const head = state.waveform.querySelector('.wave-head')
  if (!head) return
  let toolbar = head.querySelector('.wave-enhance-toolbar')
  if (!toolbar) {
    toolbar = document.createElement('div')
    toolbar.className = 'wave-enhance-toolbar'
    toolbar.innerHTML = `
      <label class="wave-search"><span>Find</span><input type="search" aria-label="Find waveform signal" placeholder="signal" /></label>
      <label class="wave-radix"><span>Radix</span><select aria-label="Waveform radix"><option value="hex">Hex</option><option value="bin">Binary</option><option value="unsigned">Unsigned</option><option value="signed">Signed</option></select></label>
      <button type="button" class="wave-fit" title="Fit waveform to view">Fit</button>
      <div class="wave-readouts"><span data-wave-readout="a">A —</span><span data-wave-readout="b">B —</span><span data-wave-readout="delta">Δ —</span></div>`
    head.insertBefore(toolbar, head.querySelector('.wave-tools'))

    toolbar.querySelector('.wave-search input').addEventListener('input', event => filterSignals(state, event.target.value))
    toolbar.querySelector('.wave-radix select').addEventListener('change', event => {
      state.radix = event.target.value
      applyRadixToBusLabels(state)
      updatePanel(state)
    })
    toolbar.querySelector('.wave-fit').addEventListener('click', () => fitWaveform(state))
  }
  state.toolbar = toolbar
  toolbar.querySelector('.wave-radix select').value = state.radix
  updateReadout(state)
}

function attachScrollInteractions(state) {
  if (state.scroll.dataset.waveEnhanced === 'true') return
  state.scroll.dataset.waveEnhanced = 'true'

  state.scroll.addEventListener('scroll', () => {
    if (state.panel?.isConnected) state.panel.style.transform = `translateX(${state.scroll.scrollLeft}px)`
  }, { passive: true })

  state.scroll.addEventListener('click', event => {
    if (event.target.closest('.wave-live-panel,.wave-failure-marker')) return
    const svg = state.scroll.querySelector('svg.wave-svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return
    const time = timeAtX(svg, event.clientX - rect.left)
    if (event.shiftKey) state.cursorB = time
    else state.cursorA = time
    updateCursorLines(state)
  })

  state.scroll.addEventListener('wheel', event => {
    if (!(event.ctrlKey || event.metaKey || event.altKey)) return
    event.preventDefault()
    zoomTowardPointer(state, event.deltaY < 0 ? 1 : -1, event.clientX)
  }, { passive: false })
}

function ensureWaveform(waveform) {
  if (!waveform?.isConnected) return
  const svg = waveform.querySelector('svg.wave-svg')
  const scroll = waveform.querySelector('.wave-scroll')
  if (!svg || !scroll) return

  let state = waveform.__hdlforgeWaveformState
  if (!state) {
    state = { waveform, scroll, svg, panel: null, toolbar: null, cursorA: 0, cursorB: null, radix: 'hex' }
    waveform.__hdlforgeWaveformState = state
  }
  state.scroll = scroll
  state.svg = svg
  waveform.classList.add('waveform-enhanced')

  buildToolbar(state)
  buildSignalPanel(state)
  attachScrollInteractions(state)
  applyRadixToBusLabels(state)

  const pending = pendingJumpByPath.get(window.location.pathname)
  if (Number.isFinite(pending)) {
    state.cursorA = pending
    pendingJumpByPath.delete(window.location.pathname)
  }
  updateCursorLines(state)
  renderFailureMarkers(state)
}

function enhanceAll() {
  enhancementScheduled = false
  captureFailureTimes()
  document.querySelectorAll('.waveform').forEach(ensureWaveform)
}

function scheduleEnhancement() {
  if (enhancementScheduled) return
  enhancementScheduled = true
  requestAnimationFrame(enhanceAll)
}

document.addEventListener('click', event => {
  const failedTest = event.target.closest?.('.test-case.fail')
  if (!failedTest) return
  const time = parseTime(failedTest.querySelector('.test-case-time')?.textContent)
  if (!Number.isFinite(time)) return
  failureTimesByPath.set(window.location.pathname, [...new Set([...(failureTimesByPath.get(window.location.pathname) || []), time])])
  pendingJumpByPath.set(window.location.pathname, time)
  const waveformButton = [...document.querySelectorAll('.bottom-tabs>button')].find(button => /waveform/i.test(button.textContent || ''))
  waveformButton?.click()
  scheduleEnhancement()
})

new MutationObserver(() => scheduleEnhancement()).observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('resize', scheduleEnhancement)
scheduleEnhancement()
