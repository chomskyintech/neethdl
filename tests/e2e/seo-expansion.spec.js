import {test,expect} from '@playwright/test'

test.describe('HDLForge generated SEO coverage',()=>{
 test('generates indexable pages for later catalog problems',async({page})=>{
  await page.goto('/problems/sv-packed-arrays/index.html')
  await expect(page).toHaveTitle(/Packed.*HDLForge/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://hdlforge.netlify.app/problems/sv-packed-arrays/')
  await expect(page.locator('script[type="application/ld+json"]')).toContainText('BreadcrumbList')
 })

 test('serves topic hubs and deeper guides',async({page})=>{
  await page.goto('/learn/sva/index.html')
  await expect(page.getByRole('heading',{name:/SystemVerilog Assertions.*Practice/i})).toBeVisible()
  await page.goto('/learn/cdc-interview/index.html')
  await expect(page).toHaveTitle(/Clock Domain Crossing.*HDLForge/i)
  await expect(page.getByRole('heading',{name:'Clock Domain Crossing (CDC) Interview Guide'})).toBeVisible()
 })

 test('sitemap includes generated problem and learning URLs',async({request})=>{
  const response=await request.get('/sitemap.xml')
  expect(response.ok()).toBeTruthy()
  const xml=await response.text()
  expect(xml).toContain('https://hdlforge.netlify.app/problems/sv-packed-arrays/')
  expect(xml).toContain('https://hdlforge.netlify.app/learn/protocols/')
  expect(xml).toContain('https://hdlforge.netlify.app/learn/cdc-interview/')
 })
})

test('problem names use a softer neutral color instead of white',async({page})=>{
 await page.goto('/')
 await page.getByRole('button',{name:'Problems'}).click()
 const title=page.locator('.problem-main strong').first()
 await expect(title).toBeVisible()
 const color=await title.evaluate(el=>getComputedStyle(el).color)
 expect(color).toBe('rgb(201, 201, 201)')
})
