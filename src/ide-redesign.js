let mounted = false
let drawer = null
let backdrop = null
let topbarButton = null
let searchInput = null
let problemRows = []
let problemsCache = null

const categories = ['RTL Design','SystemVerilog','SVA','UVM','Protocols','FPGA','Accelerators']

function currentProblemId(){
  const match = window.location.pathname.match(/^\/app\/problems\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : null
}

function closeDrawer(){
  drawer?.classList.remove('open')
  backdrop?.classList.remove('open')
  topbarButton?.classList.remove('active')
  document.body.classList.remove('ide-drawer-open')
}

function openDrawer(){
  drawer?.classList.add('open')
  backdrop?.classList.add('open')
  topbarButton?.classList.add('active')
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
  window.setTimeout(()=>{ensureTopbarButton();updateActive()},0)
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
    <label class="ide-drawer-search"><span>⌕</span><input type="search" placeholder="Search problems…" aria-label="Search problems"></label>
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

function createTopbarButton(problemCount){
  const button=document.createElement('button')
  button.type='button'
  button.id='hdlforge-ide-problems-button'
  button.className='ide-topbar-problems'
  button.setAttribute('aria-label','Open problems')
  button.innerHTML=`<span class="ide-topbar-problems-icon">▦</span><span class="ide-topbar-problems-label">Problems</span><span class="ide-topbar-problems-count"></span>`
  button.querySelector('.ide-topbar-problems-count').textContent=String(problemCount)
  button.addEventListener('click',()=>drawer?.classList.contains('open')?closeDrawer():openDrawer())
  return button
}

function ensureTopbarButton(){
  if(!problemsCache)return
  const topbar=document.querySelector('.ide-page .ide-topbar')
  if(!topbar)return
  const existing=topbar.querySelector('#hdlforge-ide-problems-button')
  if(existing){
    topbarButton=existing
    existing.querySelector('.ide-topbar-problems-count').textContent=String(problemsCache.length)
    return
  }
  topbarButton=createTopbarButton(problemsCache.length)
  const brand=topbar.querySelector('.ide-brand')
  if(brand)brand.after(topbarButton)
  else topbar.prepend(topbarButton)
}

async function mount(){
  if(!document.querySelector('.ide-page'))return
  document.body.classList.add('hdlforge-ide-active')
  if(mounted){ensureTopbarButton();return}
  mounted=true
  const {default: problems}=await import('./data/activeProblems')
  problemsCache=problems
  if(!document.querySelector('.ide-page')){
    mounted=false
    problemsCache=null
    document.body.classList.remove('hdlforge-ide-active')
    return
  }
  backdrop=document.createElement('button')
  backdrop.type='button'
  backdrop.id='hdlforge-ide-backdrop'
  backdrop.className='ide-drawer-backdrop'
  backdrop.setAttribute('aria-label','Close problem navigator')
  backdrop.addEventListener('click',closeDrawer)
  document.body.append(backdrop,createDrawer(problems))
  ensureTopbarButton()
  updateActive()
}

function unmount(){
  if(document.querySelector('.ide-page'))return
  mounted=false
  closeDrawer()
  topbarButton?.remove()
  drawer?.remove()
  backdrop?.remove()
  topbarButton=drawer=backdrop=searchInput=null
  problemRows=[]
  problemsCache=null
  document.body.classList.remove('hdlforge-ide-active','ide-drawer-open')
}

function sync(){
  if(document.querySelector('.ide-page'))mount()
  else unmount()
}

new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true})
window.addEventListener('popstate',()=>window.setTimeout(()=>{ensureTopbarButton();updateActive()},0))
document.addEventListener('click',()=>window.setTimeout(()=>{sync();ensureTopbarButton();updateActive()},0))
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeDrawer()
  if((event.key==='p'||event.key==='P')&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&document.body.classList.contains('hdlforge-ide-active')){
    const tag=document.activeElement?.tagName?.toLowerCase()
    if(tag!=='input'&&tag!=='textarea'&&tag!=='select'&&document.activeElement?.getAttribute('contenteditable')!=='true'){
      event.preventDefault()
      drawer?.classList.contains('open')?closeDrawer():openDrawer()
    }
  }
})
sync()
