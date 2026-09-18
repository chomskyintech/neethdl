import { test, expect } from '@playwright/test'

test.describe('IDE visual theme regression', () => {
  test('keeps the neutral graphite colour scheme and scrollbar palette', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/app/problems/rtl-fifo/')
    await expect(page.locator('.ide-page')).toBeVisible()

    const palette = await page.evaluate(() => {
      const colour = selector => getComputedStyle(document.querySelector(selector)).backgroundColor
      const text = selector => getComputedStyle(document.querySelector(selector)).color
      const problemContent = document.querySelector('.ide-problem-content')
      return {
        body: getComputedStyle(document.body).backgroundColor,
        topbar: colour('.ide-topbar'),
        problem: colour('.ide-problem'),
        workspace: colour('.ide-workspace'),
        problemTabs: colour('.ide-problem>.problem-tabs'),
        fileTabs: colour('.file-tabs'),
        editor: colour('.monaco-editor-stage'),
        console: colour('.console'),
        activeProblemTab: text('.problem-tabs button.active'),
        languageText: text('.editor-language select'),
        scrollbarColor: getComputedStyle(problemContent).scrollbarColor,
      }
    })

    expect(palette.body).toBe('rgb(15, 15, 15)')
    expect(palette.topbar).toBe('rgb(20, 20, 20)')
    expect(palette.problem).toBe('rgb(38, 38, 38)')
    expect(palette.workspace).toBe('rgb(31, 31, 31)')
    expect(palette.problemTabs).toBe('rgb(38, 38, 38)')
    expect(palette.fileTabs).toBe('rgb(38, 38, 38)')
    expect(palette.editor).toBe('rgb(30, 30, 30)')
    expect(palette.console).toBe('rgb(35, 35, 35)')
    expect(palette.activeProblemTab).toBe('rgb(255, 255, 255)')
    expect(palette.languageText).toBe('rgb(245, 245, 245)')
    expect(palette.scrollbarColor).toContain('rgb(102, 102, 102)')
    expect(palette.scrollbarColor).toContain('rgb(38, 38, 38)')
  })
})
