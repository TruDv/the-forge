"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Heart, MessageCircle, Send, Star, 
  Flame, ArrowRight, Users 
} from 'lucide-react';

export default function PrayerPage() {
  const [request, setRequest] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [view, setView] = useState<'all' | 'testimonies'>('all');
  
  // Watchman State (Live Count)
  const [activeWatchmen, setActiveWatchmen] = useState(0);

  const [replies, setReplies] = useState<{ [key: string]: any[] }>({});
  const [expandedPrayers, setExpandedPrayers] = useState<{ [key: string]: boolean }>({});
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [myPrayedIds, setMyPrayedIds] = useState<string[]>([]);
  const [user, setUser] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchPrayers();
    fetchUser();
    fetchWatchmanCount(); // <--- Get the live count for the banner

    const saved = localStorage.getItem('user_prayed_ids');
    if (saved) setMyPrayedIds(JSON.parse(saved));

    // Subscribe to Watchman updates so the banner number moves live
    const channel = supabase.channel('prayer_page_watchman')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchman_logs' }, () => {
         fetchWatchmanCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [view]);

  async function fetchUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.user_metadata?.full_name || 'Puritan'
      });
    }
  }

  // New: Get count for the banner
  async function fetchWatchmanCount() {
    const { count } = await supabase.from('watchman_logs').select('*', { count: 'exact', head: true });
    setActiveWatchmen(count || 0);
  }

  async function fetchPrayers() {
    let query = supabase
      .from('prayers')
      .select(`*, profiles:user_id ( full_name, avatar_url )`)
      .order('created_at', { ascending: false });
    
    if (view === 'testimonies') query = query.eq('is_testimony', true);

    const { data: prayerData, error } = await query;
    
    if (error) {
      const { data: simpleData } = await supabase.from('prayers').select('*').order('created_at', { ascending: false });
      if (simpleData) setPrayers(simpleData);
    } else if (prayerData) {
      setPrayers(prayerData);
      // Fetch replies...
      const prayerIds = prayerData.map(p => p.id);
      if (prayerIds.length > 0) {
        const { data: replyData } = await supabase.from('prayer_replies').select('*').in('prayer_id', prayerIds).order('created_at', { ascending: true });
        if (replyData) {
          const grouped = replyData.reduce((acc: any, reply) => {
            acc[reply.prayer_id] = [...(acc[reply.prayer_id] || []), reply];
            return acc;
          }, {});
          setReplies(grouped);
        }
      }
    }
  }

  async function handleSubmit() {
    if (!request.trim() || !user) return;
    setIsPosting(true);
    
    const { error } = await supabase.from('prayers').insert([{ 
      content: request, 
      prayer_count: 0,
      user_id: user.id, 
      author_name: user.name,
      is_testimony: false
    }]);
    
    if (!error) {
      setRequest('');
      fetchPrayers();
    }
    setIsPosting(false);
  }

  async function handlePraying(prayerId: string, currentCount: number) {
    if (myPrayedIds.includes(prayerId)) return;
    const newCount = (currentCount || 0) + 1;
    const updatedIds = [...myPrayedIds, prayerId];
    setMyPrayedIds(updatedIds);
    localStorage.setItem('user_prayed_ids', JSON.stringify(updatedIds));
    setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, prayer_count: newCount } : p));
    await supabase.from('prayers').update({ prayer_count: newCount }).eq('id', prayerId);
  }

  async function handlePostReply(prayerId: string) {
    const content = replyText[prayerId];
    if (!content?.trim() || !user) return;
    const { error } = await supabase.from('prayer_replies').insert([{ 
      prayer_id: prayerId, 
      content: content.trim(),
      author_name: user.name
    }]);
    if (!error) {
      setReplyText(prev => ({ ...prev, [prayerId]: '' }));
      fetchPrayers();
    }
  }

  async function toggleTestimony(prayerId: string, currentStatus: boolean) {
    const { error } = await supabase.from('prayers').update({ is_testimony: !currentStatus }).eq('id', prayerId);
    if (!error) fetchPrayers();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 bg-slate-50 min-h-screen font-sans">
      
      {/* --- FEATURED: THE WATCHMAN BANNER --- */}
      <Link href="/watchman">
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 mb-12 group cursor-pointer shadow-2xl shadow-slate-200 hover:shadow-slate-300 transition-all duration-500">
          {/* Animated Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 blur-[100px] opacity-20 rounded-full group-hover:opacity-30 transition-opacity" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform duration-500">
                <Flame size={32} className="text-orange-500 animate-pulse" fill="currentColor" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  The Watchman 
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                </h2>
                <p className="text-slate-400 mt-1 text-sm font-medium leading-relaxed max-w-md">
                  Join the unified prayer room. The fire is burning on the altar right now.
                </p>
                <div className="flex items-center gap-2 mt-3 text-orange-400 text-xs font-bold uppercase tracking-widest">
                  <Users size={14} />
                  <span>{activeWatchmen} Watchmen praying now</span>
                </div>
              </div>
            </div>

            <div className="bg-white text-slate-900 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              Enter Room <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </Link>

      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Prayer Wall</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Post requests, share testimonies, and stand in gap.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={() => setView('all')} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase transition-all ${view === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Requests</button>
          <button onClick={() => setView('testimonies')} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase transition-all ${view === 'testimonies' ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>Testimonies</button>
        </div>
      </div>

      {/* Input Box */}
      {view === 'all' && (
        <div className="bg-white rounded-[2rem] p-1 shadow-sm border border-slate-200 mb-10 transition-all focus-within:ring-4 focus-within:ring-indigo-50/50">
          <textarea 
            value={request} 
            onChange={(e) => setRequest(e.target.value)} 
            placeholder="How can we stand in faith with you today?" 
            className="w-full bg-transparent rounded-t-[1.8rem] p-6 text-slate-700 placeholder:text-slate-300 focus:outline-none min-h-[100px] resize-none text-lg font-medium" 
          />
          <div className="flex justify-between items-center bg-slate-50 rounded-[1.8rem] px-6 py-3">
            <span className="text-xs text-slate-400 font-bold uppercase">Public Request</span>
            <button onClick={handleSubmit} disabled={isPosting || !request.trim()} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200">
              {isPosting ? 'Sending...' : <><Send size={14} /> Post Prayer</>}
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {prayers.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <Heart size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-400 font-medium">No prayers yet. Be the first to light the fire.</p>
          </div>
        )}

        {prayers.map((p) => {
          const nameToDisplay = p.profiles?.full_name || p.author_name || 'Puritan Member';
          const avatarToDisplay = p.profiles?.avatar_url;
          const isMyPrayer = user?.id === p.user_id;

          return (
            <div key={p.id} className={`bg-white rounded-[2rem] p-6 md:p-8 border transition-all duration-300 ${p.is_testimony ? 'border-orange-100 shadow-xl shadow-orange-50/50' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {avatarToDisplay ? (
                      <img src={avatarToDisplay} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400 font-black text-xs">{nameToDisplay.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div>
                    <span className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">{nameToDisplay}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status Badge */}
                {p.is_testimony ? (
                   <button onClick={() => isMyPrayer && toggleTestimony(p.id, true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase bg-orange-50 text-orange-600 border border-orange-100 ${isMyPrayer ? 'hover:bg-orange-100' : 'cursor-default'}`}>
                     <Star size={12} fill="currentColor" /> Praise Report
                   </button>
                ) : (
                   isMyPrayer && (
                     <button onClick={() => toggleTestimony(p.id, false)} className="text-[9px] font-bold text-slate-300 hover:text-orange-500 uppercase tracking-wider transition-colors">
                       Mark as Answered
                     </button>
                   )
                )}
              </div>
              
              <p className="text-lg text-slate-700 leading-relaxed font-medium">"{p.content}"</p>

              <div className="mt-6 flex items-center gap-4 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => handlePraying(p.id, p.prayer_count)} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${myPrayedIds.includes(p.id) ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  <Heart size={16} fill={myPrayedIds.includes(p.id) ? "currentColor" : "none"} /> 
                  {p.prayer_count > 0 ? `${p.prayer_count} Praying` : "Pray"}
                </button>
                
                <button 
                  onClick={() => setExpandedPrayers(prev => ({ ...prev, [p.id]: !prev[p.id] }))} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <MessageCircle size={16} /> 
                  {replies[p.id]?.length || 0} Encouragements
                </button>
              </div>

              {expandedPrayers[p.id] && (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  {replies[p.id]?.map((reply: any) => (
                    <div key={reply.id} className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 ml-4 border-l-2 border-indigo-100">
                      <span className="font-bold text-indigo-900 block mb-1">{reply.author_name}</span>
                      {reply.content}
                    </div>
                  ))}
                  <div className="flex gap-2 pl-4 pt-2">
                    <input 
                      value={replyText[p.id] || ''} 
                      onChange={(e) => setReplyText(prev => ({ ...prev, [p.id]: e.target.value }))} 
                      placeholder="Write an encouragement..." 
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-200 transition-colors" 
                    />
                    <button onClick={() => handlePostReply(p.id)} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-black transition-colors"><Send size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}