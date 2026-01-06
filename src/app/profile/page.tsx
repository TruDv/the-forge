"use client"

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, Camera, Lock, LogOut, Check, 
  AlertCircle, Loader2, Heart, BookOpen, 
  History, Settings, ShieldCheck, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, type: 'prayer' | 'journal'} | null>(null);
  
  // Data States
  const [userPrayers, setUserPrayers] = useState<any[]>([]);
  const [userJournals, setUserJournals] = useState<any[]>([]);
  const [profile, setProfile] = useState({
    id: '',
    full_name: '',
    avatar_url: '',
    email: ''
  });

  useEffect(() => {
    getProfileData();
  }, []);

  async function getProfileData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.replace('/'); 
        return;
      }

      const { data: profData } = await supabase
        .from('profiles')
        .select(`full_name, avatar_url`)
        .eq('id', session.user.id)
        .single();

      if (profData) {
        setProfile({
          id: session.user.id,
          full_name: profData.full_name || '',
          avatar_url: profData.avatar_url || '',
          email: session.user.email || ''
        });
      }

      const { data: prayers } = await supabase
        .from('prayers')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (prayers) setUserPrayers(prayers);

      const { data: logs } = await supabase
        .from('fasting_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('day_number', { ascending: false });
      if (logs) setUserJournals(logs);

    } catch (error) {
      console.error('Error loading sanctuary data');
    } finally {
      setLoading(false);
    }
  }

  // --- DELETE ACTIONS ---
  async function handleDeletePrayer(id: string) {
    const { error } = await supabase.from('prayers').delete().eq('id', id);
    if (!error) {
      setUserPrayers(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
    }
  }

  async function handleDeleteJournal(id: string) {
    const { error } = await supabase.from('fasting_logs').delete().eq('id', id);
    if (!error) {
      setUserJournals(prev => prev.filter(j => j.id !== id));
      setDeleteConfirm(null);
    }
  }

  // --- PROFILE ACTIONS ---
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ type: 'success', text: 'Identity updated in The Forge!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      updated_at: new Date().toISOString(),
    });
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: 'Profile updated successfully!' });
    setUpdating(false);
  }

  async function handlePasswordReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: 'Reset link sent! Check your email.' });
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      // Use replace to prevent back-button navigation to a protected page
      window.location.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-80 space-y-4">
          <div className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative group cursor-pointer mb-4" onClick={() => !uploading && fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden relative">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                      <User size={40} />
                    </div>
                  )}
                  {uploading && <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                </div>
                <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full border-2 border-white shadow-lg"><Camera size={14} /></div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>
              <h2 className="font-black text-slate-900 uppercase tracking-tight leading-none">{profile.full_name || 'Puritan Member'}</h2>
              <p className="text-slate-400 text-xs mt-2 font-medium">{profile.email}</p>
            </div>

            <nav className="space-y-1">
              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Settings size={18} /> Profile Settings
              </button>
              <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <History size={18} /> My Journey
              </button>
            </nav>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-rose-500 hover:bg-rose-50 transition-all">
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1">
          {message.text && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
              {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          {activeTab === 'profile' ? (
            <div className="space-y-6">
              <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-6 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-600" /> Identity Settings
                </h3>
                <form onSubmit={updateProfile} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Display Name</label>
                    <input type="text" value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </div>
                  <button type="submit" disabled={updating} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-50">
                   <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Lock size={16} className="text-indigo-600" /> Security
                  </h3>
                  <button onClick={handlePasswordReset} className="flex items-center gap-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                    Send Password Reset Email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Past Prayers */}
              <section>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Heart size={16} className="text-rose-500" /> Your Prayer Requests
                </h3>
                <div className="grid gap-4">
                  {userPrayers.length > 0 ? userPrayers.map((p) => (
                    <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start group">
                      <div>
                        <p className="text-slate-600 italic font-serif">"{p.content}"</p>
                        <div className="mt-3 flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Heart size={12} /> {p.prayer_count} Prayers</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {deleteConfirm?.id === p.id && deleteConfirm?.type === 'prayer' ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleDeletePrayer(p.id)} className="text-[10px] bg-rose-500 text-white px-3 py-1.5 rounded-lg font-black uppercase">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg font-black uppercase">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm({id: p.id, type: 'prayer'})} className="text-slate-300 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-slate-50 rounded-4xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">No prayers shared yet.</div>
                  )}
                </div>
              </section>

              {/* Journal Section */}
              <section>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-orange-500" /> Fasting Reflections
                </h3>
                <div className="grid gap-4">
                  {userJournals.length > 0 ? userJournals.map((log) => (
                    <div key={log.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group">
                      <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 rounded-bl-xl text-[10px] font-black uppercase">Day {log.day_number}</div>
                      <div className="flex justify-between items-start">
                        <p className="text-slate-600 text-sm leading-relaxed italic pr-12">"{log.notes}"</p>
                        <div className="pt-4">
                          {deleteConfirm?.id === log.id && deleteConfirm?.type === 'journal' ? (
                            <div className="flex flex-col gap-1 items-end">
                              <button onClick={() => handleDeleteJournal(log.id)} className="text-[9px] bg-rose-500 text-white px-2 py-1 rounded font-black uppercase">Confirm Delete</button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-[9px] text-slate-400 font-bold uppercase">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm({id: log.id, type: 'journal'})} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-slate-50 rounded-4xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">No journal entries found.</div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}