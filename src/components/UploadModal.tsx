"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Video, Mic, Link as LinkIcon, User, AlignLeft, Edit2, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadSuccess, initialData = null }: any) {
  const [formData, setFormData] = useState({
    title: '',
    url: '', // External link fallback
    image_url: '', // External image fallback
    type: 'video' as 'video' | 'podcast',
    author: '',
    description: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Load initial data if we are editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        url: initialData.audio_url || initialData.url || '',
        image_url: initialData.image_url || '',
        type: initialData.audio_url ? 'podcast' : 'video',
        author: initialData.author || '',
        description: initialData.description || ''
      });
    } else {
      setFormData({ title: '', url: '', image_url: '', type: 'video', author: '', description: '' });
      setSelectedAudioFile(null);
      setSelectedImageFile(null);
      setUploadProgress(0);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    let finalContentUrl = formData.url;
    let finalImageUrl = formData.image_url;

    try {
      // 1. HANDLE MEDIA FILE UPLOAD (Audio or Video)
      if (selectedAudioFile) {
        const fileExt = selectedAudioFile.name.split('.').pop();
        const fileName = `content-${Date.now()}.${fileExt}`;
        const filePath = `${formData.type}s/${fileName}`;

        // FIX: Cast the options object 'as any' to allow onUploadProgress in older SDK versions
        const { error: uploadError } = await supabase.storage
          .from('forge-files')
          .upload(filePath, selectedAudioFile, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress: any) => {
              const percentage = (progress.loaded / progress.total) * 100;
              setUploadProgress(Math.round(percentage));
            }
          } as any);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('forge-files').getPublicUrl(filePath);
        finalContentUrl = publicUrl;
      }

      // 2. HANDLE COVER IMAGE UPLOAD
      if (selectedImageFile) {
        const imgExt = selectedImageFile.name.split('.').pop();
        const imgName = `cover-${Date.now()}.${imgExt}`;
        const imgPath = `covers/${imgName}`;

        const { error: imgUploadError } = await supabase.storage
          .from('forge-files')
          .upload(imgPath, selectedImageFile);

        if (imgUploadError) throw imgUploadError;

        const { data: { publicUrl } } = supabase.storage.from('forge-files').getPublicUrl(imgPath);
        finalImageUrl = publicUrl;
      }

      // 3. PREPARE DATABASE PAYLOAD
      const isPodcast = formData.type === 'podcast';
      const targetTable = isPodcast ? 'podcasts' : 'media';

      const payload: any = { 
        title: formData.title, 
        author: formData.author || 'The Forge',
        description: formData.description,
        image_url: finalImageUrl || "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800"
      };

      if (isPodcast) {
        payload.audio_url = finalContentUrl;
      } else {
        payload.url = finalContentUrl;
        payload.type = 'video';
        payload.category = 'Recorded Session';
      }

      // 4. INSERT OR UPDATE IN DATABASE
      if (initialData?.id) {
        const { error: dbError } = await supabase
          .from(targetTable)
          .update(payload)
          .eq('id', initialData.id);
        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabase
          .from(targetTable)
          .insert([payload]);
        if (dbError) throw dbError;
      }

      onUploadSuccess(); 
      onClose(); 
    } catch (err: any) {
      alert("Error forging content: " + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="font-black text-slate-900 text-xl uppercase italic tracking-tighter flex items-center gap-2">
              {initialData ? <><Edit2 size={20} className="text-orange-500"/> Edit Content</> : "Forge New Content"}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Refining the digital altar</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Content Type Toggle */}
          {!initialData && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'video'})}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${formData.type === 'video' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100' : 'border-slate-100 text-slate-300'}`}
              >
                <Video size={18} /> Video
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'podcast'})}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${formData.type === 'podcast' ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg shadow-orange-100' : 'border-slate-100 text-slate-300'}`}
              >
                <Mic size={18} /> Podcast
              </button>
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <input 
              required
              placeholder="Title of the Word"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold placeholder:text-slate-300 transition-all"
            />

            {/* Author */}
            <div className="relative">
              <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                placeholder="Speaker / Puritan Name"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
              />
            </div>

            {/* Description */}
            <div className="relative">
              <AlignLeft size={18} className="absolute left-5 top-5 text-slate-300" />
              <textarea 
                placeholder="The essence of this message..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 text-sm h-28 resize-none font-medium transition-all"
              />
            </div>

            {/* URL OR FILE UPLOAD (MEDIA SOURCE) */}
            <div className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 space-y-4">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2 text-center">Media Source</span>
               
               <div className="relative">
                <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" />
                <input 
                  type="url"
                  placeholder={formData.type === 'video' ? "Paste YouTube Link" : "Paste Link (Optional if uploading)"}
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-indigo-100 focus:ring-2 focus:ring-indigo-500 text-[11px] font-mono text-slate-600"
                />
               </div>

               <div className="relative">
                  <input 
                    type="file" 
                    id="audio-upload"
                    className="hidden"
                    accept={formData.type === 'video' ? "video/*" : "audio/*"}
                    onChange={(e) => setSelectedAudioFile(e.target.files?.[0] || null)}
                  />
                  <label 
                    htmlFor="audio-upload"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-all text-[11px] font-bold text-indigo-500 uppercase tracking-tighter"
                  >
                    <UploadCloud size={16} /> 
                    {selectedAudioFile ? selectedAudioFile.name : `Upload ${formData.type} File`}
                  </label>
               </div>
            </div>

            {/* COVER IMAGE SOURCE */}
            <div className="p-5 bg-orange-50/50 rounded-[2rem] border border-orange-100/50 space-y-4">
               <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2 text-center">Cover Image</span>
               
               <div className="relative">
                <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300" />
                <input 
                  type="url"
                  placeholder="Paste Image URL (Optional if uploading)"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-orange-100 focus:ring-2 focus:ring-orange-500 text-[11px] font-mono text-slate-600"
                />
               </div>

               <div className="relative">
                  <input 
                    type="file" 
                    id="image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)}
                  />
                  <label 
                    htmlFor="image-upload"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-dashed border-orange-200 rounded-xl cursor-pointer hover:border-orange-400 transition-all text-[11px] font-bold text-orange-500 uppercase tracking-tighter"
                  >
                    <ImageIcon size={16} /> 
                    {selectedImageFile ? selectedImageFile.name : `Upload Cover Image`}
                  </label>
               </div>
            </div>
          </div>

          {/* --- PROGRESS BAR UI --- */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Forging Content...</span>
                <span className="text-xs font-black text-slate-900">{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500 transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button 
            disabled={isUploading}
            className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
          >
            {isUploading ? (
              <><Loader2 className="animate-spin" size={18} /> Forging File...</>
            ) : (
              <>{initialData ? 'Update Altar' : 'Publish to Forge'}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}