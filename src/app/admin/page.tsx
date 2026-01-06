"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trash2, Lock, Loader2, Save, Globe, Mic, 
  LogOut, Link as LinkIcon, Send, Sparkles, 
  MessageSquare, History 
} from 'lucide-react';

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [prayers, setPrayers] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  // Tab State: Toggle between 'prayers' and 'archives'
  const [activeTab, setActiveTab] = useState<'prayers' | 'archives'>('prayers');

  // The Oracle State
  const [newCharge, setNewCharge] = useState('');
  const [isPostingCharge, setIsPostingCharge] = useState(false);

  // Site Settings State
  const [settings, setSettings] = useState({
    live_meet_link: '',
    live_topic: '',
    podcast_title: '',
    podcast_description: '',
    podcast_image: '',
    podcast_link: ''
  });

  const MASTER_PIN = "1234"; 

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === MASTER_PIN) {
      setIsAuthenticated(true);
      fetchAdminData();
      fetchSettings();
    } else {
      alert("Incorrect Admin PIN");
    }
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    
    // Fetch Prayers
    const { data: prayerData } = await supabase
      .from('prayers')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Fetch Archives (Announcements)
    const { data: archiveData } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (prayerData) setPrayers(prayerData);
    if (archiveData) setArchives(archiveData);
    
    setIsLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*');
    if (data) {
      const s = data.reduce((acc: any, curr) => {
        acc[curr.id] = curr.value;
        return acc;
      }, {});
      setSettings(prev => ({ ...prev, ...s }));
    }
  };

  const updateSetting = async (id: string, value: string) => {
    const { error } = await supabase.from('site_settings').upsert({ id, value });
    if (!error) {
      setStatus('Changes forged successfully!');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const postOracleCharge = async () => {
    if (!newCharge.trim()) return;
    setIsPostingCharge(true);
    const { error } = await supabase
      .from('announcements')
      .insert([{ content: newCharge.trim() }]);

    if (!error) {
      setNewCharge('');
      setStatus('Prophetic Charge Released!');
      fetchAdminData(); // Refresh archives list
      setTimeout(() => setStatus(''), 3000);
    } else {
      alert("Error: " + error.message);
    }
    setIsPostingCharge(false);
  };

  const deleteItem = async (table: 'prayers' | 'announcements', id: string) => {
    const itemType = table === 'prayers' ? 'prayer' : 'archive post';
    if (!confirm(`Remove this ${itemType} permanently?`)) return;

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      if (table === 'prayers') {
        setPrayers(current => current.filter(p => p.id !== id));
      } else {
        setArchives(current => current.filter(a => a.id !== id));
      }
      setStatus(`${itemType === 'prayer' ? 'Prayer' : 'Charge'} removed`);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-800 w-full max-w-md text-center">
          <Lock className="text-orange-500 mx-auto mb-6" size={40} />
          <h1 className="text-2xl font-black italic mb-8 uppercase tracking-widest">Forge Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              placeholder="ENTER ADMIN PIN" 
              className="w-full text-center text-2xl py-4 bg-slate-800 rounded-2xl outline-none border border-slate-700 focus:border-orange-500 transition-all" 
            />
            <button className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all">
              Unlock Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic tracking-tight uppercase">The Forge Control</h1>
            <p className="text-slate-500 font-medium">Updating the community of {`The Forge`}</p>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)} 
            className="flex items-center gap-2 text-rose-500 font-bold text-sm bg-rose-50 px-6 py-3 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <LogOut size={16}/> Logout
          </button>
        </div>

        {status && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl z-[200] animate-in fade-in slide-in-from-top-4 duration-300 font-bold border border-slate-700">
            {status}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: LIVE & PODCAST */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-indigo-600"><Globe size={20}/> Live Meet</h2>
              <div className="space-y-4">
                <input 
                  placeholder="Topic Title"
                  value={settings.live_topic} 
                  onChange={(e) => setSettings({...settings, live_topic: e.target.value})} 
                  className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" 
                />
                <input 
                  placeholder="Meet Link"
                  value={settings.live_meet_link} 
                  onChange={(e) => setSettings({...settings, live_meet_link: e.target.value})} 
                  className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" 
                />
                <button 
                  onClick={() => { updateSetting('live_topic', settings.live_topic); updateSetting('live_meet_link', settings.live_meet_link); }} 
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase"
                >
                  Update Live
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-orange-600"><Mic size={20}/> Podcast</h2>
              <div className="space-y-4">
                <input 
                  placeholder="Title"
                  value={settings.podcast_title} 
                  onChange={(e) => setSettings({...settings, podcast_title: e.target.value})} 
                  className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" 
                />
                <textarea 
                  placeholder="Description"
                  value={settings.podcast_description} 
                  onChange={(e) => setSettings({...settings, podcast_description: e.target.value})} 
                  className="w-full p-3 bg-slate-50 rounded-xl outline-none h-20 text-sm resize-none" 
                />
                <input 
                  placeholder="Audio Link"
                  value={settings.podcast_link} 
                  onChange={(e) => setSettings({...settings, podcast_link: e.target.value})} 
                  className="w-full p-3 bg-slate-50 rounded-xl outline-none text-xs" 
                />
                <button 
                  onClick={() => { 
                    updateSetting('podcast_title', settings.podcast_title); 
                    updateSetting('podcast_description', settings.podcast_description); 
                    updateSetting('podcast_link', settings.podcast_link); 
                  }} 
                  className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-xs uppercase"
                >
                  Update Podcast
                </button>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: THE ORACLE */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-xl border border-white/5 h-full">
              <div className="flex items-center gap-2 mb-6 text-orange-400">
                <Sparkles size={20} />
                <h2 className="text-xl font-black uppercase tracking-tighter italic">Release the Oracle</h2>
              </div>
              
              <p className="text-slate-400 text-xs mb-6 font-medium italic">This will appear in the live ticker and be saved to the Archives.</p>
              
              <textarea 
                placeholder="Type the charge or instruction here..."
                value={newCharge}
                onChange={(e) => setNewCharge(e.target.value)}
                className="w-full h-64 bg-white/5 border border-white/10 rounded-2xl p-6 outline-none focus:ring-2 focus:ring-orange-500/30 font-serif italic text-lg mb-6 resize-none"
              />

              <button 
                onClick={postOracleCharge}
                disabled={isPostingCharge || !newCharge.trim()}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-orange-900/20"
              >
                {isPostingCharge ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Release Charge</>}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: MODERATION (TABS ADDED HERE) */}
          <div className="lg:col-span-1 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden max-h-[850px]">
             <div className="flex border-b border-slate-50 bg-slate-50/50 p-1">
               <button 
                 onClick={() => setActiveTab('prayers')}
                 className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prayers' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
               >
                 <MessageSquare size={14} /> Prayer Wall
               </button>
               <button 
                 onClick={() => setActiveTab('archives')}
                 className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'archives' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
               >
                 <History size={14} /> The Oracle
               </button>
             </div>

             <div className="overflow-y-auto p-4 space-y-2 flex-1">
                {isLoading ? (
                  <div className="p-12 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Syncing...
                  </div>
                ) : (
                  <>
                    {activeTab === 'prayers' ? (
                      prayers.map((p) => (
                        <div key={p.id} className="p-4 hover:bg-slate-50 rounded-2xl flex justify-between items-start group border border-transparent hover:border-slate-100 transition-all">
                          <div className="flex-1 pr-4">
                            <p className="text-[9px] font-black text-indigo-500 uppercase mb-1 tracking-widest">{p.author_name}</p>
                            <p className="text-xs text-slate-600 italic line-clamp-2">"{p.content}"</p>
                          </div>
                          <button onClick={() => deleteItem('prayers', p.id)} className="text-slate-200 hover:text-rose-600 p-2 transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      ))
                    ) : (
                      archives.map((a) => (
                        <div key={a.id} className="p-4 hover:bg-orange-50/50 rounded-2xl flex justify-between items-start group border border-transparent hover:border-orange-100 transition-all">
                          <div className="flex-1 pr-4">
                            <p className="text-[9px] font-black text-orange-500 uppercase mb-1 tracking-widest">
                              {new Date(a.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-800 italic line-clamp-2 font-medium">"{a.content}"</p>
                          </div>
                          <button onClick={() => deleteItem('announcements', a.id)} className="text-slate-200 hover:text-rose-600 p-2 transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      ))
                    )}
                  </>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}