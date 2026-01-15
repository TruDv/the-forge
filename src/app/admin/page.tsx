"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trash2, Lock, Loader2, Globe, Mic, 
  LogOut, Send, Sparkles, MessageSquare, 
  History, Video, Plus, Edit2, MessageCircle,
  Users, Ban, CheckCircle, Search, Link as LinkIcon,
  Music, UploadCloud, Headset, Calendar, X 
} from 'lucide-react';
import UploadModal from '@/components/UploadModal';

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  // --- DATA STATES ---
  const [prayers, setPrayers] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]); 
  const [musicList, setMusicList] = useState<any[]>([]); 
  const [podcastList, setPodcastList] = useState<any[]>([]); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState<'prayers' | 'archives' | 'media' | 'users' | 'music' | 'podcasts'>('prayers');

  // --- MODAL & EDIT STATES ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [isEditingArchive, setIsEditingArchive] = useState(false);
  const [editingArchiveData, setEditingArchiveData] = useState<any>(null);

// --- MUSIC UPLOAD STATES (WITH ARTIST FIELD) ---
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState(''); // New State for Artist Name

  // --- THE ORACLE STATES (WITH DATE) ---
  const [newCharge, setNewCharge] = useState('');
  const [newLink, setNewLink] = useState('');
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().split('T')[0]); 
  const [isPostingCharge, setIsPostingCharge] = useState(false);

  // --- SETTINGS STATE ---
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

  // --- LOGIN LOGIC ---
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

  // --- DATA FETCHING ---
  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
        const { data: prayerData } = await supabase.from('prayers').select('*').order('created_at', { ascending: false });
        const { data: archiveData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        const { data: mediaData } = await supabase.from('media').select('*').order('created_at', { ascending: false });
        const { data: userData } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
        const { data: musicData } = await supabase.from('music_tracks').select('*').order('created_at', { ascending: false });
        const { data: podcastData } = await supabase.from('podcasts').select('*').order('created_at', { ascending: false });

        setPrayers(prayerData || []);
        setArchives(archiveData || []);
        setMediaList(mediaData || []);
        setUserList(userData || []);
        setMusicList(musicData || []);
        setPodcastList(podcastData || []);
    } catch (err) {
        console.error("Fetch error:", err);
    } finally {
        setIsLoading(false);
    }
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

  // --- ORACLE CHARGE LOGIC (WITH BACKDATING) ---
  const postOracleCharge = async () => {
    if (!newCharge.trim()) return;
    setIsPostingCharge(true);
    
    const { error } = await supabase.from('announcements').insert([{ 
      content: newCharge.trim(),
      link: newLink.trim() || null,
      created_at: new Date(chargeDate).toISOString() 
    }]);

    if (!error) {
      setNewCharge(''); 
      setNewLink(''); 
      setChargeDate(new Date().toISOString().split('T')[0]);
      setStatus('Prophetic Charge Released!'); 
      fetchAdminData(); 
      setTimeout(() => setStatus(''), 3000);
    }
    setIsPostingCharge(false);
  };

  // --- ARCHIVE EDIT LOGIC (FIXED) ---
  const handleEditArchive = (item: any) => {
    setEditingArchiveData({
        ...item,
        author: item.author || '', // Pre-fill author
        created_at: new Date(item.created_at).toISOString().split('T')[0]
    });
    setIsEditingArchive(true);
  };

  const updateArchiveCharge = async () => {
    if (!editingArchiveData || !editingArchiveData.content.trim()) return;
    
    // Explicitly mapping state to DB columns to ensure saving
    const { error: updateError } = await supabase
        .from('announcements')
        .update({
            content: editingArchiveData.content,
            author: editingArchiveData.author,
            link: editingArchiveData.link,
            created_at: new Date(editingArchiveData.created_at).toISOString()
        })
        .eq('id', editingArchiveData.id);

    if (updateError) {
        console.error("Save Error:", updateError);
        alert(`Failed to save: ${updateError.message}`);
    } else {
        setIsEditingArchive(false);
        setStatus('Archive Refined Successfully!');
        fetchAdminData(); // Critical: refresh data to see changes
        setTimeout(() => setStatus(''), 3000);
    }
  };
  
  // --- UNIFIED DELETE LOGIC ---
  const deleteItem = async (table: 'prayers' | 'announcements' | 'media' | 'music_tracks' | 'podcasts', id: string) => {
    if (!confirm(`Remove this item permanently?`)) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      fetchAdminData();
      setStatus('Item removed'); setTimeout(() => setStatus(''), 3000);
    }
  };

  // --- MUSIC UPLOAD LOGIC (FULLY RESTORED) ---
  const handleMusicUpload = async () => {
    if (!musicFile || !musicTitle.trim()) {
      alert("Please select a file and give it a title.");
      return;
    }
    setIsUploadingMusic(true);
    const fileName = `music-${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from('forge-music').upload(fileName, musicFile);
    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setIsUploadingMusic(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('forge-music').getPublicUrl(fileName);
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
    }
    setIsUploadingMusic(false);
  };

  // --- USER MANAGEMENT ---
  const toggleUserBlock = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: !currentStatus }).eq('id', userId);
    if (!error) {
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: !currentStatus } : u));
      setStatus(currentStatus ? 'User Unblocked' : 'User Blocked'); setTimeout(() => setStatus(''), 3000);
    }
  };

  const hardDeleteUser = async (userId: string) => {
    if (!confirm("Permanently delete user?")) return;
    const { error } = await supabase.rpc('delete_user_by_id', { target_user_id: userId });
    if (!error) {
      setUserList(prev => prev.filter(u => u.id !== userId));
      setStatus('User Deleted');
    }
  };

  const filteredUsers = userList.filter(u => 
    (u.full_name?.toLowerCase() || '').includes(userSearch.toLowerCase()) || 
    (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase())
  );

  const handleEditItem = (item: any, type: 'video' | 'podcast') => { 
    setEditingItem({ ...item, type }); 
    setIsUploadModalOpen(true); 
  };
  
  const handleCreateMedia = (type: 'video' | 'podcast') => { 
    setEditingItem({ type }); 
    setIsUploadModalOpen(true); 
  };

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
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => { setIsUploadModalOpen(false); setEditingItem(null); }} 
        onUploadSuccess={() => { fetchAdminData(); }} 
        initialData={editingItem} 
      />

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic tracking-tight uppercase">The Forge Control</h1>
            <p className="text-slate-500 font-medium">Updating the community of {`The Forge`}</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-2 text-rose-500 font-bold text-sm bg-rose-50 px-6 py-3 rounded-xl hover:bg-rose-100 transition-colors"><LogOut size={16}/> Logout</button>
        </div>

        {status && <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl z-[200] font-bold border border-slate-700">{status}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
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
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-indigo-900"><MessageCircle size={20}/> Upper Room Focus</h2>
              <div className="space-y-4">
                <textarea placeholder="Chat Topic" value={settings.chat_topic} onChange={(e) => setSettings({...settings, chat_topic: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none text-sm h-20 resize-none font-medium text-slate-700" />
                <button onClick={() => updateSetting('chat_topic', settings.chat_topic)} className="w-full bg-indigo-900 text-white py-3 rounded-xl font-bold text-xs uppercase">Set Room Topic</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-xl border border-white/5 h-full">
              <div className="flex items-center gap-2 mb-6 text-orange-400">
                <Sparkles size={20} />
                <h2 className="text-xl font-black uppercase tracking-tighter italic">Release the Oracle</h2>
              </div>
              <div className="space-y-4">
                <textarea placeholder="Type charge here..." value={newCharge} onChange={(e) => setNewCharge(e.target.value)} className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 outline-none font-serif italic text-lg resize-none" />
                
                <div className="relative">
                   <Calendar size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500" />
                   <input type="date" value={chargeDate} onChange={(e) => setChargeDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none text-white text-sm" />
                </div>

                <div className="relative">
                   <LinkIcon size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500" />
                   <input placeholder="Link (Optional)" value={newLink} onChange={(e) => setNewLink(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none text-sm font-medium text-white" />
                </div>
                <button onClick={postOracleCharge} disabled={isPostingCharge || !newCharge.trim()} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
                  {isPostingCharge ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Release Charge</>}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden max-h-[850px]">
             <div className="flex border-b border-slate-50 bg-slate-50/50 p-1 overflow-x-auto">
               <button onClick={() => setActiveTab('prayers')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prayers' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><MessageSquare size={14} /></button>
               <button onClick={() => setActiveTab('archives')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'archives' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}><History size={14} /></button>
               <button onClick={() => setActiveTab('media')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'media' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Video size={14} /></button>
               <button onClick={() => setActiveTab('podcasts')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'podcasts' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}><Headset size={14} /></button>
               <button onClick={() => setActiveTab('users')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Users size={14} /></button>
               <button onClick={() => setActiveTab('music')} className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'music' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Music size={14} /></button>
             </div>

             <div className="overflow-y-auto p-4 space-y-2 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
               {isLoading ? (
                 <div className="p-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" /> Syncing...</div>
               ) : (
                 <>
                   {activeTab === 'prayers' && prayers.map((p) => (
                     <div key={p.id} className="p-4 hover:bg-slate-50 rounded-2xl flex justify-between items-start border border-transparent hover:border-slate-100 transition-all group">
                       <div className="flex-1 pr-4">
                         <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{p.author_name}</p>
                         <p className="text-xs text-slate-600 italic line-clamp-2">"{p.content}"</p>
                       </div>
                       <button onClick={() => deleteItem('prayers', p.id)} className="text-slate-200 group-hover:text-rose-600 p-2 transition-colors"><Trash2 size={16}/></button>
                     </div>
                   ))}

                   {activeTab === 'archives' && archives.map((a) => (
                     <div key={a.id} className="p-4 hover:bg-orange-50/50 rounded-2xl flex justify-between items-start border border-transparent hover:border-orange-100 transition-all group">
                       <div className="flex-1 pr-4">
                         <p className="text-[9px] font-black text-orange-500 uppercase mb-1 tracking-widest">{new Date(a.created_at).toLocaleDateString()}</p>
                         <p className="text-xs text-slate-800 italic line-clamp-2 font-medium">"{a.content}"</p>
                       </div>
                       <div className="flex gap-1">
                            <button onClick={() => handleEditArchive(a)} className="text-slate-200 group-hover:text-orange-500 p-2 transition-colors"><Edit2 size={16}/></button>
                            <button onClick={() => deleteItem('announcements', a.id)} className="text-slate-200 group-hover:text-rose-600 p-2 transition-colors"><Trash2 size={16}/></button>
                       </div>
                     </div>
                   ))}

                   {activeTab === 'media' && mediaList.map((m) => (
                     <div key={m.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100 transition-all hover:shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-indigo-500 shadow-md"><Video size={16}/></div>
                            <p className="text-xs font-bold truncate max-w-[150px]">{m.title}</p>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => handleEditItem(m, 'video')} className="text-slate-300 hover:text-indigo-600 p-2 transition-colors"><Edit2 size={16}/></button>
                            <button onClick={() => deleteItem('media', m.id)} className="text-slate-300 hover:text-rose-600 p-2 transition-colors"><Trash2 size={16}/></button>
                        </div>
                     </div>
                   ))}

                   {activeTab === 'podcasts' && podcastList.map((p) => (
                     <div key={p.id} className="p-4 bg-white rounded-2xl flex justify-between items-center border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <img src={p.image_url} className="w-10 h-10 rounded-lg object-cover border border-slate-50" alt="" />
                            <div className="min-w-0"><p className="text-xs font-bold truncate tracking-tight">{p.title}</p><p className="text-[10px] text-indigo-500 uppercase font-black">By {p.author}</p></div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => handleEditItem(p, 'podcast')} className="text-slate-300 hover:text-orange-600 p-2 transition-colors"><Edit2 size={16}/></button>
                            <button onClick={() => deleteItem('podcasts', p.id)} className="text-slate-300 hover:text-rose-600 p-2 transition-colors"><Trash2 size={16}/></button>
                        </div>
                     </div>
                   ))}

{/* --- MUSIC TAB (ARTIST FIELD RESTORED) --- */}
                   {activeTab === 'music' && (
                     <div className="space-y-4">
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 text-center">
                          <input type="text" placeholder="Song Title" className="w-full mb-2 p-2 text-xs rounded border border-slate-200 outline-none" value={musicTitle} onChange={e => setMusicTitle(e.target.value)} />
                          {/* Artist Name Input Field */}
                          <input type="text" placeholder="Minister/Artist Name" className="w-full mb-3 p-2 text-xs rounded border border-slate-200 outline-none" value={musicArtist} onChange={e => setMusicArtist(e.target.value)} />
                          <input type="file" accept="audio/*" onChange={e => setMusicFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-400 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700" />
                          <button onClick={handleMusicUpload} disabled={isUploadingMusic} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all">
                             {isUploadingMusic ? <Loader2 size={14} className="animate-spin"/> : <><UploadCloud size={14}/> Upload Track</>}
                          </button>
                        </div>
                        {musicList.map((m) => (
                          <div key={m.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-slate-50 transition-all">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Music size={14}/></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">{m.title}</p>
                                    {/* Display Artist Name in List */}
                                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{m.artist || 'The Forge'}</p>
                                </div>
                             </div>
                             <button onClick={() => deleteItem('music_tracks', m.id)} className="text-slate-200 group-hover:text-rose-500 p-2 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        ))}
                     </div>
                   )}

                  {/* USER TAB */}
                   {activeTab === 'users' && filteredUsers.map((u) => (
                     <div key={u.id} className={`p-4 rounded-2xl flex justify-between items-center border transition-all ${u.is_blocked ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                       <div className="flex-1 pr-4"><p className="text-xs font-bold">{u.full_name || 'Puritan'}</p><p className="text-[9px] text-slate-500">{u.email}</p></div>
                       <div className="flex gap-1">
                         <button onClick={() => toggleUserBlock(u.id, u.is_blocked)} className={`p-2 ${u.is_blocked ? 'text-emerald-500' : 'text-slate-300'}`}>{u.is_blocked ? <CheckCircle size={16}/> : <Ban size={16}/>}</button>
                         <button onClick={() => hardDeleteUser(u.id)} className="text-slate-300 hover:text-rose-600 p-2 transition-colors"><Trash2 size={16}/></button>
                       </div>
                     </div>
                   ))}
                 </>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* --- ARCHIVE EDIT MODAL (FOR EDITING CHARGE, AUTHOR, AND DATE) --- */}
      {isEditingArchive && editingArchiveData && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase italic tracking-tighter">Refine Archive</h2>
                    <button onClick={() => setIsEditingArchive(false)}><X size={24}/></button>
                </div>
                <div className="p-8 space-y-4">
                    <textarea className="w-full h-32 bg-slate-50 p-6 rounded-2xl border border-slate-100 outline-none font-serif italic text-lg" value={editingArchiveData.content} onChange={(e) => setEditingArchiveData({...editingArchiveData, content: e.target.value})} />
                    
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Author</label>
                        <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-bold" value={editingArchiveData.author} onChange={(e) => setEditingArchiveData({...editingArchiveData, author: e.target.value})} placeholder="Author Name" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Archive Date</label>
                        <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none font-bold" value={editingArchiveData.created_at} onChange={(e) => setEditingArchiveData({...editingArchiveData, created_at: e.target.value})} />
                    </div>

                    <input className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none" placeholder="Link (Optional)" value={editingArchiveData.link || ''} onChange={(e) => setEditingArchiveData({...editingArchiveData, link: e.target.value})} />
                    
                    <button onClick={updateArchiveCharge} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase shadow-lg hover:bg-orange-500 transition-all">Save Changes</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}