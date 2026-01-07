"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Send, Star, User as UserIcon } from 'lucide-react';

export default function PrayerPage() {
  const [request, setRequest] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [view, setView] = useState<'all' | 'testimonies'>('all');
  
  const [replies, setReplies] = useState<{ [key: string]: any[] }>({});
  const [expandedPrayers, setExpandedPrayers] = useState<{ [key: string]: boolean }>({});
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [myPrayedIds, setMyPrayedIds] = useState<string[]>([]);
  const [user, setUser] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchPrayers();
    fetchUser();
    const saved = localStorage.getItem('user_prayed_ids');
    if (saved) setMyPrayedIds(JSON.parse(saved));
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

  async function fetchPrayers() {
    let query = supabase
      .from('prayers')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });
    
    if (view === 'testimonies') {
      query = query.eq('is_testimony', true);
    }

    const { data: prayerData, error } = await query;
    
    if (error) {
      const { data: simpleData } = await supabase.from('prayers').select('*').order('created_at', { ascending: false });
      if (simpleData) setPrayers(simpleData);
    } else if (prayerData) {
      setPrayers(prayerData);
      
      const prayerIds = prayerData.map(p => p.id);
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
    <main className="max-w-3xl mx-auto px-6 py-10 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Prayer Wall</h1>
          <p className="text-slate-500 mt-1 font-medium">Refining through faith and petition at The Forge.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
          <button onClick={() => setView('all')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${view === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>All Requests</button>
          <button onClick={() => setView('testimonies')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${view === 'testimonies' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Testimonies</button>
        </div>
      </div>

      {/* Input Box */}
      {view === 'all' && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-10">
          <textarea value={request} onChange={(e) => setRequest(e.target.value)} placeholder="How can we stand in faith with you today?" className="w-full bg-slate-50 rounded-2xl p-4 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50 border-none min-h-[120px] resize-none font-medium" />
          <div className="flex justify-end mt-4">
            <button onClick={handleSubmit} disabled={isPosting} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100">
              {isPosting ? 'Posting...' : <><Send size={16} /> Post Request</>}
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {prayers.map((p) => {
          const nameToDisplay = p.profiles?.full_name || p.author_name || 'Puritan Member';
          const avatarToDisplay = p.profiles?.avatar_url;
          const isMyPrayer = user?.id === p.user_id; // Check if I own this prayer

          return (
            <div key={p.id} className={`bg-white rounded-[32px] p-8 border transition-all ${p.is_testimony ? 'border-orange-200 shadow-orange-100 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                    {avatarToDisplay ? (
                      <img src={avatarToDisplay} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400 font-black text-xs">
                        {nameToDisplay.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="block text-[11px] font-black text-slate-900 uppercase tracking-widest">
                      {nameToDisplay}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* --- PERMISSION LOGIC FOR BUTTON --- */}
                {isMyPrayer ? (
                  // I am the author: I can click to toggle
                  <button onClick={() => toggleTestimony(p.id, p.is_testimony)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${p.is_testimony ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-500'}`}>
                    <Star size={14} fill={p.is_testimony ? "currentColor" : "none"} />
                    {p.is_testimony ? "Praise Report" : "Answered?"}
                  </button>
                ) : (
                  // I am NOT the author
                  p.is_testimony && (
                    // Show Read-Only Badge if it is a testimony
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-orange-100 text-orange-600 cursor-default">
                      <Star size={14} fill="currentColor" />
                      Praise Report
                    </div>
                  )
                )}
              </div>
              
              <p className={`leading-relaxed text-lg font-serif italic ${p.is_testimony ? 'text-slate-900' : 'text-slate-600'}`}>
                "{p.content}"
              </p>

              <div className="mt-8 flex gap-6 text-slate-400">
                <button onClick={() => handlePraying(p.id, p.prayer_count)} className={`flex items-center gap-2 text-xs font-bold transition-colors ${myPrayedIds.includes(p.id) ? 'text-rose-500' : 'hover:text-rose-500'}`}>
                  <Heart size={20} fill={myPrayedIds.includes(p.id) ? "currentColor" : "none"} /> 
                  {p.prayer_count > 0 ? `Praying (${p.prayer_count})` : "I'm Praying"}
                </button>
                <button onClick={() => setExpandedPrayers(prev => ({ ...prev, [p.id]: !prev[p.id] }))} className="flex items-center gap-2 text-xs font-bold hover:text-indigo-600 transition-colors">
                  <MessageCircle size={20} /> {replies[p.id]?.length || 0} Encouragements
                </button>
              </div>

              {expandedPrayers[p.id] && (
                <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                  {replies[p.id]?.map((reply: any) => (
                    <div key={reply.id} className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600">
                      <p className="font-black text-slate-900 text-[10px] uppercase mb-1 tracking-tighter">{reply.author_name}</p>
                      {reply.content}
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    <input value={replyText[p.id] || ''} onChange={(e) => setReplyText(prev => ({ ...prev, [p.id]: e.target.value }))} placeholder="Write an encouragement..." className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium" />
                    <button onClick={() => handlePostReply(p.id)} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700"><Send size={14} /></button>
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