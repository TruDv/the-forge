"use client"
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Play, Mic, Video, X, Loader2, Calendar, ArrowRight, 
  ScrollText, Pause, Rewind, FastForward 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LibraryPage() {
  const [allContent, setAllContent] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- AUDIO PLAYER STATE ---
  const [activePodcast, setActivePodcast] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- HELPERS ---
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnail = (item: any) => {
    if (item.image_url) return item.image_url;
    const id = getYoutubeId(item.url || '');
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800";
  };

  const getEmbedUrl = (url: string) => {
    const id = getYoutubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url;
  };

  // --- PLAYER LOGIC ---
  const handlePlayPodcast = (pod: any) => {
    if (activePodcast?.id === pod.id) {
      if (isPlaying) audioRef.current?.pause();
      else audioRef.current?.play().catch(e => console.log("Playback error", e));
      setIsPlaying(!isPlaying);
      return;
    }
    setActivePodcast(pod);
    setIsPlaying(true);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch both Video Media and Podcasts
      const [mediaRes, podcastRes] = await Promise.all([
        supabase.from('media').select('*'),
        supabase.from('podcasts').select('*')
      ]);

      let combined = [
        ...(mediaRes.data || []).map(i => ({ ...i, contentType: 'video' })),
        ...(podcastRes.data || []).map(i => ({ ...i, contentType: 'podcast', url: i.audio_url }))
      ];

      // Sort by newest
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setAllContent(combined);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" />
    </div>
  );

  const featured = allContent[0]; 
  const gallery = allContent.slice(1); 

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      {/* GLOBAL AUDIO ENGINE */}
      <audio 
        ref={audioRef} 
        src={activePodcast?.audio_url} 
        onTimeUpdate={onTimeUpdate}
        autoPlay
        onEnded={() => setIsPlaying(false)}
      />

      {/* 1. HEADER SECTION */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic mb-2">The Library</h1>
              <p className="text-slate-500 font-medium">Prophetic charges, audio words, and eternal teachings.</p>
            </div>

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

          {/* 2. FEATURED HERO */}
          {featured && (
            <div className="flex flex-col lg:flex-row gap-10 items-stretch">
              <div 
                onClick={() => featured.contentType === 'video' ? setActiveVideo(getEmbedUrl(featured.url)) : handlePlayPodcast(featured)}
                className="w-full lg:w-2/3 relative aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100 cursor-pointer group border-4 border-white"
              >
                <img 
                  src={getThumbnail(featured)} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Featured"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center text-slate-900 shadow-xl scale-90 group-hover:scale-100 transition-all duration-300">
                    {activePodcast?.id === featured.id && isPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={32} className="ml-1" />}
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 flex gap-2">
                  <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">New Release</span>
                  <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                    {featured.contentType === 'video' ? <Video size={10}/> : <Mic size={10}/>} {featured.contentType}
                  </span>
                </div>
              </div>

              <div className="w-full lg:w-1/3 flex flex-col justify-between py-2">
                <div className="space-y-4">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> {new Date(featured.created_at).toLocaleDateString()}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{featured.title}</h2>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-6">{featured.description}</p>
                </div>
                
                {/* Featured Player UI for Podcast */}
                {activePodcast?.id === featured.id && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                        <div className="flex items-center gap-4">
                            <button onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)} className="text-indigo-400 hover:text-indigo-600"><Rewind size={20}/></button>
                            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="flex-1 h-1.5 accent-indigo-600 cursor-pointer" />
                            <button onClick={() => audioRef.current && (audioRef.current.currentTime += 10)} className="text-indigo-400 hover:text-indigo-600"><FastForward size={20}/></button>
                        </div>
                    </div>
                )}

                <button 
                  onClick={() => featured.contentType === 'video' ? setActiveVideo(getEmbedUrl(featured.url)) : handlePlayPodcast(featured)}
                  className="w-full mt-6 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all"
                >
                  {activePodcast?.id === featured.id && isPlaying ? 'Pause Word' : `Start ${featured.contentType === 'video' ? 'Watching' : 'Listening'}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. GALLERY GRID */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {gallery.map((item) => {
            const isThisPlaying = activePodcast?.id === item.id;
            const progress = duration ? (currentTime / duration) * 100 : 0;

            return (
              <div key={item.id} className={`group flex flex-col gap-4 p-4 rounded-[2.5rem] transition-all duration-300 ${isThisPlaying ? 'bg-indigo-50/50 ring-2 ring-indigo-100' : 'bg-transparent'}`}>
                {/* Thumbnail Card */}
                <div 
                  onClick={() => item.contentType === 'video' ? setActiveVideo(getEmbedUrl(item.url)) : handlePlayPodcast(item)}
                  className="relative aspect-video bg-slate-200 rounded-3xl overflow-hidden shadow-md cursor-pointer group-hover:shadow-2xl transition-all duration-500"
                >
                  <img src={getThumbnail(item)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.title} />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="p-4 bg-white/90 rounded-full text-slate-900 shadow-xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      {isThisPlaying && isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                      {item.contentType === 'video' ? <Video size={10}/> : <Mic size={10}/>} {item.contentType}
                    </span>
                  </div>
                </div>

                {/* Info & Player UI */}
                <div className="px-2">
                  <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">{item.title}</h3>
                  
                  {isThisPlaying ? (
                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3">
                        <button onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)} className="text-indigo-400"><Rewind size={16}/></button>
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }} />
                        </div>
                        <button onClick={() => audioRef.current && (audioRef.current.currentTime += 10)} className="text-indigo-400"><FastForward size={16}/></button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-indigo-500 uppercase animate-pulse">Now Refining...</span>
                        <button onClick={() => {setActivePodcast(null); setIsPlaying(false)}} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                      {item.author && <span className="text-[10px] text-indigo-500 font-black uppercase">By {item.author}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* VIDEO MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 bg-slate-950/95 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
          <button onClick={() => setActiveVideo(null)} className="absolute top-6 right-6 text-white hover:bg-white/10 p-3 rounded-full z-[310]"><X size={32} /></button>
          <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <iframe src={activeVideo} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
          </div>
        </div>
      )}
    </main>
  );
}