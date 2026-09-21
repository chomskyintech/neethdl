import { test, expect } from '@playwright/test'

test.describe('IDE visual theme regression', () => {
  test('uses a Monaco-style custom problem-pane scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 650 })
    await page.goto('/app/problems/rtl-fifo/')

    const pane = page.locator('.ide-problem-content')
    const scrollbar = page.locator('.problem-scrollbar')
    const thumb = page.locator('.problem-scrollbar-thumb')
    await expect(pane).toBeVisible()
    await expect(scrollbar).toHaveClass(/visible/)
    await expect(thumb).toBeVisible()

    const styles = await page.evaluate(() => {
      const pane = document.querySelector('.ide-problem-content')
      const bar = document.querySelector('.problem-scrollbar')
      const thumb = document.querySelector('.problem-scrollbar-thumb')
      const nativeBar = getComputedStyle(pane, '::-webkit-scrollbar')
      return {
        nativeDisplay: nativeBar.display,
        nativeWidth: nativeBar.width,
        barWidth: getComputedStyle(bar).width,
        thumbWidth: getComputedStyle(thumb).width,
        thumbRadius: getComputedStyle(thumb).borderRadius,
      }
    })

    expect(styles.nativeDisplay).toBe('none')
    expect(styles.nativeWidth).toBe('0px')
    expect(styles.barWidth).toBe('10px')
    expect(styles.thumbWidth).toBe('10px')
    expect(styles.thumbRadius).toBe('0px')

    const before = await thumb.evaluate(node => getComputedStyle(node).transform)
    await pane.evaluate(node => { node.scrollTop = 220; node.dispatchEvent(new Event('scroll')) })
    await expect.poll(() => thumb.evaluate(node => getComputedStyle(node).transform)).not.toBe(before)
  })

  test('keeps the intended IDE component surfaces', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/app/problems/rtl-fifo/')
    await expect(page.locator('.ide-page')).toBeVisible()

    const palette = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement)
      const value = name => root.getPropertyValue(name).trim()
      const colour = selector => getComputedStyle(document.querySelector(selector)).backgroundColor
      const text = selector => getComputedStyle(document.querySelector(selector)).color
      return {
        vars: {
          editor: value('--nc-editor'),
          active: value('--nc-active'),
        },
        problem: colour('.ide-problem'),
        problemTabs: colour('.ide-problem>.problem-tabs'),
        fileTabs: colour('.file-tabs'),
        editor: colour('.monaco-editor'),
        activeProblemTab: text('.problem-tabs button.active'),
      }
    })

    expect(palette.vars).toEqual({
      editor: '#262527',
      active: '#d7d7d9',
    })
    expect(palette.problem).toBe('rgb(38, 38, 38)')
    expect(palette.problemTabs).toBe('rgb(38, 38, 38)')
    expect(palette.fileTabs).toBe('rgb(38, 37, 39)')
    expect(palette.editor).toBe('rgb(38, 37, 39)')
    expect(palette.activeProblemTab).toBe('rgb(215, 215, 217)')
  })
})
