import { test, expect } from '@playwright/test'

test.describe('IDE visual theme regression', () => {
  test('uses a compact rectangular problem-pane scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/app/problems/rtl-fifo/')
    const pane = page.locator('.ide-problem-content')
    await expect(pane).toBeVisible()

    const scrollbar = await pane.evaluate(node => {
      const bar = getComputedStyle(node, '::-webkit-scrollbar')
      const thumb = getComputedStyle(node, '::-webkit-scrollbar-thumb')
      const track = getComputedStyle(node, '::-webkit-scrollbar-track')
      const button = getComputedStyle(node, '::-webkit-scrollbar-button')
      return {
        width: bar.width,
        thumbRadius: thumb.borderRadius,
        trackBackground: track.backgroundColor,
        buttonDisplay: button.display,
        buttonWidth: button.width,
        buttonHeight: button.height,
      }
    })

    expect(scrollbar.width).toBe('10px')
    expect(scrollbar.thumbRadius).toBe('0px')
    expect(scrollbar.trackBackground).toBe('rgba(0, 0, 0, 0)')
    expect(scrollbar.buttonDisplay).toBe('none')
    expect(scrollbar.buttonWidth).toBe('0px')
    expect(scrollbar.buttonHeight).toBe('0px')
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
