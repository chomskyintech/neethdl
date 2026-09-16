import { test, expect } from '@playwright/test'

const muxSolution = 'module mux2(input logic a, b, sel, output logic y);\n  assign y = sel ? b : a;\nendmodule'

async function openMux(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: 'Problems', exact: true }).first().click()
  await expect(page.locator('.problem-row').first()).toBeVisible()
  await page.locator('.problem-row').first().click()
  await expect(page.locator('.monaco-editor .view-lines')).toBeVisible()
}

async function setSource(page, source) {
  await page.locator('.monaco-editor .view-lines').click()
  await page.keyboard.press('Control+A')
  await page.keyboard.insertText(source)
}

async function runAndOpenWaveform(page) {
  await setSource(page, muxSolution)
  await page.getByRole('button', { name: /Run tests/i }).first().click()
  await expect(page.getByText('HDLFORGE_PASS')).toBeVisible({ timeout: 60_000 })
  await page.getByRole('button', { name: /Waveform/i }).click()
  await expect(page.locator('.waveform-v2')).toBeVisible()
  await expect(page.locator('.sim-v2-wave-toolbar')).toBeVisible()
}

test.describe('waveform layout behavior', () => {
  test.beforeEach(async ({ page }) => {
    await openMux(page)
  })

  test('keeps zoom, scrolling, fullscreen and panel transitions geometrically correct', async ({ page }) => {
    test.setTimeout(90_000)
    await runAndOpenWaveform(page)

    const waveform = page.locator('.waveform-v2')
    const toolbar = page.locator('.sim-v2-wave-toolbar')
    const zoomOut = toolbar.locator('.sim-v2-zoom-out')
    const zoomLabel = toolbar.locator('.sim-v2-zoom-label')
    const zoomIn = toolbar.locator('.sim-v2-zoom-in')
    const svg = waveform.locator('svg.wave-svg')
    const signalPanel = waveform.locator('.sim-v2-signal-panel')
    const bottomPanel = page.locator('.ide-bottom')
    const workspace = page.locator('.ide-workspace')
    const fileTabs = page.locator('.file-tabs')

    const zoomOrder = await toolbar.locator('.sim-v2-zoom-out, .sim-v2-zoom-label, .sim-v2-zoom-in').evaluateAll(nodes =>
      nodes.map(node => node.className)
    )
    expect(zoomOrder).toEqual(['sim-v2-icon sim-v2-zoom-out', 'sim-v2-zoom-label', 'sim-v2-icon sim-v2-zoom-in'])

    const zoomBoxes = await Promise.all([zoomOut.boundingBox(), zoomLabel.boundingBox(), zoomIn.boundingBox()])
    expect(zoomBoxes.every(Boolean)).toBeTruthy()
    expect(zoomBoxes[0].x + zoomBoxes[0].width).toBeLessThanOrEqual(zoomBoxes[1].x + 1)
    expect(zoomBoxes[1].x + zoomBoxes[1].width).toBeLessThanOrEqual(zoomBoxes[2].x + 1)

    await zoomIn.click()
    await zoomIn.click()
    await zoomIn.click()
    await expect.poll(() => page.evaluate(() => {
      const el = document.querySelector('.waveform-v2 .wave-scroll')
      return el ? el.scrollWidth - el.clientWidth : 0
    })).toBeGreaterThan(100)

    const beforePan = await page.evaluate(() => {
      const s = document.querySelector('.waveform-v2 .wave-scroll')
      const svg = document.querySelector('.waveform-v2 svg.wave-svg')
      const panel = document.querySelector('.waveform-v2 .sim-v2-signal-panel')
      if (!s || !svg || !panel) return null
      const a = svg.getBoundingClientRect()
      const p = panel.getBoundingClientRect()
      return { svgWidth: a.width, svgHeight: a.height, panelLeft: p.left, viewportLeft: s.getBoundingClientRect().left }
    })
    expect(beforePan).toBeTruthy()

    await page.evaluate(() => {
      const el = document.querySelector('.waveform-v2 .wave-scroll')
      el.scrollLeft = Math.round((el.scrollWidth - el.clientWidth) * 0.55)
      el.dispatchEvent(new Event('scroll'))
    })
    await expect.poll(() => page.evaluate(() => document.querySelector('.waveform-v2 .wave-scroll')?.scrollLeft || 0)).toBeGreaterThan(50)

    const afterPan = await page.evaluate(() => {
      const s = document.querySelector('.waveform-v2 .wave-scroll')
      const svg = document.querySelector('.waveform-v2 svg.wave-svg')
      const panel = document.querySelector('.waveform-v2 .sim-v2-signal-panel')
      const ruler = document.querySelector('.waveform-v2 .sim-v2-ruler')
      if (!s || !svg || !panel || !ruler) return null
      const a = svg.getBoundingClientRect()
      const p = panel.getBoundingClientRect()
      const r = ruler.getBoundingClientRect()
      const viewport = s.getBoundingClientRect()
      return {
        svgWidth: a.width,
        svgHeight: a.height,
        panelLeft: p.left,
        viewportLeft: viewport.left,
        rulerLeft: r.left,
        scrollLeft: s.scrollLeft,
        rulerTransform: getComputedStyle(ruler).transform,
      }
    })
    expect(afterPan).toBeTruthy()
    expect(Math.abs(afterPan.svgWidth - beforePan.svgWidth)).toBeLessThanOrEqual(1)
    expect(Math.abs(afterPan.svgHeight - beforePan.svgHeight)).toBeLessThanOrEqual(1)
    expect(Math.abs(afterPan.panelLeft - beforePan.panelLeft)).toBeLessThanOrEqual(2)
    expect(Math.abs(afterPan.panelLeft - afterPan.viewportLeft)).toBeLessThanOrEqual(2)
    expect(afterPan.rulerTransform).toBe('none')
    expect(Math.abs((afterPan.viewportLeft - afterPan.scrollLeft) - afterPan.rulerLeft)).toBeLessThanOrEqual(3)

    const maxAlignmentError = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('.sim-v2-signal-row[data-sim-quality-kept="true"]')]
      const traces = [...document.querySelectorAll('svg.wave-svg g[data-sim-quality-kept="true"]')]
      if (!labels.length || labels.length !== traces.length) return 999
      return Math.max(...labels.map((label, i) => {
        const a = label.getBoundingClientRect()
        const b = traces[i].getBoundingClientRect()
        return Math.abs((a.top + a.height / 2) - (b.top + b.height / 2))
      }))
    })
    expect(maxAlignmentError).toBeLessThanOrEqual(6)

    const fullscreenButton = page.getByRole('button', { name: 'Full screen' })
    await fullscreenButton.click()
    await expect.poll(() => page.evaluate(() => {
      const w = document.querySelector('.waveform-v2')
      return Boolean(w && (document.fullscreenElement === w || w.classList.contains('sim-v2-wave-only-fullscreen')))
    })).toBe(true)

    const fullscreenState = await page.evaluate(() => {
      const w = document.querySelector('.waveform-v2')
      const bottom = document.querySelector('.ide-bottom')
      const rect = w?.getBoundingClientRect()
      return {
        waveformIsFullscreen: document.fullscreenElement === w || w?.classList.contains('sim-v2-wave-only-fullscreen'),
        bottomIsFullscreen: document.fullscreenElement === bottom || bottom?.classList.contains('sim-v2-browser-fullscreen'),
        width: rect?.width || 0,
        height: rect?.height || 0,
        vw: innerWidth,
        vh: innerHeight,
      }
    })
    expect(fullscreenState.waveformIsFullscreen).toBe(true)
    expect(fullscreenState.bottomIsFullscreen).toBe(false)
    expect(Math.abs(fullscreenState.width - fullscreenState.vw)).toBeLessThanOrEqual(3)
    expect(Math.abs(fullscreenState.height - fullscreenState.vh)).toBeLessThanOrEqual(3)

    await fullscreenButton.click()
    await expect.poll(() => page.evaluate(() => {
      const w = document.querySelector('.waveform-v2')
      return Boolean(document.fullscreenElement === w || w?.classList.contains('sim-v2-wave-only-fullscreen'))
    })).toBe(false)

    await page.getByRole('button', { name: 'Console', exact: true }).click()
    await expect(page.getByText('Accepted', { exact: true })).toBeVisible()
    await expect.poll(async () => {
      const bottom = await bottomPanel.boundingBox()
      const work = await workspace.boundingBox()
      const tabs = await fileTabs.boundingBox()
      if (!bottom || !work || !tabs) return 999
      return Math.abs(bottom.height - (work.height - tabs.height - 2))
    }).toBeLessThanOrEqual(4)
    await expect(page.locator('.monaco-editor-wrap')).toBeHidden()

    await page.getByRole('button', { name: /Waveform/i }).click()
    await expect(waveform).toBeVisible()
    const collapse = page.locator('.bottom-collapse')
    await collapse.click()
    await expect(bottomPanel).toHaveClass(/collapsed/)
    await expect(page.locator('.monaco-editor-wrap')).toBeVisible()
    await expect.poll(async () => (await bottomPanel.boundingBox())?.height || 999).toBeLessThan(80)
  })
})
