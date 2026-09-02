import React from 'react'
import { createRoot } from 'react-dom/client'
import InterviewMode from './InterviewMode'

let root

const css = `#hdlforge-interview-host{position:fixed;inset:0;z-index:9999;background:var(--bg,#0b0d10);overflow:auto}#hdlforge-interview-host .interview-shell{min-height:100vh;max-width:1000px;margin:auto;padding:48px 24px;box-sizing:border-box;font-family:inherit;color:inherit}.interview-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}.interview-top>span{font-variant-numeric:tabular-nums;font-weight:700}.interview-card{max-width:760px;margin:8vh auto 0;padding:36px;border:1px solid rgba(127,127,127,.22);border-radius:18px;background:rgba(255,255,255,.035);box-shadow:0 20px 80px rgba(0,0,0,.25)}.interview-card h1{font-size:clamp(30px,5vw,52px);line-height:1.05;margin:12px 0 18px}.interview-card p{line-height:1.7;opacity:.78}.interview-rules{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0}.interview-rules div{padding:18px;border:1px solid rgba(127,127,127,.2);border-radius:12px}.interview-rules strong,.interview-rules span{display:block}.interview-rules strong{font-size:25px}.interview-rules span{font-size:12px;opacity:.65;margin-top:4px}.interview-card button{margin-right:10px}.best-score{margin-top:20px}.question-card{margin-top:6vh}.question-card h1{font-size:clamp(25px,4vw,40px);line-height:1.2}.interview-note{font-size:14px}.question-card textarea{width:100%;min-height:330px;box-sizing:border-box;resize:vertical;margin:20px 0;padding:18px;border-radius:12px;border:1px solid rgba(127,127,127,.3);background:rgba(0,0,0,.18);color:inherit;font:500 14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;outline:none}.question-card textarea:focus{border-color:currentColor}.question-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;opacity:.8}.result-card{text-align:center}.result-card h1{font-size:72px;margin:8px}.interview-review{text-align:left;margin:28px 0}.interview-review>div{display:grid;grid-template-columns:32px 1fr 24px;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(127,127,127,.15)}.interview-review span{opacity:.5}.interview-review em{display:flex}.interview-review strong{font-size:13px;font-weight:500}@media(max-width:650px){#hdlforge-interview-host .interview-shell{padding:24px 16px}.interview-card{padding:22px;margin-top:4vh}.interview-rules{grid-template-columns:1fr}.question-card textarea{min-height:260px}.question-foot{align-items:flex-end;flex-direction:column}.interview-card button{margin-bottom:8px}}`

function installStyles() {
  if (document.getElementById('hdlforge-interview-styles')) return
  const style = document.createElement('style')
  style.id = 'hdlforge-interview-styles'
  style.textContent = css
  document.head.appendChild(style)
}

function closeInterview() {
  root?.unmount()
  root = null
  document.getElementById('hdlforge-interview-host')?.remove()
}

function openInterview() {
  if (document.getElementById('hdlforge-interview-host')) return
  installStyles()
  const host = document.createElement('div')
  host.id = 'hdlforge-interview-host'
  document.body.appendChild(host)
  root = createRoot(host)
  root.render(<InterviewMode onExit={closeInterview} />)
}

function install() {
  const nav = document.querySelector('.desktop-nav')
  if (!nav || nav.querySelector('[data-interview-launcher]')) return
  const button = document.createElement('button')
  button.textContent = 'Interview'
  button.dataset.interviewLauncher = 'true'
  button.addEventListener('click', openInterview)
  nav.appendChild(button)
}

install()
new MutationObserver(install).observe(document.body, { childList: true, subtree: true })
