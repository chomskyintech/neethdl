import { test, expect } from '@playwright/test'

test.describe('HDLForge tracks and accounts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('opens curated company and role tracks', async ({ page }) => {
    await page.getByRole('button', { name: 'Tracks', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Company & role tracks' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Jane Street/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /HFT \/ FPGA/i })).toBeVisible()
    await page.getByRole('button', { name: /Verification/i }).click()
    await expect(page.getByRole('heading', { name: 'Verification preparation' })).toBeVisible()
    await expect(page.locator('.track-problem').first()).toBeVisible()
  })

  test('opens the account sign-in and signup dialog without affecting local mode', async ({ page }) => {
    await page.getByRole('button', { name: /Sign in/i }).click()
    await expect(page.getByRole('dialog', { name: 'HDLForge account' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sign in to HDLForge' })).toBeVisible()
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
    await page.getByRole('button', { name: 'Close account dialog' }).click()
    await expect(page.getByRole('dialog', { name: 'HDLForge account' })).toBeHidden()
  })
})
