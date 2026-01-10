"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, Plus, X, Quote, Calendar, 
  MessageCircle, Heart, User, Shield, Ghost, 
  Loader2, Flame, CheckCircle2, Tag, ChevronRight, Send, Trash2, 
  Hand // Standard Lucide Hand
} from 'lucide-react';
import Link from 'next/link'; // <--- ADD THIS LINE HERE

const CATEGORIES = ["Healing", "Provision", "Salvation", "Deliverance", "Faith", "Family"];


// --- 1. NEW COMPONENT: THE FLOATING CLAP VISUAL ---
// This combines two outline hands to create a "Clapping" effect
// without using filled blobs or weird custom SVGs.
const FloatingClap = () => (
  <div className="relative w-8 h-8 opacity-80">
    {/* Back Hand (Slightly lighter, tilted right) */}
    <Hand 
      size={24} 
      strokeWidth={2} 
      className="absolute right-0 top-1 rotate-12 text-orange-300" 
    />
    {/* Front Hand (Main color, tilted left) */}
    <Hand 
      size={24} 
      strokeWidth={2} 
      className="absolute left-0 top-0 -rotate-12 text-orange-600" 
    />
    {/* Little 'impact' lines to show action */}
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 flex justify-between">
       <div className="w-0.5 h-1.5 bg-orange-400 rounded-full -rotate-12" />
       <div className="w-0.5 h-1.5 bg-orange-400 rounded-full rotate-12" />
    </div>
  </div>
);

export default function Testimonies() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [testimonies, setTestimonies] = useState<any[]>([]);
  const [filteredTestimonies, setFilteredTestimonies] = useState<any[]>([]);
  
  // Animation State
  const [floatingClaps, setFloatingClaps] = useState<{ [key: string]: { id: number, left: string }[] }>({});
  
  // UI State
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTestimony, setActiveTestimony] = useState<any>(null);
  
  // Forms & Comments
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      fetchTestimonies();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredTestimonies(testimonies);
    } else {
      setFilteredTestimonies(testimonies.filter(t => t.category === selectedCategory));
    }
  }, [selectedCategory, testimonies]);

  // --- ACTIONS ---

  const fetchTestimonies = async () => {
    const { data } = await supabase
      .from('testimonies')
      .select(`*, testimony_comments(count)`)
      .order('created_at', { ascending: false });
    if (data) setTestimonies(data);
  };

  const fetchComments = async (testimonyId: string) => {
    const { data } = await supabase
      .from('testimony_comments')
      .select('*')
      .eq('testimony_id', testimonyId)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  // --- ANIMATION LOGIC ---
  const triggerClapAnimation = (testimonyId: string) => {
    const id = Date.now();
    const randomLeft = Math.floor(Math.random() * 60) + 20 + "%"; 

    setFloatingClaps(prev => ({
      ...prev,
      [testimonyId]: [...(prev[testimonyId] || []), { id, left: randomLeft }]
    }));

    setTimeout(() => {
      setFloatingClaps(prev => ({
        ...prev,
        [testimonyId]: prev[testimonyId]?.filter(item => item.id !== id) || []
      }));
    }, 1000);
  };

  const handleClap = async (e: React.MouseEvent, testimony: any) => {
    e.stopPropagation(); 
    triggerClapAnimation(testimony.id);

    const newCount = (testimony.clap_count || 0) + 1;
    setTestimonies(prev => prev.map(t => t.id === testimony.id ? { ...t, clap_count: newCount } : t));
    
    if (activeTestimony && activeTestimony.id === testimony.id) {
        setActiveTestimony({ ...activeTestimony, clap_count: newCount });
    }

    await supabase.from('testimonies').update({ clap_count: newCount }).eq('id', testimony.id);
  };

  // --- FORM HANDLERS --- 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formTitle.trim() || !formContent.trim()) return;
    setIsSubmitting(true);
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const authorName = isAnonymous ? 'Anonymous' : (profile?.full_name || 'Puritan');
    const { error } = await supabase.from('testimonies').insert([{
      user_id: user.id, title: formTitle.trim(), content: formContent.trim(), category: formCategory, author_name: authorName, clap_count: 0, is_anonymous: isAnonymous
    }]);
    if (!error) {
      setFormTitle(''); setFormContent(''); setIsAnonymous(false); setIsCreateModalOpen(false); fetchTestimonies();
    } else { alert("Error: " + error.message); }
    setIsSubmitting(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this testimony?")) return;
    setTestimonies(prev => prev.filter(t => t.id !== id));
    if (activeTestimony?.id === id) setActiveTestimony(null);
    const { error } = await supabase.from('testimonies').delete().eq('id', id);
    if (error) { alert("Error deleting"); fetchTestimonies(); }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !activeTestimony || !user) return;
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const { error } = await supabase.from('testimony_comments').insert([{
      testimony_id: activeTestimony.id, user_id: user.id, content: newComment.trim(), author_name: profile?.full_name || 'Puritan'
    }]);
    if (!error) { setNewComment(''); fetchComments(activeTestimony.id); fetchTestimonies(); }
  };

  const openRejoiceModal = (testimony: any) => {
    setActiveTestimony(testimony);
    fetchComments(testimony.id);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-orange-500" size={32} />
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-950 pt-24 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">

          {/* --- ADDED THIS PART BELOW --- */}
    <Link href="/prayers" className="md:hidden inline-flex items-center gap-2 text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-widest mb-6 transition-colors">
      <ChevronRight className="rotate-180 text-orange-500" size={14} /> Back to Prayer Wall
    </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="text-orange-500" size={20} fill="currentColor" />
                <span className="text-orange-500 font-bold uppercase tracking-widest text-xs">Hall of Victory</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">WITNESS THE FIRE</h1>
            </div>
            <button onClick={() => setIsCreateModalOpen(true)} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-wider hover:bg-orange-600 transition-all shadow-xl shadow-orange-900/20 flex items-center gap-2">
              <Plus size={18} strokeWidth={3} /> Share Testimony
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedCategory("All")} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${selectedCategory === 'All' ? 'bg-white text-slate-900' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}>All Stories</button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}>{cat}</button>
            ))}
          </div>
        </div>
      </div>

      {/* TESTIMONIES GRID */}
      <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonies.map((t) => (
            <div 
              key={t.id} 
              onClick={() => openRejoiceModal(t)}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full cursor-pointer relative overflow-hidden"
            >
              {/* Category Badge */}
              <div className="absolute top-4 right-12">
                 <span className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border border-slate-100">{t.category || 'General'}</span>
              </div>

              {/* Delete Button */}
              {user && user.id === t.user_id && (
                <button onClick={(e) => handleDelete(e, t.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
              )}

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${t.author_name === 'Anonymous' ? 'bg-slate-100 text-slate-400' : 'bg-orange-50 text-orange-600'}`}>
                  {t.author_name === 'Anonymous' ? <Ghost size={18} /> : t.author_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{t.author_name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 mb-6">
                <h4 className="font-black text-lg text-slate-800 mb-2 leading-tight line-clamp-2">{t.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed font-serif italic opacity-90 line-clamp-3">"{t.content}"</p>
                <p className="text-orange-600 text-xs font-bold mt-2 hover:underline">Read full story</p>
              </div>

              {/* --- ACTION FOOTER --- */}
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-3 relative">
                
                {/* 1. FLOATING ANIMATION CONTAINER */}
                <div className="absolute bottom-12 left-0 right-0 h-40 pointer-events-none overflow-hidden">
                  {floatingClaps[t.id]?.map((clap) => (
                    <div 
                      key={clap.id}
                      className="absolute bottom-0 animate-float"
                      style={{ left: clap.left }}
                    >
                      {/* Using the custom Outline FloatingClap component here */}
                      <FloatingClap />
                    </div>
                  ))}
                </div>

                {/* 2. CLAP BUTTON - Outline Hand */}
                <button 
                  onClick={(e) => handleClap(e, t)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-orange-50 text-orange-600 hover:bg-orange-100 hover:scale-105 active:scale-95 relative z-10"
                >
                  <Hand size={18} strokeWidth={2} /> {/* Removed fill */}
                  {t.clap_count || 0}
                </button>
                
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                  <MessageCircle size={16} /> 
                  <span>{t.testimony_comments?.[0]?.count || 0} Rejoicings</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-8 flex justify-between items-start">
              <div className="text-white">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Testify</h2>
                <p className="text-slate-400 text-xs font-medium mt-1">What has the Lord done?</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="bg-white/10 text-white p-2 rounded-full hover:bg-white/20"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 pt-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Category</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Headline</label>
                   <input type="text" placeholder="Title..." required maxLength={40} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}/>
                </div>
              </div>
              <div className="mb-6">
                <textarea placeholder="Share the details..." required className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-serif italic text-base outline-none focus:ring-2 focus:ring-slate-900 resize-none" value={formContent} onChange={(e) => setFormContent(e.target.value)}/>
              </div>
              <div className="mb-8 bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isAnonymous ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>{isAnonymous ? <Ghost size={18} /> : <User size={18} />}</div>
                  <div><p className="text-sm font-bold text-slate-900">Post Anonymously</p><p className="text-xs text-slate-400">{isAnonymous ? "Name hidden." : "Public post."}</p></div>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isAnonymous ? 'bg-slate-900' : 'bg-slate-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-0'}`} /></div>
              </div>
              <button disabled={isSubmitting} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all">{isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : "Declare Victory"}</button>
            </form>
          </div>
        </div>
      )}

      {/* REJOICE MODAL */}
      {activeTestimony && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setActiveTestimony(null)} />
          <div className="bg-white w-full max-w-2xl h-[80vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${activeTestimony.author_name === 'Anonymous' ? 'bg-slate-200 text-slate-500' : 'bg-orange-100 text-orange-600'}`}>{activeTestimony.author_name === 'Anonymous' ? <Ghost size={20} /> : activeTestimony.author_name.charAt(0)}</div>
                <div><h3 className="font-bold text-slate-900">{activeTestimony.title}</h3><p className="text-xs text-slate-500 font-medium">By {activeTestimony.author_name} • {activeTestimony.category}</p></div>
              </div>
              <button onClick={() => setActiveTestimony(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 mb-8">
                <p className="font-serif italic text-lg text-slate-800 leading-relaxed whitespace-pre-wrap">"{activeTestimony.content}"</p>
                
                {/* Modal Clap Button with Animation */}
                <div className="mt-4 flex gap-4 relative">
                   <div className="absolute bottom-10 left-0 h-40 pointer-events-none overflow-hidden w-20">
                      {floatingClaps[activeTestimony.id]?.map((clap) => (
                        <div key={clap.id} className="absolute bottom-0 animate-float" style={{ left: "20%" }}>
                          <FloatingClap />
                        </div>
                      ))}
                   </div>
                   <button onClick={(e) => handleClap(e, activeTestimony)} className="text-orange-600 font-bold text-xs flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors relative z-10">
                      <Hand size={18} strokeWidth={2} /> {activeTestimony.clap_count || 0} Claps
                   </button>
                </div>
              </div>
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-6 flex items-center gap-2"><MessageCircle size={16} /> Rejoicings ({comments.length})</h4>
              <div className="space-y-4">
                {comments.length > 0 ? comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{c.author_name.charAt(0)}</div>
                    <div className="bg-slate-50 p-3 rounded-xl rounded-tl-none border border-slate-100"><p className="text-xs font-bold text-slate-700 mb-1">{c.author_name}</p><p className="text-sm text-slate-600">{c.content}</p></div>
                  </div>
                )) : <p className="text-center text-slate-400 text-sm italic py-4">Be the first to rejoice with this testimony.</p>}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <div className="flex gap-2">
                <input type="text" placeholder="Type a word of encouragement..." className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}/>
                <button onClick={handlePostComment} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-orange-500 transition-colors"><Send size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}