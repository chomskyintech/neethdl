import { test, expect } from '@playwright/test'

test('keeps the console collapse chevron directly between Console and Testbench', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/app/problems/rtl-mux/')

  const tabs = page.locator('.bottom-tabs')
  const consoleTab = tabs.getByRole('button', { name: /Console/ })
  const collapse = tabs.locator('.bottom-collapse')
  const testbench = tabs.getByRole('button', { name: /Testbench|Evaluation/ })

  await expect(consoleTab).toBeVisible()
  await expect(collapse).toBeVisible()
  await expect(testbench).toBeVisible()

  const consoleBox = await consoleTab.boundingBox()
  const collapseBox = await collapse.boundingBox()
  const testbenchBox = await testbench.boundingBox()

  expect(consoleBox).toBeTruthy()
  expect(collapseBox).toBeTruthy()
  expect(testbenchBox).toBeTruthy()

  const consoleCenter = consoleBox.x + consoleBox.width / 2
  const collapseCenter = collapseBox.x + collapseBox.width / 2
  const testbenchCenter = testbenchBox.x + testbenchBox.width / 2

  expect(collapseCenter).toBeGreaterThan(consoleCenter)
  expect(collapseCenter).toBeLessThan(testbenchCenter)
  expect(testbenchBox.x - (collapseBox.x + collapseBox.width)).toBeLessThanOrEqual(18)

  await collapse.click()
  await expect(page.locator('.ide-bottom')).toHaveClass(/collapsed/)
  await collapse.click()
  await expect(page.locator('.ide-bottom')).not.toHaveClass(/collapsed/)
})
