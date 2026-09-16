import { test, expect } from '@playwright/test'

const muxSolution = 'module mux2(input logic a, b, sel, output logic y);\n  assign y = sel ? b : a;\nendmodule'

async function openMux(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: 'Problems', exact: true }).first().click()
  await expect(page.locator('.problem-row').first()).toBeVisible()
  await page.locator('.problem-row').first().click()
  await expect(page.locator('.monaco-editor .view-lines')).toBeVisible()
  await page.locator('.monaco-editor .view-lines').click()
  await page.keyboard.press('Control+A')
  await page.keyboard.insertText(muxSolution)
}

test('removes the extra waveform title strip and keeps close in the toolbar row', async ({ page }) => {
  test.setTimeout(90_000)
  await openMux(page)
  await page.getByRole('button', { name: /Run tests/i }).first().click()
  await expect(page.getByText('HDLFORGE_PASS')).toBeVisible({ timeout: 60_000 })
  await page.getByRole('button', { name: 'Waveform', exact: true }).click()

  const window = page.locator('.waveform-window')
  const body = page.locator('.waveform-window-body')
  const toolbar = page.locator('.waveform-window .sim-v2-wave-toolbar')
  const close = page.getByRole('button', { name: 'Close waveform' })

  await expect(window).toBeVisible()
  await expect(toolbar).toBeVisible()
  await expect(close).toBeVisible()
  await expect(page.locator('.waveform-window-head > div')).toBeHidden()

  const windowBox = await window.boundingBox()
  const bodyBox = await body.boundingBox()
  const toolbarBox = await toolbar.boundingBox()
  const closeBox = await close.boundingBox()
  expect(windowBox && bodyBox && toolbarBox && closeBox).toBeTruthy()
  expect(Math.abs(bodyBox.y - windowBox.y)).toBeLessThanOrEqual(1)
  expect(Math.abs((closeBox.y + closeBox.height / 2) - (toolbarBox.y + toolbarBox.height / 2))).toBeLessThanOrEqual(2)

  await expect.poll(async () => {
    const last = page.locator('.waveform-window .sim-v2-tick.last')
    return (await last.count()) ? (await last.textContent()) : ''
  }).toBe('4 ns')
})
