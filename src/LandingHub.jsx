import React from 'react'
import './landing-redesign.css'

export default function LandingHub({go}){
 return <div className="landing-hub">
  <section className="hero landing-hero">
   <div className="landing-hero-copy">
    <h1>Hardware design practice for RTL,<span>FPGA, VLSI &amp; verification roles.</span><span>Learn, solve, build.</span></h1>
    <p>Practice digital design, verification, FPGA and VLSI skills through focused problems and hands-on hardware projects.</p>
    <button className="landing-start" type="button" onClick={()=>go('problems')}>Start practice</button>
   </div>
  </section>
 </div>
}
