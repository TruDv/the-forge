"use client"

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { 
  BookOpen, ChevronRight, ChevronLeft, Search, 
  Loader2, Flame, Menu, X, ArrowRight, Settings, Type,
  Languages, Check
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const BIBLE_DATA: { [key: string]: number } = {
  "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
  "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36, "Ezra": 10,
  "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150, "Proverbs": 31,
  "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66, "Jeremiah": 52,
  "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14, "Joel": 3,
  "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3, "Habakkuk": 3,
  "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4, "Matthew": 28,
  "Mark": 16, "Luke": 24, "John": 21, "Acts": 28, "Romans": 16,
  "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6,
  "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13,
  "James": 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1, "3 John": 1,
  "Jude": 1, "Revelation": 22
};

const RED_LETTER_BOOKS = ["Matthew", "Mark", "Luke", "John", "Acts", "Revelation"];
const TRANSLATIONS = [
  { id: 'web', name: 'World English' },
  { id: 'kjv', name: 'King James' },
  { id: 'bbe', name: 'Basic English' }
];

function BibleContent() {
  const searchParams = useSearchParams();
  const [currentBook, setCurrentBook] = useState("John");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [bibleContent, setBibleContent] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'books' | 'chapters'>('books');
  const [searchQuery, setSearchQuery] = useState("");
  const [translation, setTranslation] = useState('kjv');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const initialized = useRef(false);

  const fetchChapter = useCallback(async (book: string, chapter: number, trans: string) => {
    setLoading(true);
    const searchBook = book.toLowerCase() === 'psalm' ? 'Psalms' : book;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(
        `https://bible-api.com/${encodeURIComponent(searchBook)}+${chapter}?translation=${trans}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (data.verses) {
        setBibleContent(data.verses);
        setCurrentBook(searchBook);
        setCurrentChapter(chapter);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error("Bible fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc && !initialized.current) {
      const decoded = decodeURIComponent(loc);
      const lastSpace = decoded.lastIndexOf(' ');
      if (lastSpace !== -1) {
        let book = decoded.substring(0, lastSpace).trim();
        const chap = parseInt(decoded.substring(lastSpace + 1).split(':')[0]);
        if (!BIBLE_DATA[book] && BIBLE_DATA[book + 's']) book = book + 's';
        if (BIBLE_DATA[book] && !isNaN(chap)) {
          fetchChapter(book, chap, translation);
          initialized.current = true;
          return;
        }
      }
    }
    if (!initialized.current) {
      fetchChapter("John", 1, translation);
      initialized.current = true;
    }
  }, [searchParams, fetchChapter, translation]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://bible-api.com/${searchQuery}?translation=${translation}`);
      const data = await res.json();
      if (data.verses) {
          setBibleContent(data.verses);
          if (data.reference) {
              const parts = data.reference.split(' ');
              const chapPart = parts.pop();
              const chap = parseInt(chapPart.split(':')[0]);
              const book = parts.join(' ');
              setCurrentBook(book);
              setCurrentChapter(chap);
          }
      }
    } catch (err) { alert("Reference not found."); }
    setLoading(false);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-slate-900 overflow-hidden relative">
      
      {/* MOBILE HEADER - Fixed Z-Index */}
      <div className="md:hidden bg-slate-950 p-4 flex justify-between items-center sticky top-0 z-[60] shadow-md h-16">
        <div className="flex items-center gap-2 text-white">
          <BookOpen size={18} className="text-orange-500" />
          <span className="font-black tracking-tighter uppercase text-sm">Forge Bible</span>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-white p-1"><Settings size={20}/></button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-1">{isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}</button>
        </div>
      </div>

      {/* SIDEBAR - Fixed Search Bar Placement */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-full md:w-72 bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 md:translate-x-0 md:static flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Desktop Title */}
        <div className="p-6 border-b border-slate-200 hidden md:flex items-center justify-between">
          <h2 className="text-lg font-black italic flex items-center gap-2 text-slate-900">
            <BookOpen size={20} className="text-orange-500" /> NAVIGATE
          </h2>
        </div>

        {/* SEARCH BAR - Made sure it's not "pushed up" */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 md:mt-0 mt-2">
            <form onSubmit={handleSearch} className="relative group">
                <input 
                  type="text" 
                  placeholder="Jump to John 3:16..." 
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
                <Search className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-orange-500" size={16} />
            </form>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
            {viewMode === 'books' ? (
                Object.keys(BIBLE_DATA).map((book) => (
                    <button key={book} onClick={() => { setCurrentBook(book); setViewMode('chapters'); }} className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-bold flex justify-between items-center transition-all ${currentBook === book ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                      {book} <ChevronRight size={14} />
                    </button>
                ))
            ) : (
                <div className="px-2 pb-10">
                    <button onClick={() => setViewMode('books')} className="text-xs text-orange-600 mb-4 flex items-center gap-1 uppercase font-black p-2 bg-orange-50 rounded-lg"> <ChevronLeft size={14}/> Back to Books</button>
                    <h3 className="font-black text-xl mb-4 uppercase italic text-slate-900 border-l-4 border-orange-500 pl-3">{currentBook}</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: BIBLE_DATA[currentBook] || 0 }, (_, i) => i + 1).map((chap) => (
                            <button key={chap} onClick={() => { fetchChapter(currentBook, chap, translation); setIsSidebarOpen(false); }} className={`h-12 rounded-xl text-[14px] font-black transition-all ${currentChapter === chap ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>{chap}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </aside>

      {/* READER AREA */}
      <section className="flex-1 flex flex-col h-screen bg-white">
        
        {/* Settings Bar */}
        <div className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200 p-3 md:px-10 flex justify-between items-center z-40">
          <div className="flex flex-col">
              <h1 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {currentBook} <span className="text-orange-500">{currentChapter}</span>
              </h1>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
                {TRANSLATIONS.find(t => t.id === translation)?.name}
              </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-lg border transition-all ${isSettingsOpen ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
              <Type size={18} />
            </button>
            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button onClick={() => { if (currentChapter > 1) fetchChapter(currentBook, currentChapter - 1, translation) }} disabled={currentChapter <= 1} className="p-1.5 hover:bg-white rounded-md disabled:opacity-30"><ChevronLeft size={18} /></button>
              <button onClick={() => { if (currentChapter < BIBLE_DATA[currentBook]) fetchChapter(currentBook, currentChapter + 1, translation) }} disabled={currentChapter >= BIBLE_DATA[currentBook]} className="p-1.5 hover:bg-white rounded-md disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>

        {/* Display Settings Dropdown */}
        {isSettingsOpen && (
          <div className="absolute right-4 top-32 md:top-20 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-[70] animate-in fade-in slide-in-from-top-2">
              <div className="mb-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><Languages size={14}/> Translation</p>
                  <div className="grid grid-cols-1 gap-1">
                    {TRANSLATIONS.map((t) => (
                      <button key={t.id} onClick={() => { setTranslation(t.id); setIsSettingsOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex justify-between items-center ${translation === t.id ? 'bg-orange-500 text-white' : 'hover:bg-slate-50'}`}>
                        {t.name} {translation === t.id && <Check size={14}/>}
                      </button>
                    ))}
                  </div>
              </div>
              <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><Type size={14}/> Text Size</p>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['sm', 'md', 'lg'] as const).map((size) => (
                      <button key={size} onClick={() => setFontSize(size)} className={`flex-1 py-1.5 text-xs font-black uppercase rounded-lg transition-all ${fontSize === size ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>{size}</button>
                    ))}
                  </div>
              </div>
          </div>
        )}

        {/* BIBLE TEXT CONTENT */}
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="max-w-3xl mx-auto p-6 md:p-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={40} />
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Opening Scroll...</p>
              </div>
            ) : (
              <div className={`font-serif text-slate-800 transition-all ${fontSize === 'sm' ? 'text-base' : fontSize === 'lg' ? 'text-2xl' : 'text-lg md:text-xl'} leading-relaxed`}>
                <div className="mb-10 text-center border-b border-slate-100 pb-10">
                  <span className="text-orange-500 font-sans font-black text-xs uppercase tracking-[0.4em] block mb-2">{currentBook}</span>
                  <h2 className="text-6xl font-black text-slate-900 tracking-tighter">{currentChapter}</h2>
                </div>

                {bibleContent.map((verse, index) => (
                  <span key={index} className="inline group">
                    <sup className="text-orange-500 font-sans font-black mr-1 text-[10px] opacity-60">{verse.verse}</sup>
                    <span className="selection:bg-orange-100">{verse.text} </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function BibleReader() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>}>
      <BibleContent />
    </Suspense>
  );
}