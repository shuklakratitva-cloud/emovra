import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import LegalCookieBanner from "../components/LegalCookieBanner";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white selection:bg-[#8b5cf6]/30 overflow-x-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;900&display=swap');`}</style>

      {/* HEADER - Like Gavelling pill */}
      <div className="sticky top-0 z-50 px-4 py-4">
        <div className="max-w- mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text- tracking-tight" style={{fontFamily:'Inter'}}>MindGuard</div>

          <div className="hidden md:flex items-center bg-[#1a1a24]/80 backdrop-blur-xl border border-white/10 rounded-full p-1.5 gap-1">
            <a className="px-4 py-1.5 text- tracking-widest uppercase text-white/60 hover:text-white">Sessions</a>
            <a className="px-4 py-1.5 text- tracking-widest uppercase bg-[#23231f] text-[#f7e9a0] rounded-full font-bold border border-[#f7e9a0]/20">Conferences</a>
            <a className="px-4 py-1.5 text- tracking-widest uppercase text-white/60 hover:text-white">About Us</a>
            <a className="px-4 py-1.5 text- tracking-widest uppercase text-white/60 hover:text-white">Contact</a>
          </div>

          <button onClick={()=>navigate("/app")} className="px-5 py-2.5 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text- font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all">
            Launch App →
          </button>
        </div>
      </div>

      {/* HERO SECTION - Gavelling + Rolex */}
      <div className="max-w- mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.5fr] gap-10 pt-12 pb-20">
        {/* LEFT */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1c2a] border border-[#8b5cf6]/20 text- tracking-wide text-[#a78bfa] mb-6">
            <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-pulse"></span>
            AI Mental Wellness Platform
          </div>

          <h1 className="text- md:text- font-[900] leading-[0.9] tracking-[-0.04em] " style={{fontFamily:'Inter'}}>
            Your Mental<br/>
            Wellness,<br/>
            <span style={{fontFamily:'"Instrument Serif", serif'}} className="font-normal italic text-[#f7e9a0]">Understood.</span>
          </h1>

          <p className="mt-6 max-w- text- leading-[1.6] text-white/60">
            Real check-ins, real private journaling, from exam stress to late-night thoughts. Pick your moment. MindGuard helps students recognise stress, emotional abuse and mental health risks using intelligent emotion analysis.
          </p>

          {/* Search Bar like Gavelling */}
          <div className="mt-8 flex items-center gap-2 max-w- bg-[#15151f]/80 backdrop-blur border border-white/10 rounded-full p-1.5">
            <div className="flex-1 flex items-center gap-2 px-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/40"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.3-4.3"/></svg>
              <input placeholder="Search how you're feeling..." className="bg-transparent outline-none text- w-full placeholder:text-white/40" />
            </div>
            <button onClick={()=>navigate("/app")} className="px-5 py-2.5 rounded-full bg-[#f7e9a0] text-black text- font-bold hover:bg-white transition-colors">Discover all</button>
          </div>
          <p className="mt-3 text- text-white/40 ml-2">Organising one? <span className="underline cursor-pointer">List it free ↗</span></p>
        </div>

        {/* RIGHT FLOATING CARDS - Like SIMUN / WORLDMUN cards */}
        <div className="relative flex flex-col gap-4 lg:pt-4">
          {/* Card 1 */}
          <div className="group relative rounded- overflow-hidden border border-[#f7e9a0]/30 bg-gradient-to-br from-[#1e1e2a] to-[#15151f] p-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">🧠</div>
              <span className="text- px-2 py-1 rounded-full bg-white/10 border border-white/10">14-18 Mar 2027</span>
            </div>
            <h3 className="mt-12 text- font-black tracking-tight">MOOD ANALYSIS</h3>
            <div className="mt-2 flex items-center gap-3 text- text-white/60">
              <span>📍 Private, IN</span><span className="px-2 py-0.5 rounded-full bg-[#f7e9a0]/20 text-[#f7e9a0] border border-[#f7e9a0]/20">$120</span><span>👥 1,000</span>
            </div>
            <button onClick={()=>navigate("/app")} className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-[#f7e9a0] text-black text- font-bold">APPLY →</button>
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#f7e9a0] flex items-center justify-center text-">⚖️</div>
          </div>

          {/* Card 2 */}
          <div className="group relative rounded- overflow-hidden border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] p-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">🎙️</div>
              <span className="text- px-2 py-1 rounded-full bg-white/10 border border-white/10">10-11 Oct 2026</span>
            </div>
            <h3 className="mt-12 text- font-black tracking-tight">VOICE TONE</h3>
            <div className="mt-2 flex items-center gap-3 text- text-white/60">
              <span>📍 Jammu, IN</span><span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">₹3000</span><span>👥 1,500</span>
            </div>
            <button onClick={()=>navigate("/app")} className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-[#f7e9a0] text-black text- font-bold">APPLY →</button>
          </div>

          {/* Card 3 - Peeking like IMUN */}
          <div className="relative rounded- overflow-hidden border border-white/10 bg-[#0f2a1f] p-4 h-">
            <h3 className="mt-6 text- font-black tracking-tight opacity-80">JOURNAL 2026</h3>
            <span className="absolute top-3 right-12 text- px-2 py-1 rounded-full bg-white/10">25-26 Jul 2026</span>
          </div>
        </div>
      </div>

      {/* ONE PLATFORM EVERY ROLE - Like Gavelling */}
      <div className="bg-[#f6f3ee] text-[#111] py-16 px-6">
        <div className="max-w- mx-auto text-center">
          <p className="text- tracking-[0.2em] uppercase text-[#9a8a5a] font-bold">Find your seat</p>
          <h2 className="mt-3 text- md:text- font-[900] tracking-tight" style={{fontFamily:'Inter'}}>One platform, every role.</h2>

          <div className="mt-10 relative max-w- mx-auto rounded- overflow-hidden bg-[#111] h- flex">
            {/* Carousel-like */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-[#e8e6e3] flex items-center justify-center text- font-black opacity-30">DELEGATES</div>
              <div className="flex-[1.3] bg-[#0a0a0a] text-white p-8 flex flex-col justify-center text-left relative z-10">
                <h3 className="text- font-black leading-none tracking-tight">SECRETARIAT</h3>
                <p className="mt-4 text- leading-[1.6] text-white/70">The machine behind the weekend: run applications, allocations, delegates and communications from one place — the whole show, zero fees.</p>
                <div className="mt-6 flex gap-3">
                  <button onClick={()=>navigate("/app")} className="px-4 py-2 rounded-full bg-[#f7e9a0] text-black text- font-bold">See open roles</button>
                  <button className="px-4 py-2 rounded-full border border-white/20 text-white text-">List your conference</button>
                </div>
              </div>
              <div className="flex-1 bg-[#d8d5d0] flex items-center justify-center text- font-black opacity-30">CHAIRS</div>
            </div>
          </div>

          {/* Stats like Gavelling */}
          <div className="mt-12 grid grid-cols-3 max-w- mx-auto divide-x divide-black/10">
            <div><p className="text- font-black leading-none">127</p><p className="mt-2 text- tracking-widest uppercase text-[#9a8a5a]">Conferences on the board</p></div>
            <div><p className="text- font-black leading-none">27,508</p><p className="mt-2 text- tracking-widest uppercase text-[#9a8a5a]">Delegates expected</p></div>
            <div><p className="text- font-black leading-none">45</p><p className="mt-2 text- tracking-widest uppercase text-[#9a8a5a]">Countries</p></div>
          </div>
        </div>
      </div>

      {/* MUN IN INDIA - Card grid */}
      <div className="bg-[#efeadd] text-[#111] py-12 px-6">
        <div className="max-w- mx-auto">
          <h2 className="text- font-black tracking-tight">MUN in India</h2>
          <p className="text- text-black/60">Conferences around New Delhi and across India.</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {name:'ICMUN 2026', place:'Mumbai, IN', date:'25-26 Jul 2026', price:'FREE', count:50},
              {name:'NUEMUN 2026', place:'Kolhapur, IN', date:'1-2 Aug 2026', price:'FREE', count:100},
              {name:'NMUN 2026', place:'Dehradun, IN', date:'9-9 Aug 2026', price:'₹99', count:100},
              {name:'IGMUN 2026', place:'Mumbai, IN', date:'15-16 Aug 2026', price:'₹450', count:150},
            ].map(card=>(
              <div key={card.name} className="rounded- overflow-hidden bg-white border border-black/5 shadow-sm">
                <div className="h- bg-[#111] relative p-3">
                  <span className="text- px-2 py-1 rounded-full bg-white/10 border border-white/20 text-white">{card.date}</span>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 rounded-full bg-white border-4 border-white shadow flex items-center justify-center text-">🦉</div>
                </div>
                <div className="pt-8 p-4">
                  <div className="flex justify-between items-center"><h4 className="font-black text-">{card.name}</h4><span className="text- px-2 py-1 rounded-full border border-black/10 bg-[#f7e9a0]/30 font-bold">{card.price}</span></div>
                  <p className="text- text-black/60 mt-1">{card.place}</p>
                  <div className="mt-4 flex justify-between items-center"><span className="text- bg-black/5 px-2 py-1 rounded-full">👥 {card.count}</span><button onClick={()=>navigate("/app")} className="px-3 py-1.5 rounded-full bg-[#f7e9a0] text-black text- font-bold">APPLY →</button></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rolex-style minimal footer */}
      <div className="py-20 text-center bg-[#0a0a12] border-t border-white/5">
        <p className="text- tracking-[0.3em] uppercase text-white/40">Oyster Perpetual</p>
        <h2 className="text- font-bold tracking-tight mt-2" style={{fontFamily:'"Instrument Serif", serif'}}>MindGuard</h2>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={()=>navigate("/app")} className="px-6 py-2.5 rounded-full bg-[#8b5cf6] text-white text- font-bold">Start Analysis</button>
          <button className="px-6 py-2.5 rounded-full bg-white text-black text- font-bold">Learn More</button>
        </div>
        <p className="mt-16 text- text-white/30 max-w- mx-auto px-6">MindGuard is for wellness support only and does not provide medical diagnosis. If you are in crisis, call Kiran 1800-599-0019 or 112. By using this site you accept our privacy policy.</p>
      </div>

      <LegalCookieBanner />
    </div>
  );
}