import { test, expect } from '@playwright/test'

test.describe('HDLForge navigation and SEO content', () => {
  test('landing page keeps only the primary hero content', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Hardware design practice for RTL, FPGA, VLSI & verification roles/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeVisible()
    await expect(page.locator('.landing-stats')).toHaveCount(0)
    await expect(page.locator('.destination-card')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Choose your workspace' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Hardware design practice resources' })).toHaveCount(0)
    await expect(page.locator('.topic-card')).toHaveCount(0)
    await expect(page.locator('.problem-row')).toHaveCount(0)
  })

  test('Start practice opens the Problems workspace', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start practice', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Problems' })).toBeVisible()
    await expect(page).toHaveURL(/\/app\/problems\/$/)
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
    await expect(page.getByRole('heading', { name: 'Hardware design projects' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Design Verification' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'RTL / Digital Design' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'FPGA', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'SoC / Embedded Hardware' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Low-Latency / HFT Hardware' })).toBeVisible()
  })

  test('Courses page provides skill paths with problem and project links', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Courses', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible()
    await expect(page.locator('.course-card')).toHaveCount(9)
    await expect(page.getByRole('heading', { name: 'Verilog / RTL Fundamentals' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'UVM Fundamentals' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Low-Latency FPGA / HFT' })).toBeVisible()
    await expect(page.locator('.course-links button').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open Projects' }).first()).toBeVisible()
  })

  test('removes Interview navigation and keeps sign in as an icon-only account control', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.desktop-nav').getByRole('button', { name: 'Interview', exact: true })).toHaveCount(0)
    const accountButton = page.getByRole('button', { name: 'Sign in', exact: true })
    await expect(accountButton).toBeVisible()
    await expect(accountButton).toHaveText('')
  })

  test('serves SEO learn page metadata and canonical route', async ({ page }) => {
    await page.goto('/learn/verilog-interview/index.html')
    await expect(page).toHaveTitle('Verilog Interview Questions & RTL Practice | HDLForge')
    await expect(page.getByRole('heading', { name: 'Verilog Interview Questions and RTL Practice' })).toBeVisible()
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://hdlforge.netlify.app/learn/verilog-interview/')
  })
})
