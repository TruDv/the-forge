"use client"

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Flame, Users, ArrowLeft, X, User, Shield, 
  Activity, ChevronRight, Info, BookOpen 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WatchmanPage() {
  const [count, setCount] = useState(0);
  const [isPraying, setIsPraying] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [watchmenList, setWatchmenList] = useState<any[]>([]);
  const [showList, setShowList] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [currentWatch, setCurrentWatch] = useState({ number: 0, time: "" });
  
  const pingInterval = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const WATCH_TIMETABLE = [
    { n: 1, t: "12AM - 3AM", title: "The Graveyard Watch", desc: "Breaking dark covenants and deep intercession." },
    { n: 2, t: "3AM - 6AM", title: "The Morning Watch", desc: "Commanding the morning and birthing new things." },
    { n: 3, t: "6AM - 9AM", title: "The Sunrise Watch", desc: "Setting the foundation for the day ahead." },
    { n: 4, t: "9AM - 12PM", title: "Mid-Morning Watch", desc: "Accessing heaven's resources and favor." },
    { n: 5, t: "12PM - 3PM", title: "The Noonday Watch", desc: "Fighting the destruction that walks at noonday." },
    { n: 6, t: "3PM - 6PM", title: "The Afternoon Watch", desc: "Closing the gates of the day and refining work." },
    { n: 7, t: "6PM - 9PM", title: "The Evening Watch", desc: "Establishing peace and spiritual foundations." },
    { n: 8, t: "9PM - 12AM", title: "The Night Watch", desc: "Protection and silence before the Lord." },
  ];

  // 1. Bible Watch Calculation
  useEffect(() => {
    const calculateWatch = () => {
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 3) return { number: 1, time: "12AM - 3AM" };
      if (hour >= 3 && hour < 6) return { number: 2, time: "3AM - 6AM" };
      if (hour >= 6 && hour < 9) return { number: 3, time: "6AM - 9AM" };
      if (hour >= 9 && hour < 12) return { number: 4, time: "9AM - 12PM" };
      if (hour >= 12 && hour < 15) return { number: 5, time: "12PM - 3PM" };
      if (hour >= 15 && hour < 18) return { number: 6, time: "3PM - 6PM" };
      if (hour >= 18 && hour < 21) return { number: 7, time: "6PM - 9PM" };
      return { number: 8, time: "9PM - 12AM" };
    };
    setCurrentWatch(calculateWatch());
    const timer = setInterval(() => setCurrentWatch(calculateWatch()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. Init: Get User & Current Data
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const currentUserId = session.user.id;
      setUserId(currentUserId);
      fetchActiveWatchmen(currentUserId);
    }
    init();

    const channel = supabase.channel('watchman_room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchman_logs' }, () => {
          fetchActiveWatchmen(userId); 
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      if (pingInterval.current) clearInterval(pingInterval.current);
    };
  }, [userId, router]);

  const fetchActiveWatchmen = async (currentMyId: string | null) => {
    const { data } = await supabase
      .from('watchman_logs')
      .select('user_id, last_ping, profiles(full_name)')
      .order('last_ping', { ascending: false });

    if (data) {
      const now = new Date();
      const activeUsers = data.filter(log => {
        const pingTime = new Date(log.last_ping);
        const diffSeconds = (now.getTime() - pingTime.getTime()) / 1000;
        return diffSeconds < 60; 
      });

      setWatchmenList(activeUsers);
      setCount(activeUsers.length);

      if (currentMyId && activeUsers.find(u => u.user_id === currentMyId)) {
          setIsPraying(true);
          if (!pingInterval.current) startPinging(currentMyId);
      }
    }
  };

  const startPinging = (id: string) => {
    if (pingInterval.current) clearInterval(pingInterval.current);
    pingInterval.current = setInterval(async () => {
      await supabase.from('watchman_logs').upsert({ user_id: id, last_ping: new Date().toISOString() });
    }, 10000);
  };

  const togglePrayer = async () => {
    if (!userId) return;
    if (isPraying) {
      setIsPraying(false);
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
      await supabase.from('watchman_logs').delete().eq('user_id', userId);
      setWatchmenList(prev => prev.filter(u => u.user_id !== userId));
      setCount(prev => Math.max(0, prev - 1));
    } else {
      setIsPraying(true);
      await supabase.from('watchman_logs').upsert({ user_id: userId, last_ping: new Date().toISOString() });
      startPinging(userId);
      fetchActiveWatchmen(userId);
    }
  };

  const fireScale = 1 + (Math.min(count, 50) * 0.05); 
  const fireOpacity = count > 0 ? (0.5 + (Math.min(count, 10) * 0.05)) : 0.2; 

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden text-slate-200 p-4 md:p-8">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />

      {/* TOP HEADER */}
      <div className="relative z-20 flex justify-between items-center mb-8">
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
          <ArrowLeft size={14} /> Exit Wall
        </Link>
        
        <button 
          onClick={() => setShowList(true)}
          className="flex items-center gap-2 text-indigo-400 bg-indigo-950/40 px-4 py-2 rounded-xl border border-indigo-900/50 hover:bg-indigo-900/60 transition-all group"
        >
          <Users size={14} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black">{count} Watchmen Active</span>
        </button>
      </div>

      {/* WATCHMAN STATUS DASHBOARD */}
      <div className="relative z-20 w-full max-w-4xl mx-auto mb-12">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
            
            {/* Watch Indicator with Info Button */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full border-4 border-white/5 flex items-center justify-center relative bg-slate-950 shadow-inner">
                <div className="text-center">
                  <span className="block text-[10px] font-black text-indigo-500 uppercase tracking-tighter leading-none">Watch</span>
                  <span className="text-4xl font-black text-white italic">{currentWatch.number}</span>
                </div>
                <button 
                  onClick={() => setShowInfo(true)}
                  className="absolute -top-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg hover:bg-orange-500 transition-colors z-30"
                >
                  <Info size={12} />
                </button>
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-ping opacity-20 pointer-events-none" />
              </div>
            </div>

            {/* Status Text */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Operation</span>
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">
                The Wall is <span className="text-indigo-400">{count > 0 ? 'Secure' : 'Open'}</span>
              </h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center md:justify-start gap-2">
                <Shield size={12} className="text-indigo-500" /> Current Shift: {currentWatch.time}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-3 w-full md:w-auto">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[120px]">
                <Activity size={16} className="text-orange-500 mb-1" />
                <span className="text-lg font-black text-white uppercase italic tracking-tight">{isPraying ? 'On Duty' : 'Standby'}</span>
                <span className="text-[8px] font-black uppercase text-slate-500">Your Status</span>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-600/20 px-6 py-2 flex justify-center items-center">
             <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] text-center">Maintaining the 24-hour spiritual frequency</span>
          </div>
        </div>
      </div>

      {/* CENTER FLAME VISUAL */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 pb-20">
        <div 
          className="relative transition-all duration-1000 ease-in-out"
          style={{ transform: `scale(${fireScale})` }}
        >
          <div className="absolute inset-0 bg-orange-600 blur-[120px] rounded-full transition-opacity duration-1000" style={{ opacity: fireOpacity * 0.4 }} />
          <Flame 
            size={140} 
            className={`relative z-10 transition-all duration-700 ${count > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-800'}`} 
            fill={count > 0 ? "currentColor" : "none"}
          />
        </div>

        <div className="mt-12 text-center max-w-sm px-6">
          <p className="text-slate-300 font-serif italic text-lg md:text-xl leading-relaxed">
            "I have posted watchmen on your walls, O Jerusalem; they will never be silent day or night."
          </p>
        </div>

        <button
          onClick={togglePrayer}
          className={`mt-12 group relative flex items-center gap-3 px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all transform active:scale-95 shadow-2xl
            ${isPraying 
              ? 'bg-white text-slate-950 shadow-white/10' 
              : 'bg-orange-600 text-white shadow-orange-900/40 hover:bg-orange-500 hover:-translate-y-1'
            }`}
        >
          {isPraying ? (
            <>
              <Shield size={18} fill="currentColor" />
              I Am Standing Watch
            </>
          ) : (
            <>
              <Flame size={18} />
              Mount the Wall
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* WATCH TIMETABLE MODAL */}
      {showInfo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => setShowInfo(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-indigo-600">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-white" />
                <h3 className="font-black text-white text-sm uppercase tracking-[0.2em]">The 8 Watches</h3>
              </div>
              <button onClick={() => setShowInfo(false)} className="p-1 hover:bg-white/10 rounded-full text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <div className="space-y-2">
                {WATCH_TIMETABLE.map((w) => (
                  <div 
                    key={w.n} 
                    className={`p-4 rounded-2xl border transition-all ${currentWatch.number === w.n ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-white/5 opacity-60'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Watch {w.n}</span>
                       <span className="text-[10px] font-bold text-slate-400">{w.t}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm uppercase tracking-tight">{w.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 italic leading-snug">{w.desc}</p>
                    {currentWatch.number === w.n && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Shift</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-950/50 border-t border-white/5 text-center">
               <p className="text-[9px] text-slate-500 font-bold uppercase italic tracking-widest">
                 "They shall never be silent day or night" — Isaiah 62:6
               </p>
            </div>
          </div>
        </div>
      )}

      {/* WATCHMEN LIST MODAL */}
      {showList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowList(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-black text-white text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                <Shield size={14} className="text-indigo-500" /> Active Watchmen
              </h3>
              <button onClick={() => setShowList(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
              {watchmenList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-bold uppercase italic tracking-widest">The wall is currently quiet.</div>
              ) : (
                watchmenList.map((entry) => (
                  <div key={entry.user_id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-black border border-white/10 uppercase">
                        {entry.profiles?.full_name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">
                          {entry.profiles?.full_name || "Anonymous"}
                          {entry.user_id === userId && <span className="text-indigo-500 ml-2">(You)</span>}
                        </p>
                        <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Active Duty
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}