"use client"
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function Navbar() {
  const pathname = usePathname();
  const [initials, setInitials] = useState('US');

  useEffect(() => {
    async function getInitials() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Try to get name from metadata, otherwise use the first letter of their email
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
        {/* Logo Section */}
        {/* NEW WAY (With Logo) */}
<Link href="/" className="flex items-center gap-2">
  <div className="relative w-40 h-12"> {/* Adjust w- and h- to fit your logo aspect ratio */}
    <Image 
      src="/logo1.png" 
      alt="The Forge Logo" 
      fill 
      className="object-contain object-left" 
      priority
    />
  </div>
</Link>
        
        {/* Navigation Links */}
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

        {/* Profile Link Icon */}
        <Link 
          href="/profile" 
          className="w-9 h-9 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-white hover:scale-105 transition-transform cursor-pointer"
        >
          {initials}
        </Link>
      </div>
    </nav>
  );
}