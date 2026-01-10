"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Play, Mic, Video, X, Loader2, Sparkles, Clock, 
  Calendar, ArrowRight, User, BookOpen, ScrollText 
} from 'lucide-react';

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
    <main className="min-h-screen bg-slate-50 pb-32">
      
      {/* 1. HEADER SECTION & ARCHIVES ENTRY */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic mb-2">The Library</h1>
              <p className="text-slate-500 font-medium">Prophetic charges, music, and eternal teachings.</p>
            </div>

            {/* --- THE ARCHIVES BUTTON --- */}
            <Link 
              href="/announcements" 
              className="group flex items-center gap-4 bg-slate-900 p-1 pr-6 rounded-2xl border border-slate-800 hover:bg-orange-600 transition-all duration-300 shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <ScrollText size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Deep Study</span>
                <span className="text-sm font-bold text-white flex items-center gap-2">Enter Archives <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
              </div>
            </Link>
          </div>

          {/* 2. FEATURED MEDIA CARD (Hero) */}
          {featured && (
            <div className="flex flex-col lg:flex-row gap-10 items-stretch">
              {/* A. Image/Video Thumb */}
              <div 
                onClick={() => setActiveVideo(getEmbedUrl(featured.url))}
                className="w-full lg:w-2/3 relative aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100 cursor-pointer group border-4 border-white"
              >
                <img 
                  src={getThumbnail(featured.url) || "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200"} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Featured"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center text-slate-900 shadow-xl scale-90 group-hover:scale-100 transition-all duration-300">
                    <Play fill="currentColor" size={32} className="ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-6 left-6">
                  <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Featured Release</span>
                </div>
              </div>

              {/* B. Info Box */}
              <div className="w-full lg:w-1/3 flex flex-col justify-between py-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> {new Date(featured.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                    {featured.title}
                  </h2>

                  {featured.author && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                        {featured.author.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{featured.author}</span>
                    </div>
                  )}
                  
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-4">
                    {featured.description || "Step into this prophetic session as we dive deep into the Word and the Spirit."}
                  </p>
                </div>

                <button 
                  onClick={() => setActiveVideo(getEmbedUrl(featured.url))}
                  className="w-full mt-6 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 group"
                >
                  Start Watching
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. GALLERY GRID */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
             <Video size={20} />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Recent Transmissions</h2>
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
                <div className="relative aspect-video bg-slate-200 rounded-2xl overflow-hidden shadow-md group-hover:shadow-indigo-200 group-hover:shadow-2xl transition-all duration-300">
                  <img 
                    src={getThumbnail(item.url) || ""} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt={item.title}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all flex items-center justify-center">
                     <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={20} fill="currentColor" />
                     </div>
                  </div>
                  <div className="absolute top-3 left-3">
                     <span className="bg-slate-900/80 backdrop-blur text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-wider">
                       {item.type}
                     </span>
                  </div>
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    {item.author && (
                      <span className="text-[9px] text-indigo-500 font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-50 rounded">
                        {item.author}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            !featured && <div className="col-span-full text-center py-20 text-slate-400 font-medium italic border-2 border-dashed border-slate-200 rounded-3xl">No content in the vault yet.</div>
          )}
        </div>
      </section>

      {/* VIDEO MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 bg-slate-950/95 z-[300] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <button 
            onClick={() => setActiveVideo(null)}
            className="absolute top-6 right-6 text-white hover:bg-white/10 p-3 rounded-full transition-colors z-[310]"
          >
            <X size={32} />
          </button>
          
          <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black">
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