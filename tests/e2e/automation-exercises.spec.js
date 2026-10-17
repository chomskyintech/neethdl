import { expect, test } from '@playwright/test'

const exerciseRoutes = [
  '/learn/automation-exercises/',
  '/learn/automation-exercises',
  '/automation-exercises/',
  '/automation-exercises',
  '/tooling-exercises/',
  '/tooling-exercises',
  '/learn/tooling-exercises/',
  '/learn/tooling-exercises',
  '/learn/automation/',
  '/learn/automation',
]

for (const route of exerciseRoutes) {
  test('opens the automation exercise directly at ' + route, async ({ page }) => {
    await page.goto(route)

    await expect(page).toHaveTitle(/HDLForge — Automation Exercises/)
    await expect(
      page.getByRole('heading', { name: 'Inspect a simulation run' }),
    ).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Exercise files' })).toBeVisible()
    await expect(page.getByLabel('Selected file content')).toContainText('CHECK_014')
    await expect(page.getByRole('heading', { name: 'Problems' })).toHaveCount(0)
    const pathname = new URL(page.url()).pathname
    const canonicalPath = route.replace(/\/$/, '')
    expect([canonicalPath, `${canonicalPath}/`]).toContain(pathname)
  })
}

test('exercise file tabs and demo check action work in the browser', async ({ page }) => {
  await page.goto('/learn/automation-exercises/')

  await page.getByRole('button', { name: /test_config\.yaml/ }).click()
  await expect(page.getByText('test_config.yaml', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Selected file content')).toContainText('counter_reset_test')

  await page.getByRole('button', { name: /Run checks/ }).click()
  await expect(page.getByText('DEMO ONLY:', { exact: false })).toBeVisible()
  await expect(page.getByText('No real tool was executed.', { exact: false })).toBeVisible()
})

test('Exit exercise returns to the Problems page', async ({ page }) => {
  await page.goto('/learn/automation-exercises/')
  await page.getByRole('button', { name: 'Exit exercise' }).click()

  await expect(page).toHaveURL(/\/problems\/$/)
})


test('tooling exercise link from the automation roadmap opens the interactive exercise', async ({ page }) => {
  await page.goto('/learn/hardware-verification-automation/')

  await page.getByRole('link', { name: /Open interactive tooling exercise/ }).click()

  await expect(page).toHaveTitle(/HDLForge — Automation Exercises/)
  await expect(
    page.getByRole('heading', { name: 'Inspect a simulation run' }),
  ).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Exercise files' })).toBeVisible()
})
