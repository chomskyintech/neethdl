import { test, expect } from '@playwright/test'

test.describe('HDLForge tracks and accounts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('opens curated company and role tracks inside Problems', async ({ page }) => {
    await page.getByRole('button', { name: 'Problems', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Problems' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Company tracks' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Jane Street/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /HFT \/ FPGA/i })).toBeVisible()

    await page.getByRole('button', { name: /Verification/i }).click()
    await expect(page).toHaveURL(/\/app\/problems\/company\/verification\/$/)
    await expect(page.locator('.company-track-banner')).toContainText('Verification Track')
    await expect(page.locator('.problem-list .problem-row').first()).toBeVisible()
  })

  test('opens the account sign-in and signup dialog without affecting local mode', async ({ page }) => {
    await page.getByRole('button', { name: /Sign in/i }).click()
    await expect(page.getByRole('dialog', { name: 'HDLForge account' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sign in to HDLForge' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await page.getByRole('button', { name: 'Close account dialog' }).click()
    await expect(page.getByRole('dialog', { name: 'HDLForge account' })).toBeHidden()
  })
})
