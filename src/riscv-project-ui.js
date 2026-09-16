import './riscv-project-ui.css'

const files = [
  { file: 'rv32_pc.sv', block: 'Program Counter', difficulty: 'Easy', approach: ['Use one clocked always_ff block.', 'Reset pc to address zero.', 'Otherwise load pc_next on each rising clock edge.'] },
  { file: 'rv32_decode.sv', block: 'Instruction Decoder', difficulty: 'Easy', approach: ['Treat decode as pure combinational wiring.', 'Slice opcode and rd first.', 'Then add funct3, rs1, rs2 and funct7 from their fixed RV32I bit positions.'] },
  { file: 'rv32_regs.sv', block: 'Register File', difficulty: 'Medium', approach: ['Declare 32 registers of 32 bits.', 'Implement the two read ports combinationally.', 'Implement one clocked write port and block writes to x0.'] },
  { file: 'rv32_imm.sv', block: 'Immediate Generator', difficulty: 'Medium', approach: ['Start with a safe default value for imm.', 'Use opcode to select the immediate format.', 'Implement I-type sign extension first.', 'Reassemble S-type from instr[31:25] and instr[11:7].', 'Add B, U and J formats after the first two pass.'] },
  { file: 'rv32_alu.sv', block: 'Arithmetic Logic Unit', difficulty: 'Medium', approach: ['Keep the ALU combinational.', 'Use alu_op as the single operation selector.', 'Implement arithmetic and logic operations first.', 'Add signed comparison and the three shifts last.'] },
  { file: 'rv32_branch.sv', block: 'Branch & Jump Control', difficulty: 'Medium', approach: ['Calculate the PC-relative target independently.', 'Default branch_taken low.', 'Decode funct3 for BEQ and BNE comparisons.', 'Keep comparison and target generation combinational.'] },
  { file: 'rv32_mem_control.sv', block: 'Memory Control', difficulty: 'Medium', approach: ['Default every control signal low.', 'Decode LOAD to enable memory read and register writeback.', 'Decode STORE to enable memory write.', 'Only enable signals required by the selected opcode.'] },
  { file: 'rv32_core.sv', block: 'RV32I Core Integration', difficulty: 'Hard', approach: ['Instantiate the blocks you built in earlier files.', 'Wire the instruction path from PC through decode and execute.', 'Select pc + 4 or the branch target for pc_next.', 'Connect the data-memory path and writeback multiplexer.', 'Check each interface before adding the next connection.'] },
]

let scheduled = false

function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text
}

function setHTML(node, html) {
  if (node && node.innerHTML !== html) node.innerHTML = html
}

function activeIndex(lab) {
  const buttons = [...lab.querySelectorAll('.lab-steps > button')]
  const index = buttons.findIndex(button => button.classList.contains('active'))
  return Math.max(0, index)
}

function unlockedCount(lab) {
  return [...lab.querySelectorAll('.lab-steps > button')].filter(button => !button.disabled).length
}

function completeCount(lab) {
  return [...lab.querySelectorAll('.lab-steps > button')].filter(button => button.classList.contains('done')).length
}

function difficultyClass(value) {
  return `difficulty-${value.toLowerCase()}`
}

function ensureTopbar(lab) {
  const topbar = lab.querySelector('.lab-topbar')
  const back = topbar?.querySelector('.lab-back')
  const title = topbar?.querySelector('.lab-title')
  if (!topbar || !back || !title) return

  let menu = topbar.querySelector('.project-file-menu')
  if (!menu) {
    menu = document.createElement('button')
    menu.type = 'button'
    menu.className = 'project-file-menu'
    menu.setAttribute('aria-label', 'Project files')
    menu.title = 'Project files'
    menu.innerHTML = '<span class="project-file-menu-lines" aria-hidden="true"></span>'
    menu.addEventListener('click', () => toggleDrawer(lab, true))
    back.insertAdjacentElement('afterend', menu)
  }

  setText(title.querySelector('strong'), '32-bit RISC-V CPU')
  setText(title.querySelector('span'), `${files.length} files · RV32I`)
}

function ensureDrawer(lab) {
  let backdrop = lab.querySelector('.project-file-drawer-backdrop')
  let drawer = lab.querySelector('.project-file-drawer')
  if (!backdrop) {
    backdrop = document.createElement('div')
    backdrop.className = 'project-file-drawer-backdrop'
    backdrop.addEventListener('click', () => toggleDrawer(lab, false))
    lab.appendChild(backdrop)
  }
  if (!drawer) {
    drawer = document.createElement('aside')
    drawer.className = 'project-file-drawer'
    drawer.setAttribute('aria-label', 'Project files')
    drawer.innerHTML = '<div class="project-file-drawer-head"><div><strong>Project files</strong><span>Build in order</span></div><button type="button" class="project-file-drawer-close" aria-label="Close project files">×</button></div><div class="project-file-list"></div>'
    drawer.querySelector('.project-file-drawer-close').addEventListener('click', () => toggleDrawer(lab, false))
    drawer.querySelector('.project-file-list').addEventListener('click', event => {
      const item = event.target.closest('.project-file-item[data-index]')
      if (!item || item.disabled) return
      const original = lab.querySelectorAll('.lab-steps > button')[Number(item.dataset.index)]
      if (!original || original.disabled) return
      original.click()
      toggleDrawer(lab, false)
    })
    lab.appendChild(drawer)
  }
  renderDrawer(lab)
}

function toggleDrawer(lab, open) {
  lab.querySelector('.project-file-drawer')?.classList.toggle('open', open)
  lab.querySelector('.project-file-drawer-backdrop')?.classList.toggle('open', open)
}

function renderDrawer(lab) {
  const list = lab.querySelector('.project-file-list')
  const sourceButtons = [...lab.querySelectorAll('.lab-steps > button')]
  if (!list || sourceButtons.length !== files.length) return
  const current = activeIndex(lab)
  const complete = completeCount(lab)
  const unlocked = unlockedCount(lab)
  const renderKey = `${current}:${complete}:${unlocked}:${sourceButtons.map(button => `${button.classList.contains('done') ? 1 : 0}${button.disabled ? 1 : 0}`).join('')}`
  if (list.dataset.renderKey === renderKey) return
  list.dataset.renderKey = renderKey

  const sections = [
    ['Completed', files.map((_, i) => i).filter(i => i < complete)],
    ['Current', [current]],
    ['Next to build', files.map((_, i) => i).filter(i => i > current && i >= complete)],
  ]
  const used = new Set()
  let html = ''
  for (const [label, indices] of sections) {
    const unique = indices.filter(index => index >= 0 && index < files.length && !used.has(index))
    if (!unique.length) continue
    html += `<div class="project-file-section">${label}</div>`
    for (const index of unique) {
      used.add(index)
      const meta = files[index]
      const original = sourceButtons[index]
      const done = original.classList.contains('done')
      const isCurrent = index === current
      const enabled = index < unlocked
      html += `<button type="button" data-index="${index}" class="project-file-item${done ? ' done' : ''}${isCurrent ? ' current' : ''}" ${enabled ? '' : 'disabled'}><span class="project-file-state">${done ? '✓' : index + 1}</span><span class="project-file-copy"><small>FILE ${index + 1}</small><strong>${meta.file}</strong></span><span class="project-file-status">${done ? 'done' : isCurrent ? 'editing' : enabled ? 'next' : 'locked'}</span></button>`
    }
  }
  list.innerHTML = html
}

function ensureTabs(lab) {
  const pane = lab.querySelector('.lesson-pane')
  const scroll = pane?.querySelector('.lesson-scroll')
  if (!pane || !scroll) return

  let tabs = pane.querySelector('.project-task-tabs')
  if (!tabs) {
    tabs = document.createElement('div')
    tabs.className = 'project-task-tabs'
    for (const name of ['task', 'approach', 'solution', 'discussion']) {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.projectTab = name
      button.textContent = name[0].toUpperCase() + name.slice(1)
      button.addEventListener('click', () => setProjectTab(lab, name))
      tabs.appendChild(button)
    }
    pane.insertBefore(tabs, scroll)
  }

  for (const name of ['approach', 'solution', 'discussion']) {
    if (pane.querySelector(`[data-project-panel="${name}"]`)) continue
    const panel = document.createElement('div')
    panel.className = 'project-tab-panel'
    panel.dataset.projectPanel = name
    pane.appendChild(panel)
  }

  if (!lab.dataset.projectTab) lab.dataset.projectTab = 'task'
  renderProjectTab(lab)
}

function setProjectTab(lab, name) {
  lab.dataset.projectTab = name
  if (name === 'solution') ensureSolutionAvailable(lab)
  renderProjectTab(lab)
}

function renderProjectTab(lab) {
  const pane = lab.querySelector('.lesson-pane')
  const scroll = pane?.querySelector('.lesson-scroll')
  if (!pane || !scroll) return
  const selected = lab.dataset.projectTab || 'task'
  pane.querySelectorAll('.project-task-tabs button').forEach(button => button.classList.toggle('active', button.dataset.projectTab === selected))
  scroll.style.display = selected === 'task' ? '' : 'none'
  pane.querySelectorAll('.project-tab-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.projectPanel === selected))
  updateCustomPanels(lab)
}

function ensureSolutionAvailable(lab) {
  if (lab.querySelector('.reference-code')) return
  const button = lab.querySelector('.solution-button')
  if (!button || button.dataset.projectOpening === 'true') return
  button.dataset.projectOpening = 'true'
  button.click()
  requestAnimationFrame(() => {
    button.dataset.projectOpening = 'false'
    schedule()
  })
}

function updateLesson(lab) {
  const index = activeIndex(lab)
  const meta = files[index]
  const scroll = lab.querySelector('.lesson-scroll')
  const title = scroll?.querySelector('h1')
  const concept = scroll?.querySelector('.lesson-concept')
  if (!scroll || !title || !concept || !meta) return

  if (lab.dataset.projectActiveIndex !== String(index)) {
    lab.dataset.projectActiveIndex = String(index)
    lab.dataset.projectTab = 'task'
  }

  setText(title, meta.block)

  let tags = scroll.querySelector('.project-block-tags')
  if (!tags) {
    tags = document.createElement('div')
    tags.className = 'project-block-tags'
    title.insertAdjacentElement('afterend', tags)
  }
  setHTML(tags, `<span class="project-badge ${difficultyClass(meta.difficulty)}">${meta.difficulty}</span><span class="project-badge course">Course</span>`)

  let fileMeta = scroll.querySelector('.project-file-meta')
  if (!fileMeta) {
    fileMeta = document.createElement('div')
    fileMeta.className = 'project-file-meta'
    concept.insertAdjacentElement('afterend', fileMeta)
  }
  const time = lab.querySelector('.lesson-meta span:last-child')?.textContent?.trim() || ''
  setHTML(fileMeta, `<span class="project-badge meta">File ${index + 1} of ${files.length}</span><span class="project-badge meta">SystemVerilog</span>${time ? `<span class="project-badge meta">${time}</span>` : ''}`)

  setText(lab.querySelector('.code-heading strong'), meta.file)
  renderProjectTab(lab)
}

function updateCustomPanels(lab) {
  const index = activeIndex(lab)
  const meta = files[index]
  if (!meta) return

  const approach = lab.querySelector('[data-project-panel="approach"]')
  if (approach) setHTML(approach, `<h2>Approach</h2><p>Build the ${meta.block} in small, testable steps.</p><ol class="project-approach-list">${meta.approach.map(item => `<li>${item}</li>`).join('')}</ol>`)

  const solution = lab.querySelector('[data-project-panel="solution"]')
  if (solution) {
    const code = lab.querySelector('.reference-code')?.textContent || ''
    const solutionHtml = `<h2>Solution</h2><p>Reference implementation for the ${meta.block} block.</p>${code ? '<pre class="project-solution-code"></pre>' : '<div class="project-discussion-card">Open this tab again if the reference solution is still loading.</div>'}`
    setHTML(solution, solutionHtml)
    const pre = solution.querySelector('pre')
    if (pre && pre.textContent !== code) pre.textContent = code
  }

  const discussion = lab.querySelector('[data-project-panel="discussion"]')
  if (discussion) setHTML(discussion, `<h2>Discussion</h2><p>Questions and implementation notes for ${meta.block}.</p><div class="project-discussion-card">Use this space to compare RTL approaches, ask about edge cases, or note design decisions for this block.</div>`)
}

function enhanceLab(lab) {
  lab.classList.add('project-ui-ready')
  ensureTopbar(lab)
  ensureDrawer(lab)
  ensureTabs(lab)
  updateLesson(lab)
  renderDrawer(lab)
}

function refine() {
  document.querySelectorAll('.riscv-lab').forEach(enhanceLab)
}

function schedule() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    refine()
  })
}

new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled'] })
window.addEventListener('resize', schedule)
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return
  document.querySelectorAll('.riscv-lab').forEach(lab => toggleDrawer(lab, false))
})
schedule()
