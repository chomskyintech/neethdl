import { test, expect } from '@playwright/test'

test.describe('IDE visual theme regression', () => {
  test('keeps the canonical NeetCode graphite colour scheme and scrollbar palette', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/app/problems/rtl-fifo/')
    await expect(page.locator('.ide-page')).toBeVisible()

    const palette = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement)
      const value = name => root.getPropertyValue(name).trim()
      const colour = selector => getComputedStyle(document.querySelector(selector)).backgroundColor
      const text = selector => getComputedStyle(document.querySelector(selector)).color
      const problemContent = document.querySelector('.ide-problem-content')
      return {
        vars: {
          bg: value('--nc-bg'),
          editor: value('--nc-editor'),
          surface: value('--nc-surface'),
          active: value('--nc-active'),
          textStrong: value('--nc-text-strong'),
          border: value('--nc-border'),
        },
        body: getComputedStyle(document.body).backgroundColor,
        problem: colour('.ide-problem'),
        problemTabs: colour('.ide-problem>.problem-tabs'),
        fileTabs: colour('.file-tabs'),
        editor: colour('.monaco-editor'),
        activeProblemTab: text('.problem-tabs button.active'),
        scrollbarColor: getComputedStyle(problemContent).scrollbarColor,
      }
    })

    expect(palette.vars).toEqual({
      bg: '#1f1f20',
      editor: '#262527',
      surface: '#29282a',
      active: '#d7d7d9',
      textStrong: '#ececec',
      border: '#39393b',
    })

    expect(palette.body).toBe('rgb(31, 31, 32)')
    expect(palette.problem).toBe('rgb(38, 37, 39)')
    expect(palette.problemTabs).toBe('rgb(38, 37, 39)')
    expect(palette.fileTabs).toBe('rgb(38, 37, 39)')
    expect(palette.editor).toBe('rgb(38, 37, 39)')
    expect(palette.activeProblemTab).toBe('rgb(215, 215, 217)')
    expect(palette.scrollbarColor).toContain('rgb(57, 57, 59)')
    expect(palette.scrollbarColor).toContain('rgb(31, 31, 32)')
  })
})
