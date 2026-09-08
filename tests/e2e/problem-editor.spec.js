import { test, expect } from '@playwright/test'

const editorRoot = page => page.locator('.monaco-editor-wrap')
const codeText = async page => (await page.locator('.monaco-editor .view-lines').innerText()).replace(/\u00a0/g, ' ')

async function openFirstProblem(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.locator('.problem-row').first().click()
  await expect(page.locator('.monaco-editor')).toBeVisible()
  await expect(page.locator('.monaco-editor .view-lines')).toBeVisible()
}

async function placeCursorAfterMarker(page) {
  const markerLine = page.locator('.monaco-editor .view-line').filter({ hasText: 'Your RTL here' }).first()
  await expect(markerLine).toBeVisible()
  await markerLine.click()
  await page.keyboard.press('End')
}

async function replaceEditorContents(page, source) {
  await page.locator('.monaco-editor .view-lines').click()
  await page.keyboard.press('Control+A')
  await page.keyboard.insertText(source)
}

test.describe('HDLForge Monaco problem editor', () => {
  test.beforeEach(async ({ page }) => {
    await openFirstProblem(page)
  })

  test('loads the problem scaffold and allows HDL editing', async ({ page }) => {
    expect(await codeText(page)).toContain('Your RTL here')
    await placeCursorAfterMarker(page)
    await page.keyboard.press('Enter')
    await page.keyboard.type('assign y = sel ? b : a;')
    await expect(page.locator('.monaco-editor .view-lines')).toContainText('assign y = sel ? b : a;')
  })

  test('supports normal Monaco editing shortcuts', async ({ page }) => {
    const original = await codeText(page)
    await replaceEditorContents(page, 'module mux2(input logic a, b, sel, output logic y);\n  assign y = sel ? b : a;\nendmodule')
    expect(await codeText(page)).toContain('assign y = sel ? b : a;')
    await page.keyboard.press('Control+Z')
    await expect.poll(() => codeText(page)).toBe(original)
  })

  test('supports Tab indentation and native Ctrl+F find', async ({ page }) => {
    await placeCursorAfterMarker(page)
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.type('line_one;')
    expect(await codeText(page)).toMatch(/\s+line_one;/)
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

  test('runs RTL and renders a waveform', async ({ page }) => {
    test.setTimeout(90_000)
    await replaceEditorContents(page, 'module mux2(input logic a, b, sel, output logic y);\n  assign y = sel ? b : a;\nendmodule')
    await page.getByRole('button', { name: /Run tests/i }).first().click()
    await expect(page.getByText('HDLFORGE_PASS')).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: /Waveform/i }).click()
    await expect(page.locator('.waveform')).toBeVisible()
    await expect(page.locator('svg.wave-svg')).toBeVisible()
  })

  test('preserves a draft when navigating away and back', async ({ page }) => {
    await placeCursorAfterMarker(page)
    await page.keyboard.press('Enter')
    await page.keyboard.type('assign y = sel ? b : a;')
    await expect(page.locator('.monaco-editor .view-lines')).toContainText('assign y = sel ? b : a;')
    await page.getByRole('button', { name: /Next/i }).first().click()
    await expect(page.locator('.monaco-editor')).toBeVisible()
    await page.getByRole('button', { name: /Previous/i }).first().click()
    await expect(page.locator('.monaco-editor .view-lines')).toContainText('assign y = sel ? b : a;')
  })
})
