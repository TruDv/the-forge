"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Play, Heart, MessageCircle, Video, ChevronRight, 
  Flame, BookOpen, Plus, X, Send, Quote, Copy, Check,
  ArrowRight, Calendar, User as UserIcon, History, Mic, 
  Loader2, Search, Sparkles, Scroll
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UpperRoom from '@/components/UpperRoom';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // --- STATE MANAGEMENT ---
  const [announcement, setAnnouncement] = useState<any>(null);
  const [realPrayers, setRealPrayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [todayFocus, setTodayFocus] = useState<any>(null);
  const [fastDay, setFastDay] = useState<number>(1);
  const [latestVideo, setLatestVideo] = useState<any>(null); // <--- NEW STATE FOR VIDEO
  
  // Sidebar Victory Widget State
  const [latestTestimony, setLatestTestimony] = useState<any>(null);
  const [victoryComment, setVictoryComment] = useState('');
  const [isCommentingVictory, setIsCommentingVictory] = useState(false);

  // Journal State
  const [journalNote, setJournalNote] = useState('');
  const [pastLogs, setPastLogs] = useState<any[]>([]);
  
  // Modal States
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Prayer Request Modal
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false); // About / Manifesto Modal

  // Dynamic Settings (Podcast, Live Link, etc.)
  const [settings, setSettings] = useState({
    live_meet_link: '',
    live_topic: '',
    podcast_title: '',
    podcast_description: '',
    podcast_image: '',
    podcast_link: ''
  });

  // Prayer Interaction State
  const [replies, setReplies] = useState<{ [key: string]: any[] }>({});
  const [expandedPrayers, setExpandedPrayers] = useState<{ [key: string]: boolean }>({});
  const [replyText, setReplyText] = useState('');
  const [myPrayedIds, setMyPrayedIds] = useState<string[]>([]);
  const [newPrayer, setNewPrayer] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isCommenting, setIsCommenting] = useState<string | null>(null); 
  
  // Daily Manna State
  const [dailyVerse, setDailyVerse] = useState<{text: string, ref: string} | null>(null);
  const [copied, setCopied] = useState(false);

  // --- PASSWORD RESET LISTENER ---
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/auth/update-password');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // --- HELPERS (For Video Thumbnail) ---
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnail = (url: string) => {
    const id = getYoutubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800";
  };

  // --- DATA FETCHING FUNCTIONS ---

  const fetchAnnouncement = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) setAnnouncement(data);
  };

  // <--- NEW: FETCH LATEST VIDEO --->
  const fetchLatestVideo = async () => {
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('type', 'video')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setLatestVideo(data);
  };

  const fetchLatestPrayers = async () => {
    const { data: prayers } = await supabase
      .from('prayers')
      .select(`*, profiles:user_id (full_name, avatar_url)`)
      .order('created_at', { ascending: false })
      .limit(50); 

    if (prayers) {
      setRealPrayers(prayers);
      const prayerIds = prayers.map(p => p.id);
      const { data: replyData } = await supabase
        .from('prayer_replies')
        .select('*')
        .in('prayer_id', prayerIds)
        .order('created_at', { ascending: true });
      
      if (replyData) {
        const grouped = replyData.reduce((acc: any, reply) => {
          acc[reply.prayer_id] = [...(acc[reply.prayer_id] || []), reply];
          return acc;
        }, {});
        setReplies(grouped);
      }
    }
  };

  const fetchLatestTestimony = async () => {
    const { data } = await supabase
      .from('testimonies')
      .select('*, testimony_comments(count)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setLatestTestimony({
        ...data,
        comment_count: data.testimony_comments?.[0]?.count || 0
      });
    }
  };

  const fetchLogs = async (userId: string) => {
    const { data } = await supabase
      .from('fasting_logs')
      .select('*')
      .eq('user_id', userId)
      .order('day_number', { ascending: false });

    if (data) {
      setPastLogs(data);
      const today = data.find(l => l.day_number === fastDay);
      if (today) setJournalNote(today.notes);
    }
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

  const fetchBibleVerse = async () => {
    try {
      const dailyRefs = ["John+3:16", "Philippians+4:13", "Psalm+23:1", "Isaiah+41:10", "Romans+8:28", "Jeremiah+29:11"];
      const dayIndex = new Date().getDate() % dailyRefs.length;
      const res = await fetch(`https://bible-api.com/${dailyRefs[dayIndex]}`);
      const data = await res.json();
      setDailyVerse({ text: data.text, ref: data.reference });
    } catch (err) { console.error(err); }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles').select('full_name').eq('id', session.user.id).single();
        if (profile?.full_name) {
          setFirstName(profile.full_name.split(' ')[0]);
        }
      }
      setLoading(false);
    };

    checkUser();
    fetchLatestPrayers();
    fetchLatestTestimony();
    fetchLatestVideo(); // <--- Call here
    fetchBibleVerse();
    fetchSettings();
    fetchAnnouncement();
    
    const saved = localStorage.getItem('user_prayed_ids');
    if (saved) setMyPrayedIds(JSON.parse(saved));

    async function fetchFastData() {
      const startDate = new Date('2026-01-12T00:00:00');
      const today = new Date();
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const currentDay = Math.max(1, Math.min(21, diffDays));
      setFastDay(currentDay);

      const { data } = await supabase.from('fasting_days').select('*').eq('day_number', currentDay).single();
      if (data) setTodayFocus(data);
    }
    fetchFastData();
  }, []);

  useEffect(() => {
    if (user) fetchLogs(user.id);
  }, [user, fastDay]);

  // --- EVENT HANDLERS ---

  const handleVictoryComment = async () => {
    if (!victoryComment.trim() || !user || !latestTestimony) return;
    setIsCommentingVictory(true);
    const { error } = await supabase.from('testimony_comments').insert([{
      testimony_id: latestTestimony.id,
      user_id: user.id,
      content: victoryComment.trim(),
      author_name: firstName || 'Puritan'
    }]);

    if (!error) {
      setVictoryComment('');
      fetchLatestTestimony();
    }
    setIsCommentingVictory(false);
  };

  const handleSaveJournal = async () => {
    if (!user || !journalNote.trim()) return;
    setIsSavingJournal(true);
    const { error } = await supabase.from('fasting_logs').upsert({
      user_id: user.id,
      day_number: fastDay,
      notes: journalNote,
    }, { onConflict: 'user_id,day_number' });

    if (!error) {
      fetchLogs(user.id);
      setIsJournalModalOpen(false);
    }
    setIsSavingJournal(false);
  };

  const handlePostPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.trim() || !user) return;
    setIsPosting(true);
    const { error } = await supabase.from('prayers').insert([{ 
      content: newPrayer.trim(), 
      prayer_count: 0,
      user_id: user.id,
      author_name: firstName || 'Puritan' 
    }]);
    if (!error) { setNewPrayer(''); setIsModalOpen(false); fetchLatestPrayers(); }
    setIsPosting(false);
  };

  const handlePostReply = async (prayerId: string, text: string) => {
    if (!text.trim() || !user || isCommenting) return;
    setIsCommenting(prayerId);
    const { error } = await supabase.from('prayer_replies').insert([{
      prayer_id: prayerId,
      user_id: user.id,
      content: text.trim(),
      author_name: firstName || 'Puritan'
    }]);
    if (!error) {
      setReplyText('');
      await fetchLatestPrayers();
    }
    setIsCommenting(null);
  };

  const handlePraying = async (prayerId: string, currentCount: number) => {
    if (myPrayedIds.includes(prayerId)) return;
    const newCount = (currentCount || 0) + 1;
    const updatedIds = [...myPrayedIds, prayerId];
    setMyPrayedIds(updatedIds);
    localStorage.setItem('user_prayed_ids', JSON.stringify(updatedIds));
    setRealPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, prayer_count: newCount } : p));
    await supabase.from('prayers').update({ prayer_count: newCount }).eq('id', prayerId);
  };

  const handleCopyVerse = () => {
    if (!dailyVerse) return;
    navigator.clipboard.writeText(`"${dailyVerse.text}" - ${dailyVerse.ref}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPrayers = realPrayers.filter(p => {
    const content = p.content?.toLowerCase() || "";
    const name = (p.profiles?.full_name || p.author_name || "").toLowerCase();
    return content.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase());
  });

  // --- RENDER LOADING STATE ---
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-black italic">
      <Flame className="text-orange-500 animate-pulse mb-4" size={48} />
      FORGING...
    </div>
  );

  // --- RENDER LANDING PAGE (Unauthenticated) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white relative">
        <section className="relative h-screen flex items-center justify-center overflow-hidden px-6">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.15),transparent_70%)]" />
            <img src="https://imgur.com/57VGCG6.png" className="w-full h-full object-cover opacity-20 grayscale" alt="Forge" />
          </div>
          <div className="relative z-10 text-center max-w-4xl">
            <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter mb-6 leading-[0.8]">THE FORGE</h1>
            <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">A sacred space for <span className="text-white">Puritans</span> to be refined.</p>
            
            <div className="flex flex-col items-center gap-6">
              {/* PRIMARY ACTION: JOIN */}
              <Link href="/auth/signup" className="bg-white text-slate-950 px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105 shadow-xl shadow-orange-900/20">
                Join the Puritans <ArrowRight size={20} />
              </Link>

              {/* SECONDARY ACTION: ABOUT (Opens Modal) */}
              <button 
                onClick={() => setIsAboutModalOpen(true)}
                className="text-slate-400 hover:text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors border-b border-transparent hover:border-orange-500 pb-1"
              >
                <Scroll size={16} /> What is a Puritan?
              </button>
            </div>
          </div>
        </section>

        {/* --- ABOUT PURITANS MODAL (Populated from Document) --- */}
        {isAboutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
              onClick={() => setIsAboutModalOpen(false)}
            />
            
            {/* Modal Content */}
            <div className="bg-white text-slate-900 w-full max-w-3xl h-[85vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
              
              {/* Header */}
              <div className="bg-slate-900 p-8 flex justify-between items-start shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-orange-500">
                    <Flame size={20} fill="currentColor" />
                    <span className="font-black uppercase tracking-widest text-xs">The Manifesto</span>
                  </div>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Welcome to The Forge</h2>
                </div>
                <button onClick={() => setIsAboutModalOpen(false)} className="bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 scrollbar-thin scrollbar-thumb-slate-200">
                
                {/* Section 1: The Challenge */}
                <section>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-orange-500">01.</span> The Challenge of Faith
                  </h3>
                  <p className="text-slate-600 font-serif italic text-lg leading-relaxed border-l-4 border-orange-500 pl-4 mb-4">
                    "Today, the greatest challenge among the children of God is their failure to believe in His Word. This lack of faith reflects poorly on God, almost as if He were lying."
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    How long can you truly believe in God? For three hours, three days, or three months? The mindset of saying "If God wants to do it, He will do it" is not faith; it is blindness. Since our time on earth is limited, we need to learn how to number our days in order to please God.
                  </p>
                </section>

                <div className="h-px bg-slate-100 w-full" />

                {/* Section 2: Forged in Fire */}
                <section>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-orange-500">02.</span> Forged in Fire
                  </h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Just as Adam was not made for Eve, but Eve for Adam, the primary purpose of a believer is to live for Christ. We believe that furnaces must be heated red-hot before the songs of deliverance can be sung. There is no dawn of salvation until the evening has deepened into midnight gloom.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-900 mb-1">Jacob</p>
                      <p className="text-xs text-slate-600">Did not become Israel without wrestling through the night.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-900 mb-1">Peter</p>
                      <p className="text-xs text-slate-600">Did not become the rock until he sank in deep waters.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-900 mb-1">Joseph</p>
                      <p className="text-xs text-slate-600">Languished in a dark prison, seemingly forgotten, before his destiny unfolded.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-900 mb-1">David</p>
                      <p className="text-xs text-slate-600">Hunted like a partridge in the mountains before claiming his throne.</p>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-slate-100 w-full" />

                {/* Section 3: The Mandate */}
                <section>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-orange-500">03.</span> The Mandate
                  </h3>
                  <p className="text-slate-700 leading-relaxed mb-4">
                    We increasingly perceive that we stand at a crossroads where we must make a choice. On one side, the world lays out all its treasures before us. On the other, the call to lower ourselves to serve Him who detests lofty appearances.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    We are called to demonstrate our ability to conquer through faith, not by escaping the world, but by living within it. Respectful silence, careful choice, and complete obedience are the key lessons we learn here.
                  </p>
                </section>

                {/* Section 4: The Promise */}
                <section className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                  <h3 className="text-xl font-black text-orange-900 mb-3">The Promise</h3>
                  <p className="text-orange-900/80 italic font-serif leading-relaxed mb-4">
                    "Fear not, for I am with you; be not dismayed, for I am your God. I will strengthen you, yes, I will help you."
                  </p>
                  <p className="text-sm text-orange-800 font-medium">
                    Let "Forward" be your watchword. Move from faith to stronger faith, from light to greater light, and from victory to victory—ever onward!
                  </p>
                </section>

              </div>

              {/* Footer Action */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-center">
                <Link 
                  href="/auth/signup" 
                  className="bg-orange-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
                >
                  Accept the Call <ArrowRight size={18} />
                </Link>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DASHBOARD VIEW (AUTHENTICATED) ---
  return (
    <main className="max-w-6xl mx-auto px-6 py-8 relative bg-slate-50 min-h-screen text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">WELCOME, PURITAN {firstName}</h1>
          <p className="text-slate-400 text-sm font-medium">Community of The Forge</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
          <Plus size={18} strokeWidth={3} /> Share Prayer Request
        </button>
      </div>

      {/* Ticker */}
      {announcement && (
        <div className="mb-6 group">
          <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-lg border border-white/5 flex flex-col md:flex-row md:items-stretch transition-all duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between w-full md:w-auto border-b border-white/10 md:border-b-0 md:border-r border-white/5 bg-slate-900">
              <div className="bg-orange-600 px-4 py-3 flex items-center gap-2 h-full">
                <Mic size={14} className="animate-pulse text-white" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Announcements</span>
              </div>
              <Link href="/announcements" className="md:hidden pr-4 pl-6 py-3 flex items-center gap-2 text-orange-400">
                <span className="text-[9px] font-black uppercase tracking-tighter">Archives</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-3 flex items-center overflow-hidden bg-slate-900">
              <p className="text-xs font-medium italic text-slate-300 w-full line-clamp-2 md:line-clamp-none md:whitespace-nowrap md:truncate md:group-hover:whitespace-normal transition-all duration-300 leading-relaxed">
                "{announcement.content}"
              </p>
            </div>

            {/* Desktop Link */}
            <Link href="/announcements" className="hidden md:flex px-4 py-3 border-l border-white/10 hover:bg-white/5 transition-colors flex-shrink-0 items-center bg-slate-900">
              <span className="text-[10px] font-black uppercase tracking-tighter text-orange-400">Archives</span>
              <ChevronRight size={14} className="text-orange-400" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Daily Verse */}
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-8 border border-indigo-100 shadow-sm relative overflow-hidden group">
            <Quote className="absolute -top-4 -left-4 w-24 h-24 text-indigo-200/30 -rotate-12" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Daily Manna</span>
                <button onClick={handleCopyVerse} className="p-2 hover:bg-white rounded-full text-slate-400">
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
              {dailyVerse && (
                <>
                  <p className="text-xl md:text-2xl font-serif italic text-slate-800 leading-snug">"{dailyVerse.text.trim()}"</p>
                  <p className="mt-4 font-bold text-indigo-600 flex items-center gap-2"><span className="h-px w-8 bg-indigo-200"></span>{dailyVerse.ref}</p>
                </>
              )}
            </div>
          </div>

          {/* Live Section */}
          <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 shadow-2xl group border border-white/10">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-pink-500/30 rounded-full blur-3xl pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-indigo-400/30 rounded-full blur-3xl pointer-events-none mix-blend-screen" />
            
            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4 max-w-lg">
                 <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-inner">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90 drop-shadow-sm">Live Broadcast</span>
                 </div>
                 <div>
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-md">{settings.live_topic}</h2>
                    <p className="text-indigo-200 font-medium mt-3 text-xs md:text-sm flex items-center gap-2 uppercase tracking-wide">
                      <Video size={14} className="text-pink-400" /> Streaming via Google Meet
                    </p>
                 </div>
              </div>
              <a href={settings.live_meet_link} target="_blank" className="group/btn relative bg-white text-indigo-950 px-8 py-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="bg-indigo-100 p-1.5 rounded-full group-hover/btn:scale-110 transition-transform duration-300">
                    <Video size={16} className="text-indigo-600" />
                  </div>
                  <span>Join Room</span>
                </div>
              </a>
            </div>
          </div>

          {/* Podcast Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
              <img src={settings.podcast_image} alt="Podcast Cover" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Mic size={14} className="text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest Podcast</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{settings.podcast_title}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4 font-medium italic">"{settings.podcast_description}"</p>
              <a href={settings.podcast_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-orange-600 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-indigo-50 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
                  <Play size={14} fill="currentColor" />
                </div>
                Listen to the Word
              </a>
            </div>
          </div>

          {/* --- NEW SECTION: LATEST VIDEO CARD --- */}
          {latestVideo && (
            <div className="relative h-64 md:h-72 rounded-[2rem] overflow-hidden group shadow-xl">
               {/* Background Image */}
               <img 
                 src={getThumbnail(latestVideo.url)} 
                 alt={latestVideo.title} 
                 className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
               />
               
               {/* Dark Overlay Gradient */}
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-90" />

               {/* Content */}
               <div className="absolute inset-0 p-8 flex flex-col justify-end items-start z-10">
                  <div className="mb-auto">
                    <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">New Visual</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 drop-shadow-md line-clamp-2 uppercase italic tracking-tight">
                    {latestVideo.title}
                  </h3>
                  <p className="text-slate-300 text-xs font-medium line-clamp-1 mb-6 max-w-lg">
                    {latestVideo.description || "Watch the latest recorded session from The Forge."}
                  </p>

                  <Link 
                    href="/library" 
                    className="flex items-center gap-3 bg-white text-slate-950 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-lg shadow-black/20"
                  >
                    <Play size={14} fill="currentColor" /> Watch Now
                  </Link>
               </div>
            </div>
          )}

          {/* Prayer Stream Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col relative">
            <div className="p-6 border-b border-slate-50 bg-white z-10">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">The Prayer Stream</h3>
                  <p className="text-[10px] text-slate-400 font-medium tracking-wide">Interceding for the Forge</p>
                </div>
                <button onClick={fetchLatestPrayers} className="text-[10px] text-indigo-500 font-black uppercase tracking-widest hover:text-indigo-700 transition-colors">
                  Refresh
                </button>
              </div>
              
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={14} />
                <input 
                  type="text"
                  placeholder="Search prayers or members..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {filteredPrayers.length > 0 ? (
                filteredPrayers.map((p) => {
                  const rawName = p.profiles?.full_name || p.author_name || 'Puritan Member';
                  const firstNameOnly = rawName.split(' ')[0];
                  const avatarUrl = p.profiles?.avatar_url;
                  const prayerReplies = replies[p.id] || [];
                  const isExpanded = expandedPrayers[p.id];

                  return (
                    <div key={p.id} className="bg-slate-50/40 rounded-2xl p-4 border border-slate-100/50 transition-all hover:bg-white hover:shadow-md hover:border-indigo-50 group">
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={firstNameOnly} className="w-full h-full object-cover" />
                          ) : (
                            <div className="font-black text-[10px] text-indigo-600 uppercase">{firstNameOnly.charAt(0)}</div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Puritan {firstNameOnly}</p>
                            <span className="text-[8px] font-bold text-slate-300 uppercase">{new Date(p.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-700 font-serif italic text-[15px] leading-relaxed">"{p.content}"</p>
                          <div className="mt-3 flex items-center gap-3">
                            <button 
                              onClick={() => handlePraying(p.id, p.prayer_count)} 
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                                myPrayedIds.includes(p.id) 
                                  ? 'bg-rose-50 text-rose-600' 
                                  : 'bg-white text-slate-400 hover:text-rose-500 border border-slate-100'
                              }`}
                            >
                              <Heart size={12} fill={myPrayedIds.includes(p.id) ? "currentColor" : "none"} />
                              {myPrayedIds.includes(p.id) ? 'Praying' : 'Pray'} ({p.prayer_count || 0})
                            </button>
                            <button 
                              onClick={() => setExpandedPrayers(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                                isExpanded 
                                  ? 'bg-indigo-50 text-indigo-600' 
                                  : 'bg-white text-slate-400 hover:text-indigo-600 border border-slate-100'
                              }`}
                            >
                              <MessageCircle size={12} />
                              Encouragement ({prayerReplies.length})
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-300">
                              {prayerReplies.map((reply: any) => (
                                <div key={reply.id} className="flex gap-2 items-start">
                                  <div className="w-6 h-6 rounded-lg bg-indigo-50 flex-shrink-0 flex items-center justify-center text-[8px] font-black text-indigo-400 uppercase">{reply.author_name?.charAt(0)}</div>
                                  <div className="bg-white/80 p-2.5 rounded-xl rounded-tl-none border border-slate-100 flex-1">
                                    <p className="text-xs text-slate-600 font-medium">
                                      <span className="text-[8px] font-black text-indigo-500 uppercase mr-1">{reply.author_name}:</span>
                                      "{reply.content}"
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <div className="flex gap-2 pt-1">
                                <input 
                                  type="text" placeholder="Type a word..."
                                  className="flex-1 bg-white border border-slate-100 rounded-lg px-3 py-2 text-[11px] outline-none focus:ring-1 focus:ring-indigo-500/30 text-slate-800"
                                  value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' && replyText.trim() && isCommenting !== p.id) handlePostReply(p.id, replyText); }}
                                />
                                <button disabled={isCommenting === p.id || !replyText.trim()} onClick={() => handlePostReply(p.id, replyText)} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-indigo-600 transition-all flex items-center justify-center min-w-[32px]">
                                  {isCommenting === p.id ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No matching prayers found</p>
                </div>
              )}
            </div>
            <div className="h-12 bg-gradient-to-t from-white to-transparent absolute bottom-0 left-0 right-0 pointer-events-none z-10" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Fasting Schedule Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-indigo-600" size={20} />
              <h3 className="font-bold text-slate-800 text-lg">Fasting Schedule</h3>
            </div>
            
            <div className="relative pl-6 mb-6">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-orange-500 rounded-full" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Currently On</p>
              <h4 className="text-xl font-black text-slate-900 leading-tight">21 Days Spiritual Journey</h4>
              <p className="text-slate-500 text-sm mt-1 font-medium">Day {fastDay} of 21</p>
            </div>

            <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100 mb-6">
              <p className="text-orange-700 font-black text-[10px] uppercase tracking-widest mb-2">Today's Focus:</p>
              <p className="text-orange-900/80 italic text-sm font-serif">"{todayFocus?.scripture || 'Be still and know...'}"</p>
            </div>

            <button onClick={() => setIsJournalModalOpen(true)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg">
              <BookOpen size={16} /> {journalNote ? 'Edit Today\'s Journal' : 'Write Journal Entry'}
            </button>
          </div>

          {/* LATEST VICTORY WIDGET */}
          {latestTestimony && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-orange-500" size={18} />
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-tight">Latest Victory</h3>
                </div>
                <Link href="/testimonies" className="text-[10px] font-black text-indigo-600 uppercase hover:underline">
                  See all Testimonies
                </Link>
              </div>

              <div className="space-y-3 relative z-10">
                <h4 className="text-sm font-black text-slate-900 uppercase leading-tight italic line-clamp-2">
                  {latestTestimony.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 italic font-serif leading-relaxed">
                  "{latestTestimony.content}"
                </p>
                
                <div className="flex items-center justify-between pt-2 border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                      {latestTestimony.author_name?.charAt(0)}
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {latestTestimony.author_name?.split(' ')[0]}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase">
                    <MessageCircle size={10} />
                    {latestTestimony.comment_count} Rejoiced
                  </div>
                </div>

                {/* Quick Rejoice / Comment Input */}
                <div className="flex gap-2 pt-1">
                    <input 
                      type="text" 
                      placeholder="Rejoice with them..."
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] outline-none focus:ring-1 focus:ring-indigo-500/30 text-slate-800"
                      value={victoryComment}
                      onChange={(e) => setVictoryComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleVictoryComment(); }}
                    />
                    <button 
                      disabled={isCommentingVictory || !victoryComment.trim()} 
                      onClick={handleVictoryComment} 
                      className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center min-w-[32px]"
                    >
                      {isCommentingVictory ? <Loader2 className="animate-spin" size={10} /> : <Send size={10} />}
                    </button>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 text-slate-50 opacity-10 group-hover:rotate-12 transition-transform pointer-events-none">
                <Quote size={80} />
              </div>
            </div>
          )}

          {/* Recent Journey Logs */}
          {pastLogs.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <History size={16} className="text-indigo-500" /> Recent Journey
              </h4>
              <div className="space-y-3">
                {pastLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-indigo-500 mb-1 uppercase">Day {log.day_number}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 italic">"{log.notes}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Share Prayer</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handlePostPrayer} className="p-8">
              <textarea placeholder="What is on your heart?" className="w-full h-40 bg-slate-50 p-6 rounded-2xl border-none outline-none font-serif italic text-lg mb-4" value={newPrayer} onChange={(e) => setNewPrayer(e.target.value)} required />
              <button disabled={isPosting} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-indigo-600 transition-all">
                {isPosting ? <Loader2 className="animate-spin mx-auto"/> : "POST PRAYER"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isJournalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl">
            <div className="bg-orange-500 p-8 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Day {fastDay} Journal</h2>
              <button onClick={() => setIsJournalModalOpen(false)}><X size={24}/></button>
            </div>
            <div className="p-8">
              <textarea placeholder="Reflections on today's fast..." className="w-full h-40 bg-slate-50 p-6 rounded-2xl border-none outline-none font-serif italic text-lg mb-4" value={journalNote} onChange={(e) => setJournalNote(e.target.value)} />
              <button onClick={handleSaveJournal} disabled={isSavingJournal} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-orange-600 transition-all">
                {isSavingJournal ? <Loader2 className="animate-spin mx-auto"/> : "SAVE REFLECTION"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ... existing modals ... */}

      {/* THE UPPER ROOM (Global Chat) */}
      {user && <UpperRoom user={user} profileName={firstName} />}

    </main>
  );
}
