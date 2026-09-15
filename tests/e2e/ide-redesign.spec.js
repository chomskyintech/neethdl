import{test,expect}from'@playwright/test'

test.describe('redesigned IDE shell',()=>{
 test('shows compact problem rail only inside the IDE',async({page})=>{
  await page.goto('/')
  await expect(page.locator('#hdlforge-ide-rail')).toHaveCount(0)
  await page.goto('/app/problems/rtl-fifo/')
  await expect(page.locator('#hdlforge-ide-rail')).toBeVisible()
  await expect(page.locator('.ide-rail-count')).toHaveText('44')
  await expect(page.locator('body')).toHaveClass(/hdlforge-ide-active/)
 })

 test('opens, searches and closes the problem drawer',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  await page.getByRole('button',{name:'Open problems'}).click()
  await expect(page.locator('#hdlforge-ide-drawer')).toHaveClass(/open/)
  await expect(page.locator('.ide-drawer-problem.active')).toContainText('Synchronous FIFO')
  await page.getByRole('searchbox',{name:'Search problems'}).fill('systolic')
  await expect(page.locator('.ide-drawer-problem:visible')).toHaveCount(1)
  await expect(page.locator('.ide-drawer-problem:visible')).toContainText('Systolic')
  await page.keyboard.press('Escape')
  await expect(page.locator('#hdlforge-ide-drawer')).not.toHaveClass(/open/)
 })

 test('navigates between coding problems from the drawer without a full page reload',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  await page.getByRole('button',{name:'Open problems'}).click()
  await page.getByRole('searchbox',{name:'Search problems'}).fill('APB Register Peripheral')
  await page.locator('.ide-drawer-problem:visible').click()
  await expect(page).toHaveURL(/\/app\/problems\/proto-apb-register\/$/)
  await expect(page).toHaveTitle(/APB Register Peripheral/)
  await expect(page.getByText('APB Register Peripheral',{exact:true}).first()).toBeVisible()
  await expect(page.locator('#hdlforge-ide-drawer')).not.toHaveClass(/open/)
 })
})
