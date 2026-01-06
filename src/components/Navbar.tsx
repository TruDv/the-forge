"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Menu, X } from 'lucide-react'; // <--- Import Icons

export default function Navbar() {
  const pathname = usePathname();
  const [initials, setInitials] = useState('US');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // <--- New State

  useEffect(() => {
    async function getInitials() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email;
        if (name) {
          setInitials(name.charAt(0).toUpperCase());
        }
      }
    }
    getInitials();
  }, []);

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
        
        {/* --- 2. DESKTOP NAVIGATION (Hidden on Mobile) --- */}
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

        {/* --- 3. RIGHT SIDE ACTIONS (Profile + Hamburger) --- */}
        <div className="flex items-center gap-4">
          
          {/* Profile Link (Always Visible) */}
          <Link 
            href="/profile" 
            className="w-9 h-9 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-white hover:scale-105 transition-transform cursor-pointer"
          >
            {initials}
          </Link>

          {/* Hamburger Button (Visible only on Mobile) */}
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
              onClick={() => setIsMobileMenuOpen(false)} // Close menu when clicked
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