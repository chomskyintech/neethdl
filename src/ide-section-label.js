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
  if(label)label.textContent=problem.category
  if(count)count.textContent=String(problems.filter(item=>item.category===problem.category).length)
  button.setAttribute('aria-label',`Open ${problem.category} problems`)
}

new MutationObserver(syncSectionLabel).observe(document.documentElement,{childList:true,subtree:true})
window.addEventListener('popstate',()=>window.setTimeout(syncSectionLabel,0))
document.addEventListener('click',()=>window.setTimeout(syncSectionLabel,0))
syncSectionLabel()
