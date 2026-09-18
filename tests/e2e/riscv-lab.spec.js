import{test,expect}from'@playwright/test'

async function reset(page){
 await page.goto('/')
 await page.evaluate(()=>localStorage.clear())
 await page.reload()
}

async function openProject(page){
 await page.getByRole('button',{name:'Projects',exact:true}).click()
 const card=page.getByRole('button',{name:/project: 32-bit RISC-V CPU/i})
 await expect(card).toBeVisible()
 await card.click()
}

test.describe('guided RV32I project',()=>{
 test('opens the first project block in the shared Problems IDE',async({page})=>{
  await reset(page)
  await openProject(page)
  await expect(page).toHaveURL(/\/app\/projects\/riscv-core\/rv32-pc\/$/)
  await expect(page.getByRole('heading',{name:'RISC-V Program Counter'})).toBeVisible()
  await expect(page.locator('.monaco-editor')).toBeVisible({timeout:15_000})
  await expect(page.locator('.riscv-lab')).toHaveCount(0)
  await expect(page.locator('#hdlforge-ide-problems-button')).toContainText('32-bit RISC-V CPU')
  await expect(page.locator('.ide-problem-navigation button').last()).toBeDisabled()
 })

 test('resumes at the first unfinished RISC-V block',async({page})=>{
  await page.goto('/')
  await page.evaluate(()=>localStorage.setItem('hdlforge-solved',JSON.stringify(['rv32-pc','rv32-decode'])))
  await page.reload()
  await openProject(page)
  await expect(page).toHaveURL(/\/app\/projects\/riscv-core\/rv32-register-file\/$/)
  await expect(page.getByRole('heading',{name:'RISC-V Register File'})).toBeVisible()
 })

 test('the same project blocks are ordinary standalone problems',async({page})=>{
  await reset(page)
  await page.getByRole('button',{name:'Problems',exact:true}).click()
  const search=page.getByPlaceholder('Search problems...')
  await search.fill('RISC-V Program Counter')
  const row=page.locator('.problem-row').filter({hasText:'RISC-V Program Counter'})
  await expect(row).toBeVisible()
  await row.click()
  await expect(page).toHaveURL(/\/app\/problems\/rv32-pc\/$/)
  await expect(page.locator('#hdlforge-ide-problems-button')).toContainText('CPU / RISC-V')
 })

 test('project ordering follows the eight CPU blocks',async({page})=>{
  await page.goto('/')
  await page.evaluate(()=>localStorage.setItem('hdlforge-solved',JSON.stringify(['rv32-pc'])))
  await page.reload()
  await openProject(page)
  await expect(page.getByRole('heading',{name:'RISC-V Instruction Decoder'})).toBeVisible()
  const previous=page.locator('.ide-problem-navigation button').first()
  const next=page.locator('.ide-problem-navigation button').last()
  await expect(previous).toBeEnabled()
  await expect(next).toBeDisabled()
  await previous.click()
  await expect(page).toHaveURL(/\/app\/projects\/riscv-core\/rv32-pc\/$/)
  await expect(page.getByRole('heading',{name:'RISC-V Program Counter'})).toBeVisible()
  await expect(page.locator('.ide-problem-navigation button').last()).toBeEnabled()
 })
})
