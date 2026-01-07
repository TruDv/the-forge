"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Mic, Video, X, Loader2, Sparkles, Clock, Calendar, ArrowRight, User } from 'lucide-react';

export default function LibraryPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- HELPERS ---
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnail = (url: string) => {
    const id = getYoutubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
  };

  const getEmbedUrl = (url: string) => {
    const id = getYoutubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url;
  };

  useEffect(() => {
    const fetchMedia = async () => {
      const { data } = await supabase.from('media').select('*').order('created_at', { ascending: false });
      if (data) setMedia(data);
      setLoading(false);
    };
    fetchMedia();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" />
    </div>
  );

  const featured = media[0]; 
  const gallery = media.slice(1); 

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      
      {/* 1. HERO SECTION */}
      {featured && (
        <section className="bg-white border-b border-slate-200">
           <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
             <div className="flex flex-col lg:flex-row gap-10 items-start">
               
               {/* A. Image */}
               <div 
                 onClick={() => setActiveVideo(getEmbedUrl(featured.url))}
                 className="w-full lg:w-2/3 relative aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100 cursor-pointer group"
               >
                 <img 
                   src={getThumbnail(featured.url) || "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200"} 
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   alt="Featured"
                 />
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                   <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center text-indigo-600 shadow-xl scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                     <Play fill="currentColor" size={32} className="ml-1" />
                   </div>
                 </div>
               </div>

               {/* B. Info */}
               <div className="w-full lg:w-1/3 flex flex-col justify-center space-y-6">
                 <div>
                   <div className="flex items-center gap-3 mb-4">
                     <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                       <Sparkles size={12} /> New Release
                     </span>
                     <span className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                       <Calendar size={12} /> {new Date(featured.created_at).toLocaleDateString()}
                     </span>
                   </div>
                   
                   <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                     {featured.title}
                   </h1>

                   {/* --- UPDATED HERO AUTHOR BADGE (Colorful) --- */}
                   {featured.author && (
                     <div className="inline-flex items-center gap-3 mt-4 bg-slate-50 border border-slate-100 p-1.5 pr-4 rounded-full w-fit shadow-sm">
                        {/* Gradient Icon Circle */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-600 flex items-center justify-center shadow-md text-white">
                            <Mic size={14} fill="currentColor" className="opacity-90" />
                        </div>
                        
                        <div className="flex flex-col leading-none">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ministering</span>
                             <span className="text-sm font-bold text-slate-900">{featured.author}</span>
                        </div>
                     </div>
                   )}
                   
                   <p className="text-slate-500 text-base mt-4 leading-relaxed line-clamp-3">
                     {featured.description || "Watch the latest prophetic charge and teaching from The Forge."}
                   </p>
                 </div>

                 <button 
                   onClick={() => setActiveVideo(getEmbedUrl(featured.url))}
                   className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-lg shadow-slate-900/10 group"
                 >
                   <Play size={14} fill="currentColor" /> Watch Now
                 </button>
               </div>

             </div>
           </div>
        </section>
      )}

      {/* 2. GALLERY GRID */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-4">
           <div className="flex items-center gap-3">
             <Video className="text-indigo-600" />
             <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Recent Messages</h2>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {gallery.length > 0 ? (
            gallery.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setActiveVideo(getEmbedUrl(item.url))}
                className="group cursor-pointer flex flex-col gap-4"
              >
                {/* Thumbnail Card */}
                <div className="relative aspect-video bg-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  <img 
                    src={getThumbnail(item.url) || ""} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt={item.title}
                  />
                  <div className="absolute top-3 left-3">
                     <span className="bg-black/60 backdrop-blur text-white text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                       {item.type}
                     </span>
                  </div>
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  
                  {/* --- UPDATED GALLERY AUTHOR BADGE --- */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                    
                    {/* Date */}
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    
                    {/* Author with Gradient Icon */}
                    {item.author && (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                                <User size={10} />
                            </div>
                            <span className="text-xs text-slate-600 font-bold">{item.author}</span>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            !featured && <div className="col-span-full text-center py-20 text-slate-400 font-medium italic">No media content available yet.</div>
          )}
        </div>
      </section>

      {/* VIDEO MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 bg-slate-950/95 z-[200] flex items-center justify-center p-4 md:p-10 backdrop-blur-md animate-in fade-in duration-300">
          <button 
            onClick={() => setActiveVideo(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
          >
            <X size={32} />
          </button>
          
          <div className="w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <iframe 
              src={activeVideo}
              className="w-full h-full"
              allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </main>
  );
}