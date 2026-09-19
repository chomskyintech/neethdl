import { test, expect } from '@playwright/test'

const colours = {
  bg: 'rgb(31, 30, 32)',
  editor: 'rgb(38, 37, 39)',
  border: 'rgb(58, 57, 60)',
  teal: 'rgb(76, 200, 176)',
}

test.describe('NeetCode theme regression', () => {
  test('locks canonical variables on major routes', async ({ page }) => {
    for (const route of ['/', '/app/problems/', '/app/projects/', '/app/roadmaps/rtl-design/', '/app/problems/rtl-shift-register/']) {
      await page.goto(route)
      const vars = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement)
        const value = name => style.getPropertyValue(name).trim()
        return {
          bg:value('--nc-bg'),
          editor:value('--nc-editor'),
          surface:value('--nc-surface'),
          border:value('--nc-border'),
          text:value('--nc-text'),
          blue:value('--nc-blue'),
          teal:value('--nc-teal'),
          yellow:value('--nc-yellow'),
        }
      })
      expect(vars).toEqual({
        bg:'#1f1e20',
        editor:'#262527',
        surface:'#29282a',
        border:'#3a393c',
        text:'#d4d4d4',
        blue:'#549cd4',
        teal:'#4cc8b0',
        yellow:'#dcdca8',
      })
    }
  })

  test('applies NeetCode surfaces across problems, projects, career and IDE', async ({ page }) => {
    await page.goto('/app/problems/')
    await expect(page.locator('.guided-roadmap-card')).toBeVisible()
    expect(await page.locator('.guided-roadmap-card').evaluate(node => getComputedStyle(node).backgroundColor)).toBe(colours.editor)
    await expect(page.locator('.topic-group').first()).toBeVisible()
    expect(await page.locator('.topic-group').first().evaluate(node => getComputedStyle(node).borderTopColor)).toBe(colours.border)

    await page.goto('/app/projects/')
    await expect(page.locator('.project-card-modern').first()).toBeVisible()
    expect(await page.locator('.project-card-modern').first().evaluate(node => getComputedStyle(node).backgroundColor)).toBe(colours.editor)

    await page.goto('/app/roadmaps/rtl-design/')
    await expect(page.locator('.career-progress-card')).toBeVisible()
    expect(await page.locator('.career-progress-card').evaluate(node => getComputedStyle(node).backgroundColor)).toBe(colours.editor)

    await page.goto('/app/problems/rtl-shift-register/')
    await expect(page.locator('.monaco-editor')).toBeVisible()
    expect(await page.locator('.monaco-editor').first().evaluate(node => getComputedStyle(node).backgroundColor)).toBe(colours.editor)
    expect(await page.locator('.file-tabs').evaluate(node => getComputedStyle(node).backgroundColor)).toBe(colours.editor)
  })

  test('uses teal rather than the previous violet for active UI accents', async ({ page }) => {
    await page.goto('/app/problems/rtl-shift-register/')
    const active = page.locator('.problem-tabs button.active')
    await expect(active).toBeVisible()
    expect(await active.evaluate(node => getComputedStyle(node).borderBottomColor)).toBe(colours.teal)
  })
})
