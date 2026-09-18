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

    expect(palette.body).toBe('rgb(29, 28, 30)')
    expect(palette.topbar).toBe('rgb(29, 28, 30)')
    expect(palette.problem).toBe('rgb(38, 37, 39)')
    expect(palette.workspace).toBe('rgb(34, 33, 35)')
    expect(palette.problemTabs).toBe('rgb(38, 37, 39)')
    expect(palette.fileTabs).toBe('rgb(38, 37, 39)')
    expect(palette.editor).toBe('rgb(31, 30, 32)')
    expect(palette.console).toBe('rgb(37, 36, 39)')
    expect(palette.activeProblemTab).toBe('rgb(255, 255, 255)')
    expect(palette.languageText).toBe('rgb(244, 244, 245)')
    expect(palette.scrollbarColor).toContain('rgb(91, 89, 97)')
    expect(palette.scrollbarColor).toContain('rgb(38, 37, 39)')
  })
})
