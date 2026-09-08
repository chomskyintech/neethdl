import { test, expect } from '@playwright/test'

const editorRoot = page => page.locator('.monaco-editor-wrap')
const codeText = async page => (await page.locator('.monaco-editor .view-lines').innerText()).replace(/\u00a0/g, ' ')
const muxSolution = 'module mux2(input logic a, b, sel, output logic y);\n  assign y = sel ? b : a;\nendmodule'

async function openFirstProblem(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
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

test.describe('HDLForge Monaco problem editor', () => {
  test.beforeEach(async ({ page }) => {
    await openFirstProblem(page)
  })

  test('loads the scaffold and accepts a complete HDL edit', async ({ page }) => {
    expect(await codeText(page)).toContain('Your RTL here')
    await replaceEditorContents(page, muxSolution)
    expect(await codeText(page)).toContain('assign y = sel ? b : a;')
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

  test('runs valid RTL and renders a waveform', async ({ page }) => {
    test.setTimeout(90_000)
    await replaceEditorContents(page, muxSolution)
    await page.getByRole('button', { name: /Run tests/i }).first().click()
    await expect(page.getByText('HDLFORGE_PASS')).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: /Waveform/i }).click()
    await expect(page.locator('.waveform')).toBeVisible()
    await expect(page.locator('svg.wave-svg')).toBeVisible()
  })

  test('preserves an edited draft when navigating away and back', async ({ page }) => {
    await replaceEditorContents(page, muxSolution)
    await page.getByRole('button', { name: /Next/i }).first().click()
    await expect(page.locator('.monaco-editor')).toBeVisible()
    await page.getByRole('button', { name: /Previous/i }).first().click()
    await expect.poll(() => codeText(page)).toContain('assign y = sel ? b : a;')
  })
})
