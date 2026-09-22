import fs from 'node:fs'
import {test,expect} from '@playwright/test'

test.describe('HDLForge discovery SEO',()=>{
 test('serves a crawlable company interview hub and company pages',async({page})=>{
  await page.goto('/companies/index.html')
  await expect(page).toHaveTitle(/Company-Specific Hardware Interview Practice.*HDLForge/i)
  await expect(page.getByRole('heading',{name:'Company-specific hardware interview practice'})).toBeVisible()
  await expect(page.locator('a[href="/companies/qualcomm-hardware-design-interview/"]')).toBeVisible()
  await expect(page.locator('a[href="/companies/jane-street-fpga-interview/"]')).toBeVisible()

  await page.goto('/companies/qualcomm-hardware-design-interview/index.html')
  await expect(page).toHaveTitle(/Qualcomm Hardware Design Interview Practice.*HDLForge/i)
  await expect(page.getByText(/not affiliated with Qualcomm/i)).toBeVisible()
  await expect(page.getByRole('heading',{name:'Practice set'})).toBeVisible()
  await expect(page.locator('a[href^="/problems/"]').first()).toBeVisible()
 })

 test('serves a crawlable hardware project library and detailed project pages',async({page})=>{
  await page.goto('/projects/index.html')
  await expect(page).toHaveTitle(/Hardware Design, RTL, FPGA & Verification Projects.*HDLForge/i)
  await expect(page.getByRole('heading',{name:'Hardware design projects'})).toBeVisible()
  await expect(page.locator('a[href="/projects/uvm-axi4-lite-verification/"]')).toBeVisible()
  await expect(page.locator('a[href="/projects/asynchronous-fifo/"]')).toBeVisible()

  await page.goto('/projects/uvm-axi4-lite-verification/index.html')
  await expect(page.getByRole('heading',{name:'UVM Verification Environment for an AXI4-Lite Peripheral'})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Implementation plan'})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Verification plan'})).toBeVisible()
  await expect(page.getByRole('heading',{name:'What to discuss in an interview'})).toBeVisible()
 })

 test('adds company and project libraries to the sitemap',async({request})=>{
  const response=await request.get('/sitemap.xml')
  expect(response.ok()).toBeTruthy()
  const xml=await response.text()
  expect(xml).toContain('https://hdlforge.netlify.app/companies/')
  expect(xml).toContain('https://hdlforge.netlify.app/companies/nvidia-hardware-design-interview/')
  expect(xml).toContain('https://hdlforge.netlify.app/projects/')
  expect(xml).toContain('https://hdlforge.netlify.app/projects/pipelined-risc-v-core/')
 })

 test('homepage exposes crawlable company and project links',async({page})=>{
  await page.goto('/home/')
  await expect(page.locator('a[href="/companies/"]')).toBeVisible()
  await expect(page.locator('a[href="/projects/"]')).toBeVisible()
 })

 test('Netlify only SPA-fallbacks app URLs and noindexes them',()=>{
  const config=fs.readFileSync('netlify.toml','utf8')
  expect(config).toContain('from = "/app/*"')
  expect(config).toContain('X-Robots-Tag = "noindex, follow"')
  expect(config).not.toContain('from = "/*"')
 })
})
