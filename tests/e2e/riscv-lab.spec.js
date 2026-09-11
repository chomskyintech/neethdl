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
}

async function replaceCode(page,source){
 await page.locator('.monaco-editor .view-lines').click()
 await page.keyboard.press('Control+A')
 await page.keyboard.insertText(source)
}

test.describe('guided RV32I project',()=>{
 test('opens beside an editor and keeps later stages locked',async({page})=>{
  await openLab(page)
  await expect(page.getByRole('heading',{name:'Build the program counter'})).toBeVisible()
  await expect(page.getByText('Your task',{exact:true})).toBeVisible()
  await expect(page.locator('.lab-steps>button').nth(1)).toBeDisabled()
 })

 test('checks code, unlocks the next stage and persists progress',async({page})=>{
  await openLab(page)
  await replaceCode(page,pcSolution)
  await page.getByRole('button',{name:'Check code'}).click()
  await expect(page.getByText('Stage complete',{exact:true})).toBeVisible()
  await expect(page.locator('.check-list .pass')).toHaveCount(3)
  await page.getByRole('button',{name:/Next step/i}).click()
  await expect(page.getByRole('heading',{name:'Decode an instruction'})).toBeVisible()
  await page.reload()
  await page.getByRole('button',{name:'Projects',exact:true}).click()
  await page.getByRole('button',{name:/Start building/i}).click()
  await expect(page.getByRole('heading',{name:'Decode an instruction'})).toBeVisible()
  await expect(page.locator('.lab-steps>button').first()).toHaveClass(/done/)
 })
})
