"use client"
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Send, Heart, AlertCircle } from 'lucide-react';

export default function PrayerModal({ isOpen, onClose, onRefresh }: any) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Get the current user to attach their name/ID
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. Insert the prayer
      const { error } = await supabase
        .from('prayers')
        .insert([
          { 
            content: content.trim(),
            prayer_count: 0,
            // We use the user's ID or a default if not logged in
            author_name: session?.user?.user_metadata?.full_name?.split(' ')[0] || 'Puritan'
          }
        ]);

      if (error) throw error;

      // 3. Success logic
      setContent('');
      onRefresh(); // Updates the home page wall
      onClose();   // Closes the modal
    } catch (err: any) {
      console.error("Submission error:", err.message);
      setErrorMsg(err.message || "Failed to post prayer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="bg-indigo-600 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 hover:rotate-90 transition-transform">
            <X size={24} />
          </button>
          <Heart className="mb-4 opacity-50" size={32} fill="currentColor" />
          <h2 className="text-2xl font-black uppercase">Submit a Request</h2>
          <p className="text-indigo-100 text-sm mt-1">Our community is standing in faith with you.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm border border-red-100">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <textarea
            required
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="How can we pray for you today, Puritan?"
            className="w-full h-40 p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all resize-none text-slate-700 font-medium"
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {loading ? "Forging..." : "Post to Wall"}
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}