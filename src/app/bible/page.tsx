"use client"

import { useState, useEffect, Suspense, useRef } from 'react';
import { 
  BookOpen, ChevronRight, ChevronLeft, Search, 
  Loader2, Flame, Menu, X, Settings, Type,
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

const TRANSLATIONS = [
  { id: 'kjv', name: 'King James' },
  { id: 'web', name: 'World English' },
  { id: 'bbe', name: 'Basic English' }
];

function BibleContent() {
  const searchParams = useSearchParams();
  const [currentBook, setCurrentBook] = useState("John");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [bibleContent, setBibleContent] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false); // Default to false for instant cache feel
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'books' | 'chapters'>('books');
  const [searchQuery, setSearchQuery] = useState("");
  const [translation, setTranslation] = useState('kjv');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const initialized = useRef(false);

  const loadChapter = async (book: string, chapter: number, trans: string) => {
    const searchBook = book.toLowerCase() === 'psalm' ? 'Psalms' : book;
    const cacheKey = `b_${trans}_${searchBook}_${chapter}`;
    
    // INSTANT CACHE CHECK
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setBibleContent(JSON.parse(cached));
      setCurrentBook(searchBook);
      setCurrentChapter(chapter);
      window.scrollTo({ top: 0, behavior: 'instant' });
      setLoading(false);
      return;
    }

    // ONLY SHOW LOADING IF NOT IN CACHE
    setLoading(true);
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(searchBook)}+${chapter}?translation=${trans}`);
      const data = await res.json();
      if (data.verses) {
        setBibleContent(data.verses);
        setCurrentBook(searchBook);
        setCurrentChapter(chapter);
        localStorage.setItem(cacheKey, JSON.stringify(data.verses));
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc && !initialized.current) {
      const decoded = decodeURIComponent(loc);
      const lastSpace = decoded.lastIndexOf(' ');
      if (lastSpace !== -1) {
        let b = decoded.substring(0, lastSpace).trim();
        const c = parseInt(decoded.substring(lastSpace + 1).split(':')[0]);
        if (!BIBLE_DATA[b] && BIBLE_DATA[b + 's']) b += 's';
        if (BIBLE_DATA[b]) {
          loadChapter(b, c, translation);
          initialized.current = true;
          return;
        }
      }
    }
    if (!initialized.current) {
      loadChapter("John", 1, translation);
      initialized.current = true;
    }
  }, [searchParams, translation]);

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
          setCurrentBook(parts.join(' '));
          setCurrentChapter(chap);
        }
      }
    } catch (e) { alert("Not found"); }
    setLoading(false);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-slate-900 relative">
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-slate-950 p-4 flex justify-between items-center sticky top-0 z-[60] h-16">
        <div className="flex items-center gap-2 text-white">
          <BookOpen size={18} className="text-orange-500" />
          <span className="font-black uppercase text-sm">Forge Bible</span>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-white"><Settings size={20}/></button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white">{isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}</button>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-full md:w-72 bg-slate-50 border-r border-slate-200 transform transition-transform duration-150 md:translate-x-0 md:static flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4">
            <form onSubmit={handleSearch} className="relative">
                <input type="text" placeholder="Search John 3:16..." className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-orange-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            </form>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
            {viewMode === 'books' ? (
                Object.keys(BIBLE_DATA).map((book) => (
                    <button key={book} onClick={() => { setCurrentBook(book); setViewMode('chapters'); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold mb-1 ${currentBook === book ? 'bg-orange-500 text-white' : 'hover:bg-slate-200'}`}>{book}</button>
                ))
            ) : (
                <div className="px-2">
                    <button onClick={() => setViewMode('books')} className="text-xs text-orange-600 mb-4 font-black flex items-center gap-1"><ChevronLeft size={14}/> BOOKS</button>
                    <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: BIBLE_DATA[currentBook] || 0 }, (_, i) => i + 1).map((chap) => (
                            <button key={chap} onClick={() => { loadChapter(currentBook, chap, translation); setIsSidebarOpen(false); }} className={`h-10 rounded-lg text-xs font-bold ${currentChapter === chap ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}`}>{chap}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </aside>

      {/* READER */}
      <section className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="bg-slate-50 border-b p-3 md:px-10 flex justify-between items-center z-40">
          <h1 className="font-black text-lg md:text-xl uppercase">{currentBook} <span className="text-orange-500">{currentChapter}</span></h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 bg-white border rounded-lg"><Type size={18} /></button>
            <div className="flex gap-1">
              <button onClick={() => { if (currentChapter > 1) loadChapter(currentBook, currentChapter - 1, translation) }} disabled={currentChapter <= 1} className="p-2 border rounded-lg disabled:opacity-30"><ChevronLeft size={18} /></button>
              <button onClick={() => { if (currentChapter < BIBLE_DATA[currentBook]) loadChapter(currentBook, currentChapter + 1, translation) }} disabled={currentChapter >= BIBLE_DATA[currentBook]} className="p-2 border rounded-lg disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>

        {isSettingsOpen && (
          <div className="absolute right-4 top-32 md:top-20 w-64 bg-white rounded-2xl shadow-2xl border p-5 z-[70]">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Translation</p>
              {TRANSLATIONS.map((t) => (
                <button key={t.id} onClick={() => { setTranslation(t.id); setIsSettingsOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold mb-1 ${translation === t.id ? 'bg-orange-500 text-white' : 'hover:bg-slate-50'}`}>{t.name}</button>
              ))}
              <p className="text-[10px] font-black uppercase text-slate-400 mt-4 mb-3">Text Size</p>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <button key={size} onClick={() => setFontSize(size)} className={`flex-1 py-1 text-xs font-bold rounded-lg ${fontSize === size ? 'bg-white shadow-sm' : ''}`}>{size}</button>
                ))}
              </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-12 pb-40">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
          ) : (
            <div className={`font-serif text-slate-800 ${fontSize === 'sm' ? 'text-base' : fontSize === 'lg' ? 'text-2xl' : 'text-xl'} leading-relaxed max-w-2xl mx-auto`}>
              <div className="mb-8 text-center uppercase">
                <span className="text-orange-500 font-sans font-black text-xs tracking-[0.3em]">{currentBook}</span>
                <h2 className="text-5xl font-black">{currentChapter}</h2>
              </div>
              {bibleContent.map((v, i) => (
                <span key={i}><sup className="text-orange-500 font-sans font-bold mr-1 text-[10px]">{v.verse}</sup>{v.text} </span>
              ))}
            </div>
          )}
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