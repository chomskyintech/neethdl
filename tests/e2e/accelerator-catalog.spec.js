import { test, expect } from '@playwright/test'

test.describe('coding-only problem catalog and accelerators', () => {
  test('removes theory-only problems and exposes expanded accelerator category', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Problems', exact: true }).click()

    await expect(page.getByRole('button', { name: /^Accelerators · 12$/ })).toBeVisible()
    await page.getByRole('button', { name: /^Accelerators · 12$/ }).click()
    await expect(page.locator('.problem-row')).toHaveCount(12)
    await expect(page.getByText('Signed INT8 Multiply-Accumulate', { exact: true })).toBeVisible()
    await expect(page.getByText('2x2 Matrix Multiply Datapath', { exact: true })).toBeVisible()
    await expect(page.getByText('Three-Tap INT8 Convolution', { exact: true })).toBeVisible()

    await page.getByPlaceholder('Search problems...').fill('Pipeline Data Hazard')
    await expect(page.locator('.problem-row')).toHaveCount(0)
  })

  test('new accelerator problem opens in the interactive editor', async ({ page }) => {
    await page.goto('/app/problems/accel-matmul2/')
    await expect(page).toHaveTitle('2x2 Matrix Multiply Datapath | HDLForge')
    await expect(page.getByText('2x2 Matrix Multiply Datapath', { exact: true }).first()).toBeVisible()
    await expect(page).toHaveURL(/\/app\/problems\/accel-matmul2\/$/)
  })

  test('serves crawlable accelerator practice and learning hubs with expanded problems', async ({ page }) => {
    await page.goto('/practice/accelerators/index.html')
    await expect(page.getByRole('heading', { name: 'Hardware Accelerator RTL Practice Problems' })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://hdlforge.netlify.app/practice/accelerators/')
    await expect(page.locator('a[href="/problems/accel-systolic-pe/"]')).toBeVisible()
    await expect(page.locator('a[href="/problems/accel-matmul2/"]')).toBeVisible()

    await page.goto('/learn/accelerators/index.html')
    await expect(page.getByRole('heading', { name: 'Hardware Accelerator Design Practice' })).toBeVisible()
    await expect(page.locator('a[href="/problems/accel-dot4/"]')).toBeVisible()
    await expect(page.locator('a[href="/problems/accel-conv3/"]')).toBeVisible()
  })

  test('sitemap includes accelerators and new executable problem pages', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBeTruthy()
    const xml = await response.text()
    expect(xml).toContain('https://hdlforge.netlify.app/practice/accelerators/')
    expect(xml).toContain('https://hdlforge.netlify.app/learn/accelerators/')
    expect(xml).toContain('https://hdlforge.netlify.app/problems/accel-matmul2/')
    expect(xml).toContain('https://hdlforge.netlify.app/problems/rtl-skid-buffer/')
    expect(xml).toContain('https://hdlforge.netlify.app/problems/proto-apb-register/')
    expect(xml).not.toContain('https://hdlforge.netlify.app/practice/computer-architecture/')
  })
})
