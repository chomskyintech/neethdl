import React from 'react'
import { createRoot } from 'react-dom/client'
import InterviewMode from './InterviewMode'

let root

function closeInterview() {
  root?.unmount()
  root = null
  document.getElementById('hdlforge-interview-host')?.remove()
}

function openInterview() {
  if (document.getElementById('hdlforge-interview-host')) return
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
