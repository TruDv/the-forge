"use client"

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, Send, MessageCircle, Users, Loader2, Sparkles, Smile, 
  Mic, Trash2, Play, MoreVertical, Edit2, Check,
  CornerUpLeft, Flame, Mail, Globe, Quote, Search, UserPlus
} from 'lucide-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';

type RoomType = 'general' | 'fasting' | 'private';

export default function UpperRoom({ user, profileName, isFullPage = false }: { user: any, profileName: string, isFullPage?: boolean }) {
  const [unreadSenders, setUnreadSenders] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(isFullPage || false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [roomTopic, setRoomTopic] = useState("Encourage one another daily.");
  const [currentRoom, setCurrentRoom] = useState<RoomType>('general');
  const [fastingPreaching, setFastingPreaching] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasNewDM, setHasNewDM] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    const backupSent = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";
    const backupRec = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";
    sendAudioRef.current = new Audio(backupSent);
    receiveAudioRef.current = new Audio(backupRec);

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

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
                    if (newMsg.user_id !== user.id) {
                      receiveAudioRef.current?.play().catch(() => {});
                    }
                  }
                }
            }
          }
          if (payload.eventType === 'DELETE') setMessages((current) => current.filter(msg => msg.id !== payload.old.id));
          if (payload.eventType === 'UPDATE') setMessages((current) => current.map(msg => msg.id === payload.new.id ? { ...msg, ...payload.new } : msg));
      }).subscribe();

    const dmNotifier = supabase.channel('dm-pulse-permanent')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const isPrivate = payload.new.room_category === 'private';
        const isForMe = payload.new.receiver_id === user.id;
        const notLookingAtThisChat = currentRoom !== 'private' || selectedRecipient?.id !== payload.new.user_id;

        if (isPrivate && isForMe && notLookingAtThisChat) {
          setHasNewDM(true);
          setUnreadSenders(prev => [...new Set([...prev, payload.new.user_id])]);
          receiveAudioRef.current?.play().catch(() => {});
        }
      }).subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      supabase.removeChannel(dmNotifier);
    };
  }, [isOpen, user.id, currentRoom, selectedRecipient]);

  useEffect(() => {
    if (currentRoom === 'private' && unreadSenders.length === 0) setHasNewDM(false);
  }, [currentRoom, unreadSenders]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user) return;
    if (currentRoom === 'private' && !selectedRecipient) return;
    
    setIsSending(true);
    const text = newMessage;
    const parentId = replyingTo ? replyingTo.id : null;
    setNewMessage('');
    setReplyingTo(null);
    if(textareaRef.current) textareaRef.current.style.height = 'auto'; 

    const { error } = await supabase.from('messages').insert([{
      content: text, 
      type: currentRoom === 'private' ? 'private' : 'text', 
      user_id: user.id, 
      author_name: profileName || 'Puritan',
      reply_to_id: parentId,
      room_category: currentRoom,
      receiver_id: currentRoom === 'private' ? selectedRecipient.id : null
    }]);

    if (!error) sendAudioRef.current?.play().catch(() => {});
    setIsSending(false);
  };

  const handleStartPrivateChat = (authorId: string, authorName: string) => {
    if (authorId === user.id) return; 
    setActiveMenuId(null);
    const targetUser = allUsers.find(u => u.id === authorId);
    setCurrentRoom('private');
    if (targetUser) setSelectedRecipient(targetUser);
    else setSelectedRecipient({ id: authorId, full_name: authorName });
  };

  const deleteMessage = async (msgId: string) => {
    if(!window.confirm("Delete this message?")) return;
    setActiveMenuId(null);
    const { error } = await supabase.from('messages').delete().eq('id', msgId);
    if (!error) setMessages((current) => current.filter(msg => msg.id !== msgId));
  };

  const startEditing = (msg: any) => { setEditingId(msg.id); setEditText(msg.content); setActiveMenuId(null); };
  const saveEdit = async (msgId: string) => { if (!editText.trim()) return; await supabase.from('messages').update({ content: editText }).eq('id', msgId); setEditingId(null); };
  const handleReply = (msg: any) => { setReplyingTo(msg); setActiveMenuId(null); };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    const lastWord = val.split(/[\s\n]+/).pop(); 
    if (lastWord && lastWord.startsWith('@')) { setMentionQuery(lastWord.slice(1)); setShowMentionList(true); } 
    else setShowMentionList(false);
  };

  const insertMention = (name: string) => {
    const words = newMessage.split(/([\s\n]+)/); 
    words[words.length - 1] = `@${name} `; 
    setNewMessage(words.join(''));
    setShowMentionList(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) { 
      e.preventDefault(); 
      handleSendMessage(); 
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
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
          room_category: currentRoom, 
          receiver_id: currentRoom === 'private' ? selectedRecipient?.id : null 
        }]);
        sendAudioRef.current?.play().catch(() => {});
      };
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setIsRecording(false); setRecordingTime(0); if (timerRef.current) clearInterval(timerRef.current);
  };

  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@\w+(?:\s\w+)?)/g); 
    return parts.map((part, i) => part.startsWith('@') ? <span key={i} className="text-indigo-600 font-bold bg-indigo-50 rounded px-0.5">{part}</span> : part);
  };

  const filteredUsers = allUsers.filter(u => u.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()));
  const filteredDirectory = allUsers.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      {!isOpen && !isFullPage && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="fixed bottom-20 right-6 z-[40] bg-indigo-600 text-white p-4 rounded-full shadow-2xl transition-all group hover:scale-110 active:scale-95"
        >
          <MessageCircle size={28} fill="currentColor" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" 
            onClick={() => setIsOpen(false)} 
          />

          {/* Bottom Sheet */}
          <div 
            className={`
              absolute bottom-0 left-0 right-0 z-[101] 
              max-h-[90vh] h-fit bg-white rounded-t-3xl shadow-2xl
              flex flex-col pointer-events-auto
              transition-transform duration-300 ease-out
              ${isOpen ? 'translate-y-0' : 'translate-y-full'}
            `}
          >
            {/* Drag handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3" />

            {/* Tabs */}
            <div className="shrink-0 bg-slate-950 px-2 pt-[env(safe-area-inset-top,8px)] z-50">
              <div className="flex bg-white/5 p-1 rounded-xl gap-1">
                <button onClick={() => {setCurrentRoom('general'); setSelectedRecipient(null);}} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentRoom === 'general' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                  <Globe size={14} /> Fellowship
                </button>
                <button onClick={() => {setCurrentRoom('fasting'); setSelectedRecipient(null);}} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentRoom === 'fasting' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                  <Flame size={14} /> Altar
                </button>
                <button onClick={() => setCurrentRoom('private')} className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentRoom === 'private' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                  <Mail size={14} /> DMs
                  {hasNewDM && currentRoom !== 'private' && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Sub Header */}
            <div className="shrink-0 bg-slate-900 p-4 flex items-center justify-between border-b border-white/5 z-50">
              <div className="flex items-center gap-3">
                {currentRoom === 'private' && selectedRecipient && (
                  <button onClick={() => setSelectedRecipient(null)} className="text-white bg-white/10 p-1.5 rounded-lg"><X size={14}/></button>
                )}
                <h3 className="text-white font-black italic uppercase text-xs flex items-center gap-2">
                  {currentRoom === 'private' && selectedRecipient ? (
                    <span className="flex items-center gap-2 text-emerald-400">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[8px] flex items-center justify-center font-black">{selectedRecipient.full_name.charAt(0)}</div>
                      {selectedRecipient.full_name}
                    </span>
                  ) : (
                    <>{currentRoom === 'general' ? <Sparkles size={14} className="text-indigo-400"/> : <Flame size={14} className="text-orange-500"/>} {currentRoom === 'general' ? 'The Upper Room' : currentRoom === 'fasting' ? 'Fasting Altar' : 'Sanctuary'}</>
                  )}
                </h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white active:scale-90 transition-transform"><X size={26}/></button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0">
              {currentRoom === 'private' && !selectedRecipient && (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input type="text" placeholder="Find a brother..." className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-[16px] focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 font-semibold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {unreadSenders.length > 0 && !searchTerm && (
                      <div className="mb-4">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">New Messages</p>
                        {allUsers.filter(u => unreadSenders.includes(u.id)).map(u => (
                          <button key={u.id} onClick={() => { setSelectedRecipient(u); setUnreadSenders(p => p.filter(id => id !== u.id)); }} className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mb-2 text-left animate-pulse">
                            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black">{u.full_name.charAt(0)}</div><div><span className="font-bold text-emerald-900 block text-sm">{u.full_name}</span><span className="text-[10px] text-emerald-600 font-bold uppercase">Tap to read</span></div></div>
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">The Brethren</p>
                    {filteredDirectory.filter(u => !unreadSenders.includes(u.id)).map(u => (
                      <button key={u.id} onClick={() => setSelectedRecipient(u)} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-emerald-50 transition-all group active:bg-slate-100">
                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">{u.full_name.charAt(0)}</div><span className="font-bold text-slate-700">{u.full_name}</span></div>
                        <UserPlus size={18} className="text-slate-300 group-hover:text-emerald-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentRoom === 'fasting' && fastingPreaching && (
                <div className="bg-orange-50 border-b border-orange-100 p-4 shrink-0 relative overflow-hidden group">
                  <Quote className="absolute top-2 right-2 opacity-5 text-orange-900" size={40} />
                  <span className="bg-orange-200 text-orange-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase mb-1 inline-block tracking-widest">Today's Charge</span>
                  <p className="text-xs text-orange-900 font-serif italic leading-relaxed line-clamp-2">"{fastingPreaching}"</p>
                </div>
              )}

              <div className="p-4 space-y-4" onClick={() => setActiveMenuId(null)}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                    <MessageCircle size={48} className="mb-2" />
                    <p className="text-sm font-bold uppercase tracking-widest">Room is Quiet</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.user_id === user.id;
                    const isEditing = editingId === msg.id;
                    return (
                      <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-1`}>
                        <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black uppercase text-white shrink-0 ${isMe ? 'bg-indigo-500' : 'bg-slate-400'}`}>{msg.author_name?.charAt(0)}</div>
                          <div className={`relative rounded-2xl text-sm shadow-sm transition-all ${isMe ? 'bg-indigo-600 text-white rounded-br-none pl-8 pr-4 py-3' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none pr-8 pl-4 py-3'}`}>
                            {!isMe && <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{msg.author_name}</p>}
                            
                            {msg.reply_to && (
                              <div className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${isMe ? 'bg-indigo-700/50 border-indigo-300 text-indigo-100' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                                <p className="font-bold text-[10px] mb-0.5">{msg.reply_to.author_name}</p>
                                <p className="line-clamp-1 italic opacity-80">{msg.reply_to.type === 'audio' ? '🎵 Voice Note' : msg.reply_to.content}</p>
                              </div>
                            )}

                            {isEditing ? (
                              <div className="flex flex-col gap-2 min-w-[200px]">
                                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full text-slate-900 font-bold bg-white rounded p-2 text-[16px] outline-none ring-2 ring-orange-500" rows={2}/>
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingId(null)} className="text-xs text-slate-400">Cancel</button>
                                  <button onClick={() => saveEdit(msg.id)} className="bg-white text-indigo-600 px-2 py-1 rounded text-xs font-bold border shadow-sm"><Check size={12}/> Save</button>
                                </div>
                              </div>
                            ) : (
                              msg.type === 'audio' ? (
                                <div className="flex items-center gap-2 min-w-[150px] py-1">
                                  <div className={`p-2 rounded-full ${isMe ? 'bg-indigo-500' : 'bg-slate-100'}`}><Play size={14} fill="currentColor" /></div>
                                  <audio controls src={msg.media_url} className="h-8 w-44" />
                                </div>
                              ) : <p className="whitespace-pre-wrap">{renderTextWithMentions(msg.content)}</p>
                            )}

                            {!isEditing && (
                              <div className={`absolute top-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ${isMe ? 'left-2' : 'right-2'}`}>
                                <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === msg.id ? null : msg.id); }} className={`p-1 hover:bg-black/20 rounded-full transition-colors ${isMe ? 'text-white/60 hover:text-white' : 'text-slate-300 hover:text-indigo-500'}`}><MoreVertical size={14} /></button>
                                {activeMenuId === msg.id && (
                                  <div className={`absolute top-6 bg-white shadow-xl rounded-xl border border-slate-100 z-50 w-36 flex flex-col animate-in fade-in zoom-in duration-200 ${isMe ? 'left-0' : 'right-0'}`}>
                                    <button onClick={() => handleReply(msg)} className="text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"><CornerUpLeft size={10} /> Reply</button>
                                    {!isMe && (
                                      <button onClick={() => handleStartPrivateChat(msg.user_id, msg.author_name)} className="text-left px-3 py-2 text-xs text-slate-600 hover:bg-emerald-50 flex items-center gap-2 border-t border-slate-50"><Mail size={10} /> Message Privately</button>
                                    )}
                                    {isMe && msg.type === 'text' && (<button onClick={() => startEditing(msg)} className="text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-50"><Edit2 size={10} /> Edit</button>)}
                                    {isMe && (<button onClick={() => deleteMessage(msg.id)} className="text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-50"><Trash2 size={10} /> Delete</button>)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 mx-9">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="shrink-0 bg-white border-t sticky bottom-0 z-50 pb-[env(safe-area-inset-bottom,16px)] pt-2 px-4">
              {showMentionList && filteredUsers.length > 0 && (
                <div className="absolute bottom-full left-4 mb-2 bg-white shadow-2xl rounded-2xl border z-[120] w-64 max-h-48 overflow-y-auto">
                  <div className="p-2 bg-indigo-50 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Mentioning...</div>
                  {filteredUsers.map(u => (
                    <button key={u.id} onClick={() => insertMention(u.full_name)} className="w-full text-left px-4 py-3 text-[16px] hover:bg-slate-50 flex items-center gap-2 border-b last:border-0 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{u.full_name.charAt(0)}</div>
                      <span className="text-slate-900 font-bold">{u.full_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {replyingTo && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-t-xl px-4 py-2 mb-2 animate-in slide-in-from-bottom-2">
                  <div className="text-xs text-slate-500">Replying to <span className="font-bold text-indigo-600">{replyingTo.author_name}</span></div>
                  <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={14}/></button>
                </div>
              )}

              {isRecording ? (
                <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-pulse">
                  <div className="text-red-600 font-bold text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"/>Recording... 00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={cancelRecording} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                    <button onClick={stopRecording} className="p-2 bg-red-600 text-white rounded-lg text-xs font-black uppercase shadow-lg active:scale-95 transition-all">Done</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 rounded-xl border bg-slate-50 text-slate-400 h-11 hover:text-indigo-500 transition-colors"><Smile size={22} /></button>
                  <textarea 
                    ref={textareaRef} 
                    value={newMessage} 
                    onChange={handleTextChange} 
                    onKeyDown={handleKeyDown}
                    placeholder="Speak to the brethren..." 
                    className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-[16px] text-slate-900 font-bold outline-none resize-none min-h-[44px] max-h-32 placeholder:text-slate-400 leading-tight" 
                    rows={1}
                  />
                  {newMessage.trim() ? (
                    <button type="submit" disabled={isSending} className={`p-3 rounded-2xl text-white h-11 flex items-center justify-center transition-all active:scale-90 ${currentRoom === 'fasting' ? 'bg-orange-600 shadow-orange-100' : currentRoom === 'private' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-indigo-600 shadow-indigo-100'} shadow-lg`}>
                      {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  ) : (
                    <button type="button" onClick={startRecording} className="bg-orange-500 text-white p-3 rounded-2xl h-11 shadow-lg active:scale-90 transition-all flex items-center justify-center"><Mic size={22} /></button>
                  )}
                </form>
              )}

              {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 z-[100] shadow-2xl rounded-2xl border border-slate-200 overflow-hidden bg-white">
                  <EmojiPicker onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} emojiStyle={EmojiStyle.NATIVE} width={300} height={350} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}