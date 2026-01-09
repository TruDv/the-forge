"use client"

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, Send, MessageCircle, Users, Loader2, Sparkles, Smile, 
  Mic, Square, Trash2, Play, Pause, MoreVertical, Edit2, Check,
  CornerUpLeft
} from 'lucide-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';

export default function UpperRoom({ user, profileName }: { user: any, profileName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [roomTopic, setRoomTopic] = useState("Encourage one another daily.");
  
  // --- MENTION STATE ---
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  
  // --- REPLY & EDIT STATE ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // --- VOICE NOTE STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); 

  // Body Scroll Lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Audio Init
  useEffect(() => {
    const sentUrl = "/sounds/sent.mp3"; 
    const receivedUrl = "/sounds/received.mp3"; 
    sendAudioRef.current = new Audio(sentUrl);
    receiveAudioRef.current = new Audio(receivedUrl);
    
    const backupSent = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";
    const backupRec = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";
    sendAudioRef.current.onerror = () => { if(sendAudioRef.current) sendAudioRef.current.src = backupSent; };
    receiveAudioRef.current.onerror = () => { if(receiveAudioRef.current) receiveAudioRef.current.src = backupRec; };
  }, []);

  const playSound = (type: 'send' | 'receive') => {
    const audio = type === 'send' ? sendAudioRef.current : receiveAudioRef.current;
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  };

  // 1. Fetch Data
  useEffect(() => {
    if (!isOpen) return;

    const fetchTopic = async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('id', 'chat_topic').single();
      if (data?.value) setRoomTopic(data.value);
    };
    fetchTopic();

    // Fetch Messages (CORRECTED LOGIC: Newest First)
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, reply_to:reply_to_id(content, author_name, type)`)
        .order('created_at', { ascending: false }) // Get newest 50
        .limit(50);
      
      if (error) console.error("Fetch Error:", error);
      if (data) setMessages(data.reverse()); // Flip to display correctly
    };
    fetchMessages();

    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name').order('full_name', { ascending: true });
      if (data) setAllUsers(data);
    };
    fetchUsers();

    const channel = supabase
      .channel('upper_room_chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newMsg } = await supabase.from('messages').select('*, reply_to:reply_to_id(content, author_name, type)').eq('id', payload.new.id).single();
            if (newMsg) {
              setMessages((current) => [...current, newMsg]);
              if (newMsg.user_id !== user.id) playSound('receive');
            }
          }
          if (payload.eventType === 'DELETE') {
             setMessages((current) => current.filter(msg => msg.id !== payload.old.id));
          }
          if (payload.eventType === 'UPDATE') {
             setMessages((current) => current.map(msg => msg.id === payload.new.id ? { ...msg, ...payload.new } : msg));
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, user.id]);

  useEffect(() => {
    if (!editingId) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, editingId, replyingTo]);

  // --- ACTIONS ---

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    setIsSending(true);
    setShowEmojiPicker(false);
    setShowMentionList(false);
    
    const text = newMessage;
    const parentId = replyingTo ? replyingTo.id : null;
    
    setNewMessage('');
    if(textareaRef.current) textareaRef.current.style.height = 'auto'; 
    setReplyingTo(null);

    // --- INSERT WITH DEBUGGING ---
    const { error } = await supabase.from('messages').insert([{
      content: text, 
      type: 'text', 
      user_id: user.id, 
      author_name: profileName || 'Puritan',
      reply_to_id: parentId
    }]);

    if (error) { 
      console.error("Supabase Write Error:", error);
      alert(`Message Failed!\nError: ${error.message}`);
      setNewMessage(text); 
      setIsSending(false);
      return;
    }

    playSound('send');
    setIsSending(false);

    // Notification API
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        author_name: profileName || 'Puritan',
        exclude_id: user.id
      })
    });
  };

  // --- UPDATED DELETE FUNCTION ---
  const deleteMessage = async (msgId: string) => {
    // 1. Confirm
    if(!window.confirm("Are you sure you want to delete this message?")) return;
    
    setActiveMenuId(null);

    // 2. Delete from DB
    const { error } = await supabase.from('messages').delete().eq('id', msgId);

    // 3. Handle Error or Success
    if (error) {
       console.error("Delete Error:", error);
       alert("Delete Failed: " + error.message);
    } else {
       // Optimistic update
       setMessages((current) => current.filter(msg => msg.id !== msgId));
    }
  };

  const startEditing = (msg: any) => { setEditingId(msg.id); setEditText(msg.content); setActiveMenuId(null); };
  const saveEdit = async (msgId: string) => { if (!editText.trim()) return; await supabase.from('messages').update({ content: editText }).eq('id', msgId); setEditingId(null); };
  const handleReply = (msg: any) => { setReplyingTo(msg); setActiveMenuId(null); };

  // --- MENTION LOGIC ---
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;

    const lastWord = val.split(/[\s\n]+/).pop(); 
    if (lastWord && lastWord.startsWith('@')) {
      setMentionQuery(lastWord.slice(1)); 
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  const insertMention = (name: string) => {
    const words = newMessage.split(/([\s\n]+)/); 
    const lastWordIndex = words.length - 1;
    words[lastWordIndex] = `@${name} `; 
    setNewMessage(words.join(''));
    setShowMentionList(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const filteredUsers = allUsers.filter(u => u.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile = window.innerWidth < 768;
    if (e.key === 'Enter') {
      if (e.shiftKey) return;
      if (!isMobile) { e.preventDefault(); handleSendMessage(); }
    }
  };

  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@\w+(?:\s\w+)?)/g); 
    return parts.map((part, i) => part.startsWith('@') ? <span key={i} className="text-indigo-200 font-bold bg-indigo-900/10 rounded px-0.5">{part}</span> : part);
  };

  // --- RECORDING FUNCTIONS ---
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
      timerRef.current = setInterval(() => { setRecordingTime((prev) => { if (prev >= 30) { stopRecording(); return 30; } return prev + 1; }); }, 1000);
    } catch (err) { alert("Could not access microphone."); console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAndSendAudio(audioBlob);
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); }
    setIsRecording(false); setRecordingTime(0); if (timerRef.current) clearInterval(timerRef.current);
  };

  const uploadAndSendAudio = async (audioBlob: Blob) => {
    setIsSending(true);
    const fileName = `${user.id}_${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(fileName, audioBlob);
    if (uploadError) { setIsSending(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
    const { error: dbError } = await supabase.from('messages').insert([{
      content: 'Voice Note', type: 'audio', media_url: publicUrl, user_id: user.id, author_name: profileName || 'Puritan'
    }]);
    if (dbError) { alert("Audio Save Error: " + dbError.message); }
    else { playSound('send'); }
    setIsSending(false);
  };

  const onEmojiClick = (emojiData: any) => { setNewMessage((prev) => prev + emojiData.emoji); };

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-105 transition-all group animate-in zoom-in duration-300">
          <MessageCircle size={28} fill="currentColor" className="group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-md h-[100dvh] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center justify-between shrink-0 pt-safe">
              <div>
                <h3 className="text-white font-black italic uppercase text-lg tracking-tight flex items-center gap-2"><Sparkles size={16} className="text-orange-500"/> The Upper Room</h3>
                <p className="text-slate-400 text-xs font-medium flex items-center gap-1"><Users size={10} /> Fellowship of the Burning Hearts</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-2"><X size={24} /></button>
            </div>

            {/* Topic */}
            <div className="bg-orange-50 border-b border-orange-100 p-3 flex gap-2 items-start shrink-0">
               <span className="bg-orange-200 text-orange-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase mt-0.5 flex-shrink-0">Focus</span>
               <p className="text-xs text-orange-900 font-medium italic">"{roomTopic}"</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 overscroll-contain" onClick={() => setActiveMenuId(null)}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50"><MessageCircle size={48} className="mb-2" /><p className="text-sm font-bold uppercase">Room is Quiet</p><p className="text-xs">Be the first to speak.</p></div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.user_id === user.id;
                  const isEditing = editingId === msg.id;

                  return (
                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                      <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        {/* Avatar */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black uppercase text-white shrink-0 ${isMe ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                          {msg.author_name?.charAt(0)}
                        </div>
                        
                        {/* MESSAGE BUBBLE */}
                        <div className={`relative rounded-2xl text-sm leading-relaxed shadow-sm transition-all 
                          ${isMe 
                            ? 'bg-indigo-600 text-white rounded-br-none pl-8 pr-4 py-3' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none pr-8 pl-4 py-3'
                          }`}
                        >
                          {!isMe && <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{msg.author_name}</p>}
                          
                          {msg.reply_to && (
                            <div className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${isMe ? 'bg-indigo-700/50 border-indigo-300 text-indigo-100' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                              <p className="font-bold text-[10px] mb-0.5">{msg.reply_to.author_name}</p>
                              <p className="line-clamp-1 italic opacity-80">{msg.reply_to.type === 'audio' ? '🎵 Voice Note' : msg.reply_to.content}</p>
                            </div>
                          )}

                          {isEditing ? (
                             <div className="flex flex-col gap-2 min-w-[200px]">
                                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full text-slate-800 bg-white rounded p-2 text-base md:text-sm outline-none focus:ring-2 ring-orange-500" rows={2}/>
                                <div className="flex justify-end gap-2">
                                   <button onClick={() => setEditingId(null)} className="text-xs text-slate-300 hover:text-white">Cancel</button>
                                   <button onClick={() => saveEdit(msg.id)} className="bg-white text-indigo-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Check size={12}/> Save</button>
                                </div>
                             </div>
                          ) : (
                             <>
                               {msg.type === 'audio' ? (
                                  <div className="flex items-center gap-2 min-w-[150px]">
                                     <div className={`p-2 rounded-full ${isMe ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}><Play size={14} fill="currentColor" /></div>
                                     <audio controls src={msg.media_url || undefined} className="h-8 w-48 rounded-lg" />
                                  </div>
                               ) : (
                                  <p className="whitespace-pre-wrap">{renderTextWithMentions(msg.content)}</p>
                               )}
                             </>
                          )}

                          {!isEditing && (
                            <div className={`absolute top-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity
                              ${isMe ? 'left-2' : 'right-2'}`}
                            >
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === msg.id ? null : msg.id); }}
                                className={`p-1 hover:bg-black/20 rounded-full transition-colors ${isMe ? 'text-white/60 hover:text-white' : 'text-slate-300 hover:text-indigo-500'}`}
                              >
                                <MoreVertical size={14} />
                              </button>
                              
                              {activeMenuId === msg.id && (
                                <div className={`absolute top-6 bg-white shadow-xl rounded-xl overflow-hidden border border-slate-100 z-50 w-28 flex flex-col animate-in fade-in zoom-in duration-200
                                  ${isMe ? 'left-0' : 'right-0'}`}
                                >
                                  <button onClick={() => handleReply(msg)} className="text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2">
                                    <CornerUpLeft size={10} /> Reply
                                  </button>
                                  {isMe && msg.type === 'text' && (
                                    <button onClick={() => startEditing(msg)} className="text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 border-t border-slate-50">
                                      <Edit2 size={10} /> Edit
                                    </button>
                                  )}
                                  {isMe && (
                                    <button onClick={() => deleteMessage(msg.id)} className="text-left px-3 py-2 text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 border-t border-slate-50">
                                      <Trash2 size={10} /> Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 mx-9">
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0 relative pb-safe">
              
              {/* --- MENTION POPUP --- */}
              {showMentionList && filteredUsers.length > 0 && (
                <div className="absolute bottom-20 left-4 bg-white shadow-2xl rounded-2xl border border-slate-200 z-50 w-64 max-h-48 overflow-y-auto animate-in slide-in-from-bottom-2">
                  <div className="p-2 bg-indigo-50 border-b border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    Mentioning...
                  </div>
                  {filteredUsers.map((u) => (
                    <button 
                      key={u.id}
                      onClick={() => insertMention(u.full_name)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {u.full_name.charAt(0)}
                      </div>
                      <span className="truncate">{u.full_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* REPLY INDICATOR */}
              {replyingTo && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-t-xl px-4 py-2 mb-2 -mt-2 mx-1 border-b-0 animate-in slide-in-from-bottom-2">
                  <div className="text-xs text-slate-500">
                    Replying to <span className="font-bold text-indigo-600">{replyingTo.author_name}</span>
                    <p className="line-clamp-1 italic opacity-70 text-[10px]">{replyingTo.type === 'audio' ? 'Voice Note' : replyingTo.content}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-rose-500"><X size={14}/></button>
                </div>
              )}

              {showEmojiPicker && !isRecording && (
                <div className="absolute bottom-20 left-4 z-10 shadow-2xl rounded-2xl border border-slate-200">
                  <EmojiPicker onEmojiClick={onEmojiClick} emojiStyle={EmojiStyle.NATIVE} width={300} height={400} />
                </div>
              )}

              {isRecording ? (
                <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-pulse">
                   <div className="flex items-center gap-3 text-red-600 font-bold text-sm"><div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />Recording... 00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}</div>
                   <div className="flex gap-2">
                      <button onClick={cancelRecording} className="p-2 bg-white text-slate-400 rounded-lg hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                      <button onClick={stopRecording} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-xs font-black uppercase"><Square size={12} fill="currentColor"/> Done</button>
                   </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-500 transition-colors h-11"><Smile size={20} /></button>
                  
                  <textarea 
                    ref={textareaRef}
                    placeholder="Speak to the brethren..." 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base md:text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none max-h-32"
                    rows={1}
                    value={newMessage}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowEmojiPicker(false)}
                  />
                  
                  {newMessage.trim() ? (
                    <button disabled={isSending} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg h-11">{isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}</button>
                  ) : (
                    <button type="button" onClick={startRecording} className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 transition-all shadow-lg h-11"><Mic size={20} /></button>
                  )}
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}