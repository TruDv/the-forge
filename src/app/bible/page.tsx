"use client"

import { useState, useEffect, useCallback, Suspense } from 'react';
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
  { id: 'web', name: 'World English Bible' },
  { id: 'kjv', name: 'King James Version' },
  { id: 'bbe', name: 'Basic English Bible' }
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
  
  // Display States
  const [translation, setTranslation] = useState('kjv');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchChapter = useCallback(async (book: string, chapter: number, trans: string) => {
    setLoading(true);
    const searchBook = book.toLowerCase() === 'psalm' ? 'Psalms' : book;
    
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(searchBook)}+${chapter}?translation=${trans}`);
      const data = await res.json();
      if (data.verses) {
        setBibleContent(data.verses);
        setCurrentBook(searchBook);
        setCurrentChapter(chapter);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error("Bible fetch error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc) {
      const decoded = decodeURIComponent(loc);
      const lastSpace = decoded.lastIndexOf(' ');
      if (lastSpace !== -1) {
        let book = decoded.substring(0, lastSpace).trim();
        const chap = parseInt(decoded.substring(lastSpace + 1).split(':')[0]);
        if (!BIBLE_DATA[book] && BIBLE_DATA[book + 's']) book = book + 's';
        if (BIBLE_DATA[book] && !isNaN(chap)) {
          fetchChapter(book, chap, translation);
          return;
        }
      }
    }
    fetchChapter("John", 1, translation);
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
              const chap = parseInt(parts.pop().split(':')[0]);
              const book = parts.join(' ');
              setCurrentBook(book);
              setCurrentChapter(chap);
          }
      }
    } catch (err) { alert("Reference not found."); }
    setLoading(false);
  };

  const getFontSizeClass = () => {
    if (fontSize === 'sm') return 'text-base leading-[1.8]';
    if (fontSize === 'lg') return 'text-2xl leading-[2.2]';
    return 'text-lg md:text-xl leading-[2]';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-slate-900 overflow-hidden">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-slate-950 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 text-white">
          <BookOpen size={18} className="text-orange-500" />
          <span className="font-black tracking-tighter uppercase text-sm">Forge Bible</span>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-white"><Settings size={20}/></button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white"><Menu size={20}/></button>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 md:translate-x-0 md:static flex flex-col ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-black italic flex items-center gap-2 text-slate-900">
            <BookOpen size={20} className="text-orange-500" /> NAVIGATE
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 bg-slate-200 rounded-full"><X size={16}/></button>
        </div>

        <div className="p-4">
            <form onSubmit={handleSearch} className="relative group">
                <input type="text" placeholder="Jump to John 3:16..." className="w-full bg-white border border-slate-200 text-sm rounded-xl py-2.5 pl-9 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-orange-500" size={14} />
            </form>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
            {viewMode === 'books' ? (
                Object.keys(BIBLE_DATA).map((book) => (
                    <button key={book} onClick={() => { setCurrentBook(book); setViewMode('chapters'); }} className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-bold flex justify-between items-center transition-all ${currentBook === book ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-200'}`}>
                      {book} <ChevronRight size={12} className={currentBook === book ? 'opacity-100' : 'opacity-0'} />
                    </button>
                ))
            ) : (
                <div className="px-2 pb-10">
                    <button onClick={() => setViewMode('books')} className="text-[10px] text-slate-400 mb-4 flex items-center gap-1 uppercase font-black hover:text-orange-600 transition-colors"> <ChevronLeft size={12}/> Books</button>
                    <h3 className="font-black text-xl mb-4 uppercase italic text-slate-900 border-l-4 border-orange-500 pl-3">{currentBook}</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: BIBLE_DATA[currentBook] || 0 }, (_, i) => i + 1).map((chap) => (
                            <button key={chap} onClick={() => { fetchChapter(currentBook, chap, translation); setIsSidebarOpen(false); }} className={`h-10 rounded-xl text-[13px] font-black transition-all ${currentChapter === chap ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>{chap}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </aside>

      {/* MAIN READER AREA */}
      <section className="flex-1 flex flex-col h-screen bg-white">
        
        {/* TOP BAR: Controls & Info */}
        <div className="bg-slate-50/50 backdrop-blur-md border-b border-slate-100 p-4 md:px-10 md:py-4 flex justify-between items-center z-30">
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                  {currentBook} <span className="text-orange-500">{currentChapter}</span>
                </h1>
                <div className="flex items-center gap-2">
                   <Languages size={10} className="text-slate-400"/>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{TRANSLATIONS.find(t => t.id === translation)?.name}</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Display Settings Toggle */}
            <div className="relative">
               <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2.5 rounded-full transition-all border ${isSettingsOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                 <Type size={18} />
               </button>

               {isSettingsOpen && (
                 <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="mb-6">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2"><Languages size={12}/> Translation</p>
                       <div className="space-y-1.5">
                          {TRANSLATIONS.map((t) => (
                             <button key={t.id} onClick={() => setTranslation(t.id)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex justify-between items-center transition-all ${translation === t.id ? 'bg-orange-50 text-orange-600' : 'hover:bg-slate-50 text-slate-600'}`}>
                               {t.name} {translation === t.id && <Check size={14}/>}
                             </button>
                          ))}
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2"><Type size={12}/> Font Size</p>
                       <div className="flex bg-slate-50 p-1 rounded-xl">
                          {(['sm', 'md', 'lg'] as const).map((size) => (
                            <button key={size} onClick={() => setFontSize(size)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${fontSize === size ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                              {size}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

            <div className="flex gap-1.5">
              <button onClick={() => { if (currentChapter > 1) fetchChapter(currentBook, currentChapter - 1, translation) }} disabled={currentChapter <= 1} className="p-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-20 transition-all"><ChevronLeft size={18} /></button>
              <button onClick={() => { if (currentChapter < BIBLE_DATA[currentBook]) fetchChapter(currentBook, currentChapter + 1, translation) }} disabled={currentChapter >= BIBLE_DATA[currentBook]} className="p-2.5 rounded-full bg-slate-900 text-white hover:bg-orange-600 shadow-lg transition-all"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>

        {/* READER SCROLL AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-none pb-20">
          <div className="max-w-3xl mx-auto p-8 md:p-20">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="animate-spin text-orange-500" size={32} />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Illuminating the Word</p>
              </div>
            ) : (
              <div className={`font-serif text-slate-800 transition-all duration-300 ${getFontSizeClass()}`}>
                {/* Chapter Heading for better design */}
                <div className="mb-12 text-center">
                  <span className="text-orange-500 font-sans font-black text-xs uppercase tracking-[0.4em] block mb-2">{currentBook}</span>
                  <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">{currentChapter}</h2>
                </div>

                {bibleContent.map((verse, index) => {
                  const isRedLetter = RED_LETTER_BOOKS.includes(currentBook) && (verse.text.includes('"') || verse.text.includes("'"));
                  return (
                    <span key={index} className="relative group rounded hover:bg-orange-50/30 transition-colors inline">
                      <sup className="text-orange-400 font-sans font-black mr-2 text-[10px] tracking-tighter opacity-70">{verse.verse}</sup>
                      <span className={`${isRedLetter ? 'text-rose-900' : 'text-slate-800'}`}>{verse.text}</span>{" "}
                    </span>
                  )
                })}
              </div>
            )}
            
            {!loading && currentChapter < BIBLE_DATA[currentBook] && (
              <div className="mt-24 pt-10 border-t border-slate-100 flex flex-col items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Up Next</span>
                <button onClick={() => fetchChapter(currentBook, currentChapter + 1, translation)} className="group flex flex-col items-center gap-2">
                   <h4 className="text-2xl font-black text-slate-900 group-hover:text-orange-600 transition-colors uppercase tracking-tighter">{currentBook} {currentChapter + 1}</h4>
                   <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                   </div>
                </button>
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
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>}>
      <BibleContent />
    </Suspense>
  );
}