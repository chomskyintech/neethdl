import { test, expect } from '@playwright/test'

test.describe('HDLForge roadmap and SEO content', () => {
  test('shows structured roadmap stages and prerequisites', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'From fundamentals to interview readiness' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Digital & RTL fundamentals' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Assertions & verification' })).toBeVisible()
    await expect(page.getByText(/Prerequisite:/).first()).toBeVisible()
  })

  test('serves SEO learn pages with unique metadata', async ({ page }) => {
    await page.goto('/learn/verilog-interview/')
    await expect(page).toHaveTitle('Verilog Interview Questions & RTL Practice | HDLForge')
    await expect(page.getByRole('heading', { name: 'Verilog Interview Questions and RTL Practice' })).toBeVisible()
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://hdlforge.netlify.app/learn/verilog-interview/')
  })
})
