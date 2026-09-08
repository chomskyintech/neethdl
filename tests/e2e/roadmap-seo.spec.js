import { test, expect } from '@playwright/test'

test.describe('HDLForge navigation and SEO content', () => {
  test('landing page is a clean hub without problem rows', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Prepare for hardware roles/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Problems/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Tracks/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Interview/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Projects/ })).toBeVisible()
    await expect(page.locator('.problem-row')).toHaveCount(0)
  })

  test('Problems page owns problem sections and problem rows', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Problems', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Problems' })).toBeVisible()
    await expect(page.locator('.problem-section-btn')).toHaveCount(8)
    await expect(page.locator('.problem-row').first()).toBeVisible()
  })

  test('Projects page groups portfolio projects by hardware role', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Projects', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Projects for hardware roles' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Design Verification' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'RTL / Digital Design' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'FPGA', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'SoC / Embedded Hardware' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Low-Latency / HFT Hardware' })).toBeVisible()
  })

  test('serves SEO learn page metadata and canonical route', async ({ page }) => {
    await page.goto('/learn/verilog-interview/index.html')
    await expect(page).toHaveTitle('Verilog Interview Questions & RTL Practice | HDLForge')
    await expect(page.getByRole('heading', { name: 'Verilog Interview Questions and RTL Practice' })).toBeVisible()
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://hdlforge.netlify.app/learn/verilog-interview/')
  })
})
