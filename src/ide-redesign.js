import problems,{problemTopics} from './data/activeProblems'

const topPaneBorderStyle=document.createElement('style')
topPaneBorderStyle.textContent=`
.ide-topbar{border-color:transparent!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
.ide-problem-navigation .section-navigation{display:none!important}
.ide-problem-navigation button:first-child,
.ide-problem-navigation button:last-child{min-width:34px;padding:0 10px!important;font-size:0!important;line-height:1!important}
.ide-problem-navigation button:first-child::after{content:'<';font-size:18px;line-height:1}
.ide-problem-navigation button:last-child::after{content:'>';font-size:18px;line-height:1}
.ide-actions .primary{background:#22c55e!important;border-color:#22c55e!important;color:#06130a!important;box-shadow:0 7px 20px rgba(34,197,94,.22)!important;font-weight:800!important;font-size:0!important}
.ide-actions .primary svg{display:none!important}
.ide-actions .primary::after{content:'Run test';font-size:11px;line-height:1}
.ide-actions .primary:hover:not(:disabled){background:#16a34a!important;border-color:#16a34a!important;color:#fff!important}
.ide-actions .primary:disabled{opacity:.6!important;cursor:wait!important}
.ide-actions .solve-status{width:30px;height:30px;min-width:30px;padding:0!important;display:grid!important;place-items:center!important;border-radius:7px!important;font-size:0!important;line-height:1!important;font-weight:900!important;color:#fb7185!important;border-color:rgba(251,113,133,.26)!important;background:rgba(244,63,94,.07)!important}
.ide-actions .solve-status svg{display:none!important}
.ide-actions .solve-status::after{content:'✕';font-size:16px;line-height:1}
.ide-actions .solve-status.passed{color:#4ade80!important;border-color:rgba(74,222,128,.28)!important;background:rgba(34,197,94,.08)!important}
.ide-actions .solve-status.passed::after{content:'✓'}
.ide-topbar-signin{position:absolute;right:16px;top:50%;transform:translateY(-50%);height:32px;display:inline-flex;align-items:center;gap:7px;padding:0 4px;border:0;border-radius:0;background:transparent;color:#9aa7b7;font-size:13px;font-weight:700;cursor:pointer;z-index:80}
.ide-topbar-signin:hover{color:#eef4fb;background:transparent}
.ide-topbar-signin svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
@media(max-width:720px){.ide-topbar-signin{right:8px;width:32px;padding:0;justify-content:center}.ide-topbar-signin span{display:none}}
`
document.head.appendChild(topPaneBorderStyle)

let mounted = false
let drawer = null
let backdrop = null
let topbarButton = null
let signInButton = null
let searchInput = null
let problemRows = []

const categories = [
  ...problemTopics,
  ...[...new Set(problems.map(problem=>problem.topic))]
    .filter(topic=>topic&&!problemTopics.includes(topic)),
]

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
  window.setTimeout(()=>{ensureTopbarButton();ensureSignInButton();updateActive()},0)
}

function difficultyClass(difficulty=''){
  return difficulty.toLowerCase().replace(/[^a-z]/g,'')
}

function createProblemRow(problem, solved){
  const button=document.createElement('button')
  button.type='button'
  button.className='ide-drawer-problem'
  button.dataset.problemId=problem.id
  button.dataset.search=`${problem.title} ${problem.topic||''} ${problem.category||''} ${(problem.tags||[]).join(' ')}`.toLowerCase()
  button.innerHTML=`<span class="ide-drawer-status ${solved?'solved':''}">${solved?'✓':''}</span><span class="ide-drawer-copy"><strong></strong><small></small></span><span class="ide-drawer-difficulty ${difficultyClass(problem.difficulty)}"></span>`
  button.querySelector('strong').textContent=problem.title
  button.querySelector('small').textContent=(problem.tags||[]).slice(0,2).join(' · ') || problem.topic || problem.category
  button.querySelector('.ide-drawer-difficulty').textContent=problem.difficulty
  button.addEventListener('click',()=>routeToProblem(problem.id))
  problemRows.push(button)
  return button
}

function createDrawer(){
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
    const categoryProblems=problems.filter(problem=>problem.topic===category)
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

function createTopbarButton(){
  const button=document.createElement('button')
  button.type='button'
  button.id='hdlforge-ide-problems-button'
  button.className='ide-topbar-problems'
  button.setAttribute('aria-label','Open problems')
  button.innerHTML=`<span class="ide-topbar-problems-icon">☰</span><span class="ide-topbar-problems-label">Problems</span><span class="ide-topbar-problems-count">${problems.length}</span>`
  button.addEventListener('click',()=>drawer?.classList.contains('open')?closeDrawer():openDrawer())
  return button
}

function createSignInButton(){
  const button=document.createElement('button')
  button.type='button'
  button.id='hdlforge-ide-signin'
  button.className='ide-topbar-signin'
  button.setAttribute('aria-label','Sign in')
  button.title='Sign in'
  button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"></path></svg><span>Sign in</span>`
  button.addEventListener('click',()=>document.querySelector('.app>.nav .profile')?.click())
  return button
}

function ensureTopbarButton(){
  const topbar=document.querySelector('.ide-page .ide-topbar')
  if(!topbar)return
  const existing=topbar.querySelector('#hdlforge-ide-problems-button')
  if(existing){
    topbarButton=existing
    return
  }
  topbarButton=createTopbarButton()
  const brand=topbar.querySelector('.ide-brand')
  if(brand)brand.after(topbarButton)
  else topbar.prepend(topbarButton)
}

function ensureSignInButton(){
  const topbar=document.querySelector('.ide-page .ide-topbar')
  if(!topbar)return
  const existing=topbar.querySelector('#hdlforge-ide-signin')
  if(existing){signInButton=existing;return}
  signInButton=createSignInButton()
  topbar.appendChild(signInButton)
}

function mount(){
  if(!document.querySelector('.ide-page'))return
  document.body.classList.add('hdlforge-ide-active')
  if(mounted){ensureTopbarButton();ensureSignInButton();return}
  mounted=true
  backdrop=document.createElement('button')
  backdrop.type='button'
  backdrop.id='hdlforge-ide-backdrop'
  backdrop.className='ide-drawer-backdrop'
  backdrop.setAttribute('aria-label','Close problem navigator')
  backdrop.addEventListener('click',closeDrawer)
  document.body.append(backdrop,createDrawer())
  ensureTopbarButton()
  ensureSignInButton()
  updateActive()
}

function unmount(){
  if(document.querySelector('.ide-page'))return
  mounted=false
  closeDrawer()
  topbarButton?.remove()
  signInButton?.remove()
  drawer?.remove()
  backdrop?.remove()
  topbarButton=signInButton=drawer=backdrop=searchInput=null
  problemRows=[]
  document.body.classList.remove('hdlforge-ide-active','ide-drawer-open')
}

function sync(){
  if(document.querySelector('.ide-page'))mount()
  else unmount()
}

new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true})
window.addEventListener('popstate',()=>window.setTimeout(()=>{ensureTopbarButton();ensureSignInButton();updateActive()},0))
document.addEventListener('click',()=>window.setTimeout(()=>{sync();ensureTopbarButton();ensureSignInButton();updateActive()},0))
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