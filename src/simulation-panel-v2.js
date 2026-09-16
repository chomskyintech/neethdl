const V2 = {
  scheduled: false,
  waveformState: new WeakMap(),
}

const q = (root, selector) => root?.querySelector(selector)
const qa = (root, selector) => [...(root?.querySelectorAll(selector) || [])]

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function activeBottomTab(panel) {
  return qa(panel, '.bottom-tabs > button.active').find(button => !button.classList.contains('bottom-collapse'))
}

function setEditorHidden(workspace, hidden) {
  const editor = q(workspace, '.editor-wrap') || q(workspace, '.editor-shell')
  if (!editor) return
  if (hidden) {
    editor.dataset.simV2Hidden = 'true'
    editor.style.setProperty('display', 'none', 'important')
  } else if (editor.dataset.simV2Hidden === 'true') {
    editor.style.removeProperty('display')
    delete editor.dataset.simV2Hidden
  }
}

function maximizeWaveformPanel(panel) {
  const workspace = panel?.closest('.ide-workspace')
  const fileTabs = q(workspace, '.file-tabs')
  if (!panel || !workspace || !fileTabs || panel.classList.contains('collapsed')) return

  setEditorHidden(workspace, true)
  const available = Math.max(180, workspace.getBoundingClientRect().height - fileTabs.getBoundingClientRect().height - 2)

  if (panel.dataset.waveformMaximized !== 'true') {
    panel.dataset.waveformPreviousHeight = String(Number.parseFloat(panel.dataset.expandedHeight) || panel.getBoundingClientRect().height)
  }

  panel.dataset.waveformMaximized = 'true'
  panel.dataset.expandedHeight = String(available)
  panel.style.setProperty('height', `${available}px`, 'important')
  panel.style.setProperty('flex-basis', `${available}px`, 'important')
  panel.style.setProperty('max-height', `${available}px`, 'important')
}

function restoreWaveformPanel(panel) {
  if (!panel || panel.dataset.waveformMaximized !== 'true') return
  const workspace = panel.closest('.ide-workspace')
  const height = workspace?.getBoundingClientRect().height || window.innerHeight
  const stored = Number.parseFloat(panel.dataset.waveformPreviousHeight)
  const restored = Number.isFinite(stored) ? Math.min(height * 0.7, Math.max(120, stored)) : 230

  panel.dataset.waveformMaximized = 'false'
  panel.dataset.expandedHeight = String(restored)
  panel.style.setProperty('height', `${restored}px`, 'important')
  panel.style.setProperty('flex-basis', `${restored}px`, 'important')
  panel.style.setProperty('max-height', `${restored}px`, 'important')
  setEditorHidden(workspace, false)
}

function parseTestCase(node, index) {
  const passed = node.classList.contains('pass')
  const name = q(node, '.test-case-name')?.textContent?.replace(/^Test\s+\d+\s*:\s*/i, '').trim() || `Case ${index + 1}`
  const timeText = q(node, '.test-case-time')?.textContent || ''
  const timeMatch = timeText.match(/t\s*=\s*(-?\d+(?:\.\d+)?)/i)
  return { passed, name, time: timeMatch ? Number(timeMatch[1]) : null }
}

function compilerLocation(output) {
  const patterns = [
    /(?:^|\n)([^\n:]+\.(?:sv|v|vhd|vhdl)):(\d+)(?::(\d+))?/i,
    /(?:^|\n)(\/src\.v):(\d+)(?::(\d+))?/i,
    /(?:^|\n)([^\n:]+):(\d+):\s*(?:syntax|error)/i,
  ]
  for (const pattern of patterns) {
    const match = output.match(pattern)
    if (match) return { file: match[1], line: Number(match[2]), column: Number(match[3]) || null }
  }
  return null
}

function editorSourceLines() {
  const viewLines = qa(document, '.monaco-editor .view-line')
  if (viewLines.length) return viewLines.map(node => node.textContent?.replace(/\u00a0/g, ' ') || '')
  const textarea = q(document, '.ide-editor')
  return textarea ? textarea.value.split(/\r?\n/) : []
}

function compileSnippet(output) {
  const location = compilerLocation(output)
  const fileName = q(document, '.file-tab.active span')?.textContent?.trim() || 'solution.sv'
  const lines = editorSourceLines()
  const lineNo = location?.line

  if (!Number.isFinite(lineNo) || lineNo < 1 || lineNo > lines.length) {
    return { fileName, lineNo: lineNo || null, html: '' }
  }

  const start = Math.max(1, lineNo - 2)
  const end = Math.min(lines.length, lineNo + 2)
  let html = '<div class="sim-v2-code-frame">'
  for (let n = start; n <= end; n += 1) {
    html += `<div class="sim-v2-code-line${n === lineNo ? ' error-line' : ''}"><span class="ln">${n}</span><code>${escapeHtml(lines[n - 1])}${n === lineNo ? '<span class="error-caret"> ←</span>' : ''}</code></div>`
  }
  html += '</div>'
  return { fileName, lineNo, html }
}

function isCompilationError(output, tests) {
  if (tests.length) return false
  return /syntax\s+error|parse\s+error|compil(?:e|ation)|unexpected\s+token|malformed|unknown\s+module|error\s*:/i.test(output)
}

function enhanceConsoleResult(result) {
  if (!result || (result.dataset.simV2 === 'true' && q(result, '.sim-v2-result-head'))) return

  const tests = qa(result, '.test-case').map(parseTestCase)
  const output = q(result, 'pre')?.textContent?.trim() || ''
  const passed = result.classList.contains('pass')
  const compileError = !passed && isCompilationError(output, tests)

  result.dataset.simV2 = 'true'
  result.classList.add('sim-v2-result')

  if (compileError) {
    const snippet = compileSnippet(output)
    const firstMessage = output.split(/\r?\n/).find(line => /error|syntax|unexpected|expected/i.test(line)) || output || 'Compilation failed.'
    result.innerHTML = `
      <div class="sim-v2-result-head">
        <strong class="sim-v2-status fail">Compilation Error</strong>
        <span>Simulation did not run</span>
      </div>
      <div class="sim-v2-compile">
        <button type="button" class="sim-v2-location" data-line="${snippet.lineNo || ''}">${escapeHtml(snippet.fileName)}${snippet.lineNo ? `:${snippet.lineNo}` : ''}</button>
        ${snippet.html}
        <pre class="sim-v2-compiler-output">${escapeHtml(output || firstMessage)}</pre>
      </div>`

    q(result, '.sim-v2-location')?.addEventListener('click', () => {
      const line = Number(q(result, '.sim-v2-location')?.dataset.line)
      const editor = q(document, '.monaco-editor')
      if (editor && Number.isFinite(line)) {
        editor.scrollIntoView({ block: 'center' })
        editor.dispatchEvent(new CustomEvent('hdlforge-jump-line', { bubbles: true, detail: { line } }))
      }
    })
    return
  }

  const passCount = tests.filter(test => test.passed).length
  const maxTime = tests.reduce((max, test) => Number.isFinite(test.time) ? Math.max(max, test.time) : max, 0)
  const bottomPanel = result.closest('.ide-bottom')
  if (bottomPanel && maxTime > 0) bottomPanel.dataset.simV2End = String(maxTime)
  const status = passed ? 'Accepted' : 'Wrong Answer'
  const totalLabel = tests.length ? `${passCount} / ${tests.length} testcases passed` : (passed ? 'Simulation passed' : 'Simulation failed')
  const timeLabel = maxTime ? ` · Simulation time ${maxTime.toFixed(3)} ns` : ''

  result.innerHTML = `
    <div class="sim-v2-result-head">
      <strong class="sim-v2-status ${passed ? 'pass' : 'fail'}">${status}</strong>
      <span>${escapeHtml(totalLabel + timeLabel)}</span>
    </div>
    ${tests.length ? `<div class="sim-v2-case-strip">${tests.map((test, index) => `<button type="button" class="test-case sim-v2-case ${test.passed ? 'pass' : 'fail'}${index === 0 ? ' active' : ''}" data-index="${index}"><span>${test.passed ? '✓' : '×'}</span> Case ${index + 1}</button>`).join('')}</div>` : ''}
    ${tests.length ? '<div class="sim-v2-case-detail"></div>' : ''}
    <div class="sim-v2-output-label">Simulator output</div>
    <pre class="sim-v2-raw-output">${escapeHtml(output)}</pre>`

  const detail = q(result, '.sim-v2-case-detail')
  const renderCase = index => {
    if (!detail || !tests[index]) return
    const test = tests[index]
    detail.innerHTML = `
      <div class="sim-v2-detail-card">
        <span class="sim-v2-detail-label">Test</span>
        <code>${escapeHtml(test.name)}</code>
      </div>
      <div class="sim-v2-detail-card">
        <span class="sim-v2-detail-label">Result</span>
        <code class="${test.passed ? 'pass-text' : 'fail-text'}">${test.passed ? 'Passed' : 'Failed'}</code>
      </div>
      <div class="sim-v2-detail-card">
        <span class="sim-v2-detail-label">Simulation time</span>
        <code>${Number.isFinite(test.time) ? `${test.time.toFixed(3)} ns` : '—'}</code>
      </div>`
  }

  qa(result, '.sim-v2-case').forEach(button => {
    button.addEventListener('click', () => {
      qa(result, '.sim-v2-case').forEach(node => node.classList.toggle('active', node === button))
      renderCase(Number(button.dataset.index))
    })
  })
  renderCase(0)
}

function enhanceConsole() {
  qa(document, '.ide-bottom .run-result').forEach(enhanceConsoleResult)
}

function axisInfo(svg) {
  const axis = q(svg, '.wave-axis-line')
  const labels = qa(svg, '.wave-time')
  const labelEnd = labels.reduce((max, node) => Math.max(max, Number(node.textContent) || 0), 0)
  const panelEnd = Number(svg.closest('.ide-bottom')?.dataset.simV2End) || 0
  const end = Math.max(labelEnd, panelEnd, 1)
  const left = Number(axis?.getAttribute('x1')) || 120

  let traceRight = 0
  qa(svg, '.wave-digital').forEach(path => {
    const matches = [...String(path.getAttribute('d') || '').matchAll(/L\s+([0-9.]+)\s+[-0-9.]+/g)]
    const last = matches.at(-1)
    if (last) traceRight = Math.max(traceRight, Number(last[1]) || 0)
  })
  qa(svg, '.wave-bus').forEach(rect => {
    traceRight = Math.max(traceRight, (Number(rect.getAttribute('x')) || 0) + (Number(rect.getAttribute('width')) || 0))
  })

  const right = traceRight || Number(axis?.getAttribute('x2')) || Number(svg.getAttribute('width')) || 760
  return { left, right, end }
}

function waveformRows(svg) {
  return qa(svg, '.wave-name').map((name, index) => {
    const group = name.closest('g')
    const widthNode = q(group, '.wave-width')
    const widthText = widthNode?.textContent?.trim() || '1-bit'
    const range = widthText.match(/\[(\d+)\s*:\s*(\d+)\]/)
    return {
      index,
      group,
      name: name.textContent?.trim() || `signal_${index}`,
      width: range ? Math.abs(Number(range[1]) - Number(range[2])) + 1 : 1,
      widthText,
    }
  }).filter(row => row.group)
}

function rawValueAt(row, svgX) {
  if (row.width <= 1) {
    const rowLine = q(row.group, '.wave-row')
    const rowBottom = Number(rowLine?.getAttribute('y1')) || 42 * (row.index + 1)
    const threshold = rowBottom - 22
    const transitions = qa(row.group, '.wave-transition')
      .map(node => ({ x: Number(node.getAttribute('cx')), y: Number(node.getAttribute('cy')) }))
      .filter(point => Number.isFinite(point.x) && point.x <= svgX)
      .sort((a, b) => a.x - b.x)
    if (!transitions.length) return '?'
    return transitions.at(-1).y < threshold ? '1' : '0'
  }

  const buses = qa(row.group, '.wave-bus')
  const labels = qa(row.group, '.wave-bus-text')
  let selected = -1
  buses.forEach((rect, index) => {
    const x = Number(rect.getAttribute('x'))
    const width = Number(rect.getAttribute('width'))
    if (svgX >= x && svgX <= x + width) selected = index
  })
  return labels[selected]?.textContent?.trim() || labels.at(-1)?.textContent?.trim() || '?'
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
    return ((value & sign) ? value - full : value).toString(10)
  }
  return `0x${value.toString(16).toUpperCase().padStart(Math.max(1, Math.ceil(width / 4)), '0')}`
}

function addHighFills(svg) {
  waveformRows(svg).forEach(row => {
    if (row.width !== 1 || q(row.group, '.sim-v2-high-fill')) return
    const rowLine = q(row.group, '.wave-row')
    const lowY = Number(rowLine?.getAttribute('y1')) - 14
    const transitions = qa(row.group, '.wave-transition')
      .map(node => ({ x: Number(node.getAttribute('cx')), y: Number(node.getAttribute('cy')) }))
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
      .sort((a, b) => a.x - b.x)
    const { right } = axisInfo(svg)

    transitions.forEach((point, index) => {
      const nextX = transitions[index + 1]?.x ?? right
      if (point.y >= lowY || nextX <= point.x) return
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('class', 'sim-v2-high-fill')
      rect.setAttribute('x', String(point.x))
      rect.setAttribute('y', String(point.y))
      rect.setAttribute('width', String(nextX - point.x))
      rect.setAttribute('height', String(Math.max(1, lowY - point.y)))
      row.group.insertBefore(rect, row.group.firstChild)
    })
  })
}

function svgScale(state) {
  const rect = state.svg.getBoundingClientRect()
  const viewWidth = Number(state.svg.dataset.simV2ViewWidth) || Number(state.svg.getAttribute('width')) || rect.width
  return rect.width / Math.max(1, viewWidth)
}

function plotMetrics(state) {
  const info = axisInfo(state.svg)
  const scale = svgScale(state)
  const panelWidth = Number.parseFloat(getComputedStyle(state.waveform).getPropertyValue('--sim-signal-width')) || 220
  const margin = panelWidth - info.left * scale
  return { ...info, scale, panelWidth, margin }
}

function positionSvg(state) {
  const { left, scale, panelWidth } = plotMetrics(state)
  state.svg.style.marginLeft = `${panelWidth - left * scale}px`
}

function fitWaveform(state) {
  if (!state.svg.isConnected) return
  const { left, right } = axisInfo(state.svg)
  const viewWidth = Number(state.svg.dataset.simV2ViewWidth)
  const viewport = Math.max(1, state.scroll.clientWidth)
  const panelWidth = Number.parseFloat(getComputedStyle(state.waveform).getPropertyValue('--sim-signal-width')) || 220
  const plotViewWidth = Math.max(1, right - left)
  const desiredPlotWidth = Math.max(160, viewport - panelWidth)
  const baseScale = desiredPlotWidth / plotViewWidth
  state.fitScale = baseScale
  state.zoom = 1
  state.svg.style.width = `${viewWidth * baseScale}px`
  positionSvg(state)
  state.scroll.scrollLeft = 0
  updateZoomLabel(state)
  buildRuler(state)
  updateCursorUi(state)
}

function setZoom(state, next) {
  state.zoom = Math.max(0.5, Math.min(4, next))
  const viewWidth = Number(state.svg.dataset.simV2ViewWidth)
  const scale = state.fitScale * state.zoom
  state.svg.style.width = `${viewWidth * scale}px`
  positionSvg(state)
  updateZoomLabel(state)
  buildRuler(state)
  updateCursorUi(state)
}

function updateZoomLabel(state) {
  if (state.zoomLabel) state.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`
}

function buildRuler(state) {
  if (!state.ruler) return
  const { end, left, right, scale, margin } = plotMetrics(state)
  const plotLeft = margin + left * scale
  const plotWidth = (right - left) * scale
  state.ruler.innerHTML = ''

  const rough = end <= 10 ? 1 : end <= 50 ? 5 : end <= 100 ? 10 : 20
  for (let t = 0; t <= end + 0.0001; t += rough) {
    const x = plotLeft + (t / end) * plotWidth
    const tick = document.createElement('span')
    tick.className = 'sim-v2-tick'
    if (t === 0) tick.classList.add('first')
    if (Math.abs(t - end) < 0.0001) tick.classList.add('last')
    tick.style.left = `${x}px`
    tick.textContent = `${Number.isInteger(t) ? t : t.toFixed(1)} ns`
    state.ruler.appendChild(tick)
  }

  if (!state.ruler.querySelector('.last') && end > 0) {
    const tick = document.createElement('span')
    tick.className = 'sim-v2-tick last'
    tick.style.left = `${plotLeft + plotWidth}px`
    tick.textContent = `${Number.isInteger(end) ? end : end.toFixed(1)} ns`
    state.ruler.appendChild(tick)
  }
}

function timeToContentX(state, time) {
  const { end, left, right, scale, margin } = plotMetrics(state)
  return margin + (left + (time / end) * (right - left)) * scale
}

function clientXToTime(state, clientX) {
  const { end, left, right, scale, margin } = plotMetrics(state)
  const scrollRect = state.scroll.getBoundingClientRect()
  const contentX = state.scroll.scrollLeft + clientX - scrollRect.left
  const svgX = (contentX - margin) / scale
  const ratio = (svgX - left) / Math.max(1, right - left)
  return Math.max(0, Math.min(end, ratio * end))
}

function updateSignalValues(state) {
  const rows = waveformRows(state.svg)
  const { end, left, right } = axisInfo(state.svg)
  const time = Number.isFinite(state.cursorA) ? state.cursorA : 0
  const svgX = left + (time / end) * (right - left)
  qa(state.signalList, '.sim-v2-signal-row').forEach((node, index) => {
    const row = rows[index]
    const valueNode = q(node, '.sim-v2-signal-value')
    if (row && valueNode) valueNode.textContent = formatValue(rawValueAt(row, svgX), row.width, state.radix)
  })
}

function updateCursorUi(state) {
  for (const [key, time] of [['a', state.cursorA], ['b', state.cursorB]]) {
    const line = key === 'a' ? state.cursorLineA : state.cursorLineB
    if (!line) continue
    if (!Number.isFinite(time)) {
      line.hidden = true
      continue
    }
    line.hidden = false
    line.style.left = `${timeToContentX(state, time)}px`
    q(line, 'span').textContent = `${key.toUpperCase()} · ${time.toFixed(1)} ns`
  }

  if (state.readA) state.readA.textContent = `A ${Number.isFinite(state.cursorA) ? `${state.cursorA.toFixed(1)} ns` : '—'}`
  if (state.readB) state.readB.textContent = `B ${Number.isFinite(state.cursorB) ? `${state.cursorB.toFixed(1)} ns` : '—'}`
  if (state.readDelta) state.readDelta.textContent = `Δ ${Number.isFinite(state.cursorA) && Number.isFinite(state.cursorB) ? `${Math.abs(state.cursorB - state.cursorA).toFixed(1)} ns` : '—'}`
  updateSignalValues(state)
}

function buildSignalPanel(state) {
  const rows = waveformRows(state.svg)
  const panel = document.createElement('div')
  panel.className = 'sim-v2-signal-panel'
  panel.innerHTML = `
    <div class="sim-v2-signal-head"><span>Name</span><span>Value</span></div>
    <div class="sim-v2-signal-list"></div>
    <div class="sim-v2-name-value-resizer" role="separator" aria-label="Resize Name and Value columns" tabindex="0"></div>
    <div class="sim-v2-signal-resizer" role="separator" aria-label="Resize signal list and waveform area" tabindex="0"></div>`
  state.scroll.appendChild(panel)
  state.signalPanel = panel
  state.signalList = q(panel, '.sim-v2-signal-list')

  rows.forEach(row => {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'sim-v2-signal-row'
    item.dataset.signal = row.name.toLowerCase()
    item.innerHTML = `<code class="sim-v2-signal-name">${escapeHtml(row.name)}</code><code class="sim-v2-signal-value">?</code>`
    item.addEventListener('click', () => {
      qa(state.signalList, '.sim-v2-signal-row').forEach(node => node.classList.toggle('selected', node === item))
    })
    state.signalList.appendChild(item)
  })

  const signalResizer = q(panel, '.sim-v2-signal-resizer')
  let resizingSignal = false
  signalResizer.addEventListener('pointerdown', event => {
    resizingSignal = true
    signalResizer.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  })
  signalResizer.addEventListener('pointermove', event => {
    if (!resizingSignal) return
    const rect = state.scroll.getBoundingClientRect()
    const next = Math.max(150, Math.min(Math.max(150, rect.width - 280), event.clientX - rect.left + state.scroll.scrollLeft))
    state.waveform.style.setProperty('--sim-signal-width', `${next}px`)
    fitWaveform(state)
  })
  const stopSignalResize = event => {
    resizingSignal = false
    try { signalResizer.releasePointerCapture?.(event.pointerId) } catch {}
  }
  signalResizer.addEventListener('pointerup', stopSignalResize)
  signalResizer.addEventListener('pointercancel', stopSignalResize)

  const valueResizer = q(panel, '.sim-v2-name-value-resizer')
  let resizingValue = false
  valueResizer.addEventListener('pointerdown', event => {
    resizingValue = true
    valueResizer.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  })
  valueResizer.addEventListener('pointermove', event => {
    if (!resizingValue) return
    const rect = panel.getBoundingClientRect()
    const valueWidth = Math.max(44, Math.min(100, rect.right - event.clientX))
    state.waveform.style.setProperty('--sim-value-width', `${valueWidth}px`)
  })
  const stopValueResize = event => {
    resizingValue = false
    try { valueResizer.releasePointerCapture?.(event.pointerId) } catch {}
  }
  valueResizer.addEventListener('pointerup', stopValueResize)
  valueResizer.addEventListener('pointercancel', stopValueResize)
}

function buildToolbar(state) {
  const toolbar = document.createElement('div')
  toolbar.className = 'sim-v2-wave-toolbar'
  toolbar.innerHTML = `
    <button type="button" class="sim-v2-icon sim-v2-fullscreen" title="Full screen" aria-label="Full screen">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>
    </button>
    <span class="sim-v2-sep"></span>
    <button type="button" class="sim-v2-icon sim-v2-zoom-out" title="Zoom out" aria-label="Zoom out">−</button>
    <button type="button" class="sim-v2-icon sim-v2-zoom-in" title="Zoom in" aria-label="Zoom in">+</button>
    <button type="button" class="sim-v2-fit" aria-label="Fit">Zoom Fit</button>
    <span class="sim-v2-sep"></span>
    <label class="sim-v2-search"><span>⌕</span><input type="search" aria-label="Find waveform signal" placeholder="Find signal" /></label>
    <select class="sim-v2-radix" aria-label="Waveform radix"><option value="hex">Hex</option><option value="bin">Binary</option><option value="unsigned">Unsigned</option><option value="signed">Signed</option></select>
    <span class="sim-v2-toolbar-spacer"></span>
    <div class="sim-v2-readouts"><span data-wave-readout="a">A —</span><span data-wave-readout="b">B —</span><span data-wave-readout="delta">Δ —</span></div>
    <span class="sim-v2-zoom-label">100%</span>`

  state.waveform.insertBefore(toolbar, state.scroll)
  state.toolbar = toolbar
  state.zoomLabel = q(toolbar, '.sim-v2-zoom-label')
  state.readA = q(toolbar, '[data-wave-readout="a"]')
  state.readB = q(toolbar, '[data-wave-readout="b"]')
  state.readDelta = q(toolbar, '[data-wave-readout="delta"]')

  q(toolbar, '.sim-v2-zoom-out').addEventListener('click', () => setZoom(state, state.zoom - 0.25))
  q(toolbar, '.sim-v2-zoom-in').addEventListener('click', () => setZoom(state, state.zoom + 0.25))
  q(toolbar, '.sim-v2-fit').addEventListener('click', () => fitWaveform(state))
  q(toolbar, '.sim-v2-radix').addEventListener('change', event => {
    state.radix = event.target.value
    updateSignalValues(state)
  })
  q(toolbar, '.sim-v2-search input').addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase()
    const rows = waveformRows(state.svg)
    qa(state.signalList, '.sim-v2-signal-row').forEach((node, index) => {
      const match = !query || node.dataset.signal.includes(query)
      node.classList.toggle('dimmed', !match)
      if (rows[index]?.group) rows[index].group.style.opacity = match ? '' : '.16'
    })
  })
  q(toolbar, '.sim-v2-fullscreen').addEventListener('click', async () => {
    const panel = state.waveform.closest('.ide-bottom')
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await panel?.requestFullscreen?.()
    } catch {
      panel?.classList.toggle('sim-v2-browser-fullscreen')
    }
  })
}

function buildRulerShell(state) {
  const ruler = document.createElement('div')
  ruler.className = 'sim-v2-ruler'
  state.scroll.appendChild(ruler)
  state.ruler = ruler

  for (const key of ['a', 'b']) {
    const line = document.createElement('div')
    line.className = `wave-cursor-line wave-cursor-line-${key} sim-v2-cursor ${key === 'b' ? 'b' : ''}`
    line.hidden = true
    line.innerHTML = '<span></span>'
    state.scroll.appendChild(line)
    if (key === 'a') state.cursorLineA = line
    else state.cursorLineB = line
  }
}

function attachWaveInteractions(state) {
  state.scroll.addEventListener('click', event => {
    if (event.target.closest('.sim-v2-signal-panel,.sim-v2-wave-toolbar,.sim-v2-ruler')) return
    const rect = state.scroll.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right) return
    const time = clientXToTime(state, event.clientX)
    if (event.shiftKey) state.cursorB = time
    else state.cursorA = time
    updateCursorUi(state)
  })

  state.scroll.addEventListener('wheel', event => {
    if (!(event.ctrlKey || event.metaKey || event.altKey)) return
    event.preventDefault()
    setZoom(state, state.zoom + (event.deltaY < 0 ? 0.25 : -0.25))
  }, { passive: false })

  state.scroll.addEventListener('scroll', () => {
    if (state.signalPanel) state.signalPanel.style.transform = `translateX(${state.scroll.scrollLeft}px)`
    if (state.ruler) state.ruler.style.transform = `translateX(${state.scroll.scrollLeft}px)`
  }, { passive: true })

  const observer = new ResizeObserver(() => {
    if (state.zoom === 1) fitWaveform(state)
    else {
      positionSvg(state)
      buildRuler(state)
      updateCursorUi(state)
    }
  })
  observer.observe(state.scroll)
  state.resizeObserver = observer
}

function enhanceWaveform(waveform) {
  if (!waveform || waveform.dataset.simV2 === 'true') return
  const scroll = q(waveform, '.wave-scroll')
  const svg = q(scroll, 'svg.wave-svg')
  if (!scroll || !svg) return

  waveform.dataset.simV2 = 'true'
  waveform.classList.add('waveform-v2', 'waveform-enhanced')
  q(waveform, '.wave-head')?.classList.add('sim-v2-hidden-original-head')
  q(waveform, '.wave-tools')?.classList.add('sim-v2-hidden-original-tools')

  const originalWidth = Number(svg.getAttribute('width')) || svg.getBoundingClientRect().width
  const originalHeight = Number(svg.getAttribute('height')) || svg.getBoundingClientRect().height
  svg.dataset.simV2ViewWidth = String(originalWidth)
  svg.dataset.simV2ViewHeight = String(originalHeight)
  svg.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`)
  svg.setAttribute('preserveAspectRatio', 'none')

  const state = {
    waveform,
    scroll,
    svg,
    zoom: 1,
    fitScale: 1,
    radix: 'hex',
    cursorA: null,
    cursorB: null,
  }
  V2.waveformState.set(waveform, state)

  addHighFills(svg)
  buildToolbar(state)
  buildSignalPanel(state)
  buildRulerShell(state)
  attachWaveInteractions(state)
  requestAnimationFrame(() => requestAnimationFrame(() => fitWaveform(state)))
}

function enhanceWaveforms() {
  qa(document, '.waveform').forEach(enhanceWaveform)
}

function scheduleEnhance() {
  if (V2.scheduled) return
  V2.scheduled = true
  requestAnimationFrame(() => {
    V2.scheduled = false
    enhanceConsole()
    enhanceWaveforms()
  })
}

document.addEventListener('click', event => {
  const tab = event.target.closest?.('.bottom-tabs > button')
  if (!tab) return
  const panel = tab.closest('.ide-bottom')
  if (!panel) return

  if (tab.classList.contains('bottom-collapse')) {
    requestAnimationFrame(() => {
      if (!panel.classList.contains('collapsed') && /waveform/i.test(activeBottomTab(panel)?.textContent || '')) maximizeWaveformPanel(panel)
    })
    return
  }

  const label = tab.textContent || ''
  if (/waveform/i.test(label)) requestAnimationFrame(() => requestAnimationFrame(() => maximizeWaveformPanel(panel)))
  else if (/console|testbench|evaluation/i.test(label)) requestAnimationFrame(() => restoreWaveformPanel(panel))
})

document.addEventListener('fullscreenchange', () => {
  qa(document, '.sim-v2-fullscreen').forEach(button => {
    const active = Boolean(document.fullscreenElement)
    button.title = active ? 'Exit full screen' : 'Full screen'
    button.setAttribute('aria-label', active ? 'Exit full screen' : 'Full screen')
  })
})

new MutationObserver(scheduleEnhance).observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('resize', () => {
  const panel = q(document, '.hdlforge-ide-active .ide-bottom') || q(document, '.ide-bottom')
  if (panel?.dataset.waveformMaximized === 'true' && /waveform/i.test(activeBottomTab(panel)?.textContent || '')) maximizeWaveformPanel(panel)
  scheduleEnhance()
})

scheduleEnhance()
