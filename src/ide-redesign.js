let mounted = false
let drawer = null
let backdrop = null
let rail = null
let searchInput = null
let problemRows = []

const categories = ['RTL Design','SystemVerilog','SVA','UVM','Protocols','FPGA','Accelerators']

function currentProblemId(){
  const match = window.location.pathname.match(/^\/app\/problems\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : null
}

function closeDrawer(){
  drawer?.classList.remove('open')
  backdrop?.classList.remove('open')
  rail?.querySelector('.ide-rail-problems')?.classList.remove('active')
  document.body.classList.remove('ide-drawer-open')
}

function openDrawer(){
  drawer?.classList.add('open')
  backdrop?.classList.add('open')
  rail?.querySelector('.ide-rail-problems')?.classList.add('active')
  document.body.classList.add('ide-drawer-open')
  window.setTimeout(()=>searchInput?.focus(),80)
}

function updateActive(){
  const id = currentProblemId()
  problemRows.forEach(row=>row.classList.toggle('active',row.dataset.problemId===id))
}

function routeToProblem(id){
  const target = `/app/problems/${encodeURIComponent(id)}/`
  closeDrawer()
  if(window.location.pathname===target)return
  window.history.pushState({page:'problem',problemId:id},'',target)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.setTimeout(updateActive,0)
}

function difficultyClass(difficulty=''){
  return difficulty.toLowerCase().replace(/[^a-z]/g,'')
}

function createProblemRow(problem, solved){
  const button=document.createElement('button')
  button.type='button'
  button.className='ide-drawer-problem'
  button.dataset.problemId=problem.id
  button.dataset.search=`${problem.title} ${problem.category} ${(problem.tags||[]).join(' ')}`.toLowerCase()
  button.innerHTML=`<span class="ide-drawer-status ${solved?'solved':''}">${solved?'✓':''}</span><span class="ide-drawer-copy"><strong></strong><small></small></span><span class="ide-drawer-difficulty ${difficultyClass(problem.difficulty)}"></span>`
  button.querySelector('strong').textContent=problem.title
  button.querySelector('small').textContent=(problem.tags||[]).slice(0,2).join(' · ') || problem.category
  button.querySelector('.ide-drawer-difficulty').textContent=problem.difficulty
  button.addEventListener('click',()=>routeToProblem(problem.id))
  problemRows.push(button)
  return button
}

function createDrawer(problems){
  const solved = new Set((()=>{try{return JSON.parse(localStorage.getItem('hdlforge-solved')||'[]')}catch{return []}})())
  drawer=document.createElement('aside')
  drawer.id='hdlforge-ide-drawer'
  drawer.className='ide-problem-drawer'
  drawer.setAttribute('aria-label','Problem navigator')
  drawer.innerHTML=`
    <div class="ide-drawer-header">
      <div><span class="ide-drawer-eyebrow">Practice library</span><strong>Problems</strong></div>
      <button type="button" class="ide-drawer-close" aria-label="Close problem navigator">×</button>
    </div>
    <label class="ide-drawer-search"><span>⌕</span><input type="search" placeholder="Search  problems…" aria-label="Search problems"></label>
    <div class="ide-drawer-groups"></div>`
  const groups=drawer.querySelector('.ide-drawer-groups')
  categories.forEach(category=>{
    const categoryProblems=problems.filter(problem=>problem.category===category)
    if(!categoryProblems.length)return
    const section=document.createElement('section')
    section.className='ide-drawer-group'
    section.innerHTML=`<div class="ide-drawer-group-title"><span></span><em></em></div><div class="ide-drawer-list"></div>`
    section.querySelector('.ide-drawer-group-title span').textContent=category
    section.querySelector('.ide-drawer-group-title em').textContent=String(categoryProblems.length)
    const list=section.querySelector('.ide-drawer-list')
    categoryProblems.forEach(problem=>list.appendChild(createProblemRow(problem,solved.has(problem.id))))
    groups.appendChild(section)
  })
  searchInput=drawer.querySelector('input')
  searchInput.addEventListener('input',()=>{
    const q=searchInput.value.trim().toLowerCase()
    drawer.querySelectorAll('.ide-drawer-group').forEach(group=>{
      let visible=0
      group.querySelectorAll('.ide-drawer-problem').forEach(row=>{
        const show=!q||row.dataset.search.includes(q)
        row.hidden=!show
        if(show)visible++
      })
      group.hidden=visible===0
    })
  })
  drawer.querySelector('.ide-drawer-close').addEventListener('click',closeDrawer)
  return drawer
}

function createRail(problemCount){
  rail=document.createElement('aside')
  rail.id='hdlforge-ide-rail'
  rail.className='ide-problem-rail'
  rail.setAttribute('aria-label','IDE navigation')
  rail.innerHTML=`
    <button type="button" class="ide-rail-problems" aria-label="Open problems">
      <span class="ide-rail-icon">▦</span>
      <span class="ide-rail-label">Problems</span>
      <span class="ide-rail-count"></span>
    </button>
    <div class="ide-rail-spacer"></div>
    <div class="ide-rail-hint">P</div>`
  rail.querySelector('.ide-rail-count').textContent=String(problemCount)
  rail.querySelector('.ide-rail-problems').addEventListener('click',()=>drawer?.classList.contains('open')?closeDrawer():openDrawer())
  return rail
}

async function mount(){
  if(mounted||!document.querySelector('.ide-page'))return
  mounted=true
  document.body.classList.add('hdlforge-ide-active')
  const {default: problems}=await import('./data/activeProblems')
  if(!document.querySelector('.ide-page')){mounted=false;document.body.classList.remove('hdlforge-ide-active');return}
  backdrop=document.createElement('button')
  backdrop.type='button'
  backdrop.id='hdlforge-ide-backdrop'
  backdrop.className='ide-drawer-backdrop'
  backdrop.setAttribute('aria-label','Close problem navigator')
  backdrop.addEventListener('click',closeDrawer)
  document.body.append(createRail(problems.length),backdrop,createDrawer(problems))
  updateActive()
}

function unmount(){
  if(document.querySelector('.ide-page'))return
  mounted=false
  closeDrawer()
  rail?.remove();drawer?.remove();backdrop?.remove()
  rail=drawer=backdrop=searchInput=null
  problemRows=[]
  document.body.classList.remove('hdlforge-ide-active','ide-drawer-open')
}

function sync(){
  if(document.querySelector('.ide-page'))mount()
  else unmount()
}

new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true})
window.addEventListener('popstate',()=>window.setTimeout(updateActive,0))
document.addEventListener('click',()=>window.setTimeout(()=>{sync();updateActive()},0))
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeDrawer()
  if((event.key==='p'||event.key==='P')&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&document.body.classList.contains('hdlforge-ide-active')){
    const tag=document.activeElement?.tagName?.toLowerCase()
    if(tag!=='input'&&tag!=='textarea'&&document.activeElement?.getAttribute('contenteditable')!=='true'){
      event.preventDefault();drawer?.classList.contains('open')?closeDrawer():openDrawer()
    }
  }
})
sync()
