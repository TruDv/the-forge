"use client"

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trash2, Lock, Loader2, Globe, Mic, 
  LogOut, Send, Sparkles, MessageSquare, 
  History, Video, Plus, Edit2, MessageCircle,
  Users, Ban, CheckCircle, Search, Link as LinkIcon,
  Music, UploadCloud // <--- New Icons
} from 'lucide-react';
import UploadModal from '@/components/UploadModal';

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  // Data States
  const [prayers, setPrayers] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]); 
  const [musicList, setMusicList] = useState<any[]>([]); // <--- New Music State
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  // Tab State (Added 'music')
  const [activeTab, setActiveTab] = useState<'prayers' | 'archives' | 'media' | 'users' | 'music'>('prayers');

  // Upload/Edit Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); 

  // Music Upload State
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicTitle, setMusicTitle] = useState('');

  // The Oracle State
  const [newCharge, setNewCharge] = useState('');
  const [newLink, setNewLink] = useState('');
  const [isPostingCharge, setIsPostingCharge] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    live_meet_link: '', 
    live_topic: '', 
    podcast_title: '', 
    podcast_description: '', 
    podcast_image: '', 
    podcast_link: '', 
    chat_topic: ''
  });

  const MASTER_PIN = "198750##"; 

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
    
    const { data: prayerData } = await supabase.from('prayers').select('*').order('created_at', { ascending: false });
    const { data: archiveData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: mediaData } = await supabase.from('media').select('*').order('created_at', { ascending: false });
    const { data: userData } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
    
    // Fetch Music
    const { data: musicData } = await supabase.from('music_tracks').select('*').order('created_at', { ascending: false });

    if (userData) setUserList(userData);
    if (prayerData) setPrayers(prayerData);
    if (archiveData) setArchives(archiveData);
    if (mediaData) setMediaList(mediaData);
    if (musicData) setMusicList(musicData); // Set Music Data
    
    setIsLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*');
    if (data) {
      const s = data.reduce((acc: any, curr) => { acc[curr.id] = curr.value; return acc; }, {});
      setSettings(prev => ({ ...prev, ...s }));
    }
  };

  const updateSetting = async (id: string, value: string) => {
    const { error } = await supabase.from('site_settings').upsert({ id, value });
    if (!error) { setStatus('Changes forged successfully!'); setTimeout(() => setStatus(''), 3000); }
  };

  const postOracleCharge = async () => {
    if (!newCharge.trim()) return;
    setIsPostingCharge(true);
    
    const { error } = await supabase.from('announcements').insert([{ 
      content: newCharge.trim(),
      link: newLink.trim() || null
    }]);

    if (!error) {
      setNewCharge(''); 
      setNewLink(''); 
      setStatus('Prophetic Charge Released!'); 
      fetchAdminData(); 
      setTimeout(() => setStatus(''), 3000);
    }
    setIsPostingCharge(false);
  };

  // Generic Delete Function (Updated to handle music_tracks)
  const deleteItem = async (table: 'prayers' | 'announcements' | 'media' | 'music_tracks', id: string) => {
    if (!confirm(`Remove this item permanently?`)) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      if (table === 'prayers') setPrayers(c => c.filter(p => p.id !== id));
      else if (table === 'announcements') setArchives(c => c.filter(a => a.id !== id));
      else if (table === 'media') setMediaList(c => c.filter(m => m.id !== id));
      else if (table === 'music_tracks') setMusicList(c => c.filter(m => m.id !== id));
      setStatus('Item removed'); setTimeout(() => setStatus(''), 3000);
    }
  };

  // --- MUSIC UPLOAD LOGIC ---
  const handleMusicUpload = async () => {
    if (!musicFile || !musicTitle.trim()) {
      alert("Please select a file and give it a title.");
      return;
    }
    setIsUploadingMusic(true);

    // 1. Upload File
    const fileName = `music-${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from('forge-music').upload(fileName, musicFile);
    
    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setIsUploadingMusic(false);
      return;
    }

    // 2. Get URL
    const { data: { publicUrl } } = supabase.storage.from('forge-music').getPublicUrl(fileName);

    // 3. Save to DB
    const { error: dbError } = await supabase.from('music_tracks').insert([{
      title: musicTitle,
      artist: 'The Forge',
      url: publicUrl
    }]);

    if (!dbError) {
      setStatus('Music Track Uploaded!');
      setMusicFile(null);
      setMusicTitle('');
      fetchAdminData();
      setTimeout(() => setStatus(''), 3000);
    }
    setIsUploadingMusic(false);
  };

  // User Management
  const toggleUserBlock = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: !currentStatus }).eq('id', userId);
    if (!error) {
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: !currentStatus } : u));
      setStatus(currentStatus ? 'User Unblocked' : 'User Blocked'); setTimeout(() => setStatus(''), 3000);
    }
  };

  const hardDeleteUser = async (userId: string) => {
    if (!confirm("DANGER: This will permanently delete the user and their login. Are you sure?")) return;
    const { error } = await supabase.rpc('delete_user_by_id', { target_user_id: userId });
    if (!error) {
      setUserList(prev => prev.filter(u => u.id !== userId));
      setStatus('User Permanently Deleted'); setTimeout(() => setStatus(''), 3000);
    }
  };

  const filteredUsers = userList.filter(u => (u.full_name?.toLowerCase() || '').includes(userSearch.toLowerCase()) || (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase()));
  const handleEditMedia = (item: any) => { setEditingItem(item); setIsUploadModalOpen(true); };
  const handleCreateMedia = () => { setEditingItem(null); setIsUploadModalOpen(true); };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-800 w-full max-w-md text-center">
          <Lock className="text-orange-500 mx-auto mb-6" size={40} />
          <h1 className="text-2xl font-black italic mb-8 uppercase tracking-widest">Forge Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="ENTER ADMIN PIN" className="w-full text-center text-2xl py-4 bg-slate-800 rounded-2xl outline-none border border-slate-700 focus:border-orange-500 transition-all" />
            <button className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all">Unlock Portal</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 text-slate-900">
      <UploadModal isOpen={isUploadModalOpen} onClose={() => { setIsUploadModalOpen(false); setEditingItem(null); }} onUploadSuccess={() => { fetchAdminData(); }} initialData={editingItem} />

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic tracking-tight uppercase">The Forge Control</h1>
            <p className="text-slate-500 font-medium">Updating the community of {`The Forge`}</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-2 text-rose-500 font-bold text-sm bg-rose-50 px-6 py-3 rounded-xl hover:bg-rose-100 transition-colors"><LogOut size={16}/> Logout</button>
        </div>

        {status && <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl z-[200] animate-in fade-in slide-in-from-top-4 duration-300 font-bold border border-slate-700">{status}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-indigo-600"><Globe size={20}/> Live Meet</h2>
              <div className="space-y-4">
                <input placeholder="Topic Title" value={settings.live_topic} onChange={(e) => setSettings({...settings, live_topic: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" />
                <input placeholder="Meet Link" value={settings.live_meet_link} onChange={(e) => setSettings({...settings, live_meet_link: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" />
                <button onClick={() => { updateSetting('live_topic', settings.live_topic); updateSetting('live_meet_link', settings.live_meet_link); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase">Update Live</button>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-orange-600"><Mic size={20}/> Podcast</h2>
              <div className="space-y-4">
                <input placeholder="Title" value={settings.podcast_title} onChange={(e) => setSettings({...settings, podcast_title: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm" />
                <textarea placeholder="Description" value={settings.podcast_description} onChange={(e) => setSettings({...settings, podcast_description: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none h-20 text-sm resize-none" />
                <input placeholder="Audio Link" value={settings.podcast_link} onChange={(e) => setSettings({...settings, podcast_link: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none text-xs" />
                <button onClick={() => { updateSetting('podcast_title', settings.podcast_title); updateSetting('podcast_description', settings.podcast_description); updateSetting('podcast_link', settings.podcast_link); }} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-xs uppercase">Update Podcast</button>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-indigo-900"><MessageCircle size={20}/> Upper Room Focus</h2>
              <div className="space-y-4">
                <textarea placeholder="What should the Puritans discuss?" value={settings.chat_topic} onChange={(e) => setSettings({...settings, chat_topic: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm h-20 resize-none font-medium text-slate-700" />
                <button onClick={() => updateSetting('chat_topic', settings.chat_topic)} className="w-full bg-indigo-900 text-white py-3 rounded-xl font-bold text-xs uppercase">Set Room Topic</button>
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
              
              <div className="space-y-4">
                <textarea placeholder="Type the charge or instruction here..." value={newCharge} onChange={(e) => setNewCharge(e.target.value)} className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 outline-none focus:ring-2 focus:ring-orange-500/30 font-serif italic text-lg resize-none" />
                
                {/* LINK INPUT */}
                <div className="relative">
                   <LinkIcon size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500" />
                   <input 
                      placeholder="Paste PDF/Drive link (Optional)" 
                      value={newLink} 
                      onChange={(e) => setNewLink(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-orange-500/30 text-sm font-medium" 
                   />
                </div>

                <button onClick={postOracleCharge} disabled={isPostingCharge || !newCharge.trim()} className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-orange-900/20">
                  {isPostingCharge ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Release Charge</>}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: MODERATION */}
          <div className="lg:col-span-1 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden max-h-[850px]">
             
             {/* TABS HEADER */}
             <div className="flex border-b border-slate-50 bg-slate-50/50 p-1 overflow-x-auto">
               <button onClick={() => setActiveTab('prayers')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prayers' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>
                 <MessageSquare size={14} />
               </button>
               <button onClick={() => setActiveTab('archives')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'archives' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>
                 <History size={14} />
               </button>
               <button onClick={() => setActiveTab('media')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'media' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>
                 <Video size={14} />
               </button>
               <button onClick={() => setActiveTab('users')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>
                 <Users size={14} />
               </button>
               {/* NEW MUSIC TAB BTN */}
               <button onClick={() => setActiveTab('music')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'music' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>
                 <Music size={14} />
               </button>
             </div>

             <div className="overflow-y-auto p-4 space-y-2 flex-1">
               {isLoading ? (
                 <div className="p-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" /> Syncing...</div>
               ) : (
                 <>
                   {/* PRAYER TAB */}
                   {activeTab === 'prayers' && prayers.map((p) => (
                     <div key={p.id} className="p-4 hover:bg-slate-50 rounded-2xl flex justify-between items-start group border border-transparent hover:border-slate-100 transition-all">
                       <div className="flex-1 pr-4">
                         <p className="text-[9px] font-black text-indigo-500 uppercase mb-1 tracking-widest">{p.author_name}</p>
                         <p className="text-xs text-slate-600 italic line-clamp-2">"{p.content}"</p>
                       </div>
                       <button onClick={() => deleteItem('prayers', p.id)} className="text-slate-200 hover:text-rose-600 p-2 transition-colors"><Trash2 size={16}/></button>
                     </div>
                   ))}

                   {/* ARCHIVES TAB */}
                   {activeTab === 'archives' && archives.map((a) => (
                     <div key={a.id} className="p-4 hover:bg-orange-50/50 rounded-2xl flex justify-between items-start group border border-transparent hover:border-orange-100 transition-all">
                       <div className="flex-1 pr-4">
                         <p className="text-[9px] font-black text-orange-500 uppercase mb-1 tracking-widest">{new Date(a.created_at).toLocaleDateString()}</p>
                         <p className="text-xs text-slate-800 italic line-clamp-2 font-medium">"{a.content}"</p>
                         {a.link && (
                           <a href={a.link} target="_blank" className="inline-flex items-center gap-1 mt-2 text-[9px] font-bold text-indigo-600 uppercase hover:underline">
                             <LinkIcon size={10} /> Attached Resource
                           </a>
                         )}
                       </div>
                       <button onClick={() => deleteItem('announcements', a.id)} className="text-slate-200 hover:text-rose-600 p-2 transition-colors"><Trash2 size={16}/></button>
                     </div>
                   ))}

                   {/* MEDIA TAB */}
                   {activeTab === 'media' && (
                     <div className="space-y-4">
                       <button onClick={handleCreateMedia} className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 py-4 rounded-2xl text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all">
                         <Plus size={16} /> Upload New Video
                       </button>
                       {mediaList.map((m) => (
                         <div key={m.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group border border-slate-100">
                           <div className="flex items-center gap-3 overflow-hidden">
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-md ${m.type === 'video' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-orange-400 to-orange-600'}`}>
                               {m.type === 'video' ? <Video size={16}/> : <Mic size={16}/>}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-xs font-bold text-slate-900 truncate">{m.title}</p>
                               <p className="text-[10px] text-slate-500 truncate">{m.author || "The Forge"}</p>
                             </div>
                           </div>
                           <div className="flex gap-1">
                             <button onClick={() => handleEditMedia(m)} className="text-slate-300 hover:text-indigo-600 p-2 transition-colors"><Edit2 size={16}/></button>
                             <button onClick={() => deleteItem('media', m.id)} className="text-slate-300 hover:text-rose-600 p-2 transition-colors"><Trash2 size={16}/></button>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}

                   {/* MUSIC TAB (NEW) */}
                   {activeTab === 'music' && (
                      <div className="space-y-4">
                         {/* UPLOAD BOX */}
                         <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 text-center">
                            <input 
                              type="text" 
                              placeholder="Song Title (e.g. Deep Soak)" 
                              className="w-full mb-3 p-2 text-xs rounded border border-slate-200" 
                              value={musicTitle} 
                              onChange={e => setMusicTitle(e.target.value)} 
                            />
                            <input 
                              type="file" 
                              accept="audio/*" 
                              onChange={e => setMusicFile(e.target.files?.[0] || null)} 
                              className="w-full text-xs text-slate-400 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            <button 
                              onClick={handleMusicUpload} 
                              disabled={isUploadingMusic} 
                              className="w-full bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                            >
                               {isUploadingMusic ? <Loader2 size={14} className="animate-spin"/> : <><UploadCloud size={14}/> Upload Track</>}
                            </button>
                         </div>
                         
                         {/* MUSIC LIST */}
                         {musicList.map((m) => (
                           <div key={m.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Music size={14}/></div>
                                 <div>
                                   <p className="text-xs font-bold text-slate-800">{m.title}</p>
                                   <p className="text-[10px] text-slate-400">The Forge</p>
                                 </div>
                              </div>
                              <button onClick={() => deleteItem('music_tracks', m.id)} className="text-slate-300 hover:text-rose-500 p-2">
                                <Trash2 size={14}/>
                              </button>
                           </div>
                         ))}
                      </div>
                   )}

                   {/* USERS TAB */}
                   {activeTab === 'users' && (
                     <div className="space-y-4">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                           <input 
                             placeholder="Search Name or Email..." 
                             className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:border-indigo-300 transition-colors"
                             value={userSearch}
                             onChange={(e) => setUserSearch(e.target.value)}
                           />
                        </div>

                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((u) => (
                             <div key={u.id} className={`p-4 rounded-2xl flex justify-between items-center group border transition-all ${u.is_blocked ? 'bg-rose-50 border-rose-100 opacity-75' : 'bg-slate-50 border-slate-100'}`}>
                               <div className="flex items-center gap-3 overflow-hidden">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase flex-shrink-0 ${u.is_blocked ? 'bg-rose-200 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                   {u.full_name?.charAt(0) || '?'}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className={`text-xs font-bold truncate ${u.is_blocked ? 'text-rose-900 line-through' : 'text-slate-900'}`}>{u.full_name || 'Unnamed'}</p>
                                   <p className="text-[9px] text-slate-500 truncate">{u.email || 'No Email'}</p>
                                 </div>
                               </div>
                               
                               <div className="flex gap-1">
                                 <button 
                                   onClick={() => toggleUserBlock(u.id, u.is_blocked)} 
                                   className={`p-2 transition-colors rounded-lg ${u.is_blocked ? 'text-emerald-500 hover:bg-emerald-100' : 'text-slate-300 hover:text-orange-500 hover:bg-orange-50'}`}
                                   title={u.is_blocked ? "Unblock User" : "Block User"}
                                 >
                                   {u.is_blocked ? <CheckCircle size={16}/> : <Ban size={16}/>}
                                 </button>

                                 <button 
                                   onClick={() => hardDeleteUser(u.id)} 
                                   className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                                   title="Permanently Delete"
                                 >
                                   <Trash2 size={16}/>
                                 </button>
                               </div>
                             </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-slate-400 text-xs italic">No users found.</div>
                        )}
                     </div>
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