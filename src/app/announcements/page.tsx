"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, Mic, Calendar, Clock, 
  Search, Flame, Sparkles, Copy, Check,
  Link as LinkIcon, History, Quote, Maximize2, X, User
} from 'lucide-react';
import Link from 'next/link';

export default function AnnouncementArchives() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCharge, setSelectedCharge] = useState<any | null>(null); 
  
  const [amenCounts, setAmenCounts] = useState<{[key: string]: number}>({});
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);

  // FETCH FUNCTION - Verified to pull 'content'
  async function fetchArchives() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error("Fetch error:", error);

    if (data) {
      setAnnouncements(data);
      const counts: any = {};
      data.forEach((a: any) => counts[a.id] = a.amen_count || 0);
      setAmenCounts(counts);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchArchives();

    // REAL-TIME LISTENER: This ensures if you change content in admin, this page updates instantly
    const channel = supabase
      .channel('archives_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchArchives();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAmen = async (id: string) => {
    const currentCount = amenCounts[id] || 0;
    setAmenCounts(prev => ({ ...prev, [id]: currentCount + 1 }));
    setAnimatingIds(prev => [...prev, id]);
    setTimeout(() => setAnimatingIds(prev => prev.filter(pid => pid !== id)), 500);
    await supabase.rpc('increment_amen', { row_id: id });
  };

  // FILTER LOGIC: Checks both content and author
  const filtered = announcements.filter(a => 
    (a.content?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (a.author?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-bold italic text-indigo-900 text-xs">
      <History className="text-indigo-600 animate-spin-slow mb-4" size={32} />
      RETRIVING ANCIENT SCROLLS...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8F9FC] flex flex-col relative">
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <Link href="/library" className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><ChevronLeft size={20}/></Link>
               <div>
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Archives</h1>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Prophetic Charge Vault</p>
               </div>
            </div>

            <div className="relative flex-1 max-w-[200px] md:max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all text-[11px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* --- CONTENT GRID --- */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((announcement) => {
            const count = amenCounts[announcement.id] || 0;
            const isAnimating = animatingIds.includes(announcement.id);
            const date = new Date(announcement.created_at);
            const displayAuthor = announcement.author || "Forge Oracle";

            return (
              <div key={announcement.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col overflow-hidden min-h-[350px]">
                {/* Header */}
                <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedCharge(announcement)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                      <Maximize2 size={14} />
                    </button>
                    <button onClick={() => handleCopy(announcement.content, announcement.id)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600">
                      {copiedId === announcement.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Content - whitespace-pre-wrap ensures paragraphs save correctly */}
                <div className="flex-1 p-6 relative group/card overflow-hidden">
                  <p className="text-[14px] font-serif text-slate-700 leading-relaxed italic whitespace-pre-wrap line-clamp-[8]">
                    {announcement.content}
                  </p>
                  {/* Fade effect if text is too long for card */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center font-black text-white text-[9px] border border-white shadow-sm italic">
                        {displayAuthor.charAt(0)}
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight truncate max-w-[100px]">
                        {displayAuthor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAmen(announcement.id)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all active:scale-95 ${isAnimating ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-500 hover:text-indigo-600 hover:border-indigo-100'}`}>
                        <Sparkles size={12} className={isAnimating ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{count > 0 ? `${count}` : 'Receive'}</span>
                    </button>
                    <button onClick={() => setSelectedCharge(announcement)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                        <ChevronLeft className="rotate-180" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* --- THE READING ROOM MODAL --- */}
      {selectedCharge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedCharge(null)} />
          
          <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <Flame size={28} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-[0.2em] leading-none">Prophetic Charge</h3>
                  <p className="text-[11px] text-slate-400 font-bold mt-2 flex items-center gap-2">
                    <Clock size={12}/> Released {new Date(selectedCharge.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCharge(null)} className="p-4 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-full text-slate-400 transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Reading Content */}
            <div className="flex-1 overflow-y-auto p-10 md:p-16 bg-[#FCFCFE] custom-scrollbar">
              <div className="max-w-prose mx-auto">
                <Quote className="text-indigo-100 mb-6" size={64} />
                <p className="text-xl md:text-2xl font-serif text-slate-800 leading-[1.8] italic first-letter:text-6xl first-letter:font-black first-letter:text-indigo-600 first-letter:mr-4 first-letter:float-left whitespace-pre-wrap">
                  {selectedCharge.content}
                </p>
                
                {selectedCharge.link && (
                  <div className="mt-16 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Resource Material</h4>
                        <p className="text-xs text-slate-400">Attached archive document for further study.</p>
                    </div>
                    <a href={selectedCharge.link} target="_blank" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-3">
                      <LinkIcon size={16} /> Access Resource
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center font-black text-white text-[12px] border-4 border-white shadow-xl italic">
                      {(selectedCharge.author || "Forge Oracle").charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase block tracking-widest">Released By</span>
                    <span className="text-sm font-black text-slate-900 uppercase">{selectedCharge.author || "Forge Oracle"}</span>
                  </div>
               </div>
               <button 
                  onClick={() => { handleAmen(selectedCharge.id); setSelectedCharge(null); }}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all"
               >
                  Receive Word
               </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </main>
  );
}