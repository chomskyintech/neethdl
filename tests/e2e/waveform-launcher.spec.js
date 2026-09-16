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

function expectSameBox(before, after, tolerance = 2) {
  for (const key of ['x', 'y', 'width', 'height']) {
    expect(Math.abs(after[key] - before[key])).toBeLessThanOrEqual(tolerance)
  }
}

test('waveform opens only over the editor and leaves console independent', async ({ page }) => {
  test.setTimeout(90_000)
  await openMux(page)
  await setSource(page, muxSolution)
  await page.getByRole('button', { name: /Run tests/i }).first().click()
  await expect(page.getByText('HDLFORGE_PASS')).toBeVisible({ timeout: 60_000 })

  const reset = page.getByRole('button', { name: 'Reset editor' })
  const launcher = page.getByRole('button', { name: 'Waveform', exact: true })
  const consolePanel = page.locator('.ide-bottom')
  const stage = page.locator('.waveform-editor-stage')
  const editor = page.locator('.monaco-editor-wrap')

  await expect(reset).toBeVisible()
  await expect(launcher).toBeVisible()
  await expect(page.locator('.bottom-tabs > button').filter({ hasText: /^Waveform$/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Console', exact: true })).toHaveClass(/active/)

  const launcherBox = await launcher.boundingBox()
  const resetBox = await reset.boundingBox()
  expect(launcherBox && resetBox).toBeTruthy()
  expect(Math.abs(launcherBox.y - resetBox.y)).toBeLessThanOrEqual(2)
  expect(launcherBox.x + launcherBox.width).toBeLessThanOrEqual(resetBox.x + 3)
  expect(resetBox.x - (launcherBox.x + launcherBox.width)).toBeLessThanOrEqual(16)

  const beforeConsole = await consolePanel.boundingBox()
  const beforeStage = await stage.boundingBox()
  expect(beforeConsole && beforeStage).toBeTruthy()

  await launcher.click()

  const window = page.locator('.waveform-window')
  const waveform = page.locator('.waveform-window .waveform-v2')
  await expect(window).toBeVisible()
  await expect(waveform).toBeVisible()
  await expect(page.locator('.waveform-window .sim-v2-wave-toolbar')).toBeVisible()
  await expect(launcher).toHaveAttribute('aria-pressed', 'true')

  // Opening waveform must not expand, collapse, switch or otherwise move Console.
  const afterConsole = await consolePanel.boundingBox()
  expect(afterConsole).toBeTruthy()
  expectSameBox(beforeConsole, afterConsole)
  await expect(page.getByRole('button', { name: 'Console', exact: true })).toHaveClass(/active/)
  await expect(consolePanel).not.toHaveClass(/collapsed/)

  // Monaco stays mounted underneath the waveform instead of being hidden with Console.
  await expect(editor).toBeVisible()

  // The waveform window owns exactly the editor stage and must stop above Console.
  const overlayBox = await window.boundingBox()
  const stageBox = await stage.boundingBox()
  expect(overlayBox && stageBox).toBeTruthy()
  expectSameBox(stageBox, overlayBox)
  expect(overlayBox.y + overlayBox.height).toBeLessThanOrEqual(afterConsole.y + 2)

  // Closing with the window X restores the editor without changing Console.
  await page.getByRole('button', { name: 'Close waveform' }).click()
  await expect(window).toHaveCount(0)
  await expect(launcher).toHaveAttribute('aria-pressed', 'false')
  expectSameBox(beforeConsole, await consolePanel.boundingBox())
  await expect(editor).toBeVisible()

  // Escape provides the same independent close path.
  await launcher.click()
  await expect(window).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(window).toHaveCount(0)
  await expect(launcher).toHaveAttribute('aria-pressed', 'false')
  expectSameBox(beforeConsole, await consolePanel.boundingBox())
})
