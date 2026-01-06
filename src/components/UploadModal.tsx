"use client"
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Video, Mic, Link as LinkIcon } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: any) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'video' | 'podcast'>('video');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    const { error } = await supabase
      .from('media')
      .insert([{ title, url, type, category: type === 'video' ? 'Recorded Session' : 'Morning Devotion' }]);

    if (error) {
      alert(error.message);
    } else {
      setTitle('');
      setUrl('');
      onUploadSuccess();
      onClose();
    }
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800 text-lg">Upload Content</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Content Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setType('video')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition ${type === 'video' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
              >
                <Video size={18} /> Video
              </button>
              <button 
                type="button"
                onClick={() => setType('podcast')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition ${type === 'podcast' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
              >
                <Mic size={18} /> Podcast
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <input 
              required
              placeholder="Title (e.g. Sunday Service)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <div className="relative">
              <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                required
                placeholder="Paste YouTube or Audio Link"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <button 
            disabled={isUploading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Publish Content'}
          </button>
        </form>
      </div>
    </div>
  );
}