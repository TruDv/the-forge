"use client"

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // Ensure this path matches your project
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if a user is currently logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
    };

    checkAuth();

    // 2. Listen for login/logout events to update immediately
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- LOGIC RULES ---

  // Rule 1: Always HIDE on Auth pages (Login, Signup, Forgot Password)
  if (pathname?.startsWith('/auth')) return null;

  // Rule 2: Special handling for the Home Page ('/')
  if (pathname === '/') {
    // While we are checking if they are logged in, hide footer to prevent flashing
    if (loading) return null;

    // If on Home ('/') but NOT logged in (Landing Page mode) -> HIDE Footer
    if (!isAuthenticated) return null;

    // If on Home ('/') AND logged in (Dashboard mode) -> SHOW Footer
    return <Footer />;
  }

  // Rule 3: SHOW on all other pages (Archives, Fasting, Profile, etc.)
  return <Footer />;
}