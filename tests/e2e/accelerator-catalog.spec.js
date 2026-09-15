import { test, expect } from '@playwright/test'

test.describe('coding-only problem catalog and accelerators', () => {
  test('removes theory-only problems and exposes accelerator category', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Problems', exact: true }).click()

    await expect(page.getByRole('button', { name: /^Accelerators · 6$/ })).toBeVisible()
    await page.getByRole('button', { name: /^Accelerators · 6$/ }).click()
    await expect(page.locator('.problem-row')).toHaveCount(6)
    await expect(page.getByText('Signed INT8 Multiply-Accumulate', { exact: true })).toBeVisible()
    await expect(page.getByText('Systolic Array Processing Element', { exact: true })).toBeVisible()

    await page.getByPlaceholder('Search problems...').fill('Pipeline Data Hazard')
    await expect(page.locator('.problem-row')).toHaveCount(0)
  })

  test('accelerator problem opens in the interactive editor', async ({ page }) => {
    await page.goto('/app/problems/accel-mac8/')
    await expect(page).toHaveTitle('Signed INT8 Multiply-Accumulate | HDLForge')
    await expect(page.getByText('Signed INT8 Multiply-Accumulate', { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/multiply-accumulate datapath/i)).toBeVisible()
  })

  test('serves crawlable accelerator practice and learning hubs', async ({ page }) => {
    await page.goto('/practice/accelerators/index.html')
    await expect(page.getByRole('heading', { name: 'Hardware Accelerator RTL Practice Problems' })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://hdlforge.netlify.app/practice/accelerators/')
    await expect(page.locator('a[href="/problems/accel-systolic-pe/"]')).toBeVisible()

    await page.goto('/learn/accelerators/index.html')
    await expect(page.getByRole('heading', { name: 'Hardware Accelerator Design Practice' })).toBeVisible()
    await expect(page.locator('a[href="/problems/accel-dot4/"]')).toBeVisible()
  })

  test('sitemap includes accelerators and excludes empty theory practice path', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBeTruthy()
    const xml = await response.text()
    expect(xml).toContain('https://hdlforge.netlify.app/practice/accelerators/')
    expect(xml).toContain('https://hdlforge.netlify.app/learn/accelerators/')
    expect(xml).toContain('https://hdlforge.netlify.app/problems/accel-mac8/')
    expect(xml).not.toContain('https://hdlforge.netlify.app/practice/computer-architecture/')
  })
})
