import {test,expect} from '@playwright/test'

test.describe('HDLForge application routing',()=>{
 test('main navigation updates the browser URL and history',async({page})=>{
  await page.goto('/')

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

  await page.getByRole('button',{name:'Courses',exact:true}).click()
  await expect(page).toHaveURL(/\/app\/courses\/$/)

  await expect(page.getByRole('button',{name:'Progress',exact:true})).toHaveCount(0)

  await page.getByRole('button',{name:'Home',exact:true}).click()
  await expect(page).toHaveURL(/\/$/)
 })

 test('legacy Progress URL redirects into Problems',async({page})=>{
  await page.goto('/app/progress/')
  await expect(page).toHaveURL(/\/app\/problems\/$/)
  await expect(page.getByRole('heading',{name:'Problems',exact:true})).toBeVisible()
  await expect(page.getByRole('region',{name:'Problem progress'})).toBeVisible()
 })

 test('direct interactive problem URLs restore the correct problem',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  await expect(page).toHaveURL(/\/app\/problems\/rtl-fifo\/$/)
  await expect(page).toHaveTitle('Synchronous FIFO | HDLForge')
 })

 test('legacy problem query links normalize to the routed problem URL',async({page})=>{
  await page.goto('/?problem=rtl-fifo')
  await expect(page).toHaveURL(/\/app\/problems\/rtl-fifo\/$/)
  await expect(page).toHaveTitle('Synchronous FIFO | HDLForge')
 })
})
