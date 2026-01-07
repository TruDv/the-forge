"use client"

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Send, MessageCircle, Users, Loader2, Sparkles, Smile } from 'lucide-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';

export default function UpperRoom({ user, profileName }: { user: any, profileName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [roomTopic, setRoomTopic] = useState("Encourage one another daily."); // <--- Dynamic Topic State
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // --- AUDIO SETUP ---
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ideally, put files in public/sounds/sent.mp3 and public/sounds/received.mp3
    // If you haven't downloaded them yet, these external links are more reliable:
    const sentUrl = "/sounds/sent.mp3"; 
    const receivedUrl = "/sounds/received.mp3"; 

    // Fallback logic
    const backupSent = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";
    const backupRec = "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";

    sendAudioRef.current = new Audio(sentUrl);
    receiveAudioRef.current = new Audio(receivedUrl);

    // Error handling
    sendAudioRef.current.onerror = () => { sendAudioRef.current = new Audio(backupSent); };
    receiveAudioRef.current.onerror = () => { receiveAudioRef.current = new Audio(backupRec); };

    // Volume
    if(sendAudioRef.current) sendAudioRef.current.volume = 0.5;
    if(receiveAudioRef.current) receiveAudioRef.current.volume = 0.5;
  }, []);

  // Helper to play sound safely
  const playSound = (type: 'send' | 'receive') => {
    const audio = type === 'send' ? sendAudioRef.current : receiveAudioRef.current;
    if (audio) {
      audio.currentTime = 0; 
      audio.play().catch(e => console.log("Audio play failed (Browser policy):", e));
    }
  };

  // 1. Fetch Topic & Messages & Subscribe
  useEffect(() => {
    if (!isOpen) return;

    // Fetch Topic
    const fetchTopic = async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('id', 'chat_topic').single();
      if (data?.value) setRoomTopic(data.value);
    };
    fetchTopic();

    // Fetch Messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };
    fetchMessages();

    // Realtime Subscription
    const channel = supabase
      .channel('upper_room_chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
          
          // PLAY SOUND ON RECEIVE (If it's not me)
          if (payload.new.user_id !== user.id) {
            playSound('receive');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user.id]);

  // 2. Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    setIsSending(true);
    setShowEmojiPicker(false);
    const text = newMessage;
    setNewMessage('');

    // PLAY SOUND ON SEND
    playSound('send');

    const { error } = await supabase.from('messages').insert([{
      content: text,
      user_id: user.id,
      author_name: profileName || 'Puritan'
    }]);

    if (error) {
      console.error(error);
      setNewMessage(text);
    }
    setIsSending(false);
  };

  const onEmojiClick = (emojiData: any) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  return (
    <>
      {/* --- FLOATING ACTION BUTTON --- */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-105 transition-all group animate-in zoom-in duration-300"
        >
          <MessageCircle size={28} fill="currentColor" className="group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </button>
      )}

      {/* --- SLIDE-OVER DRAWER --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-white font-black italic uppercase text-lg tracking-tight flex items-center gap-2">
                  <Sparkles size={16} className="text-orange-500"/> The Upper Room
                </h3>
                <p className="text-slate-400 text-xs font-medium flex items-center gap-1">
                  <Users size={10} /> Fellowship of the Burning Hearts
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            {/* Topic - Dynamic */}
            <div className="bg-orange-50 border-b border-orange-100 p-3 flex gap-2 items-start shrink-0">
               <span className="bg-orange-200 text-orange-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase mt-0.5 flex-shrink-0">Focus</span>
               <p className="text-xs text-orange-900 font-medium italic">"{roomTopic}"</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                   <MessageCircle size={48} className="mb-2" />
                   <p className="text-sm font-bold uppercase">Room is Quiet</p>
                   <p className="text-xs">Be the first to speak.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.user_id === user.id;
                  return (
                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black uppercase text-white shrink-0 ${isMe ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                          {msg.author_name?.charAt(0)}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}>
                          {!isMe && <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{msg.author_name}</p>}
                          {msg.content}
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
              
              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 z-10 shadow-2xl rounded-2xl border border-slate-200">
                  <EmojiPicker 
                    onEmojiClick={onEmojiClick} 
                    emojiStyle={EmojiStyle.NATIVE} 
                    width={300} 
                    height={400} 
                  />
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-3 rounded-xl border transition-colors ${showEmojiPicker ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-500'}`}
                >
                  <Smile size={20} />
                </button>

                <input 
                  type="text" 
                  placeholder="Speak to the brethren..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onFocus={() => setShowEmojiPicker(false)}
                />
                
                <button 
                  disabled={!newMessage.trim() || isSending}
                  className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200"
                >
                  {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
}