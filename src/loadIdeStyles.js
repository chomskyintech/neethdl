const IDE_STYLES=[
  '/ide-redesign.css',
  '/ide-sizing-fix.css',
  '/ide-control-refinement.css',
  '/ide-brand-title-tweak.css',
  '/ide-leetcode-theme.css',
  '/ide-leetcode-monaco.css',
  '/ide-control-fix.css',
  '/ide-scrollbar-fix.css',
  '/ide-final-polish.css',
  '/ide-edge-alignment.css',
  '/ide-language-control.css',
  '/ide-compact-layout.css',
  '/ide-theme-lock.css',
  '/simulation-panel-v2.css',
  '/simulation-panel-quality.css',
]

let pending=null

function ensureStyle(href){
  const existing=document.querySelector(`link[data-hdlforge-ide-style="${href}"]`)
  if(existing){
    if(existing.dataset.loaded==='true')return Promise.resolve()
    return new Promise(resolve=>{
      existing.addEventListener('load',resolve,{once:true})
      existing.addEventListener('error',resolve,{once:true})
    })
  }

  return new Promise(resolve=>{
    const link=document.createElement('link')
    link.rel='stylesheet'
    link.href=href
    link.dataset.hdlforgeIdeStyle=href
    link.addEventListener('load',()=>{link.dataset.loaded='true';resolve()},{once:true})
    link.addEventListener('error',resolve,{once:true})
    document.head.appendChild(link)
  })
}

export function loadIdeStyles(){
  if(!pending)pending=Promise.all(IDE_STYLES.map(ensureStyle))
  return pending
}

export {IDE_STYLES}
