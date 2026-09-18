import problems from './data/activeProblems'
import {riscvProject} from './data/riscvProject'

function currentContext(){
  const projectMatch=window.location.pathname.match(/^\/app\/projects\/riscv-core\/([^/]+)\/?$/)
  if(projectMatch){
    const id=decodeURIComponent(projectMatch[1])
    return {problem:problems.find(problem=>problem.id===id)||null,label:riscvProject.title}
  }
  const match=window.location.pathname.match(/^\/app\/problems\/([^/]+)\/?$/)
  if(!match)return {problem:null,label:null}
  const id=decodeURIComponent(match[1])
  const problem=problems.find(problem=>problem.id===id)||null
  return {problem,label:problem?.topic||problem?.category||null}
}

function syncSectionLabel(){
  const {problem,label:nextLabel}=currentContext()
  const button=document.querySelector('#hdlforge-ide-problems-button')
  if(!problem||!button||!nextLabel)return

  const label=button.querySelector('.ide-topbar-problems-label')
  const count=button.querySelector('.ide-topbar-problems-count')
  const totalCount=String(problems.length)

  if(label&&label.textContent!==nextLabel)label.textContent=nextLabel
  if(count&&count.textContent!==totalCount)count.textContent=totalCount
  if(button.getAttribute('aria-label')!=='Open problems')button.setAttribute('aria-label','Open problems')
}

const observer=new MutationObserver(syncSectionLabel)
observer.observe(document.documentElement,{childList:true,subtree:true})
window.addEventListener('popstate',()=>window.setTimeout(syncSectionLabel,0))
document.addEventListener('click',()=>window.setTimeout(syncSectionLabel,0))
syncSectionLabel()
