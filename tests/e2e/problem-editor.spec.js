import { test, expect } from '@playwright/test'

const editorRoot = page => page.locator('.monaco-editor-wrap')
const codeText = async page => (await page.locator('.monaco-editor .view-lines').innerText()).replace(/\u00a0/g, ' ')
const muxSolution = 'module mux2(input logic a, b, sel, output logic y);\n  assign y = sel ? b : a;\nendmodule'
const brokenMux = 'module mux2(input logic a, b, sel, output logic y);\n  assign y = sel ? b : a\nendmodule'

async function openFirstProblem(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: 'Problems', exact: true }).first().click()
  await expect(page.locator('.problem-row').first()).toBeVisible()
  await page.locator('.problem-row').first().click()
  await expect(page.locator('.monaco-editor')).toBeVisible()
  await expect(page.locator('.monaco-editor .view-lines')).toBeVisible()
}

async function replaceEditorContents(page, source) {
  await page.locator('.monaco-editor .view-lines').click()
  await page.keyboard.press('Control+A')
  await page.keyboard.insertText(source)
  await expect.poll(() => codeText(page)).toContain(source.split('\n')[1].trim())
}

function expectSameBox(before, after, tolerance = 2) {
  expect(before).toBeTruthy()
  expect(after).toBeTruthy()
  for (const key of ['x', 'y', 'width', 'height']) {
    expect(Math.abs(after[key] - before[key])).toBeLessThanOrEqual(tolerance)
  }
}

test.describe('HDLForge Monaco problem editor', () => {
  test.beforeEach(async ({ page }) => {
    await openFirstProblem(page)
  })

  test('loads the scaffold and accepts a complete HDL edit', async ({ page }) => {
    expect(await codeText(page)).toContain('Your RTL here')
    await replaceEditorContents(page, muxSolution)
    expect(await codeText(page)).toContain('assign y = sel ? b : a;')
  })

  test('renders the rich hardware Solution guide and can load a reference implementation', async ({ page }) => {
    await page.getByRole('button', { name: 'Solution', exact: true }).click()

    const guide = page.locator('.solution-guide')
    await expect(guide).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Prerequisites' })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Intuition' })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Implementation' })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Hardware behavior' })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Common mistakes' })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Reference implementation' })).toBeVisible()

    const languageTabs = guide.locator('.solution-language-tabs')
    await expect(languageTabs.getByRole('button', { name: 'Verilog', exact: true })).toBeVisible()
    await expect(languageTabs.getByRole('button', { name: 'SystemVerilog', exact: true })).toBeVisible()
    await expect(languageTabs.getByRole('button', { name: 'VHDL', exact: true })).toBeVisible()

    await languageTabs.getByRole('button', { name: 'Verilog', exact: true }).click()
    await expect(guide.locator('.solution-code')).toContainText('always @(*)')

    await guide.getByRole('button', { name: 'Load into editor', exact: true }).click()
    await expect(page.locator('.editor-language select')).toHaveValue('Verilog')
    await expect.poll(() => codeText(page)).toContain('always @(*)')
  })

  test('opens Monaco native find with Ctrl+F', async ({ page }) => {
    await page.locator('.monaco-editor .view-lines').click()
    await page.keyboard.press('Control+F')
    await expect(page.locator('.monaco-editor .find-widget')).toBeVisible()
  })

  test('renders Monaco syntax highlighting', async ({ page }) => {
    await expect(page.locator('.monaco-editor .view-line').first()).toBeVisible()
    const highlightedTokens = page.locator('.monaco-editor .view-line span[class*="mtk"]')
    expect(await highlightedTokens.count()).toBeGreaterThan(0)
  })

  test('supports Verilog, VHDL and SystemVerilog switching', async ({ page }) => {
    const language = page.locator('.editor-language select')
    await expect(language).toHaveValue('SystemVerilog')
    await language.selectOption('Verilog')
    await expect(editorRoot(page)).toContainText('HDL source · Verilog')
    expect(await codeText(page)).toContain('Your RTL here')
    await language.selectOption('VHDL')
    await expect(editorRoot(page)).toContainText('HDL source · VHDL')
    expect(await codeText(page)).toContain('Your RTL here')
    await language.selectOption('SystemVerilog')
    await expect(editorRoot(page)).toContainText('HDL source · SystemVerilog')
  })

  test('visible language control is the actual clickable select surface', async ({ page }) => {
    const picker = page.locator('.editor-language')
    const language = picker.locator('select')

    await expect(picker).toBeVisible()
    await expect(language).toHaveValue('SystemVerilog')

    const box = await picker.boundingBox()
    expect(box).toBeTruthy()
    const hitTag = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
      x: box.x + box.width - 24,
      y: box.y + box.height / 2
    })
    expect(hitTag).toBe('SELECT')

    await language.click()
    await expect(language).toBeFocused()
    await language.selectOption('Verilog')
    await expect(editorRoot(page)).toContainText('HDL source · Verilog')
    expect(await codeText(page)).toContain('Your RTL here')
  })

  test('runs valid RTL and renders the redesigned inspection waveform correctly', async ({ page }) => {
    test.setTimeout(90_000)
    await replaceEditorContents(page, muxSolution)
    await page.getByRole('button', { name: /Run tests/i }).first().click()
    await expect(page.getByText('HDLFORGE_PASS')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('Accepted', { exact: true })).toBeVisible()
    await expect(page.locator('.test-case')).toHaveCount(4)
    await expect(page.locator('.test-case.pass')).toHaveCount(4)

    const bottomPanel = page.locator('.ide-bottom')
    const stage = page.locator('.waveform-editor-stage')
    const editor = page.locator('.monaco-editor-wrap')
    const beforeConsole = await bottomPanel.boundingBox()
    const beforeStage = await stage.boundingBox()
    expect(beforeConsole && beforeStage).toBeTruthy()

    await page.getByRole('button', { name: /Waveform/i }).click()

    const window = page.locator('.waveform-window')
    const waveform = page.locator('.waveform-v2')
    const svg = page.locator('svg.wave-svg')
    const signalPanel = page.locator('.sim-v2-signal-panel')
    const toolbar = page.locator('.sim-v2-wave-toolbar')
    const radix = page.getByRole('combobox', { name: 'Waveform radix' })
    const fit = page.getByRole('button', { name: 'Fit' })

    await expect(window).toBeVisible()
    await expect(waveform).toBeVisible()
    await expect(svg).toBeVisible()
    await expect(toolbar).toBeVisible()
    await expect(signalPanel).toBeVisible()
    await expect(page.getByRole('searchbox', { name: 'Find waveform signal' })).toBeVisible()
    await expect(fit).toBeVisible()
    await expect(page.getByRole('button', { name: 'Full screen' })).toBeVisible()
    await expect(radix).toHaveValue('hex')

    // Opening Waveform must affect only the editor stage. Console geometry and
    // state remain unchanged, while Monaco stays mounted underneath the overlay.
    expectSameBox(beforeConsole, await bottomPanel.boundingBox())
    expectSameBox(beforeStage, await window.boundingBox())
    await expect(page.getByRole('button', { name: 'Console', exact: true })).toHaveClass(/active/)
    await expect(bottomPanel).not.toHaveClass(/collapsed/)
    await expect(editor).toBeVisible()

    // The mux VCD mirrors DUT ports in the testbench. The UI must show each
    // logical signal once, not duplicate a/b/sel/y rows as the raw VCD does.
    const visibleSignalRows = signalPanel.locator('.sim-v2-signal-row[data-sim-quality-kept="true"]')
    await expect(visibleSignalRows).toHaveCount(4)
    const names = await visibleSignalRows.locator('.sim-v2-signal-name').allTextContents()
    expect([...names].sort()).toEqual(['a', 'b', 'sel', 'y'])
    expect(new Set(names).size).toBe(names.length)
    await expect(svg.locator('g[data-sim-quality-kept="true"]')).toHaveCount(4)
    await expect(svg.locator('g[data-sim-quality-duplicate="true"]:visible')).toHaveCount(0)

    // Name/value rows and their traces must stay on the same vertical rows.
    const maxAlignmentError = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('.sim-v2-signal-row[data-sim-quality-kept="true"]')]
      const traces = [...document.querySelectorAll('svg.wave-svg g[data-sim-quality-kept="true"]')]
      if (labels.length !== traces.length || !labels.length) return 999
      return Math.max(...labels.map((label, index) => {
        const a = label.getBoundingClientRect()
        const b = traces[index].getBoundingClientRect()
        return Math.abs((a.top + a.height / 2) - (b.top + b.height / 2))
      }))
    })
    expect(maxAlignmentError).toBeLessThanOrEqual(6)

    // Fit must be a true fit: no horizontal overflow and both endpoint labels
    // must remain inside the visible waveform viewport.
    await fit.click()
    await expect.poll(() => page.evaluate(() => {
      const scroll = document.querySelector('.waveform-v2 .wave-scroll')
      return scroll ? Math.max(0, scroll.scrollWidth - scroll.clientWidth) : 999
    })).toBeLessThanOrEqual(2)

    await expect(page.locator('.sim-v2-tick.first')).toContainText('0 ns')
    const tickBounds = await page.evaluate(() => {
      const scroll = document.querySelector('.waveform-v2 .wave-scroll')?.getBoundingClientRect()
      const first = document.querySelector('.sim-v2-tick.first')?.getBoundingClientRect()
      const last = document.querySelector('.sim-v2-tick.last')?.getBoundingClientRect()
      if (!scroll || !first || !last) return null
      return { firstLeft: first.left, lastRight: last.right, viewportLeft: scroll.left, viewportRight: scroll.right }
    })
    expect(tickBounds).toBeTruthy()
    expect(tickBounds.firstLeft).toBeGreaterThanOrEqual(tickBounds.viewportLeft - 1)
    expect(tickBounds.lastRight).toBeLessThanOrEqual(tickBounds.viewportRight + 1)

    // Resizing the signal pane must actually give more width to the waveform,
    // and Fit must remain correct afterwards.
    const signalResizer = page.locator('.sim-v2-signal-resizer')
    await expect(signalResizer).toBeVisible()
    const beforeWidth = (await signalPanel.boundingBox()).width
    const resizeBox = await signalResizer.boundingBox()
    expect(resizeBox).toBeTruthy()
    await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + 80)
    await page.mouse.down()
    await page.mouse.move(resizeBox.x - 50, resizeBox.y + 80, { steps: 4 })
    await page.mouse.up()
    const afterWidth = (await signalPanel.boundingBox()).width
    expect(afterWidth).toBeLessThan(beforeWidth - 20)
    await fit.click()
    await expect.poll(() => page.evaluate(() => {
      const scroll = document.querySelector('.waveform-v2 .wave-scroll')
      return scroll ? Math.max(0, scroll.scrollWidth - scroll.clientWidth) : 999
    })).toBeLessThanOrEqual(2)

    const svgBox = await svg.boundingBox()
    expect(svgBox).toBeTruthy()
    await page.mouse.click(svgBox.x + svgBox.width * 0.62, svgBox.y + Math.min(70, svgBox.height / 2))
    await expect(page.locator('[data-wave-readout="a"]')).toContainText('ns')
    await page.keyboard.down('Shift')
    await page.mouse.click(svgBox.x + svgBox.width * 0.74, svgBox.y + Math.min(70, svgBox.height / 2))
    await page.keyboard.up('Shift')
    await expect(page.locator('[data-wave-readout="b"]')).toContainText('ns')
    await expect(page.locator('[data-wave-readout="delta"]')).toContainText('ns')
    await expect(page.locator('.sim-v2-cursor:not(.b)')).toBeVisible()
    await expect(page.locator('.sim-v2-cursor.b')).toBeVisible()

    await radix.selectOption('bin')
    await expect(radix).toHaveValue('bin')
    await expect(page.locator('.sim-v2-name-value-resizer')).toBeVisible()
  })

  test('shows a compilation error instead of testcase results for invalid syntax', async ({ page }) => {
    test.setTimeout(90_000)
    await replaceEditorContents(page, brokenMux)
    await page.getByRole('button', { name: /Run tests/i }).first().click()

    await expect(page.getByText('Compilation Error', { exact: true })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('Simulation did not run', { exact: true })).toBeVisible()
    await expect(page.locator('.sim-v2-compile')).toBeVisible()
    await expect(page.locator('.sim-v2-compiler-output')).toContainText(/error|syntax/i)
    await expect(page.locator('.sim-v2-case')).toHaveCount(0)
  })

  test('preserves an edited draft when navigating away and back', async ({ page }) => {
    await replaceEditorContents(page, muxSolution)
    await page.getByRole('button', { name: /Next/i }).first().click()
    await expect(page.locator('.monaco-editor')).toBeVisible()
    await page.getByRole('button', { name: /Previous/i }).first().click()
    await expect.poll(() => codeText(page)).toContain('assign y = sel ? b : a;')
  })
})