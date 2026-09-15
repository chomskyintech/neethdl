import {test,expect} from '@playwright/test'

test.describe('HDLForge code splitting',()=>{
 test('homepage defers the problem editor bundle until a problem is opened',async({page})=>{
  const scripts=[]
  page.on('request',request=>{
   if(request.resourceType()==='script')scripts.push(new URL(request.url()).pathname)
  })

  await page.goto('/')
  await expect(page.getByRole('button',{name:'Problems',exact:true})).toBeVisible()
  await page.waitForLoadState('networkidle')

  expect(scripts.some(path=>/ProblemIDE|MonacoHDLEditor/i.test(path))).toBeFalsy()

  await page.getByRole('button',{name:'Problems',exact:true}).click()
  await page.locator('.problem-row').first().click()
  await expect(page.locator('.monaco-editor-stage')).toBeVisible()
  expect(scripts.some(path=>/ProblemIDE|MonacoHDLEditor/i.test(path))).toBeTruthy()
 })
})
