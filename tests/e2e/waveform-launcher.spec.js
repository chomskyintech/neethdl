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
}

async function setSource(page, source) {
  await page.locator('.monaco-editor .view-lines').click()
  await page.keyboard.press('Control+A')
  await page.keyboard.insertText(source)
}

test('waveform launches beside Reset editor and owns the editor workspace', async ({ page }) => {
  test.setTimeout(90_000)
  await openMux(page)
  await setSource(page, muxSolution)
  await page.getByRole('button', { name: /Run tests/i }).first().click()
  await expect(page.getByText('HDLFORGE_PASS')).toBeVisible({ timeout: 60_000 })

  const reset = page.getByRole('button', { name: 'Reset editor' })
  const launcher = page.getByRole('button', { name: 'Waveform', exact: true })
  await expect(reset).toBeVisible()
  await expect(launcher).toBeVisible()

  const bottomWaveform = page.locator('.bottom-tabs > button').filter({ hasText: /^Waveform$/ })
  await expect(bottomWaveform).toBeHidden()

  const resetBox = await reset.boundingBox()
  const launchBox = await launcher.boundingBox()
  expect(resetBox && launchBox).toBeTruthy()
  expect(Math.abs(launchBox.y - resetBox.y)).toBeLessThanOrEqual(2)
  expect(launchBox.x).toBeGreaterThanOrEqual(resetBox.x + resetBox.width - 2)
  expect(launchBox.x - (resetBox.x + resetBox.width)).toBeLessThanOrEqual(20)

  await launcher.click()
  const waveform = page.locator('.waveform-v2')
  await expect(waveform).toBeVisible()
  await expect(page.locator('.monaco-editor-wrap')).toBeHidden()

  const geometryError = await page.evaluate(() => {
    const bottom = document.querySelector('.ide-bottom')?.getBoundingClientRect()
    const workspace = document.querySelector('.ide-workspace')?.getBoundingClientRect()
    const tabs = document.querySelector('.file-tabs')?.getBoundingClientRect()
    if (!bottom || !workspace || !tabs) return 999
    return Math.max(
      Math.abs(bottom.left - workspace.left),
      Math.abs(bottom.right - workspace.right),
      Math.abs(bottom.top - tabs.bottom),
      Math.abs(bottom.height - (workspace.height - tabs.height - 2)),
    )
  })
  expect(geometryError).toBeLessThanOrEqual(4)

  await expect(page.locator('.sim-v2-wave-toolbar')).toBeVisible()
  await expect(launcher).toHaveAttribute('aria-pressed', 'true')
})
