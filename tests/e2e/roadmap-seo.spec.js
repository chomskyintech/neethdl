import { test, expect } from '@playwright/test'

test.describe('HDLForge navigation and SEO content', () => {
  test('landing page keeps only the primary hero content', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Hardware design practice for RTL, FPGA, VLSI & verification roles/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeVisible()
    await expect(page.locator('.landing-stats')).toHaveCount(0)
    await expect(page.locator('.destination-card')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Choose your workspace' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Hardware design practice resources' })).toHaveCount(0)
    await expect(page.locator('.topic-card')).toHaveCount(0)
    await expect(page.locator('.problem-row')).toHaveCount(0)
  })


  test('uses an integrated graphite scrollbar instead of the browser default rail', async ({ page }) => {
    await page.goto('/')
    const scrollbar = await page.evaluate(() => {
      const root = document.documentElement
      const base = getComputedStyle(root)
      const track = getComputedStyle(root, '::-webkit-scrollbar-track')
      const thumb = getComputedStyle(root, '::-webkit-scrollbar-thumb')
      const button = getComputedStyle(root, '::-webkit-scrollbar-button')
      return {
        width: base.scrollbarWidth,
        colors: base.scrollbarColor,
        track: track.backgroundColor,
        thumb: thumb.backgroundColor,
        radius: thumb.borderRadius,
        buttonDisplay: button.display,
      }
    })
    expect(scrollbar.width).toBe('thin')
    expect(scrollbar.colors).toContain('rgb(91, 91, 95)')
    expect(scrollbar.colors).toContain('rgb(15, 15, 15)')
    expect(scrollbar.track).toBe('rgb(15, 15, 15)')
    expect(['rgb(91, 91, 95)','rgb(119, 119, 125)']).toContain(scrollbar.thumb)
    expect(scrollbar.radius).toBe('999px')
    expect(scrollbar.buttonDisplay).toBe('none')
  })


  test('homepage floating nav remains visibly translucent over the hero', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('.app>.nav')
    await expect(nav).toBeVisible()
    const style = await nav.evaluate(el => {
      const s = getComputedStyle(el)
      return {
        backgroundImage: s.backgroundImage,
        backdropFilter: s.backdropFilter,
      }
    })
    expect(style.backgroundImage).toContain('linear-gradient')
    expect(style.backgroundImage).toContain('rgba(15, 15, 15, 0.42)')
    expect(style.backgroundImage).toContain('rgba(15, 15, 15, 0.08)')
    expect(style.backdropFilter).toContain('blur(9px)')
  })

  test('Start practice opens the Problems workspace', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start practice', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Problems' })).toBeVisible()
    await expect(page).toHaveURL(/\/app\/problems\/$/)
  })

  test('homepage SEO links remain crawlable and normal clicks open working app sections', async ({ page }) => {
    await page.goto('/')
    const problems = page.locator('.landing-resource-links a[href="/problems/"]')
    const learning = page.locator('.landing-resource-links a[href="/learn/"]')
    const companies = page.locator('.landing-resource-links a[href="/companies/"]')
    const projects = page.locator('.landing-resource-links a[href="/projects/"]')
    await expect(problems).toBeVisible()
    await expect(learning).toBeVisible()
    await expect(companies).toBeVisible()
    await expect(projects).toBeVisible()

    await problems.click()
    await expect(page).toHaveURL(/\/app\/problems\/$/)
    await expect(page.getByRole('heading', { name: 'Problems' })).toBeVisible()

    await page.goto('/')
    await page.locator('.landing-resource-links a[href="/learn/"]').click()
    await expect(page).toHaveURL(/\/learn\/$/)
    await expect(page.locator('h1').first()).toBeVisible()

    await page.goto('/')
    await page.locator('.landing-resource-links a[href="/companies/"]').click()
    await expect(page).toHaveURL(/\/app\/problems\/$/)
    await expect(page.getByRole('heading', { name: 'Problems' })).toBeVisible()

    await page.goto('/')
    await page.locator('.landing-resource-links a[href="/projects/"]').click()
    await expect(page).toHaveURL(/\/app\/projects\/$/)
    await expect(page.getByRole('heading', { name: 'Hardware design projects' })).toBeVisible()
  })

  test('Problems page owns problem sections and problem rows', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Problems', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Problems' })).toBeVisible()
    await expect(page.locator('.topic-cloud-item')).toHaveCount(4)
    const expandTopics = page.getByRole('button', { name: 'Expand', exact: true })
    await expect(expandTopics).toBeVisible()
    await expandTopics.click()
    await expect(page.locator('.topic-cloud-item')).toHaveCount(20)
    await expect(page.getByRole('button', { name: /FSMs\s*2/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Counters & Timers\s*4/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /FIFOs & Buffers\s*2/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /CPU \/ RISC-V\s*8/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Collapse', exact: true })).toBeVisible()
    await expect(page.locator('.problem-row').first()).toBeVisible()
  })

  test('shows verification areas as separate top-level topic accordions', async ({ page }) => {
    await page.goto('/app/problems/')
    await page.getByRole('button', { name: 'Expand', exact: true }).click()
    await expect(page.getByRole('button', { name: /Verification\s*6/ })).toHaveCount(0)

    const topicRows = page.locator('.topic-group-head')
    await expect(topicRows.filter({ hasText: 'Testbenches' })).toBeVisible()
    await expect(topicRows.filter({ hasText: 'Interfaces' })).toBeVisible()
    await expect(topicRows.filter({ hasText: 'SVA' })).toBeVisible()
    await expect(topicRows.filter({ hasText: 'Constrained Random' })).toBeVisible()
    await expect(topicRows.filter({ hasText: 'Functional Coverage' })).toBeVisible()
    await expect(topicRows.filter({ hasText: 'UVM' })).toBeVisible()
    await expect(topicRows.filter({ hasText: 'Scoreboards' })).toBeVisible()
    await expect(topicRows.filter({ hasText: 'Formal Verification' })).toBeVisible()

    await expect(topicRows.filter({ hasText: 'Constrained Random' })).toContainText('0/0')
    await expect(topicRows.filter({ hasText: 'Functional Coverage' })).toContainText('0/0')
    await expect(topicRows.filter({ hasText: 'Formal Verification' })).toContainText('0/0')
  })

  test('renders compact progress inside Problems and removes standalone Progress navigation', async ({ page }) => {
    await page.goto('/app/problems/')
    await expect(page.locator('.desktop-nav').getByRole('button', { name: 'Progress', exact: true })).toHaveCount(0)

    const progress = page.getByRole('region', { name: 'Problem progress' })
    await expect(progress).toBeVisible()
    await expect(progress).toContainText('HDLForge')
    await expect(progress).toContainText('Easy')
    await expect(progress).toContainText('Medium')
    await expect(progress).toContainText('Hard')
    await expect(progress).toContainText('Solved')
  })

  test('shows company tracks and guided role roadmaps inside Problems', async ({ page }) => {
    await page.goto('/app/problems/')
    await expect(page.locator('.desktop-nav').getByRole('button', { name: 'Tracks', exact: true })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Company tracks' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Guided Roadmap' })).toBeVisible()
    await expect(page.getByRole('button', { name: /AMD/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Arm/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Qualcomm/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /NVIDIA/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Jane Street/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'RTL Design Engineer', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'CPU / GPU Hardware', exact: true })).toBeVisible()
  })

  test('company track filters and orders its existing Problems, then opens a guided sequence', async ({ page }) => {
    await page.goto('/app/problems/')
    await page.getByRole('button', { name: /AMD/ }).click()

    const rows = page.locator('.problem-list .problem-row')
    await expect(rows).toHaveCount(10)
    await expect(rows.first()).toContainText(/FIFO/i)
    await expect(page.locator('.company-track-banner')).toContainText('AMD Track')

    await rows.first().click()
    await expect(page).toHaveURL(/\/app\/problems\/company\/amd\/rtl-fifo\/$/)
    await expect(page.locator('.section-navigation')).toHaveText('AMD Track')
    await expect(page.getByRole('button', { name: 'Next →' })).toBeDisabled()
  })

  test('legacy Tracks URL redirects into Problems', async ({ page }) => {
    await page.goto('/app/tracks/')
    await expect(page).toHaveURL(/\/app\/problems\/$/)
    await expect(page.getByRole('heading', { name: 'Problems' })).toBeVisible()
  })

  test('Projects page uses guided roadmap, project activity and compact project cards', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Projects', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Hardware design projects' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Guided Roadmap' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Project activity' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Connect to GitHub', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Company tracks' })).toHaveCount(0)
    await expect(page.locator('.project-category-chip')).toHaveCount(6)
    await expect(page.getByRole('heading', { name: 'Design Verification' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'RTL / Digital Design' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'FPGA', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'SoC / Embedded Hardware' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Low-Latency / HFT Hardware' })).toBeVisible()
    await expect(page.locator('.project-card-modern .project-build')).toHaveCount(0)
    await expect(page.locator('.project-card-modern .project-why')).toHaveCount(0)
  })

  test('Courses workspace is removed while learning resources remain available', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Courses', exact: true })).toHaveCount(0)
    await page.goto('/app/courses/')
    await expect(page).toHaveURL(/\/app\/problems\/$/)
    await expect(page.getByRole('heading', { name: 'Problems', exact: true })).toBeVisible()
  })

  test('removes Interview navigation and keeps sign in as an icon-only account control', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.desktop-nav').getByRole('button', { name: 'Interview', exact: true })).toHaveCount(0)
    await expect(page.locator('.desktop-nav').getByRole('button', { name: 'Courses', exact: true })).toHaveCount(0)
    const accountButton = page.getByRole('button', { name: 'Sign in', exact: true })
    await expect(accountButton).toBeVisible()
    await expect(accountButton).toHaveText('')
  })

  test('serves SEO learn page metadata and canonical route', async ({ page }) => {
    await page.goto('/learn/verilog-interview/index.html')
    await expect(page).toHaveTitle('Verilog Interview Questions & RTL Practice | HDLForge')
    await expect(page.getByRole('heading', { name: 'Verilog Interview Questions and RTL Practice' })).toBeVisible()
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://hdlforge.netlify.app/learn/verilog-interview/')
  })
})
