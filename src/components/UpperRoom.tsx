"use client"

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, Send, MessageCircle, Users, Loader2, Sparkles, Smile, 
  Mic, Square, Trash2, Play, Pause, MoreVertical, Edit2, Check 
} from 'lucide-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';

export default function UpperRoom({ user, profileName }: { user: any, profileName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [roomTopic, setRoomTopic] = useState("Encourage one another daily.");
  
  // --- EDITING STATE ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // --- VOICE NOTE STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // --- AUDIO SETUP ---
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Audio Init
    const sentUrl = "/sounds/sent.mp3"; 
    const receivedUrl = "/sounds/received.mp3"; 
    const backupSent = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";
    const backupRec = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";

    sendAudioRef.current = new Audio(sentUrl);
    receiveAudioRef.current = new Audio(receivedUrl);
    sendAudioRef.current.onerror = () => { if(sendAudioRef.current) sendAudioRef.current.src = backupSent; };
    receiveAudioRef.current.onerror = () => { if(receiveAudioRef.current) receiveAudioRef.current.src = backupRec; };
    if(sendAudioRef.current) sendAudioRef.current.volume = 0.5;
    if(receiveAudioRef.current) receiveAudioRef.current.volume = 0.5;
  }, []);

  const playSound = (type: 'send' | 'receive') => {
    const audio = type === 'send' ? sendAudioRef.current : receiveAudioRef.current;
    if (audio) {
      audio.currentTime = 0; 
      audio.play().catch(() => {});
    }
  };

  // 1. Fetch & Subscribe
  useEffect(() => {
    if (!isOpen) return;

    const fetchTopic = async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('id', 'chat_topic').single();
      if (data?.value) setRoomTopic(data.value);
    };
    fetchTopic();

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };
    fetchMessages();

    // Realtime Listener
    const channel = supabase
      .channel('upper_room_chat')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((current) => [...current, payload.new]);
            if (payload.new.user_id !== user.id) playSound('receive');
          }
          if (payload.eventType === 'DELETE') {
             setMessages((current) => current.filter(msg => msg.id !== payload.old.id));
          }
          if (payload.eventType === 'UPDATE') {
             setMessages((current) => current.map(msg => msg.id === payload.new.id ? payload.new : msg));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, user.id]);

  useEffect(() => {
    if (!editingId) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, editingId]);

  // --- ACTIONS ---

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    setIsSending(true);
    setShowEmojiPicker(false);
    const text = newMessage;
    setNewMessage('');
    playSound('send');

    const { error } = await supabase.from('messages').insert([{
      content: text, type: 'text', user_id: user.id, author_name: profileName || 'Puritan'
    }]);

    if (error) { console.error(error); setNewMessage(text); }
    setIsSending(false);
  };

  const deleteMessage = async (msgId: string) => {
    if(!confirm("Delete this message?")) return;
    setActiveMenuId(null);
    await supabase.from('messages').delete().eq('id', msgId);
  };

  const startEditing = (msg: any) => {
    setEditingId(msg.id);
    setEditText(msg.content);
    setActiveMenuId(null);
  };

  const saveEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    await supabase.from('messages').update({ content: editText }).eq('id', msgId);
    setEditingId(null);
  };

  // --- RECORDING FUNCTIONS ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 30) { stopRecording(); return 30; }
          return prev + 1;
        });
      }, 1000);
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
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
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
    if (!dbError) playSound('send');
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

          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center justify-between shrink-0">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" onClick={() => setActiveMenuId(null)}>
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
                            ? 'bg-indigo-600 text-white rounded-br-none pl-8 pr-4 py-3' // Added pl-8 for menu space
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none p-3'
                          }`}
                        >
                          
                          {!isMe && <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{msg.author_name}</p>}
                          
                          {/* EDITING vs VIEW */}
                          {isEditing ? (
                             <div className="flex flex-col gap-2 min-w-[200px]">
                                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full text-slate-800 bg-white rounded p-2 text-xs outline-none focus:ring-2 ring-orange-500" rows={2}/>
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
                                     <audio controls src={msg.media_url} className="h-8 w-48 rounded-lg" />
                                  </div>
                               ) : (
                                  msg.content
                               )}
                             </>
                          )}

                          {/* Options Menu (Three Dots) - VISIBLE ON MOBILE */}
                          {isMe && !isEditing && (
                            <div className="absolute top-2 left-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === msg.id ? null : msg.id); }}
                                className="p-1 hover:bg-black/20 rounded-full text-white/60 hover:text-white transition-colors"
                              >
                                <MoreVertical size={14} />
                              </button>
                              
                              {/* Dropdown */}
                              {activeMenuId === msg.id && (
                                <div className="absolute top-6 left-0 bg-white shadow-xl rounded-xl overflow-hidden border border-slate-100 z-50 w-24 flex flex-col animate-in fade-in zoom-in duration-200">
                                  {msg.type === 'text' && (
                                    <button onClick={() => startEditing(msg)} className="text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2">
                                      <Edit2 size={10} /> Edit
                                    </button>
                                  )}
                                  <button onClick={() => deleteMessage(msg.id)} className="text-left px-3 py-2 text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 border-t border-slate-50">
                                    <Trash2 size={10} /> Delete
                                  </button>
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
            <div className="p-4 bg-white border-t border-slate-100 shrink-0 relative">
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
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-500 transition-colors"><Smile size={20} /></button>
                  <input type="text" placeholder="Speak to the brethren..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onFocus={() => setShowEmojiPicker(false)}/>
                  {newMessage.trim() ? (
                    <button disabled={isSending} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg">{isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}</button>
                  ) : (
                    <button type="button" onClick={startRecording} className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 transition-all shadow-lg"><Mic size={20} /></button>
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