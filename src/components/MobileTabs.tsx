"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Flame, 
  Shield, 
  MessageSquare, 
  Cross,
  Home // <--- Added missing Home import
} from 'lucide-react';

export default function MobileTabs() {
  const pathname = usePathname();
  
  // --- Activity States ---
  const [hasNewChat, setHasNewChat] = useState(false);
  const [hasNewDM, setHasNewDM] = useState(false); // <--- Added missing state
  const [hasNewPrayer, setHasNewPrayer] = useState(false);
  const [watchmanActive, setWatchmanActive] = useState(false);
  const [isCommunalFasting, setIsCommunalFasting] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Initial Checks
    const runInitialChecks = async () => {
      // Check Watchmen
      const { count: wCount } = await supabase.from('watchman_logs').select('*', { count: 'exact', head: true });
      setWatchmanActive((wCount || 0) > 0);

      // Check Fasting (Is anyone fasting today?)
      const { count: fCount } = await supabase.from('fasting_daily_attendance').select('*', { count: 'exact', head: true }).eq('date', today);
      setIsCommunalFasting((fCount || 0) > 0);
    };
    runInitialChecks();

    // 2. Realtime Listener for CHAT
    const chatChannel = supabase.channel('tab-chat-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (pathname !== '/UpperRoom') {
          // If it has a receiver_id, it's a DM, otherwise it's a general chat
          if (payload.new.receiver_id) {
            setHasNewDM(true);
          } else {
            setHasNewChat(true);
          }
        }
      })
      .subscribe();

    // 3. Realtime Listener for PRAYERS/COMMENTS
    const prayerChannel = supabase.channel('tab-prayer-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prayers' }, () => {
        if (pathname !== '/prayers') setHasNewPrayer(true);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prayer_replies' }, () => {
        if (pathname !== '/prayers') setHasNewPrayer(true);
      })
      .subscribe();

    // 4. Realtime Listener for WATCHMAN
    const watchmanChannel = supabase.channel('tab-watchman-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchman_logs' }, async () => {
        const { count } = await supabase.from('watchman_logs').select('*', { count: 'exact', head: true });
        setWatchmanActive((count || 0) > 0);
      })
      .subscribe();

    // 5. Realtime Listener for FASTING
    const fastingChannel = supabase.channel('tab-fasting-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fasting_daily_attendance' }, async () => {
        const { count } = await supabase.from('fasting_daily_attendance').select('*', { count: 'exact', head: true }).eq('date', today);
        setIsCommunalFasting((count || 0) > 0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(prayerChannel);
      supabase.removeChannel(watchmanChannel);
      supabase.removeChannel(fastingChannel);
    };
  }, [pathname]);

  // Reset indicators when user visits the page
  useEffect(() => {
    if (pathname === '/UpperRoom') {
      setHasNewChat(false);
      setHasNewDM(false);
    }
    if (pathname === '/prayers') setHasNewPrayer(false);
  }, [pathname]);

  const tabs = [
    { name: 'Home', href: '/', icon: Home, alert: false },
    { name: 'Prayers', href: '/prayers', icon: Cross, alert: hasNewPrayer },
    { name: 'Fasting', href: '/fasting', icon: Flame, alert: isCommunalFasting },
    { name: 'Watchman', href: '/watchman', icon: Shield, alert: watchmanActive },
    { name: 'Chat', href: '/UpperRoom', icon: MessageSquare, alert: hasNewChat || hasNewDM },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-t border-slate-200/50 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-14 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link 
              key={tab.name} 
              href={tab.href}
              className="flex flex-col items-center justify-center flex-1 relative"
            >
              {isActive && (
                <div className="absolute -top-1 w-8 h-0.5 bg-orange-500 rounded-full transition-all duration-300" />
              )}
              
              <div className="relative">
                <Icon 
                  size={20} 
                  className={`transition-all duration-200 ${
                    isActive ? 'text-orange-500 scale-110' : 'text-slate-400'
                  }`} 
                  fill={isActive ? "currentColor" : "none"}
                  fillOpacity={isActive ? 0.2 : 0}
                />
                
                {tab.alert && !isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                )}
              </div>
              
              <span className={`text-[8px] font-bold uppercase tracking-tighter mt-1 transition-colors ${
                isActive ? 'text-orange-600' : 'text-slate-500'
              }`}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}