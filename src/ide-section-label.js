import problems from './data/activeProblems'

function currentProblem(){
  const match=window.location.pathname.match(/^\/app\/problems\/([^/]+)\/?$/)
  if(!match)return null
  const id=decodeURIComponent(match[1])
  return problems.find(problem=>problem.id===id)||null
}

function syncSectionLabel(){
  const problem=currentProblem()
  const button=document.querySelector('#hdlforge-ide-problems-button')
  if(!problem||!button)return

  const label=button.querySelector('.ide-topbar-problems-label')
  const count=button.querySelector('.ide-topbar-problems-count')
  const nextLabel=problem.category
  const totalCount=String(problems.length)

  // Keep the visible label section-specific, but preserve the stable
  // accessible name and total problem count used by the IDE contract.
  if(label&&label.textContent!==nextLabel)label.textContent=nextLabel
  if(count&&count.textContent!==totalCount)count.textContent=totalCount
  if(button.getAttribute('aria-label')!=='Open problems')button.setAttribute('aria-label','Open problems')
}

const observer=new MutationObserver(syncSectionLabel)
observer.observe(document.documentElement,{childList:true,subtree:true})
window.addEventListener('popstate',()=>window.setTimeout(syncSectionLabel,0))
document.addEventListener('click',()=>window.setTimeout(syncSectionLabel,0))
syncSectionLabel()
