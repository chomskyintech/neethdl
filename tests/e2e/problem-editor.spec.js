import { test, expect } from '@playwright/test'

const editorRoot = page => page.locator('.monaco-editor-wrap')
const codeText = async page => (await page.locator('.monaco-editor-wrap .view-lines').innerText()).replace(/\u00a0/g, ' ')
const guideOrPage = page => page.locator('.solution-guide')
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

  test('loads a multiline shift-register scaffold and migrates the old one-line scaffold', async ({ page }) => {
    const legacy = "module shift_reg #(parameter WIDTH=8) (input logic clk, reset, shift_en, din, output logic [WIDTH-1:0] dout);\n  // Your RTL here\nendmodule"
    await page.evaluate(value => {
      localStorage.setItem('hdlforge-drafts', JSON.stringify({'rtl-shift-register': value}))
    }, legacy)
    await page.goto('/app/problems/rtl-shift-register/')
    await expect(page.locator('.monaco-editor-wrap')).toBeVisible()

    await expect.poll(() => codeText(page)).toContain('module shift_reg #(')
    await expect.poll(() => codeText(page)).toContain('input logic clk,')
    await expect.poll(() => codeText(page)).toContain('output logic [WIDTH-1:0] dout')
    expect(await codeText(page)).not.toContain('module shift_reg #(parameter WIDTH=8) (input logic')
  })

  test('does not replace a user-edited legacy scaffold during migration', async ({ page }) => {
    const edited = "module shift_reg #(parameter WIDTH=8) (input logic clk, reset, shift_en, din, output logic [WIDTH-1:0] dout);\n  // Your RTL here\nendmodule\\n// user-added logic"
    await page.evaluate(value => {
      localStorage.setItem('hdlforge-drafts', JSON.stringify({'rtl-shift-register': value}))
    }, edited)
    await page.goto('/app/problems/rtl-shift-register/')
    await expect(page.locator('.monaco-editor-wrap')).toBeVisible()
    await expect.poll(() => codeText(page)).toContain('user-added logic')
  })

  test('loads the scaffold and accepts a complete HDL edit', async ({ page }) => {
    expect(await codeText(page)).toContain('Your RTL here')
    await replaceEditorContents(page, muxSolution)
    expect(await codeText(page)).toContain('assign y = sel ? b : a;')
  })


  test('explains the priority arbiter clearly without extra teaching sections', async ({ page }) => {
    await page.goto('/app/problems/rtl-arbiter/')
    await expect(page.getByRole('heading', { name: 'What this means', exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Inputs & outputs', exact: true })).toHaveCount(0)
    await expect(page.locator('.problem-copy')).toContainText('req[3] > req[2] > req[1] > req[0]')
    await expect(page.locator('.problem-copy')).toContainText('Requester 2 wins because it has higher priority than requester 0.')
    await expect(page.locator('.problem-copy')).toContainText('Drive grant[3:0]')
  })

  test('renders hardware theory and design reasoning in the Approach tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Approach', exact: true }).click()

    const guide = page.locator('.approach-guide')
    await expect(guide).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Core theory', exact: true })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'How to reason about it', exact: true })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'What the interviewer is checking', exact: true })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Combinational logic', exact: true })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Multiplexing', exact: true })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Complete assignment', exact: true })).toBeVisible()
    await expect(guide).toContainText('no memory')
    await expect(guide).toContainText('latch')
  })

  test('renders the rich hardware Solution guide with compact reference actions', async ({ page }) => {
    await page.getByRole('button', { name: 'Solution', exact: true }).click()

    const guide = page.locator('.solution-guide')
    await expect(guide).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Prerequisites' })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Intuition' })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Implementation', exact: true })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Hardware behavior' })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Common mistakes' })).toBeVisible()
    await expect(guide.getByRole('heading', { name: 'Reference implementation' })).toBeVisible()

    const languageTabs = guide.locator('.solution-language-tabs')
    await expect(languageTabs.getByRole('button', { name: 'Verilog', exact: true })).toBeVisible()
    await expect(languageTabs.getByRole('button', { name: 'SystemVerilog', exact: true })).toBeVisible()
    await expect(languageTabs.getByRole('button', { name: 'VHDL', exact: true })).toBeVisible()

    await languageTabs.getByRole('button', { name: 'Verilog', exact: true }).click()
    const referenceViewer = guide.locator('.reference-monaco')
    await expect(referenceViewer).toBeVisible()
    await expect(referenceViewer.locator('.view-lines')).toContainText('always @(*)')

    await expect(guide.getByRole('button', { name: 'Copy reference solution', exact: true })).toBeVisible()
    await expect(guide.getByRole('button', { name: /Expand|Collapse reference/i })).toHaveCount(0)
    await expect(guide.getByRole('button', { name: 'Load into editor', exact: true })).toHaveCount(0)
  })

  test('changes structural formatting mode when the problem/editor splitter is resized', async ({ page }) => {
    await page.getByRole('button', { name: 'Solution', exact: true }).click()

    const viewer = page.locator('.reference-monaco')
    await expect(viewer).toBeVisible()
    const beforeColumn = Number(await viewer.getAttribute('data-format-column'))
    expect(beforeColumn).toBeGreaterThan(40)

    const resizer = page.locator('.ide-panel-resizer')
    const box = await resizer.boundingBox()
    expect(box).toBeTruthy()
    await page.mouse.move(box.x + box.width / 2, box.y + 100)
    await page.mouse.down()
    await page.mouse.move(box.x - 160, box.y + 100, { steps: 6 })
    await page.mouse.up()

    await expect.poll(async () => Number(await viewer.getAttribute('data-format-column'))).toBeLessThan(beforeColumn)
    await expect(viewer).toHaveAttribute('data-format-mode', 'narrow')

  })

  test('adapts the editable HDL formatter width to the editor pane', async ({ page }) => {
    const editor = page.locator('.monaco-editor-wrap')
    await expect(editor).toBeVisible()
    const beforeColumn = Number(await editor.getAttribute('data-format-column'))
    expect(beforeColumn).toBeGreaterThan(50)

    const resizer = page.locator('.ide-panel-resizer')
    const box = await resizer.boundingBox()
    expect(box).toBeTruthy()
    await page.mouse.move(box.x + box.width / 2, box.y + 120)
    await page.mouse.down()
    await page.mouse.move(box.x + 180, box.y + 120, { steps: 6 })
    await page.mouse.up()

    await expect.poll(async () => Number(await editor.getAttribute('data-format-column'))).toBeLessThan(beforeColumn)
  })

  test('renders a richer HDL syntax colour palette', async ({ page }) => {
    await expect(page.locator('.monaco-editor-wrap .view-lines')).toBeVisible()
    await expect.poll(async () => page.locator('.monaco-editor-wrap .view-lines span').evaluateAll(nodes => {
      const colors = new Set(
        nodes
          .filter(node => (node.textContent || '').trim())
          .map(node => getComputedStyle(node).color)
      )
      return colors.size
    })).toBeGreaterThanOrEqual(4)
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


  test('first correct solution marks solved without crashing and remains stable on rerender', async ({ page }) => {
    test.setTimeout(90_000)
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.addInitScript(() => {
      localStorage.removeItem('hdlforge-solved')
      localStorage.removeItem('hdlforge-activity-days')
    })

    await page.goto('/app/problems/rtl-priority/')
    await expect(page.locator('.monaco-editor')).toBeVisible()
    await expect(page.locator('.solve-status.passed')).toHaveCount(0)

    const solution = `module priority_encoder(input [7:0] in, output reg [2:0] index, output reg valid);
  integer i;
  always @(*) begin
    index = 3'd0;
    valid = 1'b0;
    for (i = 7; i >= 0; i = i - 1) begin
      if (in[i] && !valid) begin
        index = i[2:0];
        valid = 1'b1;
      end
    end
  end
endmodule`

    await replaceEditorContents(page, solution)
    await page.getByRole('button', { name: /Run tests/i }).first().click()
    await expect(page.getByText('HDLFORGE_PASS')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('Accepted', { exact: true })).toBeVisible()
    await expect(page.getByText(/4 \/ 4 testcases passed/)).toBeVisible()
    await expect(page.locator('.solve-status.passed')).toHaveCount(1)
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('hdlforge-solved') || '[]'))).toContain('rtl-priority')

    // Force React state updates after the pass result is on screen. This used
    // to crash because simulation-panel-v2 rewrote React-owned result markup.
    await page.getByRole('button', { name: /Collapse console/i }).click()
    await page.getByRole('button', { name: /Expand console/i }).click()
    await expect(page.getByText('Accepted', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: /Run tests/i }).first().click()
    await expect(page.getByText('Accepted', { exact: true })).toBeVisible()
    await expect(page.locator('.ide-page')).toBeVisible()
    await expect(page.locator('.monaco-editor')).toBeVisible()
    expect(pageErrors).toEqual([])
  })


  test('accepts the exact Shift Register reference solution', async ({ page }) => {
    test.setTimeout(90_000)
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))

    await page.addInitScript(() => {
      localStorage.removeItem('hdlforge-solved')
      localStorage.removeItem('hdlforge-activity-days')
      localStorage.removeItem('hdlforge-drafts')
    })
    await page.goto('/app/problems/rtl-shift-register/')
    await expect(page.locator('.monaco-editor')).toBeVisible()

    const solution = `module shift_reg #(
  parameter WIDTH = 8
) (
  input clk,
  input reset,
  input shift_en,
  input din,
  output reg [WIDTH-1:0] dout
);

always @(posedge clk) begin
  if (reset)
    dout <= {WIDTH{1'b0}};
  else if (shift_en)
    dout <= {dout[WIDTH-2:0], din};
end

endmodule`

    await replaceEditorContents(page, solution)
    await page.getByRole('button', { name: /Run tests/i }).first().click()
    await expect(page.getByText('Accepted', { exact: true })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText(/5 \/ 5 testcases passed/)).toBeVisible()
    await expect(page.locator('.solve-status.passed')).toHaveCount(1)
    expect(pageErrors).toEqual([])
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