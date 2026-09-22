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
let selectedTopic = problemTopics[0] || 'Combinational Logic'
let topicMenu = null
let topicButton = null
let tableBody = null
let emptyState = null

function readStoredSet(key){
  try{return new Set(JSON.parse(localStorage.getItem(key)||'[]'))}
  catch{return new Set()}
}

function persistStoredSet(key,set){
  localStorage.setItem(key,JSON.stringify([...set]))
}

function currentProblem(){
  return problems.find(problem=>problem.id===currentProblemId())||null
}

function currentTopic(){
  return currentProblem()?.topic || problemTopics[0] || 'Combinational Logic'
}

function topicProblems(topic){
  return problems.filter(problem=>problem.topic===topic)
}

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
  selectedTopic=currentTopic()
  if(searchInput)searchInput.value=''
  renderDrawerProblems()
  updateTopicControl()
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

function updateTopicControl(){
  if(!drawer)return
  const label=drawer.querySelector('.ide-drawer-topic-label')
  const count=drawer.querySelector('.ide-drawer-topic-count')
  if(label)label.textContent=selectedTopic
  if(count)count.textContent=String(topicProblems(selectedTopic).length)
  drawer.querySelectorAll('.ide-drawer-topic-item').forEach(button=>{
    button.classList.toggle('active',button.dataset.topic===selectedTopic)
  })
}

function createProblemRow(problem,solved,starred){
  const row=document.createElement('div')
  row.className='ide-drawer-problem'
  row.dataset.problemId=problem.id
  row.dataset.search=`${problem.title} ${problem.topic||''} ${problem.category||''} ${(problem.tags||[]).join(' ')}`.toLowerCase()
  row.setAttribute('role','button')
  row.setAttribute('tabindex','0')
  row.innerHTML=`
    <span class="ide-drawer-status ${solved?'solved':''}" aria-label="${solved?'Solved':'Not solved'}">${solved?'✓':''}</span>
    <button type="button" class="ide-drawer-star ${starred?'starred':''}" aria-label="${starred?'Remove star':'Star problem'}">☆</button>
    <span class="ide-drawer-copy"><strong></strong><small></small></span>
    <span class="ide-drawer-difficulty ${difficultyClass(problem.difficulty)}"></span>
    <button type="button" class="ide-drawer-solution" aria-label="Open solution for ${problem.title}">▤</button>`
  row.querySelector('strong').textContent=problem.title
  row.querySelector('small').textContent=(problem.tags||[]).slice(0,3).join(' · ') || problem.topic || problem.category
  row.querySelector('.ide-drawer-difficulty').textContent=problem.difficulty

  const star=row.querySelector('.ide-drawer-star')
  star.addEventListener('click',event=>{
    event.stopPropagation()
    const starredSet=readStoredSet('hdlforge-starred')
    if(starredSet.has(problem.id))starredSet.delete(problem.id)
    else starredSet.add(problem.id)
    persistStoredSet('hdlforge-starred',starredSet)
    star.classList.toggle('starred',starredSet.has(problem.id))
    star.setAttribute('aria-label',starredSet.has(problem.id)?'Remove star':'Star problem')
  })

  row.querySelector('.ide-drawer-solution').addEventListener('click',event=>{
    event.stopPropagation()
    routeToProblem(problem.id)
    window.setTimeout(()=>{
      const solution=[...document.querySelectorAll('.problem-tabs button')]
        .find(button=>button.textContent.trim()==='Solution')
      solution?.click()
    },120)
  })

  const open=()=>routeToProblem(problem.id)
  row.addEventListener('click',open)
  row.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault()
      open()
    }
  })
  problemRows.push(row)
  return row
}

function renderDrawerProblems(){
  if(!tableBody)return
  const solved=readStoredSet('hdlforge-solved')
  const starred=readStoredSet('hdlforge-starred')
  const q=(searchInput?.value||'').trim().toLowerCase()
  const visible=topicProblems(selectedTopic).filter(problem=>{
    if(!q)return true
    const haystack=`${problem.title} ${problem.topic||''} ${problem.category||''} ${(problem.tags||[]).join(' ')}`.toLowerCase()
    return haystack.includes(q)
  })

  problemRows=[]
  tableBody.innerHTML=''
  visible.forEach(problem=>tableBody.appendChild(
    createProblemRow(problem,solved.has(problem.id),starred.has(problem.id))
  ))
  if(emptyState)emptyState.hidden=visible.length!==0
  updateActive()
}

function createDrawer(){
  drawer=document.createElement('aside')
  drawer.id='hdlforge-ide-drawer'
  drawer.className='ide-problem-drawer'
  drawer.setAttribute('aria-label','Problem navigator')
  drawer.innerHTML=`
    <div class="ide-drawer-header">
      <div><span class="ide-drawer-eyebrow">Practice library</span><strong>Problems</strong></div>
      <button type="button" class="ide-drawer-close" aria-label="Close problem navigator">×</button>
    </div>
    <div class="ide-drawer-controls">
      <div class="ide-drawer-topic">
        <button type="button" class="ide-drawer-topic-button" aria-haspopup="listbox" aria-expanded="false">
          <span class="ide-drawer-topic-icon">⌁</span>
          <span class="ide-drawer-topic-label"></span>
          <span class="ide-drawer-topic-count"></span>
          <span class="ide-drawer-topic-chevron">⌄</span>
        </button>
        <div class="ide-drawer-topic-menu" role="listbox" aria-label="Problem topic"></div>
      </div>
      <label class="ide-drawer-search">
        <span>⌕</span>
        <input type="search" placeholder="Search problems" aria-label="Search problems">
      </label>
    </div>
    <div class="ide-drawer-table">
      <div class="ide-drawer-table-head" aria-hidden="true">
        <span>Status</span><span>Star</span><span>Problem</span><span>Difficulty</span><span>Solution</span>
      </div>
      <div class="ide-drawer-table-scroll">
        <div class="ide-drawer-table-body"></div>
        <div class="ide-drawer-empty" hidden>No matching problems.</div>
      </div>
    </div>`

  topicMenu=drawer.querySelector('.ide-drawer-topic-menu')
  topicButton=drawer.querySelector('.ide-drawer-topic-button')
  tableBody=drawer.querySelector('.ide-drawer-table-body')
  emptyState=drawer.querySelector('.ide-drawer-empty')
  searchInput=drawer.querySelector('input')

  problemTopics.forEach(topic=>{
    const button=document.createElement('button')
    button.type='button'
    button.className='ide-drawer-topic-item'
    button.dataset.topic=topic
    button.setAttribute('role','option')
    button.innerHTML='<span></span><small></small>'
    button.querySelector('span').textContent=topic
    button.querySelector('small').textContent=String(topicProblems(topic).length)
    button.addEventListener('click',event=>{
      event.stopPropagation()
      selectedTopic=topic
      searchInput.value=''
      topicMenu.classList.remove('open')
      topicButton.setAttribute('aria-expanded','false')
      updateTopicControl()
      renderDrawerProblems()
    })
    topicMenu.appendChild(button)
  })

  topicButton.addEventListener('click',event=>{
    event.stopPropagation()
    const open=topicMenu.classList.toggle('open')
    topicButton.setAttribute('aria-expanded',String(open))
  })
  searchInput.addEventListener('input',renderDrawerProblems)
  drawer.querySelector('.ide-drawer-close').addEventListener('click',closeDrawer)
  drawer.addEventListener('click',event=>{
    if(!event.target.closest('.ide-drawer-topic')){
      topicMenu.classList.remove('open')
      topicButton.setAttribute('aria-expanded','false')
    }
  })

  selectedTopic=currentTopic()
  updateTopicControl()
  renderDrawerProblems()
  return drawer
}

function createTopbarButton(){
  const button=document.createElement('button')
  button.type='button'
  button.id='hdlforge-ide-problems-button'
  button.className='ide-topbar-problems'
  button.setAttribute('aria-label','Open problems')
  button.innerHTML=`<span class="ide-topbar-problems-icon" aria-hidden="true"><i></i><i></i><i></i></span><span class="ide-topbar-problems-label">Problems</span><span class="ide-topbar-problems-count">${problems.length}</span>`
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
  topbarButton=signInButton=drawer=backdrop=searchInput=topicMenu=topicButton=tableBody=emptyState=null
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