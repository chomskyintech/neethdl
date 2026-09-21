import{test,expect}from'@playwright/test'

async function reset(page){
  await page.goto('/')
  await page.evaluate(()=>localStorage.clear())
  await page.reload()
}

async function replaceEditorContents(page,source){
  await page.locator('.monaco-editor .view-lines').click()
  await page.keyboard.press('Control+A')
  await page.keyboard.insertText(source)
}

test.describe('guided project catalog',()=>{
  test('shows eight working guided projects',async({page})=>{
    await reset(page)
    await page.getByRole('button',{name:'Projects',exact:true}).click()

    const guided=page.locator('.guided-project-card')
    await expect(guided).toHaveCount(8)
    await expect(guided.filter({hasText:'32-bit RISC-V CPU'})).toContainText('8 modules')
    await expect(guided.filter({hasText:'UART Controller'})).toContainText('7 modules')
    await expect(guided.filter({hasText:'AXI4-Lite Slave Peripheral'})).toContainText('8 modules')
    await expect(guided.filter({hasText:'Asynchronous FIFO / CDC'})).toContainText('8 modules')
    await expect(guided.filter({hasText:'UVM AXI4-Lite Verification Environment'})).toContainText('7 modules')
    await expect(guided.filter({hasText:'Three-Stage Pipelined RISC-V Core'})).toContainText('7 modules')
    await expect(guided.filter({hasText:'Hardware DSP Pipeline'})).toContainText('6 modules')
    await expect(guided.filter({hasText:'Matrix-Multiplication Accelerator'})).toContainText('6 modules')
  })

  test('opens UART and can browse modules before solving them',async({page})=>{
    await reset(page)
    await page.getByRole('button',{name:'Projects',exact:true}).click()
    await page.getByRole('button',{name:/Start project: UART Controller/i}).click()

    await expect(page).toHaveURL(/\/app\/projects\/uart-controller\/uart-baud-tick\/$/)
    await expect(page.getByRole('heading',{name:'UART Baud Tick Generator'})).toBeVisible()

    const next=page.locator('.ide-problem-navigation button').last()
    await expect(next).toBeEnabled()
    await next.click()

    await expect(page).toHaveURL(/\/app\/projects\/uart-controller\/uart-tx-shift\/$/)
    await expect(page.getByRole('heading',{name:'UART TX Frame Shifter'})).toBeVisible()
  })

  test('routes directly into AXI-Lite and asynchronous FIFO projects',async({page})=>{
    await page.goto('/app/projects/axi-lite-slave/axi-aw-capture/')
    await expect(page.getByRole('heading',{name:'AXI-Lite AW Channel Capture'})).toBeVisible()
    await expect(page.locator('#hdlforge-ide-problems-button')).toContainText('AXI4-Lite Slave Peripheral')

    await page.goto('/app/projects/async-fifo/afifo-gray-sync/')
    await expect(page.getByRole('heading',{name:'Synchronize Gray Pointers'})).toBeVisible()
    await expect(page.locator('#hdlforge-ide-problems-button')).toContainText('Asynchronous FIFO / CDC')
  })

  test('groups buildable projects under career titles',async({page})=>{
    await reset(page)
    await page.getByRole('button',{name:'Projects',exact:true}).click()

    await expect(page.getByRole('heading',{name:'RTL Design Engineer'})).toBeVisible()
    await expect(page.getByRole('heading',{name:'Design Verification'})).toBeVisible()
    await expect(page.getByRole('heading',{name:'FPGA Engineer'})).toBeVisible()
    await expect(page.getByRole('heading',{name:'CPU / GPU Hardware'})).toBeVisible()
    await expect(page.getByRole('heading',{name:'Hardware Accelerator'})).toBeVisible()
    await expect(page.getByText(/Project Guides$/)).toHaveCount(0)
    await expect(page.locator('.project-category-chip').first()).toContainText('All · 8')
  })

  test('routes directly into the new guided projects',async({page})=>{
    await page.goto('/app/projects/uvm-axi4-lite-verification/uvm-axi-interface/')
    await expect(page.getByRole('heading',{name:'AXI-Lite Verification Interface'})).toBeVisible()

    await page.goto('/app/projects/pipelined-risc-v-core/pipe-forwarding/')
    await expect(page.getByRole('heading',{name:'EX Forwarding Unit'})).toBeVisible()

    await page.goto('/app/projects/hardware-dsp-pipeline/dsp-fixed-mac/')
    await expect(page.getByRole('heading',{name:'Signed Fixed-Point MAC'})).toBeVisible()

    await page.goto('/app/projects/matrix-multiplication-accelerator/matmul-mac-pe/')
    await expect(page.getByRole('heading',{name:'Matrix MAC Processing Element'})).toBeVisible()
  })

  test('guided module checks can solve a project stage',async({page})=>{
    await reset(page)
    await page.goto('/app/projects/uart-controller/uart-baud-tick/')

    const solution=`module uart_baud_tick #(parameter int DIV=4)(
  input logic clk,
  input logic reset,
  output logic tick
);
  logic [2:0] count;
  always_ff @(posedge clk) begin
    if (reset) begin
      count <= '0;
      tick <= 1'b0;
    end else if (count == DIV-1) begin
      count <= '0;
      tick <= 1'b1;
    end else begin
      count <= count + 1'b1;
      tick <= 1'b0;
    end
  end
endmodule`

    await replaceEditorContents(page,solution)
    await page.getByRole('button',{name:/Run test/i}).click()
    await expect(page.locator('.run-result')).toContainText('Accepted')
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hdlforge-solved')||'[]'))).toContain('uart-baud-tick')
  })
})
