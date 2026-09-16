import{test,expect}from'@playwright/test'

test.describe('redesigned IDE shell',()=>{
 test('shows the Problems button only inside the IDE and no vertical rail',async({page})=>{
  await page.goto('/')
  await expect(page.locator('#hdlforge-ide-problems-button')).toHaveCount(0)
  await expect(page.locator('#hdlforge-ide-rail')).toHaveCount(0)
  await page.goto('/app/problems/rtl-fifo/')
  await expect(page.getByRole('button',{name:'Open problems'})).toBeVisible()
  await expect(page.locator('.ide-topbar-problems-count')).toHaveText('44')
  await expect(page.locator('#hdlforge-ide-rail')).toHaveCount(0)
  await expect(page.locator('body')).toHaveClass(/hdlforge-ide-active/)
 })

 test('keeps the problem and editor as separate rounded panes',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  const problemRadius=await page.locator('.ide-problem').evaluate(el=>getComputedStyle(el).borderRadius)
  const workspaceRadius=await page.locator('.ide-workspace').evaluate(el=>getComputedStyle(el).borderRadius)
  expect(problemRadius).not.toBe('0px')
  expect(workspaceRadius).not.toBe('0px')
 })

 test('keeps equal outer gutters and no persistent blue divider',async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/app/problems/rtl-fifo/')

  const frame=page.locator('.ide-body')
  const frameBox=await frame.boundingBox()
  expect(frameBox).toBeTruthy()
  const leftGap=frameBox.x
  const rightGap=1440-(frameBox.x+frameBox.width)
  expect(Math.abs(leftGap-rightGap)).toBeLessThanOrEqual(1)

  const overflow=await page.evaluate(()=>({
   innerWidth:window.innerWidth,
   rootWidth:document.documentElement.scrollWidth,
   bodyWidth:document.body.scrollWidth
  }))
  expect(overflow.rootWidth).toBeLessThanOrEqual(overflow.innerWidth)
  expect(overflow.bodyWidth).toBeLessThanOrEqual(overflow.innerWidth)

  const divider=page.locator('.ide-panel-resizer')
  await expect(divider).toBeVisible()
  const dividerStyle=await divider.evaluate(el=>{
   const pseudo=getComputedStyle(el,'::before')
   return{opacity:pseudo.opacity,background:pseudo.backgroundColor}
  })
  expect(dividerStyle.opacity).toBe('0')
  expect(dividerStyle.background).toBe('rgb(74, 74, 74)')
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

 test('uses the larger neutral IDE palette in the problem drawer',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  await page.getByRole('button',{name:'Open problems'}).click()

  const drawer=page.locator('#hdlforge-ide-drawer')
  const header=drawer.locator('.ide-drawer-header')
  const search=drawer.locator('.ide-drawer-search')
  const active=drawer.locator('.ide-drawer-problem.active')

  await expect(drawer).toHaveClass(/open/)
  await expect(active).toBeVisible()

  const drawerBox=await drawer.boundingBox()
  expect(drawerBox).toBeTruthy()
  expect(drawerBox.width).toBeGreaterThanOrEqual(420)
  expect(await drawer.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(31, 31, 31)')
  expect(await header.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(38, 38, 38)')
  expect(await search.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(30, 30, 30)')
  expect(await active.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(48, 48, 48)')
 })

 test('navigates between coding problems from the drawer without a full page reload',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  await page.getByRole('button',{name:'Open problems'}).click()
  await page.getByRole('searchbox',{name:'Search problems'}).fill('APB Register Peripheral')
  await page.locator('.ide-drawer-problem:visible').click()
  await expect(page).toHaveURL(/\/app\/problems\/proto-apb-register\/$/)
  await expect(page).toHaveTitle(/APB Register Peripheral/)
  await expect(page.getByText('APB Register Peripheral',{exact:true}).first()).toBeVisible()
  await expect(page.getByRole('button',{name:'Open problems'})).toBeVisible()
  await expect(page.locator('#hdlforge-ide-drawer')).not.toHaveClass(/open/)
 })

 test('hides tab-strip scrollbars and matches the statement scrollbar to the neutral palette',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')

  const tabs=page.locator('.ide-problem>.problem-tabs')
  const statement=page.locator('.ide-problem-content')
  await expect(tabs).toBeVisible()
  await expect(statement).toBeVisible()

  const tabStyles=await tabs.evaluate(el=>{
   const style=getComputedStyle(el)
   return{overflowX:style.overflowX,overflowY:style.overflowY,scrollbarWidth:style.scrollbarWidth}
  })
  expect(tabStyles.overflowX).toBe('hidden')
  expect(tabStyles.overflowY).toBe('hidden')
  expect(tabStyles.scrollbarWidth).toBe('none')

  const statementStyles=await statement.evaluate(el=>{
   const style=getComputedStyle(el)
   return{overflowX:style.overflowX,overflowY:style.overflowY,scrollbarColor:style.scrollbarColor}
  })
  expect(statementStyles.overflowX).toBe('hidden')
  expect(statementStyles.overflowY).toBe('auto')
  expect(statementStyles.scrollbarColor).toContain('rgb(85, 85, 85)')
  expect(statementStyles.scrollbarColor).toContain('rgb(38, 38, 38)')
 })

 test('keeps the account control icon-only',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  const signIn=page.locator('#hdlforge-ide-signin')
  await expect(signIn).toBeVisible()
  await expect(signIn.locator('span')).toBeHidden()
  const box=await signIn.boundingBox()
  expect(box).toBeTruthy()
  expect(box.width).toBeLessThanOrEqual(40)
 })

 test('keeps language control borderless and reset beside it',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  const picker=page.locator('.editor-language')
  const select=picker.locator('select')
  const reset=page.locator('.file-tabs .icon-btn')
  await expect(picker).toBeVisible()
  await expect(reset).toBeVisible()

  expect(await picker.evaluate(el=>getComputedStyle(el).boxShadow)).toBe('none')
  await select.focus()
  const focused=await select.evaluate(el=>{const s=getComputedStyle(el);return{outline:s.outlineStyle,border:s.borderTopWidth,shadow:s.boxShadow}})
  expect(focused.outline).toBe('none')
  expect(focused.border).toBe('0px')
  expect(focused.shadow).toBe('none')

  const pickerBox=await picker.boundingBox()
  const resetBox=await reset.boundingBox()
  expect(pickerBox).toBeTruthy()
  expect(resetBox).toBeTruthy()
  expect(resetBox.x-(pickerBox.x+pickerBox.width)).toBeLessThanOrEqual(12)
 })

 test('puts the collapse chevron immediately after Console',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')

  const consoleTab=page.locator('.bottom-tabs>button').first()
  const collapseButton=page.locator('.bottom-collapse')
  await expect(consoleTab).toContainText('Console')
  await expect(collapseButton).toBeVisible()

  const consoleBox=await consoleTab.boundingBox()
  const collapseBox=await collapseButton.boundingBox()
  expect(consoleBox).toBeTruthy()
  expect(collapseBox).toBeTruthy()

  const consoleRight=consoleBox.x+consoleBox.width
  expect(collapseBox.x).toBeGreaterThanOrEqual(consoleRight-14)
  expect(collapseBox.x).toBeLessThanOrEqual(consoleRight+8)
  const collapseCenterY=collapseBox.y+collapseBox.height/2
  const consoleCenterY=consoleBox.y+consoleBox.height/2
  expect(Math.abs(collapseCenterY-consoleCenterY)).toBeLessThanOrEqual(2)
 })

 test('keeps run and collapse controls in the draggable console header',async({page})=>{
  await page.goto('/app/problems/rtl-fifo/')
  await expect(page.locator('.ide-bottom')).toBeVisible()

  const consolePanel=page.locator('.ide-bottom')
  const runButton=page.getByRole('button',{name:/Run tests/i}).first()
  const collapseButton=page.locator('.bottom-collapse')

  await expect(runButton).toBeVisible()
  await expect(collapseButton).toBeVisible()
  expect(await collapseButton.evaluate(el=>getComputedStyle(el).fontSize)).toBe('0px')

  const before=await consolePanel.boundingBox()
  const runBox=await runButton.boundingBox()
  expect(before).toBeTruthy()
  expect(runBox).toBeTruthy()
  expect(runBox.x).toBeGreaterThan(before.x+before.width-90)
  expect(runBox.y).toBeGreaterThanOrEqual(before.y-2)
  expect(runBox.y+runBox.height).toBeLessThanOrEqual(before.y+42)

  await page.mouse.move(before.x+before.width/2,before.y+4)
  await page.mouse.down()
  await page.mouse.move(before.x+before.width/2,before.y-60,{steps:6})
  await page.mouse.up()

  const after=await consolePanel.boundingBox()
  expect(after.height).toBeGreaterThan(before.height+30)

  await collapseButton.click()
  await expect(consolePanel).toHaveClass(/collapsed/)
 })
})
