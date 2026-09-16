import { test, expect } from '@playwright/test'

test.describe('IDE interaction regressions', () => {
  test('keeps the language chevron attached to the selected label and controls on the right', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/app/problems/rtl-fifo/')

    const fileTabs = page.locator('.file-tabs')
    const picker = page.locator('.editor-language')
    const select = picker.locator('select')
    const reset = fileTabs.locator('button[title="Reset editor"]')

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

    expect(resetBox.x).toBeGreaterThan(tabsBox.x + tabsBox.width * 0.75)

    const hitTag = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
      x: pickerBox.x + pickerBox.width - 24,
      y: pickerBox.y + pickerBox.height / 2
    })
    expect(hitTag).toBe('SELECT')
  })

  test('keeps the requested compact header and tab sizing', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/app/problems/rtl-fifo/')

    const topbar = page.locator('.ide-topbar')
    const problemTabs = page.locator('.ide-problem>.problem-tabs')
    const problemTabButton = problemTabs.locator('button').first()
    const fileTabs = page.locator('.file-tabs')
    const language = page.locator('.editor-language select')

    expect(await topbar.evaluate(el => getComputedStyle(el).height)).toBe('48px')
    expect(await problemTabs.evaluate(el => getComputedStyle(el).height)).toBe('45px')
    expect(await problemTabButton.evaluate(el => getComputedStyle(el).fontSize)).toBe('14px')
    expect(await fileTabs.evaluate(el => getComputedStyle(el).height)).toBe('43px')
    expect(await language.evaluate(el => getComputedStyle(el).fontSize)).toBe('13px')
  })

  test('removes the editor info row and keeps search beside reset', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/app/problems/rtl-fifo/')

    const fileTabs = page.locator('.file-tabs')
    const reset = fileTabs.locator('button[title="Reset editor"]')
    const search = fileTabs.getByRole('button', { name: 'Find in source' })

    await expect(page.locator('.editor-toolbar')).toHaveCount(0)
    await expect(reset).toBeVisible()
    await expect(search).toBeVisible()

    const tabsBox = await fileTabs.boundingBox()
    const resetBox = await reset.boundingBox()
    const searchBox = await search.boundingBox()
    expect(tabsBox).toBeTruthy()
    expect(resetBox).toBeTruthy()
    expect(searchBox).toBeTruthy()

    const gap = searchBox.x - (resetBox.x + resetBox.width)
    expect(gap).toBeGreaterThanOrEqual(0)
    expect(gap).toBeLessThanOrEqual(12)
    expect(Math.abs((resetBox.y + resetBox.height / 2) - (searchBox.y + searchBox.height / 2))).toBeLessThanOrEqual(1)
    expect(tabsBox.x + tabsBox.width - (searchBox.x + searchBox.width)).toBeLessThanOrEqual(16)

    await search.click()
    await expect(page.locator('.monaco-editor .find-widget')).toBeVisible()
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