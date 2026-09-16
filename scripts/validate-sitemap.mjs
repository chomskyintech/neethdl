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

const htmlFiles=[path.join(root,'index.html'),...walk(publicDir).filter(file=>file.endsWith('.html'))].filter(fs.existsSync)
const expected=new Set(htmlFiles.map(canonicalFromHtml).filter(Boolean))
const sitemapPath=path.join(publicDir,'sitemap.xml')
if(!fs.existsSync(sitemapPath))throw new Error('public/sitemap.xml does not exist')

const xml=fs.readFileSync(sitemapPath,'utf8')
const actual=new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1].replace(/&amp;/g,'&')))
const missing=[...expected].filter(url=>!actual.has(url)).sort()
const stale=[...actual].filter(url=>!expected.has(url)).sort()

if(missing.length||stale.length){
 const parts=[]
 if(missing.length)parts.push(`Missing from sitemap:\n${missing.join('\n')}`)
 if(stale.length)parts.push(`Sitemap URLs without an indexable canonical HTML page:\n${stale.join('\n')}`)
 throw new Error(parts.join('\n\n'))
}

console.log(`Sitemap validation passed: ${actual.size} indexable canonical pages are represented exactly once.`)
