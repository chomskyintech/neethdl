import React from 'react'
import './landing-redesign.css'
import './landing-home-adjustments.css'

const resources=[
 {label:'Problems',href:'/problems/',page:'problems'},
 {label:'Learning',href:'/learn/'},
 {label:'Verilog guide',href:'/learn/verilog-interview/'},
 {label:'Companies',href:'/companies/',page:'problems'},
 {label:'Projects',href:'/projects/',page:'projects'},
]

export default function LandingHub({go}){
 const openResource=(event,page)=>{
  if(!page||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return
  event.preventDefault()
  go(page)
 }

 return <div className="landing-hub">
  <section className="hero landing-hero">
   <div className="landing-hero-copy">
    <h1>Hardware design practice for RTL,<span>FPGA, VLSI &amp; verification roles.</span><span>Learn, solve, build.</span></h1>
    <p>Practice digital design, verification, FPGA and VLSI skills through focused problems and hands-on hardware projects.</p>
    <button className="landing-start" type="button" onClick={()=>go('problems')}>Start practice</button>
    <nav className="landing-resource-links" aria-label="Explore HDLForge resources">
     {resources.map(resource=><a key={resource.href} href={resource.href} onClick={event=>openResource(event,resource.page)}>{resource.label}</a>)}
    </nav>
   </div>
  </section>
 </div>
}
