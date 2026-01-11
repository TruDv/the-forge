"use client"

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, Send, MessageCircle, Users, Loader2, Sparkles, Smile, 
  Mic, Square, Trash2, Play, Pause, MoreVertical, Edit2, Check,
  CornerUpLeft, Flame, Mail, Globe, Quote, Search, UserPlus
} from 'lucide-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';

type RoomType = 'general' | 'fasting' | 'private';

export default function UpperRoom({ user, profileName, isFullPage = false }: { user: any, profileName: string, isFullPage?: boolean }) {
  // --- CORE STATE ---
  const [unreadSenders, setUnreadSenders] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(isFullPage || false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [roomTopic, setRoomTopic] = useState("Encourage one another daily.");
  
  // --- ROOM & DM STATE ---
  const [currentRoom, setCurrentRoom] = useState<RoomType>('general');
  const [fastingPreaching, setFastingPreaching] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasNewDM, setHasNewDM] = useState(false);

  // --- UI INTERACTION STATE ---
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // --- AUDIO STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); 

  // --- MOBILE KEYBOARD & VIEWPORT LOGIC ---
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        // If viewport height drops significantly, keyboard is likely up
        const isCurrentlyKeyboardUp = window.visualViewport.height < window.innerHeight * 0.85;
        setIsKeyboardOpen(isCurrentlyKeyboardUp);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
      handleVisualViewportResize();
    }

    // Lock body scroll when open on mobile
    if (window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
    }

    return () => {
      window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Initial Sound Setup
  useEffect(() => {
    const backupSent = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";
    const backupRec = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";
    sendAudioRef.current = new Audio(backupSent);
    receiveAudioRef.current = new Audio(backupRec);
  }, []);

  const playSound = (type: 'send' | 'receive') => {
    const audio = type === 'send' ? sendAudioRef.current : receiveAudioRef.current;
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  };

  // --- DATA FETCHING & REALTIME ---
  useEffect(() => {
    if (!isOpen) return;

    const loadContent = async () => {
      const { data: topicData } = await supabase.from('site_settings').select('value').eq('id', 'chat_topic').single();
      if (topicData?.value) setRoomTopic(topicData.value);

      const startDate = new Date('2026-01-08T00:00:00'); 
      const today = new Date();
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        setFastingPreaching("Preparation: Sanitize your heart. The fast begins soon.");
      } else {
        const currentDay = Math.min(21, diffDays);
        const { data: dayData } = await supabase.from('fasting_days').select('scripture').eq('day_number', currentDay).single();
        if (dayData?.scripture) setFastingPreaching(dayData.scripture);
        else setFastingPreaching("Wait on the Lord, and He shall strengthen thine heart.");
      }
    };
    loadContent();

    const fetchMessages = async () => {
      let query = supabase.from('messages').select(`*, reply_to:reply_to_id(content, author_name, type)`).order('created_at', { ascending: false }).limit(50);
      
      if (currentRoom === 'private') {
        if (!selectedRecipient) { setMessages([]); return; }
        query = query.eq('room_category', 'private')
                     .or(`and(user_id.eq.${user.id},receiver_id.eq.${selectedRecipient.id}),and(user_id.eq.${selectedRecipient.id},receiver_id.eq.${user.id})`);
        setUnreadSenders(prev => prev.filter(id => id !== selectedRecipient.id));
      } else {
        query = query.eq('room_category', currentRoom);
      }

      const { data } = await query;
      if (data) setMessages(data.reverse());
    };
    fetchMessages();

    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').order('full_name', { ascending: true });
      if (data) setAllUsers(data.filter(u => u.id !== user.id));
    };
    fetchUsers();

    const channel = supabase.channel(`room-listener-${currentRoom}-${selectedRecipient?.id || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.room_category === currentRoom) {
                const isDM = currentRoom === 'private';
                const isRelevant = !isDM || (
                  (payload.new.user_id === user.id && payload.new.receiver_id === selectedRecipient?.id) ||
                  (payload.new.user_id === selectedRecipient?.id && payload.new.receiver_id === user.id)
                );

                if (isRelevant) {
                  const { data: newMsg } = await supabase.from('messages').select('*, reply_to:reply_to_id(content, author_name, type)').eq('id', payload.new.id).single();
                  if (newMsg) {
                    setMessages((current) => [...current, newMsg]);
                    if (newMsg.user_id !== user.id) playSound('receive');
                  }
                }
            }
          }
          if (payload.eventType === 'DELETE') setMessages((current) => current.filter(msg => msg.id !== payload.old.id));
          if (payload.eventType === 'UPDATE') setMessages((current) => current.map(msg => msg.id === payload.new.id ? { ...msg, ...payload.new } : msg));
      }).subscribe();

    const dmNotifier = supabase.channel('dm-pulse')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, (payload) => {
        if (payload.new.room_category === 'private' && (currentRoom !== 'private' || selectedRecipient?.id !== payload.new.user_id)) {
          setHasNewDM(true);
          setUnreadSenders(prev => [...new Set([...prev, payload.new.user_id])]);
          playSound('receive');
        }
      }).subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      supabase.removeChannel(dmNotifier);
    };
  }, [isOpen, user.id, currentRoom, selectedRecipient]);

  useEffect(() => {
    if (!editingId) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, editingId, replyingTo]);

  // --- ACTIONS ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;
    
    setIsSending(true);
    const text = newMessage;
    const parentId = replyingTo ? replyingTo.id : null;
    setNewMessage('');
    setReplyingTo(null);

    const { error } = await supabase.from('messages').insert([{
      content: text, 
      type: currentRoom === 'private' ? 'private' : 'text', 
      user_id: user.id, 
      author_name: profileName || 'Puritan',
      reply_to_id: parentId,
      room_category: currentRoom,
      receiver_id: currentRoom === 'private' ? selectedRecipient.id : null
    }]);

    if (!error) playSound('send');
    setIsSending(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { alert("Mic access denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const fileName = `${user.id}_${Date.now()}.webm`;
        await supabase.storage.from('chat-media').upload(fileName, audioBlob);
        const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
        await supabase.from('messages').insert([{ 
          content: 'Voice Note', type: 'audio', media_url: publicUrl, 
          user_id: user.id, author_name: profileName || 'Puritan', 
          room_category: currentRoom, receiver_id: selectedRecipient?.id 
        }]);
        playSound('send');
      };
    }
  };

  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@\w+(?:\s\w+)?)/g); 
    return parts.map((part, i) => part.startsWith('@') ? <span key={i} className="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">{part}</span> : part);
  };

  const filteredDirectory = allUsers.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      {!isOpen && !isFullPage && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95">
          <MessageCircle size={28} fill="currentColor" />
          {hasNewDM && <span className="absolute -top-1 -right-1 flex h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
        </button>
      )}

      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />

          {/* MAIN CONTAINER */}
          <div className={`
            fixed z-50 bg-white flex flex-col shadow-2xl transition-all duration-300 ease-out
            /* Mobile Logic: Snap between header and footer, or fill screen if typing */
            left-0 right-0 top-[60px] ${isKeyboardOpen ? 'bottom-0' : 'bottom-[80px]'}
            /* Desktop Logic: Floating Box */
            md:left-auto md:right-6 md:top-auto md:bottom-24 md:w-[400px] md:h-[650px] md:rounded-2xl md:border md:border-slate-200
            overflow-hidden
          `}>
            
            {/* 1. TABS (Top) */}
            <div className="shrink-0 bg-slate-950 p-2">
               <div className="flex bg-white/5 p-1 rounded-xl gap-1">
                  <button onClick={() => {setCurrentRoom('general'); setSelectedRecipient(null);}} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentRoom === 'general' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                    <Globe size={14} /> Fellowship
                  </button>
                  <button onClick={() => {setCurrentRoom('fasting'); setSelectedRecipient(null);}} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentRoom === 'fasting' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                    <Flame size={14} /> Altar
                  </button>
                  <button onClick={() => setCurrentRoom('private')} className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentRoom === 'private' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                    <Mail size={14} /> DMs
                    {hasNewDM && <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />}
                  </button>
               </div>
            </div>

            {/* 2. SUB-HEADER */}
            <div className="bg-slate-900 p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                {currentRoom === 'private' && selectedRecipient && (
                  <button onClick={() => setSelectedRecipient(null)} className="text-white bg-white/10 p-1 rounded-lg"><X size={14}/></button>
                )}
                <h3 className="text-white font-black italic uppercase text-[11px] truncate tracking-wider">
                   {currentRoom === 'private' && selectedRecipient ? (
                    <span className="text-emerald-400">Chatting with {selectedRecipient.full_name}</span>
                  ) : (
                    <>{currentRoom === 'general' ? 'The Upper Room' : currentRoom === 'fasting' ? 'Fasting Altar' : 'Private Sanctuary'}</>
                  )}
                </h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>

            {/* 3. MESSAGE AREA */}
            <div className="flex-1 relative flex flex-col min-h-0 bg-slate-50 overflow-hidden">
              
              {/* DM Directory Overlay */}
              {currentRoom === 'private' && !selectedRecipient && (
                <div className="absolute inset-0 bg-white z-20 flex flex-col">
                  <div className="p-4 border-b bg-slate-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input type="text" placeholder="Find a brother..." className="w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {filteredDirectory.map(u => (
                      <button key={u.id} onClick={() => setSelectedRecipient(u)} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 active:bg-slate-100 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500">{u.full_name[0]}</div>
                          <span className="font-bold text-slate-700">{u.full_name}</span>
                        </div>
                        <UserPlus size={18} className="text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fasting Scripture Header */}
              {currentRoom === 'fasting' && fastingPreaching && (
                <div className="bg-orange-50 p-3 shrink-0 border-b border-orange-100 flex items-start gap-3">
                  <Quote size={16} className="text-orange-300 mt-1 shrink-0" />
                  <p className="text-[12px] text-orange-900 font-serif italic leading-snug">{fastingPreaching}</p>
                </div>
              )}

              {/* Main Scrollable Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" onClick={() => setActiveMenuId(null)}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                    <MessageCircle size={40} className="mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Peace be unto you</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.user_id === user.id;
                    return (
                      <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1`}>
                        <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black uppercase text-white shrink-0 ${isMe ? 'bg-indigo-500' : 'bg-slate-400'}`}>{msg.author_name?.charAt(0)}</div>
                          <div className={`relative rounded-2xl text-sm shadow-sm p-3 ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}>
                            {!isMe && <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{msg.author_name}</p>}
                            {msg.reply_to && (
                              <div className={`mb-2 p-2 rounded-lg text-[10px] border-l-2 ${isMe ? 'bg-indigo-700/50 border-indigo-300 text-indigo-100' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                                <p className="font-bold opacity-80 line-clamp-1">{msg.reply_to.content}</p>
                              </div>
                            )}
                            {msg.type === 'audio' ? <audio controls src={msg.media_url} className="h-8 w-44" /> : <p className="whitespace-pre-wrap leading-snug">{renderTextWithMentions(msg.content)}</p>}
                            <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === msg.id ? null : msg.id); }} className={`absolute top-1 ${isMe ? '-left-6' : '-right-6'} text-slate-300`}><MoreVertical size={14} /></button>
                            
                            {activeMenuId === msg.id && (
                              <div className={`absolute top-6 z-50 bg-white shadow-xl rounded-xl border w-32 flex flex-col overflow-hidden ${isMe ? 'left-0' : 'right-0'}`}>
                                <button onClick={() => {setReplyingTo(msg); setActiveMenuId(null);}} className="text-left px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-50 flex items-center gap-2"><CornerUpLeft size={12} /> Reply</button>
                                {isMe && <button onClick={async () => { if(window.confirm("Delete?")) await supabase.from('messages').delete().eq('id', msg.id); }} className="text-left px-3 py-2 text-[11px] text-rose-600 hover:bg-rose-50 flex items-center gap-2"><Trash2 size={12} /> Delete</button>}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[8px] text-slate-400 mt-1 mx-9 font-bold uppercase">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 4. INPUT AREA */}
            <div className="shrink-0 p-4 bg-white border-t border-slate-100 relative z-30">
              {replyingTo && (
                <div className="flex items-center justify-between bg-slate-50 border rounded-t-xl px-3 py-1.5 mb-2">
                  <span className="text-[10px] text-slate-500 italic">Replying to <b>{replyingTo.author_name}</b></span>
                  <button onClick={() => setReplyingTo(null)} className="text-slate-400"><X size={12}/></button>
                </div>
              )}

              {isRecording ? (
                <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-2 animate-pulse">
                   <div className="text-red-600 font-bold text-xs flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"/> Recording 00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setIsRecording(false)} className="p-2 text-slate-400"><Trash2 size={18}/></button>
                      <button onClick={stopRecording} className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase shadow-lg">Done</button>
                   </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 rounded-xl border bg-slate-50 text-slate-400 h-11"><Smile size={22} /></button>
                  <textarea 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    placeholder="Speak to the brethren..."
                    className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold outline-none resize-none max-h-32"
                    rows={1}
                    onFocus={() => { if(window.innerWidth < 768) setIsKeyboardOpen(true); }}
                  />
                  {newMessage.trim() ? (
                    <button type="submit" disabled={isSending} className={`p-3 rounded-2xl text-white h-11 transition-all active:scale-90 ${currentRoom === 'fasting' ? 'bg-orange-600' : currentRoom === 'private' ? 'bg-emerald-600' : 'bg-indigo-600'} shadow-lg`}>
                      {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  ) : (
                    <button type="button" onClick={startRecording} className="bg-orange-500 text-white p-3 rounded-2xl h-11 shadow-lg shadow-orange-100 active:scale-90 transition-all"><Mic size={22} /></button>
                  )}
                </form>
              )}

              {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 z-[100] shadow-2xl rounded-2xl border bg-white">
                  <EmojiPicker onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} emojiStyle={EmojiStyle.NATIVE} width={300} height={350} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </>
  );
}