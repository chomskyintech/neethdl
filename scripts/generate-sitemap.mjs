import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const publicDir=path.join(root,'public')
const base='https://hdlforge.netlify.app'

function walk(dir){
 if(!fs.existsSync(dir))return []
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const full=path.join(dir,entry.name)
  return entry.isDirectory()?walk(full):[full]
 })
}

function canonicalFromHtml(file){
 const html=fs.readFileSync(file,'utf8')
 const robots=[...html.matchAll(/<meta\b[^>]*name=["']robots["'][^>]*>/gi)].map(m=>m[0]).join(' ')
 if(/noindex/i.test(robots))return null
 const match=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
            ||html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i)
 if(!match)return null
 const canonical=match[1].trim()
 if(!canonical.startsWith(base+'/')&&canonical!==base+'/')return null
 return canonical
}

const files=[path.join(root,'index.html'),...walk(publicDir).filter(file=>file.endsWith('.html'))].filter(fs.existsSync)
const canonicalToFile=new Map()
for(const file of files){
 const canonical=canonicalFromHtml(file)
 if(!canonical)continue
 if(canonicalToFile.has(canonical)){
  throw new Error(`Duplicate canonical URL ${canonical} in ${path.relative(root,canonicalToFile.get(canonical))} and ${path.relative(root,file)}`)
 }
 canonicalToFile.set(canonical,file)
}

const urls=[...canonicalToFile.keys()].sort((a,b)=>{
 if(a===base+'/')return -1
 if(b===base+'/')return 1
 return a.localeCompare(b)
})

const xmlEscape=value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>{
 const pathname=new URL(url).pathname
 const priority=pathname==='/'?'1.0':pathname==='/problems/'||pathname==='/learn/'||pathname==='/projects/'||pathname==='/practice/'||pathname==='/companies/'?'0.9':pathname.startsWith('/problems/')?'0.7':'0.8'
 const changefreq=pathname==='/'||['/problems/','/learn/','/projects/','/practice/','/companies/'].includes(pathname)?'weekly':'monthly'
 return `  <url><loc>${xmlEscape(url)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
}).join('\n')}\n</urlset>\n`

fs.writeFileSync(path.join(publicDir,'sitemap.xml'),sitemap)
console.log(`Generated final sitemap from ${urls.length} canonical indexable HTML pages.`)
