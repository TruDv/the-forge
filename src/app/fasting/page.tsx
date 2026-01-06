"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, Flame, Clock, BookOpen, History, 
  ChevronRight, Info, X, Shield, ScrollText, Zap, Target, 
  RefreshCw, AlertTriangle, PenTool, Loader2 
} from 'lucide-react';

export default function FastingPage() {
  const fastStartDate = 12; 
  const [selectedDay, setSelectedDay] = useState(1);
  const [dailyFocus, setDailyFocus] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [journalLogs, setJournalLogs] = useState<any[]>([]);
  
  // Modals
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false); // <--- NEW
  const [journalNote, setJournalNote] = useState(''); // <--- NEW
  const [isSavingJournal, setIsSavingJournal] = useState(false); // <--- NEW

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fastDays = Array.from({ length: 21 }, (_, i) => i + 1);

  const getWeeklyTopic = (day: number) => {
    if (day <= 7) return { title: "Week 1: Consecration", focus: "Pure Hearts" };
    if (day <= 14) return { title: "Week 2: Breakthrough", focus: "Spiritual Warfare" };
    return { title: "Week 3: Empowerment", focus: "Spiritual Clarity" };
  };

  const currentTopic = getWeeklyTopic(selectedDay);

  const fetchLogs = async (userId: string) => {
    const { data: logs } = await supabase
      .from('fasting_logs')
      .select('*')
      .eq('user_id', userId)
      .order('day_number', { ascending: false });
    if (logs) {
        setJournalLogs(logs);
        // If we are viewing a specific day, check if there's a note for it to edit
        const activeLog = logs.find(l => l.day_number === selectedDay);
        if (activeLog) setJournalNote(activeLog.notes);
        else setJournalNote(''); // Clear if no note for this day
    }
  };

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchLogs(session.user.id);
      }

      const { data } = await supabase
        .from('fasting_days')
        .select('*')
        .eq('day_number', selectedDay)
        .single();
      
      if (data) setDailyFocus(data);
      else setDailyFocus(null);
    }
    fetchData();
  }, [selectedDay]);

  const handleSaveJournal = async () => {
    if (!user || !journalNote.trim()) return;
    setIsSavingJournal(true);
    const { error } = await supabase.from('fasting_logs').upsert({
      user_id: user.id,
      day_number: selectedDay, // Use currently selected day
      notes: journalNote,
    }, { onConflict: 'user_id,day_number' });

    if (!error) {
      fetchLogs(user.id);
      setIsJournalModalOpen(false);
    }
    setIsSavingJournal(false);
  };

  const getCalendarDate = (dayNum: number) => fastStartDate + dayNum - 1;
  const getDayName = (dayNum: number) => {
    const date = new Date(2026, 0, getCalendarDate(dayNum));
    return weekdays[date.getDay()];
  };

  const scrollToArchive = () => {
    document.getElementById('journal-archive')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewPastDay = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      
      {/* --- JOURNAL MODAL --- */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-orange-500 p-8 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Day {selectedDay} Journal</h2>
              <button onClick={() => setIsJournalModalOpen(false)} className="hover:bg-white/10 rounded-full p-1"><X size={24}/></button>
            </div>
            <div className="p-8">
              <textarea 
                placeholder={`What is God saying to you on Day ${selectedDay}?`} 
                className="w-full h-40 bg-slate-50 p-6 rounded-2xl border-none outline-none font-serif italic text-lg mb-4 resize-none focus:ring-2 focus:ring-orange-200"
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
              />
              <button 
                onClick={handleSaveJournal} 
                disabled={isSavingJournal}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
              >
                {isSavingJournal ? <Loader2 className="animate-spin" /> : "Save Reflection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FULL SPIRITUAL JOURNEY MODAL --- */}
      {isVisionOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in duration-300">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-8 py-6 flex justify-between items-center border-b border-slate-100 z-20">
               <div className="flex items-center gap-2">
                  <Shield className="text-orange-500" size={20} />
                  <span className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">The Forge: 2026 Mandate</span>
               </div>
               <button onClick={() => setIsVisionOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} className="text-slate-400" />
               </button>
            </div>

            <div className="p-8 md:p-12 pt-6">
              {/* Vision Hero Section */}
              <div className="mb-12 text-center">
                <h2 className="text-5xl font-black text-slate-900 mb-4 leading-tight uppercase italic tracking-tighter">Spiritual Journey</h2>
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                  "Come Up Hither"
                </div>
                <p className="text-2xl font-serif italic text-slate-700 max-w-2xl mx-auto leading-relaxed">
                  “That the will of God may find expression in your territory.”
                </p>
              </div>

              <div className="space-y-12">
                
                {/* 1. Aim & Results */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <Target className="text-orange-500 mb-3" size={24} />
                    <h4 className="font-black text-xs uppercase tracking-widest mb-2">The Aim</h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-pretty">The sole purpose is for the will of God to find expression in your territory.</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <Zap className="text-indigo-600 mb-3" size={24} />
                    <h4 className="font-black text-xs uppercase tracking-widest mb-2">The Result</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">Purity, Sanctification, and a measure of the Spirit of the Lord [Power].</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <ScrollText className="text-emerald-600 mb-3" size={24} />
                    <h4 className="font-black text-xs uppercase tracking-widest mb-2">The Reward</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">Eternal and Material Blessings. Inheritance in Christ.</p>
                  </div>
                </section>

                {/* 2. Introduction & Identity */}
                <section className="space-y-6">
                  <div className="border-l-4 border-indigo-600 pl-6 py-2">
                    <h4 className="font-black text-indigo-600 uppercase text-xs tracking-widest mb-3">Introduction</h4>
                    <p className="text-slate-600 leading-relaxed font-serif text-lg italic">
                      "While many fast for themes, we fast solely for the will of God. The intent of a fast births the reward."
                    </p>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-[32px] text-white">
                    <h4 className="font-black text-orange-400 uppercase text-xs tracking-widest mb-4">The Puritan Identity</h4>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6 italic">You are a rare breed—a sanctified priest separated unto God.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold uppercase tracking-tight">
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 italic">
                        <span className="text-orange-500 text-lg">01</span> Maintain a Secret Place
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 italic">
                        <span className="text-orange-500 text-lg">02</span> Be a Living Altar
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. The Protocol */}
                <section>
                  <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6 text-center">The Protocol</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-indigo-50 p-5 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase text-indigo-400">Duration</p>
                      <p className="text-xs font-bold text-indigo-900 mt-1">21 or 40 Days</p>
                    </div>
                    <div className="bg-orange-50 p-5 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase text-orange-500">Type</p>
                      <p className="text-xs font-bold text-orange-900 mt-1">Dry Fast</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase text-slate-400">Time</p>
                      <p className="text-xs font-bold text-slate-900 mt-1">12 AM - 3 PM</p>
                    </div>
                  </div>
                </section>

                {/* 4. Things to Watch For */}
                <section className="bg-amber-50 p-8 rounded-[32px] border border-amber-100">
                  <h4 className="flex items-center gap-2 font-black text-amber-700 uppercase text-xs tracking-widest mb-6">
                    <AlertTriangle size={18} /> Things to Watch For
                  </h4>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="font-black text-[10px] uppercase text-amber-600 min-w-[100px]">Instructions</div>
                      <p className="text-sm text-slate-700">Watch for "impressions" in your mind. Timely response is key to your journey.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="font-black text-[10px] uppercase text-amber-600 min-w-[100px]">Temptations</div>
                      <p className="text-sm text-slate-700">Read Matthew 4:1-11. Temptations target your flesh and calling. Stay alert on your prayer watch.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="font-black text-[10px] uppercase text-amber-600 min-w-[100px]">Promises</div>
                      <p className="text-sm text-slate-700">God’s promises via dreams or revelation are beyond what you can ask for yourself.</p>
                    </div>
                  </div>
                </section>

                {/* 5. Post-Fast Switch */}
                <section className="pb-8">
                  <div className="bg-indigo-600 p-8 rounded-[32px] text-white flex flex-col md:flex-row items-center gap-8">
                    <div className="shrink-0 bg-white/10 p-4 rounded-full">
                      <RefreshCw size={40} className="text-indigo-200" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-xs tracking-widest text-indigo-200 mb-2">The Switch: Post-Fast Devotion</h4>
                      <p className="text-sm leading-relaxed text-indigo-50">
                        If He impresses you to continue, you are "not yet there"—reach out to Charles. Otherwise, switch to a weekly rhythm: <strong>Tuesdays & Thursdays (12 AM - 3 PM).</strong>
                      </p>
                    </div>
                  </div>
                </section>

                <button 
                  onClick={() => setIsVisionOpen(false)}
                  className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-orange-600 transition-all shadow-xl"
                >
                  I Undergo The Forge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-orange-500 font-black uppercase tracking-widest text-xs">
              {currentTopic.title}
            </span>
            <button 
              onClick={() => setIsVisionOpen(true)}
              className="group relative flex items-center gap-2 bg-white text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight hover:ring-2 hover:ring-orange-500 transition-all border border-slate-200 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Read The Forge Mandate
              <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mt-1 uppercase">The Forge: Spiritual Journey</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium italic">
            Weekly Focus: {currentTopic.focus}
          </p>
        </div>
        <div className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-200">
          <Flame size={20} fill="currentColor" />
          Day {selectedDay} of 21
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Progress Grid */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <CalendarIcon size={20} className="text-indigo-600" />
              Fast Calendar
            </h3>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Jan 2026</span>
          </div>
          
          <div className="grid grid-cols-7 gap-3">
            {['S','M','T','W','T','F','S'].map((label, i) => (
              <div key={i} className="text-center text-[10px] font-black text-slate-300 uppercase pb-2">{label}</div>
            ))}

            {fastDays.map((day) => {
              const isActive = selectedDay === day;
              const hasLog = journalLogs.some(l => l.day_number === day);
              
              return (
                <button 
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border
                    ${isActive 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:bg-slate-50'}
                  `}
                >
                  <span className={`text-[9px] font-black uppercase mb-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-300'}`}>
                    {getDayName(day)}
                  </span>
                  <span className="text-lg font-bold leading-none">{getCalendarDate(day)}</span>
                  {hasLog && !isActive && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR DAILY ROUTINE */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white h-full flex flex-col">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-indigo-400 uppercase italic tracking-tighter">
              <Clock size={20} /> Forge Protocol
            </h3>
            <div className="space-y-6 flex-1">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">01</div>
                <div>
                  <p className="font-bold text-sm">Dry Fast Window</p>
                  <p className="text-orange-400 text-[10px] font-black uppercase mt-1 italic tracking-widest">12:00 AM — 3:00 PM</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">02</div>
                <div>
                  <p className="font-bold text-sm">Morning Prayer</p>
                  <p className="text-slate-400 text-xs mt-1 italic tracking-tighter">Focus: {currentTopic.focus}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">03</div>
                <div>
                  <p className="font-bold text-sm">Devotional Study</p>
                  <p className="text-slate-400 text-xs mt-1 italic">Expect divine encounters</p>
                </div>
              </div>
            </div>

            {/* --- NEW JOURNAL BUTTON --- */}
            <button 
              onClick={() => setIsJournalModalOpen(true)}
              className="mt-8 w-full bg-orange-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-orange-600 shadow-lg shadow-orange-900/20 group"
            >
              <PenTool size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Journal Day {selectedDay}</span>
            </button>

            {/* View Full Journal Button (Smaller) */}
            <button 
              onClick={scrollToArchive}
              className="mt-4 w-full bg-transparent hover:bg-white/5 border border-white/10 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all group text-slate-400 hover:text-white"
            >
              <History size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">View Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC DEVOTIONAL SECTION */}
      <div id="devotional-view" className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm mb-16">
        <div className="bg-indigo-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={24} className="text-indigo-200" />
            <span className="uppercase tracking-[0.2em] text-[10px] font-black text-indigo-200">Daily Bread • {currentTopic.title}</span>
          </div>
          <h2 className="text-4xl font-black leading-tight">
            {dailyFocus?.title || `Day ${selectedDay}: ${currentTopic.focus}`}
          </h2>
          <p className="mt-4 text-indigo-100 text-xl font-medium">
            {dailyFocus?.scripture || 'Scripture for this day coming soon...'}
          </p>
        </div>
        
        <div className="p-10 bg-white">
          <p className="text-slate-600 leading-relaxed text-2xl font-serif max-w-4xl">
            {dailyFocus?.devotional ? `"${dailyFocus.devotional}"` : `Take time today to meditate on ${currentTopic.focus.toLowerCase()}.`}
          </p>
        </div>
      </div>

      {/* JOURNAL ARCHIVE SECTION */}
      <div id="journal-archive" className="pt-8 border-t border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-slate-900 uppercase italic flex items-center gap-3">
            <History className="text-orange-500" /> Your Forged Journey
          </h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{journalLogs.length} Entries Saved</span>
        </div>

        {journalLogs.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center">
            <p className="text-slate-500 font-medium font-serif italic">Your journal is currently empty. Start your first reflection on the Home page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {journalLogs.map((log) => (
              <div key={log.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative group hover:border-orange-200 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    Day {log.day_number}
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-700 font-serif italic text-lg leading-relaxed line-clamp-4">
                  "{log.notes}"
                </p>
                <button 
                  onClick={() => handleViewPastDay(log.day_number)}
                  className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 tracking-widest hover:text-orange-600 transition-colors"
                >
                   View Focus <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}