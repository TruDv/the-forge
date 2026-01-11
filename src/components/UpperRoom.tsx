"use client"

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, Send, MessageCircle, Users, Loader2, Sparkles, Smile, 
  Mic, Square, Trash2, Play, Pause, MoreVertical, Edit2, Check,
  CornerUpLeft, Flame, Mail, Globe, Quote, Search, UserPlus, MessageSquare
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

  // --- VIEWPORT STABILITY ---
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        const height = window.visualViewport.height;
        const isKeyboard = height < window.innerHeight * 0.85;
        setIsKeyboardOpen(isKeyboard);
        if (isKeyboard) window.scrollTo(0, 0);
      }
    };
    window.visualViewport?.addEventListener('resize', handleVisualViewportResize);
    document.body.style.overflow = 'hidden';
    return () => {
      window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Initial Sound Setup
  useEffect(() => {
    sendAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    receiveAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
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
      const diffDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const currentDay = Math.max(1, Math.min(21, diffDays));
      const { data: dayData } = await supabase.from('fasting_days').select('scripture').eq('day_number', currentDay).single();
      setFastingPreaching(dayData?.scripture || "Wait on the Lord, and He shall strengthen thine heart.");
    };
    loadContent();

    const fetchMessages = async () => {
      let query = supabase.from('messages').select(`*, reply_to:reply_to_id(content, author_name, type)`).order('created_at', { ascending: false }).limit(50);
      
      if (currentRoom === 'private') {
        if (!selectedRecipient) { setMessages([]); return; }
        query = query.eq('room_category', 'private')
                     .or(`and(user_id.eq.${user.id},receiver_id.eq.${selectedRecipient.id}),and(user_id.eq.${selectedRecipient.id},receiver_id.eq.${user.id})`);
        setUnreadSenders(prev => prev.filter(id => id !== selectedRecipient.id));
        if (unreadSenders.length <= 1) setHasNewDM(false);
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

    const channel = supabase.channel(`room-listener-${currentRoom}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
          if (payload.eventType === 'INSERT') {
            const isDM = payload.new.room_category === 'private';
            const isForMe = payload.new.receiver_id === user.id;

            // Global Notification Logic
            if (isDM && isForMe && (currentRoom !== 'private' || selectedRecipient?.id !== payload.new.user_id)) {
                setHasNewDM(true);
                setUnreadSenders(prev => Array.from(new Set([...prev, payload.new.user_id])));
                playSound('receive');
            }

            if (payload.new.room_category === currentRoom) {
                const isRelevant = currentRoom !== 'private' || (
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

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, user.id, currentRoom, selectedRecipient]);

  useEffect(() => {
    if (!editingId) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, editingId, replyingTo]);

  // --- HELPER: Get Active DM Conversations ---
  const [activeConversations, setActiveConversations] = useState<any[]>([]);
  useEffect(() => {
    const fetchActiveDMs = async () => {
      const { data } = await supabase
        .from('messages')
        .select('user_id, receiver_id')
        .eq('room_category', 'private')
        .or(`user_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      if (data) {
        const userIds = new Set();
        data.forEach(m => {
          if (m.user_id !== user.id) userIds.add(m.user_id);
          if (m.receiver_id !== user.id) userIds.add(m.receiver_id);
        });
        setActiveConversations(allUsers.filter(u => userIds.has(u.id)));
      }
    };
    if (currentRoom === 'private') fetchActiveDMs();
  }, [currentRoom, messages, allUsers, user.id]);

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
      receiver_id: currentRoom === 'private' ? selectedRecipient?.id : null
    }]);

    if (!error) playSound('send');
    setIsSending(false);
  };

  const deleteMessage = async (msgId: string) => {
    if(!window.confirm("Delete this message?")) return;
    setActiveMenuId(null);
    await supabase.from('messages').delete().eq('id', msgId);
  };

  const saveEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    await supabase.from('messages').update({ content: editText }).eq('id', msgId);
    setEditingId(null);
  };

  const startPrivateChat = (otherUser: any) => {
    setSelectedRecipient(otherUser);
    setCurrentRoom('private');
    setActiveMenuId(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    const lastWord = val.split(/[\s\n]+/).pop(); 
    if (lastWord && lastWord.startsWith('@')) { setMentionQuery(lastWord.slice(1)); setShowMentionList(true); } 
    else { setShowMentionList(false); }
  };

  const insertMention = (name: string) => {
    const words = newMessage.split(/([\s\n]+)/); 
    words[words.length - 1] = `@${name} `; 
    setNewMessage(words.join(''));
    setShowMentionList(false);
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
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (err) { alert("Mic access denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
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

  const filteredUsers = allUsers.filter(u => u.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()));

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110">
          <MessageCircle size={28} fill="currentColor" />
          {hasNewDM && <span className="absolute -top-1 -right-1 flex h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
        </button>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />

          <div className={`
            fixed z-50 bg-white flex flex-col shadow-2xl transition-all duration-300 ease-out
            left-0 right-0 top-[60px] ${isKeyboardOpen ? 'bottom-0' : 'bottom-[80px]'}
            md:left-auto md:right-6 md:top-auto md:bottom-24 md:w-[420px] md:h-[70vh] md:max-h-[750px] md:rounded-3xl md:border md:border-slate-200
            overflow-hidden
          `}>
            
            {/* 1. TABS */}
            <div className="shrink-0 bg-slate-950 p-2">
               <div className="flex bg-white/5 p-1 rounded-2xl gap-1">
                  <button onClick={() => {setCurrentRoom('general'); setSelectedRecipient(null);}} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentRoom === 'general' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                    <Globe size={14} /> Fellowship
                  </button>
                  <button onClick={() => {setCurrentRoom('fasting'); setSelectedRecipient(null);}} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentRoom === 'fasting' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                    <Flame size={14} /> Altar
                  </button>
                  <button onClick={() => setCurrentRoom('private')} className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentRoom === 'private' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                    <Mail size={14} /> DMs
                    {hasNewDM && <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse border border-white" />}
                  </button>
               </div>
            </div>

            {/* 2. HEADER */}
            <div className={`px-5 py-3 flex items-center justify-between border-b border-white/5 shrink-0 transition-colors ${currentRoom === 'fasting' ? 'bg-orange-950' : currentRoom === 'private' ? 'bg-emerald-950' : 'bg-slate-900'}`}>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">The Forge</span>
                <h3 className="text-white font-serif italic text-sm">
                  {currentRoom === 'private' && selectedRecipient ? (
                    <span className="flex items-center gap-2">
                      <button onClick={() => setSelectedRecipient(null)} className="p-1 bg-white/10 rounded-md"><X size={10}/></button>
                      {selectedRecipient.full_name}
                    </span>
                  ) : (
                    currentRoom === 'general' ? 'The Upper Room' : currentRoom === 'fasting' ? 'Sacred Altar' : 'Sanctuary'
                  )}
                </h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white p-1"><X size={24}/></button>
            </div>

            {/* 3. CONTENT AREA */}
            <div className="flex-1 relative flex flex-col min-h-0 bg-[#f8f9fa] overflow-hidden">
              
              {/* Existing Conversations for DMs */}
              {currentRoom === 'private' && !selectedRecipient && (
                <div className="absolute inset-0 bg-white z-20 flex flex-col p-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MessageSquare size={12} /> Recent Conversations
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                    {activeConversations.length > 0 ? (
                      activeConversations.map(u => (
                        <button key={u.id} onClick={() => setSelectedRecipient(u)} className="relative w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-500 transition-all font-bold text-slate-700 shadow-sm">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">{u.full_name[0]}</div>
                          {u.full_name}
                          {unreadSenders.includes(u.id) && <span className="ml-auto h-3 w-3 bg-red-500 rounded-full animate-pulse" />}
                        </button>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                          <Mail size={32} />
                        </div>
                        <p className="text-slate-400 font-serif italic">No private messages yet. Use the menu on a message to start a conversation.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar" onClick={() => setActiveMenuId(null)}>
                {currentRoom === 'fasting' && (
                  <div className="bg-orange-50 border-y border-orange-100 p-6 mb-6 -mx-4 text-center">
                    <Quote size={20} className="mx-auto text-orange-200 mb-3" />
                    <p className="font-serif italic text-orange-900 leading-relaxed text-[15px]">{fastingPreaching}</p>
                  </div>
                )}

                {messages.map((msg, i) => {
                    const isMe = msg.user_id === user.id;
                    const isEditing = editingId === msg.id;
                    return (
                      <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-1`}>
                        <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${isMe ? 'bg-indigo-600' : 'bg-slate-300'}`}>{msg.author_name?.[0]}</div>
                          <div className={`relative p-3.5 rounded-2xl shadow-sm text-[15px] ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                            {!isMe && <p className="text-[10px] font-black uppercase text-indigo-500 mb-1 tracking-tighter">{msg.author_name}</p>}
                            
                            {msg.reply_to && (
                              <div className={`mb-2 p-2 rounded text-[11px] border-l-2 ${isMe ? 'bg-indigo-700/50 border-indigo-300 text-indigo-100' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                                <p className="font-bold">{msg.reply_to.author_name}</p>
                                <p className="line-clamp-1 opacity-80 italic">{msg.reply_to.content}</p>
                              </div>
                            )}

                            {isEditing ? (
                               <textarea value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={() => saveEdit(msg.id)} className="w-full text-slate-900 font-bold bg-white rounded p-1 text-[16px] outline-none" autoFocus />
                            ) : (
                               msg.type === 'audio' ? <audio controls src={msg.media_url} className="h-8 w-44" /> : <p className="leading-relaxed whitespace-pre-wrap">{renderTextWithMentions(msg.content)}</p>
                            )}
                            
                            <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === msg.id ? null : msg.id); }} className={`absolute top-1 ${isMe ? '-left-6' : '-right-6'} text-slate-300`}><MoreVertical size={14} /></button>
                            
                            {activeMenuId === msg.id && (
                              <div className={`absolute top-6 z-50 bg-white shadow-xl rounded-xl border border-slate-100 w-36 flex flex-col overflow-hidden ${isMe ? 'left-0' : 'right-0'}`}>
                                <button onClick={() => {setReplyingTo(msg); setActiveMenuId(null);}} className="text-left px-3 py-2.5 text-[11px] text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-bold border-b border-slate-50"><CornerUpLeft size={12} /> Reply</button>
                                {!isMe && (
                                  <button onClick={() => startPrivateChat({id: msg.user_id, full_name: msg.author_name})} className="text-left px-3 py-2.5 text-[11px] text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 font-bold border-b border-slate-50">
                                    <Mail size={12} /> Message
                                  </button>
                                )}
                                {isMe && <button onClick={() => {setEditingId(msg.id); setEditText(msg.content); setActiveMenuId(null);}} className="text-left px-3 py-2.5 text-[11px] text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-bold border-b border-slate-50"><Edit2 size={12} /> Edit</button>}
                                {isMe && <button onClick={() => deleteMessage(msg.id)} className="text-left px-3 py-2.5 text-[11px] text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold"><Trash2 size={12} /> Delete</button>}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[8px] text-slate-400 mt-1 mx-9 font-bold uppercase tracking-tight">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 4. INPUT AREA */}
            <div className="shrink-0 p-4 bg-white border-t border-slate-100 relative z-30">
              {showMentionList && filteredUsers.length > 0 && (
                <div className="absolute bottom-full left-4 mb-2 bg-white shadow-2xl rounded-2xl border w-64 max-h-48 overflow-y-auto z-50 overflow-x-hidden">
                  {filteredUsers.map(u => (
                    <button key={u.id} onClick={() => insertMention(u.full_name)} className="w-full text-left px-4 py-3 text-[16px] hover:bg-indigo-50 font-bold border-b border-slate-50 last:border-0 text-slate-700">{u.full_name}</button>
                  ))}
                </div>
              )}

              {replyingTo && (
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-t-xl mb-2 text-[11px] font-bold text-slate-500 px-4 border-x border-t border-slate-100">
                  <span>Replying to {replyingTo.author_name}</span>
                  <button onClick={() => setReplyingTo(null)}><X size={12}/></button>
                </div>
              )}

              {isRecording ? (
                <div className="flex items-center justify-between bg-rose-50 border border-rose-100 rounded-2xl px-5 py-3 animate-pulse">
                   <div className="text-rose-600 font-black text-xs flex items-center gap-2 uppercase tracking-widest">
                      <div className="w-2 h-2 bg-rose-600 rounded-full animate-ping"/> REC 00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setIsRecording(false)} className="p-2 text-slate-400"><Trash2 size={20}/></button>
                      <button onClick={stopRecording} className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Finish</button>
                   </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 h-12 w-12 flex items-center justify-center shrink-0"><Smile size={24} /></button>
                  <textarea 
                    value={newMessage} 
                    onChange={handleTextChange} 
                    placeholder="Write to the Forge..."
                    className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-4 text-[16px] text-slate-900 font-bold outline-none resize-none max-h-32"
                    rows={1}
                    onFocus={() => { if(window.innerWidth < 768) setIsKeyboardOpen(true); }}
                  />
                  {newMessage.trim() ? (
                    <button type="submit" disabled={isSending} className={`p-3 rounded-2xl text-white h-12 w-12 flex items-center justify-center shrink-0 transition-all active:scale-90 ${currentRoom === 'fasting' ? 'bg-orange-600' : currentRoom === 'private' ? 'bg-emerald-600' : 'bg-indigo-600'} shadow-xl`}>
                      {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={22} />}
                    </button>
                  ) : (
                    <button type="button" onClick={startRecording} className="bg-orange-500 text-white p-3 rounded-2xl h-12 w-12 flex items-center justify-center shrink-0 shadow-lg active:scale-90"><Mic size={24} /></button>
                  )}
                </form>
              )}

              {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-3 z-[100] shadow-2xl rounded-3xl overflow-hidden border border-slate-100 bg-white">
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        textarea { font-size: 16px !important; }
      `}} />
    </>
  );
}