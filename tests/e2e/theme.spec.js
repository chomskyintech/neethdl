import { test, expect } from '@playwright/test'

const colours = {
  bg: 'rgb(31, 31, 32)',
  editor: 'rgb(38, 37, 39)',
  border: 'rgb(57, 57, 59)',
  teal: 'rgb(57, 126, 115)',
  careerPanel: 'rgb(38, 37, 39)',
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
          active:value('--nc-active'),
        }
      })
      expect(vars).toEqual({
        bg:'#1f1f20',
        editor:'#262527',
        surface:'#29282a',
        border:'#39393b',
        text:'#c2c2c4',
        blue:'#4b82ac',
        teal:'#397e73',
        yellow:'#aaa672',
        active:'#d7d7d9',
      })
    }
  })

  test('keeps the topic filter strip unboxed', async ({ page }) => {
    await page.goto('/app/problems/')
    const shell = page.locator('.topic-cloud-shell')
    const item = page.locator('.topic-cloud-item').first()
    const count = item.locator('em')

    await expect(shell).toBeVisible()
    expect(await shell.evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
    expect(await shell.evaluate(node => getComputedStyle(node).borderTopColor)).toBe('rgba(0, 0, 0, 0)')
    expect(await item.evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
    expect(await count.evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
    expect(await count.evaluate(node => getComputedStyle(node).borderTopWidth)).toBe('0px')
  })

  test('applies canonical surfaces across problems, projects, career and IDE', async ({ page }) => {
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
    expect(await page.locator('.career-progress-card').evaluate(node => getComputedStyle(node).backgroundColor)).toBe(colours.careerPanel)

    await page.goto('/app/problems/rtl-shift-register/')
    await expect(page.locator('.monaco-editor')).toBeVisible()
    expect(await page.locator('.monaco-editor').first().evaluate(node => getComputedStyle(node).backgroundColor)).toBe(colours.editor)
    expect(await page.locator('.file-tabs').evaluate(node => getComputedStyle(node).backgroundColor)).toBe(colours.editor)
  })

  test('keeps Monaco syntax deliberately muted', async ({ page }) => {
    await page.goto('/app/problems/rtl-shift-register/')
    await expect(page.locator('.monaco-editor-wrap .view-lines')).toBeVisible()

    const coloursSeen = await page.locator('.monaco-editor-wrap .view-lines span').evaluateAll(nodes =>
      [...new Set(nodes.filter(node => (node.textContent || '').trim()).map(node => getComputedStyle(node).color))]
    )

    expect(coloursSeen).toContain('rgb(194, 194, 196)')
    expect(coloursSeen).toContain('rgb(57, 126, 115)')
    expect(coloursSeen).not.toContain('rgb(76, 200, 176)')
    expect(coloursSeen).not.toContain('rgb(220, 220, 168)')
  })

  test('uses muted neutral white for active navigation underlines', async ({ page }) => {
    await page.goto('/app/problems/rtl-shift-register/')
    const active = page.locator('.problem-tabs button.active')
    await expect(active).toBeVisible()
    expect(await active.evaluate(node => getComputedStyle(node).borderBottomColor)).toBe('rgb(215, 215, 217)')

    await page.getByRole('button', { name: 'Solution', exact: true }).click()
    const solutionTab = page.locator('.solution-language-tabs button.active')
    await expect(solutionTab).toBeVisible()
    expect(await solutionTab.evaluate(node => getComputedStyle(node).borderBottomColor)).toBe('rgb(215, 215, 217)')
  })
})
