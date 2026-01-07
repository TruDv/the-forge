"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, Mic, Calendar, Clock, 
  Search, Flame, Sparkles, Copy, Check,
  Link as LinkIcon // <--- Import Link Icon
} from 'lucide-react';
import Link from 'next/link';

export default function AnnouncementArchives() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
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
    const newCount = currentCount + 1;
    setAmenCounts(prev => ({ ...prev, [id]: newCount }));
    setAnimatingIds(prev => [...prev, id]);
    setTimeout(() => {
       setAnimatingIds(prev => prev.filter(pid => pid !== id));
    }, 500);

    const { error } = await supabase.rpc('increment_amen', { row_id: id });
    if (error) {
      console.error("Error receiving charge:", error);
      setAmenCounts(prev => ({ ...prev, [id]: currentCount }));
    }
  };

  const filtered = announcements.filter(a => 
    a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-black italic">
      <Flame className="text-orange-500 animate-pulse mb-4" size={48} />
      OPENING THE VAULT...
    </div>
  );

  return (
    <main className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* --- FIXED HEADER SECTION --- */}
      <div className="max-w-4xl w-full mx-auto px-6 pt-10 pb-6 flex-shrink-0">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-6 transition-colors group"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to the Forge
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              The Forge <span className="text-orange-500 italic">Archives</span>
            </h1>
            <p className="text-slate-400 text-xs mt-2 font-medium uppercase tracking-widest">
              Chronological charges from <span className="text-slate-900">Puritan Charles</span>
            </p>
          </div>

          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Filter charges..."
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto px-6 pb-20 scrollbar-hide">
        <div className="max-w-4xl mx-auto relative">
          
          {/* Vertical Timeline Line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-indigo-100 via-slate-200 to-transparent" />

          <div className="space-y-6">
            {filtered.length > 0 ? (
              filtered.map((announcement) => {
                const count = amenCounts[announcement.id] || 0;
                const isAnimating = animatingIds.includes(announcement.id);

                return (
                <div key={announcement.id} className="relative pl-14 group animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Timeline Icon */}
                  <div className="absolute left-0 top-1 w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center z-10 group-hover:scale-110 group-hover:border-orange-200 transition-all duration-300">
                    <Mic size={16} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                  </div>

                  <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm group-hover:shadow-md group-hover:border-slate-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Calendar size={12} className="text-indigo-500" />
                          <span className="text-[10px] font-black uppercase text-slate-500">
                            {new Date(announcement.created_at).toLocaleDateString(undefined, { 
                               month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Clock size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(announcement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Copy Button */}
                      <button 
                        onClick={() => handleCopy(announcement.content, announcement.id)}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-all group/btn"
                        title="Copy Charge"
                      >
                        {copiedId === announcement.id ? (
                          <Check size={16} className="text-green-500 animate-in zoom-in" />
                        ) : (
                          <Copy size={16} className="text-slate-300 group-hover/btn:text-indigo-500" />
                        )}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="relative">
                      <p className="text-base md:text-lg font-serif italic text-slate-700 leading-relaxed pr-4">
                        "{announcement.content}"
                      </p>
                      
                      {/* --- NEW LINK SECTION --- */}
                      {announcement.link && (
                        <a 
                          href={announcement.link} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-indigo-100 transition-colors"
                        >
                          <LinkIcon size={14} /> 
                          Attached Resource / Read More
                        </a>
                      )}
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                          <Sparkles size={10} className="text-orange-600" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Released by Puritan Charles</span>
                      </div>

                      {/* AMEN / RECEIVE BUTTON */}
                      <button 
                        onClick={() => handleAmen(announcement.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95 select-none
                          ${isAnimating 
                            ? 'bg-orange-100 border-orange-300 text-orange-700 scale-110' 
                            : count > 0 
                              ? 'bg-orange-50/50 border-orange-200 text-orange-600' 
                              : 'bg-white border-slate-200 text-slate-500 hover:border-orange-200 hover:text-orange-500' 
                          }
                        `}
                      >
                          <Flame 
                            size={14} 
                            className={`transition-transform duration-300 ${isAnimating ? 'scale-125' : ''}`} 
                            fill={count > 0 ? "currentColor" : "none"}
                          />
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {count > 0 ? `${count} Amens` : 'Receive'}
                          </span>
                      </button>
                    </div>
                  </div>
                </div>
              )})
            ) : (
              <div className="ml-14 text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic text-sm">The silence is deep. No archives match your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}