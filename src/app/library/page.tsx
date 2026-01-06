"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Plus, X, Mic, Video, Search } from 'lucide-react';
import UploadModal from '@/components/UploadModal';

export default function LibraryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [media, setMedia] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // --- HELPERS ---
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnail = (url: string) => {
    const id = getYoutubeId(url);
    // Returns high quality YouTube thumbnail, or a fallback if it's not a YT link
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
  };

  const getEmbedUrl = (url: string) => {
    const id = getYoutubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url;
  };

  const fetchMedia = async () => {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setMedia(data);
    if (error) console.error("Error fetching media:", error.message);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Media Library</h1>
          <p className="text-slate-500 mt-1 font-medium">Catch up on recorded sessions and podcasts.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
          Upload New Content
        </button>
      </div>

      {/* CONTENT GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {media.length > 0 ? (
          media.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setActiveVideo(getEmbedUrl(item.url))}
              className="group cursor-pointer bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                {item.type === 'video' ? (
                  <img 
                    src={getThumbnail(item.url) || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800"} 
                    alt={item.title}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center">
                    <Mic className="text-white/20 group-hover:scale-110 transition duration-500" size={60} />
                  </div>
                )}

                {/* Centered Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-2xl scale-90 group-hover:scale-100 transition duration-300">
                    <Play fill="currentColor" size={28} className="ml-1" />
                  </div>
                </div>

                {/* Type Badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-white/95 backdrop-blur text-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1.5">
                    {item.type === 'video' ? <Video size={12} /> : <Mic size={12} />}
                    {item.type}
                  </span>
                </div>
              </div>

              {/* Text Details */}
              <div className="p-7">
                <h3 className="font-bold text-slate-900 text-xl line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-indigo-600 text-xs font-bold group-hover:underline">Watch Now →</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Empty State */
          <div className="col-span-full py-20 text-center">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Video size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No content found</h3>
            <p className="text-slate-500 mt-2">Start by uploading your first video or podcast.</p>
          </div>
        )}
      </div>

      {/* VIDEO PLAYER MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 bg-slate-950/95 z-[200] flex items-center justify-center p-4 md:p-10 backdrop-blur-md">
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

      {/* UPLOAD MODAL COMPONENT */}
      <UploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUploadSuccess={fetchMedia} 
      />
    </main>
  );
}