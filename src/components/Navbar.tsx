"use client"

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { 
  X, Bell, Music, Play, Pause, 
  SkipForward, SkipBack, 
  Loader2, Signal, ListMusic,
  Repeat, Repeat1, BookOpen, Share 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [initials, setInitials] = useState('US');
  
  // --- NOTIFICATION & TOAST STATE ---
  const [notifCount, setNotifCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'info' | 'alert' }>({ visible: false, message: '', type: 'info' });
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  // Ref for the Notification Sound
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- MUSIC PLAYER STATE ---
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [showPlaylistView, setShowPlaylistView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  
  // --- REPEAT STATE ---
  const [isRepeatOne, setIsRepeatOne] = useState(false); 
  
  // Progress Bar State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRestored, setIsRestored] = useState(false); 
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0); 
  const isInitialMount = useRef(true); 

// --- 1. INITIALIZATION: ONESIGNAL, PWA & REALTIME ---
  useEffect(() => {
    let channel: any;

    // A. Init Sound
    notificationAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    if (notificationAudioRef.current) {
        notificationAudioRef.current.volume = 0.6;
    }

    // B. Init OneSignal & Supabase
    const initSystem = async () => {
      // 1. Check Session First
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. Initialize OneSignal
      if (typeof window !== 'undefined') {
        const w = window as any;
        w.OneSignal = w.OneSignal || [];
        
        w.OneSignal.push(function() {
          w.OneSignal.init({
            appId: "e2ae7af9-258c-4cbe-8397-99a8cc438376", 
            safari_web_id: "web.onesignal.auto.xxxxx", 
            notifyButton: { enable: true },
            allowLocalhostAsSecureOrigin: true,
          });

          // 3. CRITICAL: SAVE ID TO SUPABASE
          w.OneSignal.on('subscriptionChange', function (isSubscribed: boolean) {
            if (isSubscribed && session?.user) {
              w.OneSignal.getUserId(async function(userId: string) {
                if(userId) {
                   console.log("Saving OneSignal ID:", userId);
                   await supabase
                     .from('profiles')
                     .update({ onesignal_id: userId })
                     .eq('id', session.user.id);
                }
              });
            }
          });

          // Check if already subscribed on load
          w.OneSignal.getUserId(async function(userId: string) {
             if(userId && session?.user) {
               await supabase
                 .from('profiles')
                 .update({ onesignal_id: userId })
                 .eq('id', session.user.id);
             }
          });
        });
      }

      // 4. Supabase Realtime Listeners (Only if logged in)
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email;
        if (name) setInitials(name.charAt(0).toUpperCase());

        channel = supabase
          .channel('global_notifications') 
          
          // Message Notification
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
              if (payload.new && payload.new.user_id !== session.user.id) {
                triggerNotification(`New message from ${payload.new.author_name || 'a member'}`);
              }
          })
          
          // Prayer/Fasting Notification
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prayer_replies' }, (payload) => {
              if (payload.new && payload.new.user_id !== session.user.id) {
                triggerNotification("Someone replied to a prayer request!");
              }
          })

          // Watchman Join Notification
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'watchman_logs' }, (payload) => {
             if (payload.new.user_id !== session.user.id) {
               triggerNotification("A Watchman has mounted the wall!", 'alert');
             }
          })
          .subscribe();
      }
    };

    initSystem();

    // C. Check PWA Install Status
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isStandalone) {
      setTimeout(() => setShowInstallPrompt(true), 3000);
    }

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  // --- 2. MUSIC INIT & PERSISTENCE ---
  useEffect(() => {
    async function fetchMusic() {
      const { data } = await supabase.from('music_tracks').select('*').order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setPlaylist(data);
        
        const savedIndex = localStorage.getItem('forge_track_index');
        const savedTime = localStorage.getItem('forge_track_time');
        
        const initialIndex = savedIndex ? parseInt(savedIndex) : 0;
        const initialTime = savedTime ? parseFloat(savedTime) : 0;
        
        const safeIndex = (initialIndex >= 0 && initialIndex < data.length) ? initialIndex : 0;

        setCurrentTrackIndex(safeIndex);
        indexRef.current = safeIndex;
        setIsRestored(true);

        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.volume = 0.4;
          audioRef.current.src = data[safeIndex].url;
          
          audioRef.current.onloadedmetadata = () => {
             if (audioRef.current) {
               setDuration(audioRef.current.duration);
               if (isInitialMount.current) {
                 if (initialTime > 0) audioRef.current.currentTime = initialTime;
                 isInitialMount.current = false;
               }
             }
          };

          audioRef.current.onended = () => {
            if (!audioRef.current?.loop) {
                const nextIndex = (indexRef.current + 1) % data.length;
                playTrackAtIndex(nextIndex, data);
            }
          };
          
          audioRef.current.ontimeupdate = () => {
             if(audioRef.current) {
               setCurrentTime(audioRef.current.currentTime);
               localStorage.setItem('forge_track_time', audioRef.current.currentTime.toString());
             }
          };

          audioRef.current.onwaiting = () => setIsLoadingMusic(true);
          audioRef.current.oncanplay = () => setIsLoadingMusic(false);
        }
      }
    }
    fetchMusic();
    
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  useEffect(() => { 
    if (isRestored) {
        indexRef.current = currentTrackIndex; 
        localStorage.setItem('forge_track_index', currentTrackIndex.toString());
    }
  }, [currentTrackIndex, isRestored]);


  // --- NOTIFICATION TRIGGER LOGIC ---
  const triggerNotification = (message: string = "New Activity", type: 'info' | 'alert' = 'info') => {
    setNotifCount(prev => prev + 1);
    setIsAnimating(true);
    
    if (notificationAudioRef.current) {
        notificationAudioRef.current.currentTime = 0; 
        notificationAudioRef.current.play().catch(e => console.log("Audio play blocked", e));
    }

    setToast({ visible: true, message, type });

    setTimeout(() => setIsAnimating(false), 1000);
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000); 
  };

  // --- MUSIC HANDLERS ---
  const playTrackAtIndex = (index: number, tracks = playlist) => {
    if (!audioRef.current || tracks.length === 0) return;
    
    isInitialMount.current = false; 

    let safeIndex = index;
    if (index >= tracks.length) safeIndex = 0;
    if (index < 0) safeIndex = tracks.length - 1;

    setCurrentTrackIndex(safeIndex);
    
    const track = tracks[safeIndex];
    const url = track.url;
    
    if (audioRef.current.src !== url) {
      audioRef.current.src = url;
      audioRef.current.currentTime = 0; 
      localStorage.setItem('forge_track_time', '0'); 
    }
    
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist || "The Forge",
            album: "The Forge Atmosphere",
            artwork: [
              { src: '/logo1.png', sizes: '192x192', type: 'image/png' },
              { src: '/logo1.png', sizes: '512x512', type: 'image/png' },
            ]
          });

          navigator.mediaSession.setActionHandler('play', () => { 
            audioRef.current?.play(); 
            setIsPlaying(true); 
          });
          navigator.mediaSession.setActionHandler('pause', () => { 
            audioRef.current?.pause(); 
            setIsPlaying(false); 
          });
          navigator.mediaSession.setActionHandler('previoustrack', () => {
             playTrackAtIndex(safeIndex - 1, tracks);
          });
          navigator.mediaSession.setActionHandler('nexttrack', () => {
             playTrackAtIndex(safeIndex + 1, tracks);
          });
        }
      })
      .catch(e => console.log("Audio playback error:", e));
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

  const toggleRepeat = () => {
    if (!audioRef.current) return;
    const newMode = !isRepeatOne;
    setIsRepeatOne(newMode);
    audioRef.current.loop = newMode; 
  };

  const handleNext = () => playTrackAtIndex(currentTrackIndex + 1);
  const handlePrev = () => playTrackAtIndex(currentTrackIndex - 1);
  
  const handleSelectTrack = (index: number) => {
    playTrackAtIndex(index);
    setShowPlaylistView(false); 
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const currentSong = playlist[currentTrackIndex];

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Fasting', href: '/fasting' },
    { name: 'Prayers', href: '/prayers' },
    { name: 'Watchman', href: '/watchman' },
  ];

  return (
    <>
      {/* 1. VISUAL TOAST NOTIFICATION */}
      <div 
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ease-in-out ${toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}
      >
        <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${toast.type === 'alert' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-900 border-slate-700 text-white'}`}>
          <Bell size={18} className={toast.type === 'alert' ? 'animate-bounce' : ''} />
          <span className="text-xs font-bold uppercase tracking-wide">{toast.message}</span>
          <button onClick={() => setToast(p => ({...p, visible: false}))}><X size={14}/></button>
        </div>
      </div>

      {/* 2. iOS INSTALL PROMPT */}
      {showInstallPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 animate-in slide-in-from-bottom duration-500">
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-slate-200 relative max-w-md mx-auto">
            <button onClick={() => setShowInstallPrompt(false)} className="absolute top-2 right-2 text-slate-400 p-2"><X size={20}/></button>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                <Image src="/logo1.png" width={30} height={30} alt="Icon" className="object-contain"/>
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm uppercase">Install The Forge</h4>
                <p className="text-xs text-slate-500 mt-1">Get notifications & better experience.</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-700 font-medium">
                  1. Tap <Share size={14} className="inline mx-1" /> below <br/>
                  2. Select <span className="font-bold">"Add to Home Screen"</span> <span className="inline-block border border-slate-300 rounded px-1 ml-1">+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN NAVBAR */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex justify-between items-center relative">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-32 h-10 md:w-40 md:h-12"> 
              <Image src="/logo1.png" alt="The Forge Logo" fill className="object-contain object-left" priority />
            </div>
          </Link>
          
          {/* DESKTOP NAV */}
          <div className="hidden lg:flex space-x-8 font-medium text-sm ml-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`${pathname === link.href ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-slate-500 hover:text-indigo-600 transition'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-1 md:gap-4">
            
            <Link 
              href="/bible" 
              className={`p-1.5 md:p-2 rounded-full transition-all flex items-center justify-center
                ${pathname === '/bible' ? 'bg-orange-50 text-orange-600' : 'hover:bg-slate-50 text-slate-400'}
              `}
              title="Read Bible"
            >
              <BookOpen size={20} />
            </Link>

            {/* Library Icon (Mobile Only) */}
            <Link 
              href="/library" 
              className={`lg:hidden p-1.5 md:p-2 rounded-full transition-all flex items-center justify-center
                ${pathname === '/library' || pathname === '/archives' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-400'}
              `}
              title="Vault & Library"
            >
              <ListMusic size={20} />
            </Link>

            {/* MUSIC PLAYER WIDGET */}
            {playlist.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setIsPlayerOpen(!isPlayerOpen)}
                  className={`p-1.5 md:p-2 rounded-full transition-all flex items-center justify-center
                    ${isPlaying ? 'bg-indigo-50 text-indigo-600 animate-pulse-slow' : 'hover:bg-slate-50 text-slate-400'}
                  `}
                >
                  {isPlaying ? <Signal size={20} className="animate-pulse" /> : <Music size={20} />}
                </button>

                {/* POPUP PLAYER */}
                {isPlayerOpen && (
                  <div className={`
                    bg-slate-900 rounded-2xl shadow-2xl p-3 border border-slate-800 z-[100] animate-in zoom-in duration-200
                    fixed top-24 left-1/2 -translate-x-1/2 w-[85%] max-w-[260px]
                    md:absolute md:top-12 md:right-0 md:left-auto md:translate-x-0 md:w-72
                  `}>
                    
                    <button 
                      onClick={() => setIsPlayerOpen(false)}
                      className="absolute -top-3 -left-3 bg-slate-800 text-white rounded-full p-1.5 border border-slate-700 shadow-md hover:bg-slate-700 transition-colors z-[110]"
                    >
                      <X size={14} />
                    </button>

                    <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                        {showPlaylistView ? "Select Track" : "Now Playing"}
                      </span>
                      
                      <button 
                        onClick={() => setShowPlaylistView(!showPlaylistView)}
                        className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider inline-block">
                          {showPlaylistView ? "Player" : "Playlist"}
                        </span>
                        {showPlaylistView ? <Music size={14} /> : <ListMusic size={16} />}
                      </button>
                    </div>

                    {showPlaylistView ? (
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {playlist.map((track, idx) => (
                          <button 
                            key={track.id}
                            onClick={() => handleSelectTrack(idx)}
                            className={`w-full text-left p-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors
                              ${idx === currentTrackIndex 
                                ? 'bg-indigo-600 text-white' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                              }`}
                          >
                            <span className="truncate max-w-[180px]">{idx + 1}. {track.title}</span>
                            {idx === currentTrackIndex && isPlaying && <Signal size={12} className="animate-pulse"/>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 ${isPlaying ? 'animate-pulse' : ''}`}>
                            <Music size={18} className="text-white" />
                          </div>
                          <div className="overflow-hidden w-full">
                            <div className="whitespace-nowrap overflow-hidden">
                              <p className="text-xs font-bold text-white animate-marquee inline-block min-w-full">
                                {currentSong?.title || "Loading..."} &nbsp; • &nbsp; {currentSong?.title || "Loading..."} &nbsp; • &nbsp;
                              </p>
                            </div>
                            <p className="text-[9px] text-slate-400 truncate">{currentSong?.artist || "The Forge"}</p>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <input 
                            type="range" 
                            min="0" 
                            max={duration || 100} 
                            value={currentTime} 
                            onChange={handleSeek}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                          />
                          <div className="flex justify-between mt-1 text-[8px] font-medium text-slate-400">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-xl p-2">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={toggleRepeat} 
                              className={`transition-colors p-1 ${isRepeatOne ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                            >
                               {isRepeatOne ? <Repeat1 size={14} /> : <Repeat size={14} />}
                            </button>
                            <button onClick={handlePrev} className="text-slate-400 hover:text-white transition-colors p-1"><SkipBack size={16} /></button>
                            <button 
                              onClick={togglePlay}
                              className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors"
                            >
                              {isLoadingMusic ? <Loader2 size={14} className="animate-spin"/> : (isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5"/>)}
                            </button>
                            <button onClick={handleNext} className="text-slate-400 hover:text-white transition-colors p-1"><SkipForward size={16} /></button>
                          </div>
                          <div className="flex gap-0.5 items-end h-3">
                            {[1,2,3,4].map((h, i) => (
                              <div key={i} className={`w-0.5 bg-indigo-500 rounded-full ${isPlaying ? 'animate-music-bar' : 'h-1'}`} style={{ height: isPlaying ? `${h * 3}px` : '2px', animationDelay: `${i * 0.1}s` }} />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* BELL */}
            <button 
              onClick={() => setNotifCount(0)} 
              className={`relative p-1.5 md:p-2 rounded-full transition-all hover:bg-slate-50 ${isAnimating ? 'animate-bounce' : ''}`}
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

{/* --- DEBUG BUTTON --- */}
<button
    onClick={async () => {
        const w = window as any;
        const permission = Notification.permission;
        const isLoaded = !!w.OneSignal;
        
        // 1. Alert the Status
        alert(`DIAGNOSTIC REPORT:\n
        - OneSignal Loaded: ${isLoaded ? "YES" : "NO (Check Script)"}
        - Permission Status: ${permission}
        - Protocol: ${window.location.protocol} (Must be https or localhost)
        `);

        if (!isLoaded) return;

        // 2. If already granted, force save the ID
        if (permission === 'granted') {
             w.OneSignal.push(async () => {
                 const userId = await w.OneSignal.getUserId();
                 alert(`You are ALREADY subscribed!\nUser ID: ${userId}`);
                 if (userId) {
                     // Force save to Supabase
                     const { data: { session } } = await supabase.auth.getSession();
                     if (session) {
                         await supabase.from('profiles').update({ onesignal_id: userId }).eq('id', session.user.id);
                         alert("ID Saved to Database!");
                     }
                 }
             });
        } 
        // 3. If not granted, try to show prompt
        else {
            w.OneSignal.push(() => {
                w.OneSignal.showNativePrompt(); // The Slide Prompt
                w.OneSignal.registerForPushNotifications(); // The Browser Prompt
                alert("Prompt requested...");
            });
        }
    }}
    className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-red-700 transition-colors ml-1"
>
    TEST NOTIFICATIONS
</button>

            {/* PROFILE */}
            <Link href="/profile" className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-white hover:scale-105 transition-transform cursor-pointer">
              {initials}
            </Link>

          </div>
        </div>
      </nav>
    </>
  );
}