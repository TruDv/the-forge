"use client"

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Flame, Users, ArrowLeft, X, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WatchmanPage() {
  const [count, setCount] = useState(0);
  const [isPraying, setIsPraying] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [watchmenList, setWatchmenList] = useState<any[]>([]);
  const [showList, setShowList] = useState(false);
  
  const pingInterval = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // 1. Init: Get User & Current Data
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const currentUserId = session.user.id;
      setUserId(currentUserId);
      
      // Fetch status immediately to see if I am already praying
      fetchActiveWatchmen(currentUserId);
    }
    init();

    // Realtime Listener
    const channel = supabase.channel('watchman_room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchman_logs' }, () => {
         // Pass userId if we have it, otherwise null (it's okay, state update will handle it next render)
         fetchActiveWatchmen(userId); 
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      if (pingInterval.current) clearInterval(pingInterval.current);
    };
  }, [userId, router]);

  // Helper to fetch data AND restore state
  const fetchActiveWatchmen = async (currentMyId: string | null) => {
    const { data } = await supabase
      .from('watchman_logs')
      .select('user_id, last_ping, profiles(full_name)')
      .order('last_ping', { ascending: false });

    if (data) {
      // GHOST FILTER: Only count people who pinged in the last 60 seconds
      const now = new Date();
      const activeUsers = data.filter(log => {
        const pingTime = new Date(log.last_ping);
        const diffSeconds = (now.getTime() - pingTime.getTime()) / 1000;
        return diffSeconds < 60; 
      });

      setWatchmenList(activeUsers);
      setCount(activeUsers.length);

      // RESTORE STATE: If I am in the active list, set my status to TRUE and resume pinging
      if (currentMyId && activeUsers.find(u => u.user_id === currentMyId)) {
         setIsPraying(true);
         // If interval isn't running, start it
         if (!pingInterval.current) {
            startPinging(currentMyId);
         }
      }
    }
  };

  const startPinging = (id: string) => {
    if (pingInterval.current) clearInterval(pingInterval.current); // clear existing to be safe
    
    pingInterval.current = setInterval(async () => {
      await supabase.from('watchman_logs').upsert({ user_id: id, last_ping: new Date().toISOString() });
    }, 10000);
  };

  // 2. The "I Am Praying" Logic
  const togglePrayer = async () => {
    if (!userId) return;

    if (isPraying) {
      // STOP PRAYING
      setIsPraying(false);
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
      // Remove me from DB immediately
      await supabase.from('watchman_logs').delete().eq('user_id', userId);
      // Update local UI immediately so it feels snappy
      setWatchmenList(prev => prev.filter(u => u.user_id !== userId));
      setCount(prev => Math.max(0, prev - 1));
    
    } else {
      // START PRAYING
      setIsPraying(true);
      await supabase.from('watchman_logs').upsert({ user_id: userId, last_ping: new Date().toISOString() });
      startPinging(userId);
      fetchActiveWatchmen(userId); // Refresh list to show me instantly
    }
  };

  // --- VISUAL SCALING ---
  // If count is > 0, ensure fire is visible. 
  // Base scale is 1. If 0 people, fire opacity drops but icon stays visible (dormant).
  const fireScale = 1 + (Math.min(count, 50) * 0.05); 
  const fireOpacity = count > 0 ? (0.5 + (Math.min(count, 10) * 0.05)) : 0.2; 
  const isFireActive = count > 0;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden text-slate-200">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/20 via-slate-950 to-slate-950" />

      {/* Header */}
      <div className="relative z-20 p-6 flex justify-between items-center">
        <Link href="/prayers" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
          <ArrowLeft size={16} /> Exit
        </Link>
        
        {/* ACTIVE COUNT BUTTON */}
        <button 
          onClick={() => setShowList(true)}
          className="flex items-center gap-2 text-orange-500 bg-orange-950/40 px-3 py-1.5 rounded-full border border-orange-900/50 hover:bg-orange-900/60 transition-colors cursor-pointer group"
        >
          <Users size={14} className="group-hover:text-white transition-colors" />
          <span className="text-xs font-black group-hover:text-white transition-colors">{count} Active</span>
        </button>
      </div>

      {/* --- WATCHMEN LIST MODAL --- */}
      {showList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowList(false)} />
          
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Flame size={14} className="text-orange-500" /> Watchmen on the Wall
              </h3>
              <button onClick={() => setShowList(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {watchmenList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No one else is here yet.</div>
              ) : (
                watchmenList.map((entry) => (
                  <div key={entry.user_id} className="flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-xl transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        {entry.profiles?.full_name || "Anonymous Watchman"}
                        {entry.user_id === userId && <span className="text-slate-500 text-[10px] ml-2">(You)</span>}
                      </p>
                      <p className="text-[10px] text-green-500 font-medium uppercase tracking-wide">
                        ● Praying Now
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CENTER STAGE */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        
        {/* THE LIVING FLAME */}
        <div 
          className="relative transition-all duration-1000 ease-in-out"
          style={{ transform: `scale(${fireScale})` }}
        >
          {/* Outer Glow */}
          <div className={`absolute inset-0 bg-orange-500 blur-[100px] rounded-full transition-opacity duration-1000`} style={{ opacity: fireOpacity * 0.5 }} />
          
          {/* Core Fire Icon */}
          <Flame 
            size={120} 
            className={`relative z-10 transition-all duration-500 ${isFireActive ? 'text-orange-400 animate-pulse' : 'text-slate-800'}`} 
            fill={isFireActive ? "currentColor" : "none"}
          />
        </div>

        {/* Text */}
        <div className="mt-12 text-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            The Watchman
          </h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            "I have posted watchmen on your walls, O Jerusalem; they will never be silent day or night."
          </p>
        </div>

        {/* ACTION BUTTON */}
        <button
          onClick={togglePrayer}
          className={`mt-12 px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all transform hover:scale-105 shadow-2xl
            ${isPraying 
              ? 'bg-orange-600 text-white shadow-orange-900/50 ring-4 ring-orange-500/20' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
        >
          {isPraying ? "I Am Standing Watch" : "Join the Watch"}
        </button>

      </div>
    </div>
  );
}