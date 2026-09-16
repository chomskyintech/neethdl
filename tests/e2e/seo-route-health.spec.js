import {test,expect} from '@playwright/test'

const base='https://hdlforge.netlify.app'

const homepageSeoRoutes=[
 {path:'/problems/',canonical:`${base}/problems/`},
 {path:'/learn/',canonical:`${base}/learn/`},
 {path:'/learn/verilog-interview/',canonical:`${base}/learn/verilog-interview/`},
 {path:'/companies/',canonical:`${base}/companies/`},
 {path:'/projects/',canonical:`${base}/projects/`},
]

const canonicalFrom=html=>html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]

test.describe('SEO route health',()=>{
 test('homepage SEO destinations resolve through their pretty URLs instead of falling back to the SPA homepage',async({request})=>{
  for(const route of homepageSeoRoutes){
   const response=await request.get(route.path)
   expect(response.ok(),`${route.path} should return a successful HTTP response`).toBeTruthy()
   const html=await response.text()
   expect(canonicalFrom(html),`${route.path} should serve its own SEO document, not the SPA fallback`).toBe(route.canonical)
  }
 })

 test('every sitemap URL resolves over HTTP to a document with the same canonical URL',async({request})=>{
  test.setTimeout(120_000)
  const sitemapResponse=await request.get('/sitemap.xml')
  expect(sitemapResponse.ok()).toBeTruthy()
  const sitemap=await sitemapResponse.text()
  const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1])
  expect(urls.length).toBeGreaterThan(0)

  for(const canonical of urls){
   const target=new URL(canonical)
   const response=await request.get(target.pathname)
   expect(response.ok(),`${target.pathname} should not be a dead route`).toBeTruthy()
   const html=await response.text()
   expect(canonicalFrom(html),`${target.pathname} should not resolve to another page or SPA fallback`).toBe(canonical)
  }
 })
})
