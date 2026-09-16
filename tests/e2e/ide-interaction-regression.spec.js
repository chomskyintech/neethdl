import { test, expect } from '@playwright/test'

test.describe('IDE interaction regressions', () => {
  test('keeps the language chevron attached to the selected label and reset on the far right', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/app/problems/rtl-fifo/')

    const fileTabs = page.locator('.file-tabs')
    const picker = page.locator('.editor-language')
    const select = picker.locator('select')
    const reset = fileTabs.locator('.icon-btn')

    await expect(select).toBeVisible()
    await expect(reset).toBeVisible()
    await expect(select).toHaveValue('SystemVerilog')

    const systemChevronLeft = await picker.evaluate(el => Number.parseFloat(getComputedStyle(el, '::after').left))
    expect(Number.isFinite(systemChevronLeft)).toBeTruthy()

    await select.selectOption('VHDL')
    await expect(select).toHaveValue('VHDL')
    await expect.poll(async () => picker.evaluate(el => Number.parseFloat(getComputedStyle(el, '::after').left))).toBeLessThan(systemChevronLeft - 20)

    const tabsBox = await fileTabs.boundingBox()
    const pickerBox = await picker.boundingBox()
    const resetBox = await reset.boundingBox()
    expect(tabsBox).toBeTruthy()
    expect(pickerBox).toBeTruthy()
    expect(resetBox).toBeTruthy()

    expect(tabsBox.x + tabsBox.width - (resetBox.x + resetBox.width)).toBeLessThanOrEqual(16)
    expect(resetBox.x).toBeGreaterThan(tabsBox.x + tabsBox.width * 0.75)

    const hitTag = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
      x: pickerBox.x + pickerBox.width - 24,
      y: pickerBox.y + pickerBox.height / 2
    })
    expect(hitTag).toBe('SELECT')
  })

  test('lets the console resize handle expand a collapsed console directly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/app/problems/rtl-fifo/')

    const consolePanel = page.locator('.ide-bottom')
    const collapseButton = page.locator('.bottom-collapse')

    await expect(consolePanel).toBeVisible()
    await collapseButton.click()
    await expect(consolePanel).toHaveClass(/collapsed/)

    const collapsedBox = await consolePanel.boundingBox()
    expect(collapsedBox).toBeTruthy()

    await page.mouse.move(collapsedBox.x + collapsedBox.width / 2, collapsedBox.y + 6)
    await page.mouse.down()
    await page.mouse.move(collapsedBox.x + collapsedBox.width / 2, collapsedBox.y - 150, { steps: 8 })
    await page.mouse.up()

    await expect(consolePanel).not.toHaveClass(/collapsed/)
    const expandedBox = await consolePanel.boundingBox()
    expect(expandedBox).toBeTruthy()
    expect(expandedBox.height).toBeGreaterThan(120)
    await expect(consolePanel.locator('.console')).toBeVisible()
  })
})
