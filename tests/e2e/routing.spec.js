import {test,expect} from '@playwright/test'

test.describe('HDLForge application routing',()=>{
 test('main navigation updates the browser URL and history',async({page})=>{
  await page.goto('/')

  await expect(page.getByRole('heading',{name:'Problems',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Problems',exact:true}).click()
  await expect(page).toHaveURL(/\/app\/problems\/$/)

  await page.locator('.problem-row').first().click()
  await expect(page).toHaveURL(/\/app\/problems\/[^/]+\/$/)

  await page.goBack()
  await expect(page).toHaveURL(/\/app\/problems\/$/)
  await expect(page.getByRole('heading',{name:'Problems',exact:true})).toBeVisible()

  await expect(page.getByRole('button',{name:'Tracks',exact:true})).toHaveCount(0)

  await page.getByRole('button',{name:'Projects',exact:true}).click()
  await expect(page).toHaveURL(/\/app\/projects\/$/)

  await expect(page.getByRole('button',{name:'Courses',exact:true})).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Progress',exact:true})).toHaveCount(0)

  await page.getByRole('button',{name:'HDLForge home',exact:true}).click()
  await expect(page).toHaveURL(/\/home\/$/)
 })

 test('Problems landing defers editor JavaScript and full problem payloads until an editor opens',async({page})=>{
  const detailRequests=[]
  const problemIdeScriptRequests=[]
  page.on('request',request=>{
   const url=request.url()
   if(url.includes('/problem-data/'))detailRequests.push(url)
   if(/\/assets\/ProblemIDE-[^/]+\.js(?:\?|$)/.test(url))problemIdeScriptRequests.push(url)
  })

  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Problems',exact:true})).toBeVisible()
  expect(detailRequests).toHaveLength(0)
  expect(problemIdeScriptRequests).toHaveLength(0)

  await page.locator('.problem-row').first().click()
  await expect(page).toHaveURL(/\/app\/problems\/[^/]+\/$/)
  await expect.poll(()=>detailRequests.length).toBeGreaterThan(0)
  await expect.poll(()=>problemIdeScriptRequests.length).toBeGreaterThan(0)
  await expect(page.locator('.ide-page')).toBeVisible()
 })

 test('legacy Progress URL redirects into Problems',async({page})=>{
  await page.goto('/app/progress/')
  await expect(page).toHaveURL(/\/app\/problems\/$/)
  await expect(page.getByRole('heading',{name:'Problems',exact:true})).toBeVisible()
  await expect(page.getByRole('region',{name:'Problem progress'})).toBeVisible()
 })

 test('legacy Courses URL redirects into Problems',async({page})=>{
  await page.goto('/app/courses/')
  await expect(page).toHaveURL(/\/app\/problems\/$/)
  await expect(page.getByRole('heading',{name:'Problems',exact:true})).toBeVisible()
 })

 test('direct interactive problem URLs restore the correct problem',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  await expect(page).toHaveURL(/\/app\/problems\/rtl-fifo\/$/)
  await expect(page).toHaveTitle('Synchronous FIFO | HDLForge')
 })

 test('editor arrows finish the current topic before advancing to the next topic',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  await expect(page).toHaveTitle('Synchronous FIFO | HDLForge')

  await page.getByRole('button',{name:/Next/i}).first().click()
  await expect(page).toHaveURL(/\/app\/problems\/rtl-skid-buffer\/$/)

  await page.getByRole('button',{name:/Next/i}).first().click()
  await expect(page).toHaveURL(/\/app\/problems\/fifo-counted\/$/)

  await page.getByRole('button',{name:/Previous/i}).first().click()
  await expect(page).toHaveURL(/\/app\/problems\/rtl-skid-buffer\/$/)
 })

 test('legacy problem query links normalize to the routed problem URL',async({page})=>{
  await page.goto('/?problem=rtl-fifo')
  await expect(page).toHaveURL(/\/app\/problems\/rtl-fifo\/$/)
  await expect(page).toHaveTitle('Synchronous FIFO | HDLForge')
 })
})
