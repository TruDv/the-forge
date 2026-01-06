"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, ChevronRight, ChevronLeft, Search, 
  Loader2, Flame, Menu, X, ArrowRight, List, Grid
} from 'lucide-react';

// Standard 66 Books of the Bible with Chapter Counts (approximate for UI)
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

export default function BibleReader() {
  // Navigation State
  const [currentBook, setCurrentBook] = useState("John");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'books' | 'chapters'>('books');
  
  // Content State
  const [bibleContent, setBibleContent] = useState<any[]>([]); // Array of verses
  const [loading, setLoading] = useState(true);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- FETCH SCRIPTURE ---
  const fetchChapter = async (book: string, chapter: number) => {
    setLoading(true);
    setSearchResults([]); // Clear search if navigating
    setSearchQuery("");   // Clear search bar
    
    try {
      // Using 'web' (World English Bible) or 'kjv' (King James Version)
      // The API returns an array of verses if we ask for the whole chapter
      const res = await fetch(`https://bible-api.com/${book}+${chapter}?translation=web`);
      const data = await res.json();
      
      if (data.verses) {
        setBibleContent(data.verses);
        setCurrentBook(book);
        setCurrentChapter(chapter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error("Failed to fetch scripture", err);
    }
    setLoading(false);
  };

  // --- SEARCH HANDLER ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setIsSearching(true);
    try {
      // Note: bible-api.com search is limited, but this endpoint works for verse lookups
      // If user types "John 3:16", we fetch that specific verse
      const res = await fetch(`https://bible-api.com/${searchQuery}?translation=web`);
      const data = await res.json();
      
      if (data.verses) {
        // If it's a specific reference, just load it as content
        setBibleContent(data.verses);
        // Try to parse book/chapter from response to update header
        if (data.reference) {
            // Very basic parsing, API usually gives "John 3:16"
            // We settle for displaying the result rather than full navigation update for complex searches
        }
        setIsSearching(false); 
      }
    } catch (err) {
      alert("Verse not found. Try format 'John 3:16'");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChapter(currentBook, currentChapter);
  }, []);

  // --- NAVIGATION ---
  const handleNext = () => {
    // Check if we are at the end of the book
    const maxChapters = BIBLE_DATA[currentBook];
    if (currentChapter < maxChapters) {
      fetchChapter(currentBook, currentChapter + 1);
    } else {
        // Simple logic: Go to next book? (Optional, kept simple for now)
        alert("End of book.");
    }
  };

  const handlePrev = () => {
    if (currentChapter > 1) {
      fetchChapter(currentBook, currentChapter - 1);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden bg-slate-950 p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2 text-white">
          <BookOpen size={20} className="text-orange-500" />
          <span className="font-black italic">THE WORD</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-2">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out border-r border-white/5
        md:translate-x-0 md:static md:h-screen flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/10 hidden md:block">
          <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2 text-white">
            <Flame size={20} className="text-orange-500" fill="currentColor" />
            SCRIPTURE
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">Sword of the Spirit</p>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/5">
            <form onSubmit={handleSearch} className="relative">
                <input 
                    type="text" 
                    placeholder="Search (e.g. John 3:16)" 
                    className="w-full bg-slate-800 text-sm text-white placeholder-slate-500 rounded-lg py-2.5 pl-9 pr-3 outline-none focus:ring-1 focus:ring-orange-500 border border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            </form>
        </div>

        {/* View Toggle (Books vs Chapters) */}
        {viewMode === 'chapters' && (
            <button 
                onClick={() => setViewMode('books')}
                className="flex items-center gap-2 px-6 py-3 text-orange-400 hover:text-orange-300 text-xs font-bold uppercase tracking-widest border-b border-white/5"
            >
                <ChevronLeft size={14} /> Back to Books
            </button>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
            {viewMode === 'books' ? (
                // LIST OF BOOKS
                <div className="space-y-0.5">
                    {Object.keys(BIBLE_DATA).map((book) => (
                        <button
                            key={book}
                            onClick={() => {
                                setCurrentBook(book);
                                setViewMode('chapters');
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all flex justify-between items-center group ${
                                currentBook === book ? 'bg-orange-600/10 text-orange-500' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            {book}
                            <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${currentBook === book ? 'opacity-100' : ''}`} />
                        </button>
                    ))}
                </div>
            ) : (
                // GRID OF CHAPTERS
                <div className="p-2">
                    <h3 className="text-white font-black text-lg mb-4 px-2">{currentBook}</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: BIBLE_DATA[currentBook] }, (_, i) => i + 1).map((chap) => (
                            <button
                                key={chap}
                                onClick={() => {
                                    fetchChapter(currentBook, chap);
                                    setIsSidebarOpen(false); // Close mobile menu
                                }}
                                className={`h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                                    currentChapter === chap 
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {chap}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </aside>

      {/* --- MAIN READER AREA --- */}
      <section className="flex-1 h-screen overflow-y-auto bg-slate-50">
        
        {/* Top Navigation Bar */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-200 p-4 md:px-8 md:py-5 flex justify-between items-center z-30 shadow-sm">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Sidebar Toggle Button (if needed again) */}
            <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-baseline gap-2">
                {currentBook} 
                <span className="text-orange-500 text-3xl md:text-4xl">{currentChapter}</span>
                </h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:inline-block">
                    World English Bible
                </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handlePrev} 
              disabled={currentChapter <= 1}
              className="w-10 h-10 md:w-auto md:h-auto md:px-5 md:py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase"
            >
              <ChevronLeft size={16} /> <span className="hidden md:inline">Prev</span>
            </button>
            <button 
              onClick={handleNext}
              disabled={currentChapter >= BIBLE_DATA[currentBook]}
              className="w-10 h-10 md:w-auto md:h-auto md:px-5 md:py-2.5 rounded-xl bg-slate-900 text-white hover:bg-orange-600 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase shadow-xl shadow-slate-900/10"
            >
              <span className="hidden md:inline">Next</span> <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* The Scripture Content */}
        <div className="max-w-3xl mx-auto p-6 md:p-12 pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="animate-spin text-orange-500" size={48} />
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Opening the Scroll...</p>
            </div>
          ) : (
            <div className="font-serif text-slate-800 leading-[2] text-lg md:text-xl">
              {/* If it's a search result or full chapter, we map the verses */}
              {bibleContent.map((verse: any, index: number) => {
                // RED LETTER LOGIC: Rough check if it's a Gospel book
                const isGospel = RED_LETTER_BOOKS.includes(currentBook);
                // Very basic heuristic: If it looks like speech in a Gospel, we tint it.
                // Note: API doesn't provide red-letter metadata, so we apply a subtle class for reading feel.
                
                return (
                  <span key={index} className="relative group">
                    {/* Verse Number */}
                    <sup className="text-[10px] font-sans font-bold text-orange-400 mr-1 select-none opacity-60 group-hover:opacity-100 transition-opacity">
                      {verse.verse}
                    </sup>
                    
                    {/* Verse Text */}
                    <span className={`hover:bg-orange-50 transition-colors rounded px-0.5 ${isGospel ? 'text-slate-800' : 'text-slate-800'}`}>
                      {verse.text} 
                    </span>
                    {/* Spacing */}
                    {" "}
                  </span>
                )
              })}
            </div>
          )}

          {/* Footer of Reader */}
          {!loading && (
            <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-400 font-medium">Public Domain (WEB Translation)</p>
              
              {currentChapter < BIBLE_DATA[currentBook] ? (
                  <button 
                    onClick={handleNext}
                    className="text-orange-600 font-black text-sm uppercase tracking-widest hover:underline flex items-center gap-2"
                  >
                    Read Chapter {currentChapter + 1} <ArrowRight size={16} />
                  </button>
              ) : (
                  <span className="text-slate-300 text-xs font-bold uppercase">End of Book</span>
              )}
            </div>
          )}
        </div>

      </section>
    </main>
  );
}