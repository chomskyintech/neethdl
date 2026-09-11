import {test,expect} from '@playwright/test'

test.describe('HDLForge generated SEO coverage',()=>{
 test('generates indexable pages for later catalog problems',async({page})=>{
  await page.goto('/problems/sv-packed-arrays/index.html')
  await expect(page).toHaveTitle(/Packed.*HDLForge/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://hdlforge.netlify.app/problems/sv-packed-arrays/')
  const structured=await page.locator('script[type="application/ld+json"]').textContent()
  expect(structured).toContain('BreadcrumbList')
 })

 test('serves topic hubs and deeper guides',async({page})=>{
  await page.goto('/learn/sva/index.html')
  await expect(page.getByRole('heading',{name:/SystemVerilog Assertions.*Practice/i})).toBeVisible()
  await page.goto('/learn/cdc-interview/index.html')
  await expect(page).toHaveTitle(/Clock Domain Crossing.*HDLForge/i)
  await expect(page.getByRole('heading',{name:'Clock Domain Crossing (CDC) Interview Guide'})).toBeVisible()
 })

 test('serves crawlable problem and learning indexes',async({page})=>{
  await page.goto('/problems/index.html')
  await expect(page).toHaveTitle(/Hardware Design Practice Problems.*HDLForge/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://hdlforge.netlify.app/problems/')
  await expect(page.locator('a[href="/problems/rtl-fifo/"]')).toBeVisible()

  await page.goto('/learn/index.html')
  await expect(page).toHaveTitle(/Hardware Design Learning.*HDLForge/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://hdlforge.netlify.app/learn/')
  await expect(page.locator('a[href="/learn/verilog-interview/"]')).toBeVisible()
 })

 test('homepage exposes crawlable links to SEO hubs',async({page})=>{
  await page.goto('/')
  await expect(page.locator('a[href="/learn/"]')).toBeVisible()
  await expect(page.locator('a[href="/problems/"]')).toBeVisible()
  await expect(page.locator('a[href="/learn/verilog-interview/"]')).toBeVisible()
 })

 test('sitemap includes generated problem and learning URLs',async({request})=>{
  const response=await request.get('/sitemap.xml')
  expect(response.ok()).toBeTruthy()
  const xml=await response.text()
  expect(xml).toContain('https://hdlforge.netlify.app/problems/sv-packed-arrays/')
  expect(xml).toContain('https://hdlforge.netlify.app/learn/protocols/')
  expect(xml).toContain('https://hdlforge.netlify.app/learn/cdc-interview/')
  expect(xml).toContain('https://hdlforge.netlify.app/learn/')
 })
})

test('problem rows stay dark and problem names use a softer neutral color',async({page})=>{
 await page.goto('/')
 await page.getByRole('button',{name:'Problems',exact:true}).click()
 const row=page.locator('.problem-row').first()
 await expect(row).toBeVisible()
 const bg=await row.evaluate(el=>getComputedStyle(el).backgroundColor)
 expect(bg).not.toBe('rgb(255, 255, 255)')
 expect(bg).not.toBe('rgba(255, 255, 255, 1)')
 const title=row.locator('.problem-main strong')
 expect(await title.evaluate(el=>getComputedStyle(el).color)).toBe('rgb(201, 201, 201)')
})
