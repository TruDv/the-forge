"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Video, Mic, Link as LinkIcon, User, AlignLeft, Edit2 } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadSuccess, initialData = null }: any) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: 'video' as 'video' | 'podcast',
    author: '',
    description: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  // Load initial data if we are editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        url: initialData.url || '',
        type: initialData.type || 'video',
        author: initialData.author || '',
        description: initialData.description || ''
      });
    } else {
      // Reset if adding new
      setFormData({ title: '', url: '', type: 'video', author: '', description: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    const payload = { 
      title: formData.title, 
      url: formData.url, 
      type: formData.type, 
      author: formData.author,
      description: formData.description,
      category: formData.type === 'video' ? 'Recorded Session' : 'Morning Devotion' 
    };

    let error;

    if (initialData?.id) {
      // UPDATE EXISTING
      const { error: updateError } = await supabase
        .from('media')
        .update(payload)
        .eq('id', initialData.id);
      error = updateError;
    } else {
      // INSERT NEW
      const { error: insertError } = await supabase
        .from('media')
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      alert(error.message);
    } else {
      onUploadSuccess(); // Refresh the list
      onClose(); // Close modal
    }
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            {initialData ? <><Edit2 size={18} className="text-orange-500"/> Edit Content</> : "Upload Content"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Content Type Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Content Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'video'})}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition font-bold text-sm ${formData.type === 'video' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
              >
                <Video size={18} /> Video
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'podcast'})}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition font-bold text-sm ${formData.type === 'podcast' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 text-slate-400'}`}
              >
                <Mic size={18} /> Podcast
              </button>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Title */}
            <div>
              <input 
                required
                placeholder="Title (e.g. Sunday Service)"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
              />
            </div>

            {/* Author */}
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                placeholder="Preacher / Author (Optional)"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* URL */}
            <div className="relative">
              <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                required
                type="url"
                placeholder="Paste YouTube Link"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-slate-600"
              />
            </div>

            {/* Description */}
            <div className="relative">
              <AlignLeft size={16} className="absolute left-4 top-4 text-slate-400" />
              <textarea 
                placeholder="Brief description..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 text-sm h-24 resize-none"
              />
            </div>

          </div>

          <button 
            disabled={isUploading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50 uppercase tracking-widest text-xs"
          >
            {isUploading ? 'Saving...' : (initialData ? 'Save Changes' : 'Publish Content')}
          </button>
        </form>
      </div>
    </div>
  );
}