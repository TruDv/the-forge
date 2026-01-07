"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Menu, X, Bell } from 'lucide-react'; // <--- Added Bell

export default function Navbar() {
  const pathname = usePathname();
  const [initials, setInitials] = useState('US');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- NOTIFICATION STATE ---
  const [notifCount, setNotifCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    async function getUserAndListen() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // 1. Set Initials
        const name = session.user.user_metadata?.full_name || session.user.email;
        if (name) setInitials(name.charAt(0).toUpperCase());

        // 2. Listen for Realtime Events (Chat & Replies)
        const channel = supabase
          .channel('global_alerts')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' }, // Upper Room
            (payload) => {
              if (payload.new.user_id !== session.user.id) {
                triggerNotification();
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'prayer_replies' }, // Prayer Replies
            (payload) => {
              if (payload.new.user_id !== session.user.id) {
                triggerNotification();
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
    getUserAndListen();
  }, []);

  const triggerNotification = () => {
    setNotifCount(prev => prev + 1);
    setIsAnimating(true);
    // Remove animation class after it plays
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Fasting', href: '/fasting' },
    { name: 'Prayers', href: '/prayers' },
    { name: 'Testimonies', href: '/testimonies' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
        
        {/* --- 1. LOGO SECTION --- */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-32 h-10 md:w-40 md:h-12"> 
            <Image 
              src="/logo1.png" 
              alt="The Forge Logo" 
              fill 
              className="object-contain object-left" 
              priority
            />
          </div>
        </Link>
        
        {/* --- 2. DESKTOP NAVIGATION --- */}
        <div className="hidden md:flex space-x-8 font-medium text-sm">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`${
                pathname === link.href 
                ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' 
                : 'text-slate-500 hover:text-indigo-600 transition'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* --- 3. RIGHT SIDE ACTIONS --- */}
        <div className="flex items-center gap-4">
          
          {/* NOTIFICATION BELL (NEW) */}
          <button 
            onClick={() => setNotifCount(0)} // Reset count on click
            className={`relative p-2 rounded-full transition-all hover:bg-slate-50 ${isAnimating ? 'animate-bounce' : ''}`}
          >
            <Bell size={20} className={notifCount > 0 ? "text-indigo-600" : "text-slate-400"} />
            
            {/* Red Badge */}
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] font-black text-white items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              </span>
            )}
          </button>

          {/* Profile Link */}
          <Link 
            href="/profile" 
            className="w-9 h-9 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-white hover:scale-105 transition-transform cursor-pointer"
          >
            {initials}
          </Link>

          {/* Hamburger Button */}
          <button 
            className="md:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* --- 4. MOBILE MENU DROPDOWN --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white absolute top-16 left-0 w-full shadow-lg py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-5 duration-200">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className={`text-sm font-bold py-2 ${
                pathname === link.href 
                ? 'text-indigo-600' 
                : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}