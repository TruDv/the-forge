"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, Flame, Clock, BookOpen, History, 
  ChevronRight, Info, X, Shield, ScrollText, Zap, Target, 
  RefreshCw, AlertTriangle, PenTool, Loader2, Quote
} from 'lucide-react';

export default function FastingPage() {
  const fastStartDate = 12; 
  const [selectedDay, setSelectedDay] = useState(1);
  const [dailyFocus, setDailyFocus] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [journalLogs, setJournalLogs] = useState<any[]>([]);
  
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalNote, setJournalNote] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);

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
        const activeLog = logs.find(l => l.day_number === selectedDay);
        if (activeLog) setJournalNote(activeLog.notes);
        else setJournalNote('');
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
      day_number: selectedDay,
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
    /* ADDED bg-white and min-h-screen to force background color on mobile */
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-12">
      
      {/* JOURNAL MODAL */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-orange-500 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Day {selectedDay} Journal</h2>
              <button onClick={() => setIsJournalModalOpen(false)} className="bg-white/20 rounded-full p-1"><X size={20}/></button>
            </div>
            <div className="p-6">
              <textarea 
                placeholder={`What is God saying to you on Day ${selectedDay}?`} 
                className="w-full h-48 bg-slate-50 p-5 rounded-2xl border border-slate-200 outline-none font-serif italic text-lg mb-4 text-slate-800 resize-none focus:border-orange-500 focus:bg-white transition-all"
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
              />
              <button 
                onClick={handleSaveJournal} 
                disabled={isSavingJournal}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
              >
                {isSavingJournal ? <Loader2 className="animate-spin" size={16} /> : "Save Reflection"}
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
                    <h4 className="font-black text-xs uppercase tracking-widest mb-2 text-slate-900">The Aim</h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-pretty">The sole purpose is for the will of God to find expression in your territory.</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <Zap className="text-indigo-600 mb-3" size={24} />
                    <h4 className="font-black text-xs uppercase tracking-widest mb-2 text-slate-900">The Result</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">Purity, Sanctification, and a measure of the Spirit of the Lord [Power].</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <ScrollText className="text-emerald-600 mb-3" size={24} />
                    <h4 className="font-black text-xs uppercase tracking-widest mb-2 text-slate-900">The Reward</h4>
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
                    <h4 className="font-black text-orange-400 uppercase text-xs tracking-widest mb-4 italic">The Puritan Identity</h4>
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
                    <div className="bg-indigo-50 p-5 rounded-2xl text-center border border-indigo-100">
                      <p className="text-[10px] font-black uppercase text-indigo-400">Duration</p>
                      <p className="text-xs font-bold text-indigo-900 mt-1">21 or 40 Days</p>
                    </div>
                    <div className="bg-orange-50 p-5 rounded-2xl text-center border border-orange-100">
                      <p className="text-[10px] font-black uppercase text-orange-500">Type</p>
                      <p className="text-xs font-bold text-orange-900 mt-1">Dry Fast</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl text-center border border-slate-200">
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
                  <div className="bg-indigo-600 p-8 rounded-[32px] text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-indigo-200">
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

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-orange-600 font-black uppercase tracking-widest text-[10px] bg-orange-50 px-2 py-1 rounded">
              {currentTopic.title}
            </span>
            <button 
  onClick={() => setIsVisionOpen(true)}
  className="group relative flex items-center gap-2 bg-white text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight hover:ring-2 hover:ring-orange-500 transition-all border border-slate-200 shadow-sm"
>
  {/* The Pulse Signal Animation */}
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
  </span>
  
  Read The Forge Mandate
  <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
</button>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">Spiritual Journey</h1>
          <p className="text-slate-500 mt-2 text-base md:text-lg font-medium italic">
            Focus: {currentTopic.focus}
          </p>
        </div>
        <div className="bg-orange-500 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-100 whitespace-nowrap">
          <Flame size={18} fill="currentColor" />
          Day {selectedDay} of 21
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon size={18} className="text-indigo-600" />
              Fast Calendar
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jan 2026</span>
          </div>
          
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {['S','M','T','W','T','F','S'].map((label, i) => (
              <div key={i} className="text-center text-[9px] font-black text-slate-300 uppercase pb-1">{label}</div>
            ))}

            {fastDays.map((day) => {
              const isActive = selectedDay === day;
              const hasLog = journalLogs.some(l => l.day_number === day);
              
              // NEW DATE LOGIC:
              // Creates a real date object starting Jan 12, 2026
              const calendarDate = new Date(2026, 0, 12); 
              calendarDate.setDate(calendarDate.getDate() + day - 1);
              
              const dayOfMonth = calendarDate.getDate();
              const monthName = calendarDate.toLocaleString('default', { month: 'short' });
              const dayName = weekdays[calendarDate.getDay()];

              return (
                <button 
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square rounded-xl md:rounded-2xl flex flex-col items-center justify-center transition-all duration-200 border
                    ${isActive 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105 z-10' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}
                  `}
                >
                  <span className={`text-[7px] font-black uppercase mb-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-300'}`}>
                    {dayName}
                  </span>
                  <span className="text-base md:text-lg font-bold">{dayOfMonth}</span>
                  
                  {/* Monthly Indicator for Crossover Days */}
                  <span className={`text-[6px] font-black uppercase ${isActive ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {monthName}
                  </span>

                  {hasLog && !isActive && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Protocol Sidebar */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-indigo-400 uppercase italic tracking-tighter">
            <Clock size={18} /> Forge Protocol
          </h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">01</div>
              <div>
                <p className="font-bold text-sm text-white">Dry Fast Window</p>
                <p className="text-orange-400 text-[10px] font-black uppercase mt-1">12:00 AM — 3:00 PM</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">02</div>
              <div>
                <p className="font-bold text-sm text-white">Morning Prayer</p>
                <p className="text-slate-400 text-[10px] font-black uppercase mt-1">{currentTopic.focus}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsJournalModalOpen(true)}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              <PenTool size={16} /> Journal Day {selectedDay}
            </button>
            <button 
              onClick={scrollToArchive}
              className="w-full bg-white/5 text-slate-400 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
            >
              View History
            </button>
          </div>
        </div>
      </div>

      {/* DEVOTIONAL VIEW */}
      <div id="devotional-view" className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm mb-16">
        <div className="bg-indigo-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={24} className="text-indigo-200" />
            <span className="uppercase tracking-[0.2em] text-[10px] font-black text-indigo-200">Daily Bread</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black leading-tight uppercase italic tracking-tighter">
            {dailyFocus?.title || `Day ${selectedDay}: ${currentTopic.focus}`}
          </h2>
          {/* Explicit white text for scripture */}
          <p className="mt-4 text-white text-xl md:text-2xl font-serif italic border-l-4 border-orange-500 pl-4">
            {dailyFocus?.scripture || 'Scripture loading...'}
          </p>
        </div>
        
        <div className="p-8 md:p-12 bg-white relative">
          <Quote className="absolute top-4 right-8 text-slate-50 w-24 h-24 -z-0" />
          {/* High contrast text for the devotional body */}
          <p className="relative z-10 text-slate-800 leading-relaxed text-xl md:text-2xl font-serif">
            {dailyFocus?.devotional ? `"${dailyFocus.devotional}"` : `Take time today to meditate on the theme of ${currentTopic.focus.toLowerCase()}.`}
          </p>
        </div>
      </div>

      {/* ARCHIVE */}
      <div id="journal-archive" className="pt-12 border-t border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900 uppercase italic flex items-center gap-3">
            <History className="text-orange-500" /> Your Forged Journey
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{journalLogs.length} Entries</span>
        </div>

        {journalLogs.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-serif italic">Your journal archive is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {journalLogs.map((log) => (
              <div key={log.id} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-orange-200 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                    Day {log.day_number}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                {/* Fixed line height and color for mobile readability */}
                <p className="text-slate-800 font-serif italic text-lg leading-relaxed">
                  "{log.notes}"
                </p>
                <button 
                  onClick={() => handleViewPastDay(log.day_number)}
                  className="mt-6 text-[10px] font-black uppercase text-indigo-600 tracking-widest"
                >
                   View Focus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </main>
  );
}