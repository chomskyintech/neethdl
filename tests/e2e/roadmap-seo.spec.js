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
    expect(scrollbar.colors).toContain('rgb(57, 57, 59)')
    expect(scrollbar.colors).toContain('rgb(31, 31, 32)')
    expect(scrollbar.track).toBe('rgb(31, 31, 32)')
    expect(['rgb(57, 57, 59)','rgb(118, 118, 122)']).toContain(scrollbar.thumb)
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
    await expect(page.locator('.topic-cloud-item')).toHaveCount(21)
    await expect(page.getByRole('button', { name: /FSMs\s*10/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Counters & Timers\s*4/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /FIFOs & Buffers\s*10/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /CPU \/ RISC-V\s*28/ })).toBeVisible()
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

    await expect(topicRows.filter({ hasText: 'Constrained Random' })).toContainText('0/8')
    await expect(topicRows.filter({ hasText: 'Functional Coverage' })).toContainText('0/8')
    await expect(topicRows.filter({ hasText: 'Formal Verification' })).toContainText('0/14')
    await expect(topicRows.filter({ hasText: 'Testbenches' })).toContainText('0/10')
    await expect(topicRows.filter({ hasText: 'Interfaces' })).toContainText('0/8')
    await expect(topicRows.filter({ hasText: 'SVA' })).toContainText('0/12')
    await expect(topicRows.filter({ hasText: 'UVM' })).toContainText('0/10')
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

  test('shows guided role roadmaps inside Problems without the Company Tracks card', async ({ page }) => {
    await page.goto('/app/problems/')
    await expect(page.locator('.desktop-nav').getByRole('button', { name: 'Tracks', exact: true })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Company tracks' })).toHaveCount(0)
    await expect(page.getByRole('complementary', { name: 'Guided Roadmap' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'RTL Design Engineer', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'CPU / GPU Hardware', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'SoC Design / Integration Engineer', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Formal Verification Engineer', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Embedded Hardware / Firmware Engineer', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'NoC / Interconnect Engineer', exact: true })).toBeVisible()
  })

  test('RTL Design roadmap opens a dedicated career page with related problems and projects', async ({ page }) => {
    await page.goto('/app/problems/')
    await page.getByRole('button', { name: 'RTL Design Engineer', exact: true }).click()

    await expect(page).toHaveURL(/\/app\/roadmaps\/rtl-design\/$/)
    await expect(page.getByRole('heading', { name: 'RTL Design Engineer', exact: true })).toBeVisible()
    await expect(page.locator('.career-problem')).toHaveCount(15)
    await expect(page.locator('.career-project-card')).toHaveCount(8)
    await expect(page.getByText('1. RTL fundamentals', { exact: true })).toBeVisible()
    await expect(page.getByText('3. Storage and flow control', { exact: true })).toBeVisible()
    await expect(page.getByText('Asynchronous FIFO / CDC', { exact: true })).toBeVisible()

    await page.locator('.career-problem').first().click()
    await expect(page).toHaveURL(/\/app\/problems\/rtl-mux\/$/)
    await expect(page.locator('.section-navigation')).toHaveText('RTL Design Engineer')
    await page.goBack()
    await expect(page).toHaveURL(/\/app\/roadmaps\/rtl-design\/$/)
  })

  test('Projects roadmap links to the same RTL Design career page', async ({ page }) => {
    await page.goto('/app/projects/')
    await page.getByRole('button', { name: 'RTL Design Engineer', exact: true }).click()
    await expect(page).toHaveURL(/\/app\/roadmaps\/rtl-design\/$/)
    await expect(page.getByRole('heading', { name: 'Projects for this path', exact: true })).toBeVisible()
  })

  test('serves crawlable RTL Design career index metadata', async ({ page }) => {
    await page.goto('/careers/rtl-design/index.html')
    await expect(page).toHaveTitle('RTL Design Engineer Roadmap | HDLForge')
    await expect(page.getByRole('heading', { name: 'RTL Design Engineer', exact: true })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://hdlforge.netlify.app/careers/rtl-design/')
    await expect(page.locator('a[href="/app/roadmaps/rtl-design/"]')).toBeVisible()
    await expect(page.locator('a[href="/problems/rtl-fifo/"]')).toBeVisible()
    await expect(page.locator('a[href="/projects/asynchronous-fifo/"]')).toBeVisible()
  })

  test('existing company-track deep links still open their guided sequence', async ({ page }) => {
    await page.goto('/app/problems/company/amd/rtl-fifo/')
    await expect(page.locator('.section-navigation')).toHaveText('AMD Track')
    await expect(page.getByRole('heading', { name: /Synchronous FIFO/i })).toBeVisible()
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
    await expect(page.getByRole('heading', { name: 'RTL Design Engineer', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Design Verification', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'FPGA Engineer', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'CPU / GPU Hardware', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Hardware Accelerator', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'SoC Design / Integration Engineer', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Formal Verification Engineer', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Embedded Hardware / Firmware Engineer', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'NoC / Interconnect Engineer', exact: true })).toBeVisible()
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
  test('new career roadmaps have working app routes and crawlable SEO pages', async ({ page }) => {
    const careers=[
      ['soc-design-integration','SoC Design / Integration Engineer'],
      ['formal-verification-engineer','Formal Verification Engineer'],
      ['embedded-hardware-firmware','Embedded Hardware / Firmware Engineer'],
      ['noc-interconnect','NoC / Interconnect Engineer'],
    ]
    for(const [slug,label] of careers){
      await page.goto(`/app/roadmaps/${slug}/`)
      await expect(page.getByRole('heading',{name:label,exact:true})).toBeVisible()
      await page.goto(`/careers/${slug}/index.html`)
      await expect(page.getByRole('heading',{name:label,exact:true})).toBeVisible()
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',`https://hdlforge.netlify.app/careers/${slug}/`)
    }
  })

  test('all career roadmap problem sections are titled collapsible dropdowns', async ({ page }) => {
    const careers=[
      ['rtl-design',4],
      ['design-verification',4],
      ['fpga-engineer',4],
      ['cpu-gpu-hardware',4],
      ['hardware-accelerator',4],
      ['soc-design-integration',3],
      ['formal-verification-engineer',3],
      ['embedded-hardware-firmware',3],
      ['noc-interconnect',4],
    ]

    for(const [slug,count] of careers){
      await page.goto(`/app/roadmaps/${slug}/`)
      const sections=page.locator('.career-milestone')
      const headers=page.locator('.career-milestone-head')
      await expect(sections).toHaveCount(count)
      await expect(headers).toHaveCount(count)

      await expect(headers.first()).toHaveAttribute('aria-expanded','true')
      if(count>1){
        await expect(headers.nth(1)).toHaveAttribute('aria-expanded','false')
        const secondList=sections.nth(1).locator('.career-problem-list')
        await expect(secondList).toBeHidden()
        await headers.nth(1).click()
        await expect(headers.nth(1)).toHaveAttribute('aria-expanded','true')
        await expect(secondList).toBeVisible()
        await headers.nth(1).click()
        await expect(headers.nth(1)).toHaveAttribute('aria-expanded','false')
        await expect(secondList).toBeHidden()
      }
    }
  })

  test('all career roadmap pages share one canonical palette', async ({ page }) => {
    const slugs=[
      'rtl-design',
      'design-verification',
      'fpga-engineer',
      'cpu-gpu-hardware',
      'hardware-accelerator',
      'soc-design-integration',
      'formal-verification-engineer',
      'embedded-hardware-firmware',
      'noc-interconnect',
    ]

    let baseline=null
    for(const slug of slugs){
      await page.goto(`/app/roadmaps/${slug}/`)
      await expect(page.locator('.career-workspace')).toBeVisible()

      const palette=await page.evaluate(() => {
        const style = selector => getComputedStyle(document.querySelector(selector))
        const hero=style('.career-hero')
        const roadmap=style('.career-workspace .guided-roadmap-card')
        const active=style('.career-workspace .guided-roadmap-item.active')
        const project=style('.career-project-card')
        const progress=style('.career-progress-track i')
        const number=style('.career-progress-number strong')
        const eyebrow=style('.career-eyebrow')
        return {
          heroBackground:hero.backgroundColor,
          heroBorder:hero.borderColor,
          roadmapBackground:roadmap.backgroundColor,
          roadmapBorder:roadmap.borderColor,
          activeColor:active.color,
          projectBackground:project.backgroundColor,
          projectBorder:project.borderColor,
          progressColor:progress.backgroundColor,
          numberColor:number.color,
          eyebrowColor:eyebrow.color,
        }
      })

      baseline ||= palette
      expect(palette).toEqual(baseline)
    }

    expect(baseline.heroBackground).toBe('rgb(35, 35, 38)')
    expect(baseline.projectBackground).toBe('rgb(35, 35, 38)')
    expect(baseline.heroBorder).toBe('rgb(58, 58, 63)')
    expect(baseline.activeColor).toBe('rgb(54, 164, 135)')
    expect(baseline.progressColor).toBe('rgb(54, 164, 135)')
    expect(baseline.numberColor).toBe('rgb(54, 164, 135)')
    expect(baseline.eyebrowColor).toBe('rgb(54, 164, 135)')
  })

  test('new standalone interview problems open in the editor', async ({ page }) => {
    const cases=[
      ['/app/problems/comb-decoder3to8/','3-to-8 Decoder'],
      ['/app/problems/seq-sticky-flag/','Sticky Status Flag'],
      ['/app/problems/fsm-seq1011/','1011 Sequence Detector'],
      ['/app/problems/fifo-counted/','Counted Synchronous FIFO'],
      ['/app/problems/tb-clock-reset/','Clock and Reset Generator'],
      ['/app/problems/if-clocking-block/','Interface Clocking Block'],
      ['/app/problems/sva-onehot-grant/','One-Hot Grant Assertion'],
      ['/app/problems/cr-weighted-distribution/','Weighted Random Distribution'],
      ['/app/problems/cov-cross-operation-size/','Cross Operation and Size'],
      ['/app/problems/uvm-sequence-item/','UVM Sequence Item'],
    ]
    for(const [url,title] of cases){
      await page.goto(url)
      await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible()
      await expect(page.locator('.editor-language select')).toHaveValue('SystemVerilog')
    }
  })

})
