import { test, expect } from '@playwright/test'

const guides = [
  ['axi-lite-verification','AXI-Lite Verification Guide'],
  ['ready-valid-handshake-rtl','Ready/Valid Handshake RTL Guide'],
  ['verilog-fifo-design','Verilog FIFO Design Guide'],
  ['asynchronous-fifo-cdc','Asynchronous FIFO and CDC Guide'],
  ['systolic-array-rtl','Systolic Array RTL Design Guide'],
  ['hardware-accelerator-design','Hardware Accelerator RTL Design Guide'],
  ['uvm-scoreboard-guide','UVM Scoreboard Guide'],
  ['sva-handshake-assertions','SVA Handshake Assertions Guide'],
]

test.describe('high-intent implementation guides', () => {
  test('serves all deep-dive guides with canonical URLs and useful practice links', async ({ page }) => {
    for (const [slug, title] of guides) {
      await page.goto(`/learn/${slug}/index.html`)
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://hdlforge.netlify.app/learn/${slug}/`)
      await expect(page.getByRole('heading', { name: 'Practice with executable problems' })).toBeVisible()
      await expect(page.locator('a[href^="/problems/"]').first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Verification checklist' })).toBeVisible()
    }
  })

  test('links AXI, FIFO, accelerator and DV guides to relevant executable problems', async ({ page }) => {
    await page.goto('/learn/axi-lite-verification/index.html')
    await expect(page.locator('a[href="/problems/proto-axi-lite-write/"]')).toBeVisible()
    await expect(page.locator('a[href="/projects/uvm-axi4-lite-verification/"]')).toBeVisible()

    await page.goto('/learn/verilog-fifo-design/index.html')
    await expect(page.locator('a[href="/problems/rtl-fifo/"]')).toBeVisible()
    await expect(page.locator('a[href="/projects/asynchronous-fifo/"]')).toBeVisible()

    await page.goto('/learn/systolic-array-rtl/index.html')
    await expect(page.locator('a[href="/problems/accel-systolic-pe/"]')).toBeVisible()
    await expect(page.locator('a[href="/problems/accel-mac8/"]')).toBeVisible()

    await page.goto('/learn/uvm-scoreboard-guide/index.html')
    await expect(page.locator('a[href="/problems/uvm-scoreboard/"]')).toBeVisible()

    await page.goto('/learn/sva-handshake-assertions/index.html')
    await expect(page.locator('a[href="/problems/sva-handshake/"]')).toBeVisible()
  })

  test('adds deep dives to learning and topic hubs', async ({ page }) => {
    await page.goto('/learn/index.html')
    await expect(page.getByRole('heading', { name: 'Implementation deep dives' })).toBeVisible()
    await expect(page.locator('a[href="/learn/axi-lite-verification/"]')).toBeVisible()
    await expect(page.locator('a[href="/learn/hardware-accelerator-design/"]')).toBeVisible()

    await page.goto('/learn/uvm/index.html')
    await expect(page.getByRole('heading', { name: 'Related implementation guides' })).toBeVisible()
    await expect(page.locator('a[href="/learn/uvm-scoreboard-guide/"]')).toBeVisible()

    await page.goto('/practice/accelerators/index.html')
    await expect(page.getByRole('heading', { name: 'Related implementation guides' })).toBeVisible()
    await expect(page.locator('a[href="/learn/systolic-array-rtl/"]')).toBeVisible()
  })

  test('includes all high-intent guides in sitemap', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBeTruthy()
    const xml = await response.text()
    for (const [slug] of guides) {
      expect(xml).toContain(`https://hdlforge.netlify.app/learn/${slug}/`)
    }
  })
})
