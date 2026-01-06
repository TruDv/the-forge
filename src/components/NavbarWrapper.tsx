"use client"

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

export default function NavbarWrapper() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show navbar if:
  // - We are still loading
  // - There is no user logged in
  // - We are on the Login or Signup pages
  const isAuthPage = pathname?.startsWith('/auth');
  
  if (loading || !session || isAuthPage) {
    return null;
  }

  return <Navbar />;
}