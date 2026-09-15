import { test, expect } from '@playwright/test'

test.describe('HDLForge structured practice SEO', () => {
  test('practice hub exposes distinct hardware practice paths', async ({ page }) => {
    await page.goto('/practice/index.html')
    await expect(page).toHaveTitle('Hardware Design Practice Paths | HDLForge')
    await expect(page.getByRole('heading', { name: 'Hardware Design Practice Paths' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Verilog Practice Problems/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /RTL Design Practice Problems/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Design Verification Practice Problems/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /FPGA Practice Problems/ })).toBeVisible()
  })

  test('Verilog practice page is indexable and links to real problems', async ({ page }) => {
    await page.goto('/practice/verilog/index.html')
    await expect(page).toHaveTitle('Verilog Practice Problems | HDLForge')
    await expect(page.getByRole('heading', { name: 'Verilog Practice Problems' })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://hdlforge.netlify.app/practice/verilog/')
    await expect(page.locator('a[href^="/problems/"]').first()).toBeVisible()
  })

  test('design verification path combines SystemVerilog, SVA and UVM practice', async ({ page }) => {
    await page.goto('/practice/design-verification/index.html')
    await expect(page.getByRole('heading', { name: 'Design Verification Practice Problems' })).toBeVisible()
    const body = page.locator('body')
    await expect(body).toContainText('SystemVerilog')
    await expect(body).toContainText('SVA')
    await expect(body).toContainText('UVM')
  })

  test('sitemap contains practice hub and priority practice paths', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBeTruthy()
    const xml = await response.text()
    expect(xml).toContain('https://hdlforge.netlify.app/practice/')
    expect(xml).toContain('https://hdlforge.netlify.app/practice/verilog/')
    expect(xml).toContain('https://hdlforge.netlify.app/practice/rtl-design/')
    expect(xml).toContain('https://hdlforge.netlify.app/practice/design-verification/')
    expect(xml).toContain('https://hdlforge.netlify.app/practice/fpga/')
  })
})
