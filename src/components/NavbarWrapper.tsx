"use client"

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import MobileTabs from '@/components/MobileTabs'; 
import { usePathname } from 'next/navigation';

export default function NavbarWrapper() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthPage = pathname?.startsWith('/auth');
  
  // Hide everything if not logged in, loading, or on login/signup page
  if (loading || !session || isAuthPage) {
    return null;
  }

  return (
    <>
      <Navbar />
      <MobileTabs />
    </>
  );
}