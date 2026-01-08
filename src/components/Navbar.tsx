"use client"

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
  Menu, X, Bell, Music, Play, Pause, 
  SkipForward, SkipBack, 
  Volume2, Loader2, Signal
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [initials, setInitials] = useState('US');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- NOTIFICATION STATE ---
  const [notifCount, setNotifCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // --- MUSIC PLAYER STATE ---
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0); 

  // 1. Fetch User & Initialize Realtime (ROBUST VERSION)
  useEffect(() => {
    let channel: any;

    async function initSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email;
        if (name) setInitials(name.charAt(0).toUpperCase());

        // --- REALTIME SUBSCRIPTION ---
        console.log("🔔 Initializing Notification Listener...");
        
        channel = supabase
          .channel('global_notifications') 
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
              // Check if the message is NOT from me
              if (payload.new && payload.new.user_id !== session.user.id) {
                console.log("🔔 Message Alert!");
                triggerNotification();
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'prayer_replies' },
            (payload) => {
              // Check if reply is NOT from me
              if (payload.new && payload.new.user_id !== session.user.id) {
                console.log("🔔 Reply Alert!");
                triggerNotification();
              }
            }
          )
          .subscribe((status, err) => {
            console.log("Realtime Status:", status);
            if (status === 'CHANNEL_ERROR') {
              console.error("Realtime Error:", err);
            }
          });
      }
    }

    initSession();

    return () => { 
      if (channel) supabase.removeChannel(channel); 
    };
  }, []);

  // 2. Fetch Music Playlist & Init Player
  useEffect(() => {
    async function fetchMusic() {
      const { data } = await supabase.from('music_tracks').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setPlaylist(data);
        
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.volume = 0.4;
          
          // Auto-play next track logic
          audioRef.current.onended = () => {
            const nextIndex = (indexRef.current + 1) % data.length;
            playTrackAtIndex(nextIndex, data);
          };
          
          audioRef.current.onwaiting = () => setIsLoadingMusic(true);
          audioRef.current.oncanplay = () => setIsLoadingMusic(false);
          
          // Fix for "Empty Src" warning: Check before setting
          const firstUrl = data[0].url;
          if (firstUrl) audioRef.current.src = firstUrl;
        }
      }
    }
    fetchMusic();
    
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Keep Ref in sync with State for the event listener
  useEffect(() => { 
    indexRef.current = currentTrackIndex; 
  }, [currentTrackIndex]);

  const triggerNotification = () => {
    setNotifCount(prev => prev + 1);
    setIsAnimating(true);
    // Optional: Play a sound effect
    // const audio = new Audio("/sounds/ping.mp3");
    // audio.volume = 0.2;
    // audio.play().catch(() => {});
    
    setTimeout(() => setIsAnimating(false), 1000);
  };

  // --- MUSIC CONTROLS ---
  const playTrackAtIndex = (index: number, tracks = playlist) => {
    if (!audioRef.current || tracks.length === 0) return;
    
    let safeIndex = index;
    // Loop logic
    if (index >= tracks.length) safeIndex = 0;
    if (index < 0) safeIndex = tracks.length - 1;

    setCurrentTrackIndex(safeIndex);
    indexRef.current = safeIndex;

    const url = tracks[safeIndex].url;
    
    // Only load if different or ended
    if (audioRef.current.src !== url || audioRef.current.ended) {
      audioRef.current.src = url;
    }
    
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(e => console.log("Playback prevented:", e));
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.log(e));
      setIsPlaying(true);
    }
  };

  const handleNext = () => playTrackAtIndex(currentTrackIndex + 1);
  const handlePrev = () => playTrackAtIndex(currentTrackIndex - 1);

  const currentSong = playlist[currentTrackIndex];

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Fasting', href: '/fasting' },
    { name: 'Prayers', href: '/prayers' },
    { name: 'Testimonies', href: '/testimonies' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center relative">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-32 h-10 md:w-40 md:h-12"> 
            <Image src="/logo1.png" alt="The Forge Logo" fill className="object-contain object-left" priority />
          </div>
        </Link>
        
        {/* DESKTOP NAV */}
        <div className="hidden md:flex space-x-8 font-medium text-sm">
          {navLinks.map((link) => (
            <Link 
              key={link.name} href={link.href} 
              className={`${pathname === link.href ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-slate-500 hover:text-indigo-600 transition'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* MUSIC PLAYER WIDGET */}
          {playlist.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => setIsPlayerOpen(!isPlayerOpen)}
                className={`p-2 rounded-full transition-all flex items-center justify-center
                  ${isPlaying ? 'bg-indigo-50 text-indigo-600 animate-pulse-slow' : 'hover:bg-slate-50 text-slate-400'}
                `}
              >
                {isPlaying ? <Signal size={20} className="animate-pulse" /> : <Music size={20} />}
              </button>

              {/* POPUP PLAYER */}
              {isPlayerOpen && (
                <div className="absolute top-12 right-0 w-64 bg-slate-900 rounded-2xl shadow-2xl p-4 border border-slate-800 z-[100] animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 ${isPlaying ? 'animate-pulse' : ''}`}>
                      <Music size={16} className="text-white" />
                    </div>
                    <div className="overflow-hidden w-full">
                      <div className="whitespace-nowrap overflow-hidden">
                        <p className="text-xs font-bold text-white animate-marquee inline-block min-w-full">
                          {currentSong?.title || "Loading..."} &nbsp; • &nbsp; {currentSong?.title || "Loading..."} &nbsp; • &nbsp;
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{currentSong?.artist || "The Forge"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-2">
                    <div className="flex items-center gap-2">
                      <button onClick={handlePrev} className="text-slate-400 hover:text-white transition-colors"><SkipBack size={16} /></button>
                      
                      <button 
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors"
                      >
                        {isLoadingMusic ? <Loader2 size={14} className="animate-spin"/> : (isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5"/>)}
                      </button>
                      
                      <button onClick={handleNext} className="text-slate-400 hover:text-white transition-colors"><SkipForward size={16} /></button>
                    </div>
                    
                    <div className="flex gap-0.5 items-end h-3">
                      {[1,2,3,4,3,2,1].map((h, i) => (
                        <div key={i} className={`w-0.5 bg-indigo-500 rounded-full ${isPlaying ? 'animate-music-bar' : 'h-1'}`} style={{ height: isPlaying ? `${h * 3}px` : '3px', animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BELL (Notifications) */}
          <button 
            onClick={() => setNotifCount(0)} 
            className={`relative p-2 rounded-full transition-all hover:bg-slate-50 ${isAnimating ? 'animate-bounce' : ''}`}
          >
            <Bell size={20} className={notifCount > 0 ? "text-indigo-600" : "text-slate-400"} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] font-black text-white items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              </span>
            )}
          </button>

          {/* PROFILE */}
          <Link href="/profile" className="w-9 h-9 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-white hover:scale-105 transition-transform cursor-pointer">
            {initials}
          </Link>

          {/* MOBILE MENU BTN */}
          <button className="md:hidden text-slate-600 hover:text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white absolute top-16 left-0 w-full shadow-lg py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-5 duration-200">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={`text-sm font-bold py-2 ${pathname === link.href ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}>
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}