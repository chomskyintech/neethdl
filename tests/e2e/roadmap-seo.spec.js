import { test, expect } from '@playwright/test'

test.describe('HDLForge navigation and SEO content', () => {
  test('landing page is a clean hub without problem rows', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Prepare for hardware roles/i })).toBeVisible()
    const destinations = page.locator('.destination-card')
    await expect(destinations).toHaveCount(5)
    await expect(destinations.filter({ hasText: 'Problems' })).toBeVisible()
    await expect(destinations.filter({ hasText: 'Tracks' })).toBeVisible()
    await expect(destinations.filter({ hasText: 'Interview' })).toBeVisible()
    await expect(destinations.filter({ hasText: 'Projects' })).toBeVisible()
    await expect(destinations.filter({ hasText: 'Courses' })).toBeVisible()
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

  test('Interview navigation opens only the current interview simulation', async ({ page }) => {
    await page.goto('/')
    const interviewNav = page.locator('.desktop-nav').getByRole('button', { name: 'Interview', exact: true })
    await expect(interviewNav).toHaveCount(1)
    await interviewNav.click()
    await expect(page.getByRole('heading', { name: 'Hardware interview simulation' })).toBeVisible()
    await expect(page.getByText('RTL Screening — Practice')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Start interview/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to home' })).toBeVisible()
  })

  test('serves SEO learn page metadata and canonical route', async ({ page }) => {
    await page.goto('/learn/verilog-interview/index.html')
    await expect(page).toHaveTitle('Verilog Interview Questions & RTL Practice | HDLForge')
    await expect(page.getByRole('heading', { name: 'Verilog Interview Questions and RTL Practice' })).toBeVisible()
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://hdlforge.netlify.app/learn/verilog-interview/')
  })
})
