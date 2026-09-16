import{test,expect}from'@playwright/test'

const pcSolution=`module rv32_pc(
  input logic clk, reset,
  input logic [31:0] pc_next,
  output logic [31:0] pc
);
  always_ff @(posedge clk) begin
    if (reset) pc <= 32'b0;
    else pc <= pc_next;
  end
endmodule`

async function openLab(page){
 await page.goto('/')
 await page.evaluate(()=>localStorage.clear())
 await page.reload()
 await page.getByRole('button',{name:'Projects',exact:true}).click()
 await page.getByRole('button',{name:/Start building/i}).click()
 await expect(page.getByTestId('riscv-lab')).toBeVisible()
 await expect(page.locator('.monaco-editor')).toBeVisible({timeout:15_000})
 await expect(page.getByRole('button',{name:'Project files'})).toBeVisible()
}

async function replaceCode(page,source){
 const input=page.locator('.monaco-editor textarea.inputarea').first()
 await expect(input).toBeAttached()
 await input.focus()
 await page.keyboard.press('Control+A')
 await page.keyboard.insertText(source)
}

test.describe('guided RV32I project',()=>{
 test('uses the shared editor shell with project files and block tabs',async({page})=>{
  await openLab(page)
  await expect(page.getByText('32-bit RISC-V CPU',{exact:true})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Program Counter'})).toBeVisible()
  await expect(page.getByText('Easy',{exact:true})).toBeVisible()
  await expect(page.getByText('Course',{exact:true})).toBeVisible()

  const tabs=page.locator('.project-task-tabs button')
  await expect(tabs).toHaveCount(4)
  await expect(tabs.nth(0)).toHaveText('Task')
  await expect(tabs.nth(1)).toHaveText('Approach')
  await expect(tabs.nth(2)).toHaveText('Solution')
  await expect(tabs.nth(3)).toHaveText('Discussion')

  await page.getByRole('button',{name:'Project files'}).click()
  await expect(page.locator('.project-file-drawer')).toHaveClass(/open/)
  await expect(page.locator('.project-file-item').first()).toContainText('rv32_pc.sv')
  await expect(page.locator('.project-file-item').nth(1)).toBeDisabled()
 })

 test('shows approach and solution without replacing the Monaco editor',async({page})=>{
  await openLab(page)
  const editor=page.locator('.monaco-editor')
  await expect(editor).toBeVisible()

  await page.locator('.project-task-tabs').getByRole('button',{name:'Approach'}).click()
  await expect(page.getByRole('heading',{name:'Approach'})).toBeVisible()
  await expect(editor).toBeVisible()

  await page.locator('.project-task-tabs').getByRole('button',{name:'Solution'}).click()
  await expect(page.getByRole('heading',{name:'Solution'})).toBeVisible()
  await expect(page.locator('.project-solution-code')).toContainText('always_ff')
  await expect(editor).toBeVisible()
 })

 test('checks code, unlocks the next file and persists progress',async({page})=>{
  await openLab(page)
  await replaceCode(page,pcSolution)
  await page.getByRole('button',{name:'Check code'}).click()
  await expect(page.getByText('Stage complete',{exact:true})).toBeVisible()
  await expect(page.locator('.check-list .pass')).toHaveCount(3)
  await page.getByRole('button',{name:/Next step/i}).click()
  await expect(page.getByRole('heading',{name:'Instruction Decoder'})).toBeVisible()
  await expect(page.locator('.code-heading strong')).toHaveText('rv32_decode.sv')

  await page.getByRole('button',{name:'Project files'}).click()
  await expect(page.locator('.project-file-item').filter({hasText:'rv32_decode.sv'})).toBeEnabled()

  await page.reload()
  await page.locator('.desktop-nav').getByRole('button',{name:'Projects',exact:true}).click()
  await page.getByRole('button',{name:/Start building/i}).click()
  await expect(page.getByRole('heading',{name:'Instruction Decoder'})).toBeVisible()
 })
})
