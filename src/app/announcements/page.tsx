"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, Mic, Calendar, Clock, 
  Search, Flame, Sparkles, Copy, Check,
  Link as LinkIcon, History, Quote, Maximize2, X 
} from 'lucide-react';
import Link from 'next/link';

export default function AnnouncementArchives() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCharge, setSelectedCharge] = useState<any | null>(null); // For the Modal
  
  const [amenCounts, setAmenCounts] = useState<{[key: string]: number}>({});
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchArchives() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setAnnouncements(data);
        const counts: any = {};
        data.forEach((a: any) => counts[a.id] = a.amen_count || 0);
        setAmenCounts(counts);
      }
      setLoading(false);
    }
    fetchArchives();
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

  const filtered = announcements.filter(a => 
    a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-bold italic text-indigo-900 text-xs">
      <History className="text-indigo-600 animate-spin-slow mb-4" size={32} />
      RETRIVING ANCIENT SCROLLS...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8F9FC] flex flex-col relative">
      {/* --- COMPACT HEADER --- */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((announcement) => {
            const count = amenCounts[announcement.id] || 0;
            const isAnimating = animatingIds.includes(announcement.id);
            const date = new Date(announcement.created_at);

            return (
              <div key={announcement.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden h-[280px]">
                {/* Top metadata */}
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedCharge(announcement)} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors" title="Read Full Screen">
                      <Maximize2 size={14} />
                    </button>
                    <button onClick={() => handleCopy(announcement.content, announcement.id)} className="p-1.5 hover:bg-white rounded-lg text-slate-400">
                      {copiedId === announcement.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar relative group/card">
                  <p className="text-[13px] font-serif text-slate-700 leading-relaxed italic relative z-10">
                    "{announcement.content}"
                  </p>
                  <button 
                    onClick={() => setSelectedCharge(announcement)}
                    className="mt-4 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline block"
                  >
                    Read Full Charge →
                  </button>
                </div>

                {/* Bottom bar */}
                <div className="p-3 bg-white border-t border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[8px] uppercase border border-white">PC</div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">P. Charles</span>
                  </div>
                  <button onClick={() => handleAmen(announcement.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all active:scale-90 ${isAnimating ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:text-indigo-600'}`}>
                    <Sparkles size={12} className={isAnimating ? 'animate-spin' : ''} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{count > 0 ? `${count} Received` : 'Receive'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* --- THE READING ROOM MODAL --- */}
      {selectedCharge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedCharge(null)} />
          
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Flame size={24} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">The Prophetic Vault</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Released {new Date(selectedCharge.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCharge(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content - The "Book" Page */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-[#FCFCFE] custom-scrollbar">
              <div className="max-w-prose mx-auto">
                <Quote className="text-slate-100 mb-4" size={60} />
                <p className="text-xl md:text-2xl font-serif text-slate-800 leading-[1.6] italic first-letter:text-5xl first-letter:font-black first-letter:text-indigo-600 first-letter:mr-3 first-letter:float-left">
                  {selectedCharge.content}
                </p>
                
                {selectedCharge.link && (
                  <div className="mt-12 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2">Extended Study Material</h4>
                    <a href={selectedCharge.link} target="_blank" className="text-indigo-600 font-bold flex items-center gap-2 hover:underline">
                      <LinkIcon size={16} /> Click here to access full resource
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center sticky bottom-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-black text-white text-[10px] border-2 border-white shadow-md italic">PC</div>
                  <span className="text-xs font-black text-slate-600 uppercase">Puritan Charles</span>
               </div>
               <button 
                  onClick={() => { handleAmen(selectedCharge.id); setSelectedCharge(null); }}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
               >
                  Receive Charge
               </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </main>
  );
}