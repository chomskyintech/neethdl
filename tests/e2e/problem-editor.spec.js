import { test, expect } from '@playwright/test'

test.describe('HDLForge problem editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('.problem-row').first().click()
    await expect(page.locator('textarea.ide-editor')).toBeVisible()
  })

  test('loads the problem scaffold and allows typing in the RTL region', async ({ page }) => {
    const editor = page.locator('textarea.ide-editor')
    const initial = await editor.inputValue()
    expect(initial).toContain('Your RTL here')

    const marker = initial.indexOf('Your RTL here')
    const lineStart = initial.lastIndexOf('\n', marker) + 1
    const markerEnd = initial.indexOf('\n', marker)
    await editor.evaluate((el, pos) => {
      el.focus()
      el.setSelectionRange(pos.start, pos.end)
    }, { start: lineStart, end: markerEnd })
    await page.keyboard.press('End')
    await page.keyboard.type('  // browser test')

    await expect(editor).toHaveValue(/Your RTL here.*browser test/)
  })

  test('keeps the scaffold locked outside the implementation region', async ({ page }) => {
    const editor = page.locator('textarea.ide-editor')
    const initial = await editor.inputValue()

    await editor.evaluate(el => {
      el.focus()
      el.setSelectionRange(0, 0)
    })
    await page.keyboard.type('X')
    await expect(editor).toHaveValue(initial)

    const marker = initial.indexOf('Your RTL here')
    const markerEnd = initial.indexOf('\n', marker)
    await editor.evaluate((el, pos) => {
      el.focus()
      el.setSelectionRange(pos, pos)
    }, markerEnd)
    await page.keyboard.type('\nassign browser_test = 1;')
    await expect(editor).toHaveValue(/assign browser_test = 1;/)
  })

  test('supports language switching without breaking the editor', async ({ page }) => {
    const editor = page.locator('textarea.ide-editor')
    const language = page.getByRole('combobox', { name: 'Select HDL language' })
    await expect(language).toHaveValue('SystemVerilog')

    await language.selectOption('Verilog')
    await expect(editor).toHaveValue(/Your RTL here/)
    await language.selectOption('VHDL')
    await expect(editor).toHaveValue(/Your RTL here/)
    await language.selectOption('SystemVerilog')
    await expect(editor).toHaveValue(/Your RTL here/)
  })
})
