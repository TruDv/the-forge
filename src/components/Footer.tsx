"use client"

import React, { useState } from 'react';
import { Flame, Mic, Shield, Globe, Github, Twitter, Instagram, BookOpen, Scroll, X } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <>
      <footer className="bg-slate-950 border-t border-white/5 pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            
            {/* Brand Section */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center rotate-3">
                  <Flame className="text-white" size={24} fill="currentColor" />
                </div>
                <span className="text-2xl font-black italic tracking-tighter text-white uppercase">
                  The Forge
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
                A digital sanctuary for prophetic charges, communal prayer, and spiritual iron-sharpening. 
                Led by Puritan Charles, forged in faith.
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </div>
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">
                  Forge Active: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} GMT
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase text-xs tracking-widest">Navigation</h4>
              <ul className="space-y-4">
                <li>
                  {/* ABOUT LINK (Triggers Modal) */}
                  <button 
                    onClick={() => setIsAboutModalOpen(true)}
                    className="text-slate-400 hover:text-white transition-colors text-sm font-bold flex items-center gap-2"
                  >
                    <Scroll size={14} /> About The Forge
                  </button>
                </li>
                <li>
                  <Link href="/bible" className="text-slate-400 hover:text-orange-500 transition-colors text-sm font-bold flex items-center gap-2">
                    <BookOpen size={14} /> The Holy Bible
                  </Link>
                </li>
                <li>
                  <Link href="/announcements" className="text-slate-400 hover:text-orange-500 transition-colors text-sm font-bold flex items-center gap-2">
                    <Mic size={14} /> The Oracle Archives
                  </Link>
                </li>
                <li>
                  <Link href="/fasting" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm font-bold flex items-center gap-2">
                    <Shield size={14} /> Spiritual Walk
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Connect */}
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase text-xs tracking-widest">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-orange-600 hover:text-white transition-all">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                  <Twitter size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-all">
                  <Github size={18} />
                </a>
              </div>
              <p className="text-[10px] text-slate-500 font-medium italic">
                Join the conversation on our social platforms for daily reminders.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
              © {currentYear} The Forge Community. Built for the Kingdom.
            </p>
            <div className="flex gap-8">
              <Link href="/privacy" className="text-slate-600 hover:text-slate-400 text-[9px] font-black uppercase tracking-widest">Privacy Policy</Link>
              <Link href="/terms" className="text-slate-600 hover:text-slate-400 text-[9px] font-black uppercase tracking-widest">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* --- ABOUT MODAL (No Sign Up Button) --- */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsAboutModalOpen(false)}
          />
          <div className="bg-white text-slate-900 w-full max-w-3xl h-[80vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-8 flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-2 text-orange-500">
                  <Flame size={20} fill="currentColor" />
                  <span className="font-black uppercase tracking-widest text-xs">The Manifesto</span>
                </div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Welcome to The Forge</h2>
              </div>
              <button onClick={() => setIsAboutModalOpen(false)} className="bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 scrollbar-thin scrollbar-thumb-slate-200 pb-16">
              
              {/* --- 00. WHO WE ARE --- */}
              <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-500">00.</span> Who We Are
                </h3>
                <div className="space-y-4 text-slate-700 leading-relaxed font-medium">
                  <p>
                    <strong className="text-slate-900">The Forge</strong> is a Christian Discipleship Fellowship. It is a Church of God, with Christ as the head and center of our fellowship.
                  </p>
                  <p>
                    We see The Forge as a <strong className="text-slate-900">house of God</strong>, where as believers, we demonstrate God's character and reflect His loving, glorious, and righteous nature.
                  </p>
                  <p>
                    The Forge is also a <strong className="text-slate-900">family of God</strong>, called to manifest the love of God and the relationship that exists between Him and us.
                  </p>
                </div>
              </section>

              <div className="h-px bg-slate-100 w-full" />

              {/* --- 01. THE CHALLENGE --- */}
              <section>
                <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-500">01.</span> The Challenge of Faith
                </h3>
                <p className="text-slate-600 font-serif italic text-lg leading-relaxed border-l-4 border-orange-500 pl-4 mb-4">
                  "Today, the greatest challenge among the children of God is their failure to believe in His Word. This lack of faith reflects poorly on God, almost as if He were lying."
                </p>
                <p className="text-slate-700 leading-relaxed text-lg">
                  How long can you truly believe in God? For three hours, three days, or three months? Or do you find yourself saying, "If God wants to do it, He will do it"? This mindset is not faith; it is blindness. Since our time on earth is limited, we need to learn how to number our days in order to please God.
                </p>
              </section>

              <div className="h-px bg-slate-100 w-full" />

              {/* --- 02. FORGED IN FIRE --- */}
              <section>
                <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-500">02.</span> Forged in Fire
                </h3>
                <p className="text-slate-700 leading-relaxed mb-6 text-lg">
                  Just as Adam was not made for Eve, but Eve for Adam, the primary purpose of a believer is to live for Christ. We believe that <strong className="text-orange-600">furnaces must be heated red-hot before the songs of deliverance can be sung.</strong> There is no dawn of salvation until the evening has deepened into midnight gloom.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                    <p className="text-sm font-black text-slate-900 mb-1 uppercase tracking-widest">Jacob</p>
                    <p className="text-slate-600">Did not become Israel without wrestling through the night.</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                    <p className="text-sm font-black text-slate-900 mb-1 uppercase tracking-widest">Peter</p>
                    <p className="text-slate-600">Did not become the rock until he sank in deep waters.</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                    <p className="text-sm font-black text-slate-900 mb-1 uppercase tracking-widest">Joseph</p>
                    <p className="text-slate-600">Languished in a dark prison, seemingly forgotten, before his destiny unfolded.</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                    <p className="text-sm font-black text-slate-900 mb-1 uppercase tracking-widest">The Heroic Soul</p>
                    <p className="text-slate-600">It is in solitude that the heroic soul must be matured for its grand destiny.</p>
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100 w-full" />

              {/* --- 03. THE MANDATE --- */}
              <section>
                <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-500">03.</span> The Mandate
                </h3>
                <p className="text-slate-700 leading-relaxed mb-4 text-lg">
                  We increasingly perceive that we stand at a crossroads where we must make a choice. On one side, the world lays out all its treasures before us, offering a glittering career. On the other, the call to lower ourselves to serve Him who detests lofty appearances.
                </p>
                <p className="text-slate-700 leading-relaxed mb-6 text-lg">
                  We are called to demonstrate our ability to conquer through faith, not by escaping the world, but by living within it. Let "Forward" be your watchword. Move from faith to stronger faith, from light to greater light, and from victory to victory—ever onward!
                </p>
              </section>

              {/* --- 04. THE PROMISE --- */}
              <section className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                <h3 className="text-xl font-black text-orange-900 mb-3">The Promise</h3>
                <p className="text-orange-900/80 italic font-serif leading-relaxed mb-4">
                  "Fear not, for I am with you; be not dismayed, for I am your God. I will strengthen you, yes, I will help you; I will uphold you with the right hand of my righteousness."
                </p>
              </section>

              {/* --- CLOSING --- */}
              <section className="text-center pt-8">
                <p className="text-slate-500 font-medium text-sm uppercase tracking-widest mb-2">To the King Eternal</p>
                <p className="text-slate-900 font-bold">
                  Now unto Him that is able to do exceeding abundantly above all that we ask or think, according to the power that worketh in us, unto Him be glory in the Church, by Christ Jesus, throughout all ages, world without end!
                </p>
                <p className="text-orange-600 font-black italic mt-4 text-lg">Welcome to The Forge.</p>
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}