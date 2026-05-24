import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlayCircle, Globe, Bot, Heart, History, Users, Search, Film, Tv, ListCollapse, ChevronDown, Check, Trash2, Smile, Activity, Star, Play, Download } from "lucide-react";

import { MediaItem } from "./types";
import ProfileSelector from "./components/ProfileSelector";
import AIChatBot from "./components/AIChatBot";
import SubtitleDownloader from "./components/SubtitleDownloader";
import HeroSection from "./components/HeroSection";
import VideoPlayer from "./components/VideoPlayer";

// Standard genre and language aliases matching user's template dropdown configs
const GENRES = [
  { id: 28, label: "Action (ක්‍රියාදාම)" },
  { id: 12, label: "Adventure (ත්‍රාසජනක)" },
  { id: 16, label: "Animation (කාටූන්)" },
  { id: 35, label: "Comedy (විකට)" },
  { id: 80, label: "Crime (අපරාධ)" },
  { id: 18, label: "Drama (නාට්‍ය)" },
  { id: 14, label: "Fantasy (මනඃකල්පිත)" },
  { id: 27, label: "Horror (භීෂණ)" },
  { id: 10749, label: "Romance (ආදර කතා)" },
  { id: 878, label: "Sci-Fi (විද්‍යා ප්‍රබන්ධ)" },
  { id: 53, label: "Thriller (කුතුහලයෙන්)" },
];

const LANGUAGES = [
  { code: "en", label: "English (ඉංග්‍රීසි)" },
  { code: "hi", label: "Hindi (හින්දි)" },
  { code: "ta", label: "Tamil (දෙමළ)" },
  { code: "te", label: "Telugu (තෙළිඟු)" },
  { code: "ml", label: "Malayalam (මලයාලම්)" },
  { code: "ko", label: "Korean (කොරියානු)" },
  { code: "ja", label: "Japanese (ජපන්)" },
];

const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "Older"];

export default function App() {
  const [activeProfile, setActiveProfile] = useState<string>("");
  const [currentLang, setCurrentLang] = useState<"si" | "en">("si");
  const [activeSection, setActiveSection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdown, setSearchDropdown] = useState<MediaItem[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter conditions
  const [activeGenreFilter, setActiveGenreFilter] = useState<{ id: number; label: string } | null>(null);
  const [activeLangFilter, setActiveLangFilter] = useState<{ code: string; label: string } | null>(null);
  const [activeYearFilter, setActiveYearFilter] = useState<string | null>(null);

  // Active play state
  const [activePlayItem, setActivePlayItem] = useState<{
    id: number;
    type: "movie" | "tv";
    title: string;
    srtSi?: string;
    srtEn?: string;
  } | null>(null);

  // Saved client local state tracking
  const [myList, setMyList] = useState<MediaItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<MediaItem[]>([]);

  // Open dropdown configurations
  const [activeNavDropdown, setActiveNavDropdown] = useState<string | null>(null);

  const localText = {
    brand: "BATCLOUD",
    xlive: "XLIVE",
    all: { si: "මුල් පිටුව", en: "Home" },
    movies: { si: "චිත්‍රපට (Movies)", en: "Movies" },
    tv: { si: "ටීවී මාලා (TV)", en: "TV Shows" },
    genres: { si: "වර්ග (Genres)", en: "Genres" },
    languages: { si: "භාෂා (Languages)", en: "Languages" },
    years: { si: "වසර (Years)", en: "Years" },
    cast: { si: "නළු නිළියන් (Cast)", en: "Cast Archive" },
    mylist: { si: "මගේ ලැයිස්තුව", en: "My List" },
    history: { si: "නැරඹූ ඉතිහාසය", en: "History" },
    subFinder: { si: "උපසිරැසි සොයන්නා", en: "Sub Finder" },
    searchPh: { si: "සෙවීම... (Ctrl+K)", en: "Search shows... (Ctrl+K)" },
    changeProf: { si: "Profile මාරු කරන්න", en: "Switch Profile" },
    clearList: { si: "Watch List හිස් කරන්න", en: "Clear List" },
    footerCopyright: { si: "© 2026 Batcloud Xlive. සියලුම හිමිකම් ඇවිරිණි.", en: "© 2026 Batcloud Xlive. All rights reserved." },
    footerDisclaimer: {
      si: "මෙය අධ්‍යාපනික කටයුතු සදහා පෝට්ෆෝලියෝ ව්‍යාපෘතියක් පමණි. සියලුම දත්ත TMDB API මගින් සපයනු ලැබේ.",
      en: "This is a portfolio project designed solely for educational purposes. All metadata is supplied via TMDB API."
    },
    noResults: { si: "කිසිවක් සොයාගත නොහැකි විය.", en: "No matching titles found." },
    showingFilter: { si: "පෙරහන (Filter): ", en: "Filtered by: " },
    resetFilter: { si: "පෙරහන් ඉවත් කරන්න", en: "Clear Filters" },
    trendingRow: { si: "🔥 දැන් ජනප්‍රියම නිර්මාණ (Trending)", en: "🔥 Trending This Week" },
    moviesRow: { si: "🎬 ජනප්‍රිය සිනමා නිර්මාණ", en: "🎬 Popular Blockbuster Movies" },
    tvRow: { si: "📺 ජනප්‍රිය ටීවී මාලා", en: "📺 Popular TV Shows" },
    gridTitleMovies: { si: "සියලුම ජනප්‍රිය චිත්‍රපට", en: "Blockbuster Movies Catalogue" },
    gridTitleTV: { si: "සියලුම ජනප්‍රිය ටීවී මාලා", en: "Trending TV Shows Catalogue" }
  };

  // Load Saved list on profile activation
  useEffect(() => {
    const savedProf = localStorage.getItem("netflix_profile");
    if (savedProf) {
      setActiveProfile(savedProf);
    }
  }, []);

  useEffect(() => {
    if (!activeProfile) return;
    // Load watch list
    const storedList = localStorage.getItem(`my_list_v1_${activeProfile}`);
    if (storedList) {
      try {
        setMyList(JSON.parse(storedList));
      } catch (e) {
        setMyList([]);
      }
    } else {
      setMyList([]);
    }

    // Load History list
    const storedHistory = localStorage.getItem(`watch_history_v1_${activeProfile}`);
    if (storedHistory) {
      try {
        setWatchHistory(JSON.parse(storedHistory));
      } catch (e) {
        setWatchHistory([]);
      }
    } else {
      setWatchHistory([]);
    }
  }, [activeProfile]);

  // Handle hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("navSearchInput");
        if (input) input.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync state helpers
  const isInWatchList = (id: number) => {
    return myList.some(item => item.id.toString() === id.toString());
  };

  const onToggleWatchList = (item: MediaItem) => {
    let updatedList = [...myList];
    const targetId = item.id.toString();
    const isSaved = updatedList.some(i => i.id.toString() === targetId);

    if (isSaved) {
      updatedList = updatedList.filter(i => i.id.toString() !== targetId);
    } else {
      updatedList.unshift({
        id: item.id,
        title: item.title || item.name,
        name: item.title || item.name,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        media_type: item.media_type || "movie"
      });
    }

    setMyList(updatedList);
    localStorage.setItem(`my_list_v1_${activeProfile}`, JSON.stringify(updatedList));
  };

  const clearMyList = () => {
    setMyList([]);
    localStorage.removeItem(`my_list_v1_${activeProfile}`);
  };

  const removeHistoryItem = (id: number) => {
    const updated = watchHistory.filter(i => i.id !== id);
    setWatchHistory(updated);
    localStorage.setItem(`watch_history_v1_${activeProfile}`, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setWatchHistory([]);
    localStorage.removeItem(`watch_history_v1_${activeProfile}`);
  };

  // Dynamic TMDB Search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchDropdown([]);
      setShowSearchDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const resp = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(searchQuery.trim())}&api_key=5c6ec82a535bb9fb80b786387a055019`);
        if (resp.ok) {
          const data = await resp.json();
          const items = (data.results || [])
            .filter((item: any) => item.media_type !== "person" && item.poster_path)
            .slice(0, 8);
          setSearchDropdown(items);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error(err);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Profile Selector callback
  const handleSelectProfile = (name: string) => {
    localStorage.setItem("netflix_profile", name);
    setActiveProfile(name);
    // Refresh to home screen
    setActiveSection("all");
    setSearchQuery("");
  };

  // Direct trigger to stream inside theatre video player
  const handleTriggerDirectPlay = (
    titleString: string,
    mediaType: "movie" | "tv",
    season?: number,
    episode?: number,
    srtSi?: string,
    srtEn?: string
  ) => {
    // Generate simulated/proper TMDB ID matching user's download queries
    // First, let's search via TMDB to get ID, or fallback
    fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(titleString)}&api_key=5c6ec82a535bb9fb80b786387a055019`)
      .then(res => res.json())
      .then(data => {
        let itemId = 157336; // Default Interstellar
        if (data.results && data.results.length > 0) {
          const matched = data.results.find((r: any) => r.media_type !== "person");
          if (matched) itemId = matched.id;
        }
        
        setActivePlayItem({
          id: itemId,
          type: mediaType,
          title: titleString,
          srtSi,
          srtEn
        });
      })
      .catch(() => {
        setActivePlayItem({
          id: 157336,
          type: mediaType,
          title: titleString,
          srtSi,
          srtEn
        });
      });
  };

  const handleSelectCardPlay = (item: MediaItem, mediaTypeOverride?: string) => {
    const titleString = item.title || item.name || "Cinema Blockbuster";
    const typeDeduce = item.media_type || mediaTypeOverride || "movie";
    setActivePlayItem({
      id: item.id,
      type: typeDeduce as any,
      title: titleString
    });
  };

  const resetFilters = () => {
    setActiveGenreFilter(null);
    setActiveLangFilter(null);
    setActiveYearFilter(null);
  };

  return (
    <div className="bg-[#0a0a0b] text-white font-sans min-h-screen Selection:bg-red-600 overflow-x-hidden relative flex flex-col pt-18">
      
      {/* Dynamic Profile chooser cover */}
      <AnimatePresence>
        {!activeProfile && (
          <ProfileSelector onSelectProfile={handleSelectProfile} />
        )}
      </AnimatePresence>

      {/* Primary Sticky Header Navigation */}
      <nav className="fixed top-0 inset-x-0 w-full z-40 bg-[#0a0a0b]/95 border-b border-zinc-900 backdrop-blur-md py-3 px-4 md:px-12 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-7">
          {/* Logo brand */}
          <div
            onClick={() => {
              setActiveSection("all");
              resetFilters();
              setSearchQuery("");
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <PlayCircle className="text-red-600 w-8 h-8 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)] transition-transform group-hover:scale-105" />
            <span className="font-display font-[900] text-2xl tracking-tighter bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
              {localText.brand}
            </span>
            <span className="hidden sm:inline-block font-mono text-[9px] bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded text-purple-400 font-bold uppercase tracking-widest">
              {localText.xlive}
            </span>
          </div>

          {/* Links Row */}
          <ul className="hidden xl:flex items-center gap-5 text-xs font-black text-zinc-400">
            {/* Home link */}
            <li>
              <button
                onClick={() => {
                  setActiveSection("all");
                  resetFilters();
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1 cursor-pointer transition-colors ${
                  activeSection === "all" && !activeGenreFilter && !activeLangFilter ? "text-white border-b-2 border-red-600 pb-0.5" : "hover:text-red-500"
                }`}
              >
                <span>{localText.all[currentLang]}</span>
              </button>
            </li>

            {/* Movies grid link */}
            <li>
              <button
                onClick={() => {
                  setActiveSection("movieGrid");
                  resetFilters();
                  setSearchQuery("");
                }}
                className={`cursor-pointer transition-colors ${
                  activeSection === "movieGrid" ? "text-white border-b-2 border-red-600 pb-0.5" : "hover:text-red-500"
                }`}
              >
                <span>{localText.movies[currentLang]}</span>
              </button>
            </li>

            {/* TV Series grid link */}
            <li>
              <button
                onClick={() => {
                  setActiveSection("tvGrid");
                  resetFilters();
                  setSearchQuery("");
                }}
                className={`cursor-pointer transition-colors ${
                  activeSection === "tvGrid" ? "text-white border-b-2 border-red-600 pb-0.5" : "hover:text-red-500"
                }`}
              >
                <span>{localText.tv[currentLang]}</span>
              </button>
            </li>

            {/* Genres dropdown link */}
            <li className="relative">
              <button
                onClick={() => setActiveNavDropdown(prev => prev === "genre" ? null : "genre")}
                className="flex items-center gap-1 hover:text-red-500 cursor-pointer select-none font-black"
              >
                <span>{localText.genres[currentLang]}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>
              {activeNavDropdown === "genre" && (
                <div 
                  className="absolute top-full left-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 max-h-80 overflow-y-auto no-scrollbar z-50 flex flex-col gap-1 text-zinc-300"
                  onMouseLeave={() => setActiveNavDropdown(null)}
                >
                  {GENRES.map(g => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setActiveGenreFilter(g);
                        setActiveSection("all");
                        setActiveNavDropdown(null);
                      }}
                      className="w-full text-left py-2 px-3 text-xs font-semibold rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              )}
            </li>

            {/* Languages dropdown link */}
            <li className="relative">
              <button
                onClick={() => setActiveNavDropdown(prev => prev === "lang" ? null : "lang")}
                className="flex items-center gap-1 hover:text-red-500 cursor-pointer select-none font-black"
              >
                <span>{localText.languages[currentLang]}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>
              {activeNavDropdown === "lang" && (
                <div 
                  className="absolute top-full left-0 mt-3 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-zinc-300"
                  onMouseLeave={() => setActiveNavDropdown(null)}
                >
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setActiveLangFilter(l);
                        setActiveSection("all");
                        setActiveNavDropdown(null);
                      }}
                      className="w-full text-left py-2 px-3 text-xs font-semibold rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </li>

            {/* Years dropdown link */}
            <li className="relative">
              <button
                onClick={() => setActiveNavDropdown(prev => prev === "year" ? null : "year")}
                className="flex items-center gap-1 hover:text-red-500 cursor-pointer select-none font-black"
              >
                <span>{localText.years[currentLang]}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>
              {activeNavDropdown === "year" && (
                <div 
                  className="absolute top-full left-0 mt-3 w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-zinc-300"
                  onMouseLeave={() => setActiveNavDropdown(null)}
                >
                  {YEARS.map(y => (
                    <button
                      key={y}
                      onClick={() => {
                        setActiveYearFilter(y === "Older" ? "older" : y);
                        setActiveSection("all");
                        setActiveNavDropdown(null);
                      }}
                      className="w-full text-left py-2 px-3 text-xs font-semibold rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </li>

            {/* My List Page link */}
            <li>
              <button
                onClick={() => {
                  setActiveSection("mylist");
                  resetFilters();
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1 cursor-pointer transition-colors ${
                  activeSection === "mylist" ? "text-white border-b-2 border-red-600 pb-0.5" : "hover:text-red-500"
                }`}
              >
                <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                <span>{localText.mylist[currentLang]}</span>
              </button>
            </li>

            {/* History Link */}
            <li>
              <button
                onClick={() => {
                  setActiveSection("history");
                  resetFilters();
                  setSearchQuery("");
                }}
                className={`flex items-center gap-1 cursor-pointer transition-colors ${
                  activeSection === "history" ? "text-white border-b-2 border-red-600 pb-0.5" : "hover:text-red-500 font-semibold"
                }`}
              >
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>{localText.history[currentLang]}</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Search, Locale Language buttons */}
        <div className="flex items-center gap-3.5">
          {/* TMDB Search input search block */}
          <div className="relative">
            <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-full px-4 py-1.5 focus-within:border-red-600 transition-all duration-300 shadow-inner">
              <input
                id="navSearchInput"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={localText.searchPh[currentLang]}
                className="bg-transparent text-white text-xs md:text-sm focus:outline-none w-32 sm:w-44 md:w-60 leading-none uppercase tracking-wide font-black"
              />
              <Search className="w-4 h-4 text-zinc-500" />
            </div>

            {/* Live dropdown results menu */}
            {showSearchDropdown && searchDropdown.length > 0 && (
              <div className="absolute top-full mt-2 right-0 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 max-h-[380px] overflow-y-auto z-50 flex flex-col gap-1">
                {searchDropdown.map(item => {
                  const titleStr = item.title || item.name || "";
                  const yearStr = (item.release_date || item.first_air_date || "2026").substring(0, 4);
                  const ratingVal = item.vote_average ? item.vote_average.toFixed(1) : "8.0";
                  const posterSrc = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : "https://via.placeholder.com/100x150?text=Poster";

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        handleSelectCardPlay(item);
                        setSearchQuery("");
                        setShowSearchDropdown(false);
                      }}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-zinc-800"
                    >
                      <img src={posterSrc} alt="poster" className="w-10 h-14 object-cover rounded shadow" />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-bold text-white truncate">{titleStr}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-1 capitalize font-semibold">
                          <span>{yearStr}</span>
                          <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                          <span className="bg-red-600/10 text-red-500 px-1 py-0.2 rounded font-black text-[8px] uppercase">{item.media_type}</span>
                        </div>
                        <p className="text-[10px] text-yellow-500 flex items-center gap-0.5 mt-0.5 font-mono"><Star className="w-3 h-3 fill-yellow-500" /> {ratingVal}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bilingual Converter switcher panel */}
          <div className="relative">
            <button
              onClick={() => setActiveNavDropdown(prev => prev === "subFinder" ? null : "subFinder")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black cursor-pointer select-none transition-all ${
                activeNavDropdown === "subFinder" 
                  ? "bg-red-650 bg-red-600 text-white shadow-lg shadow-red-600/30 border border-transparent" 
                  : "bg-white/5 hover:bg-white/10 border border-zinc-800 hover:border-zinc-500 text-rose-400"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{localText.subFinder[currentLang]}</span>
              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${activeNavDropdown === "subFinder" ? "rotate-180" : ""}`} />
            </button>
            {activeNavDropdown === "subFinder" && (
              <div 
                className="absolute top-full mt-3 right-0 w-[450px] max-w-[90vw] z-50 max-h-[85vh] overflow-y-auto no-scrollbar"
                style={{ animationDuration: "0.2s" }}
              >
                <SubtitleDownloader
                  currentLang={currentLang}
                  onTriggerDirectPlay={(title, type, s, ep, sSi, sEn) => {
                    handleTriggerDirectPlay(title, type, s, ep, sSi, sEn);
                    setActiveNavDropdown(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Bilingual Converter switcher panel */}
          <button
            onClick={() => setCurrentLang(prev => prev === "si" ? "en" : "si")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-zinc-800 hover:border-zinc-500 rounded-full text-xs font-bold cursor-pointer text-white select-none transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="font-extrabold">{currentLang === "si" ? "English" : "සිංහල"}</span>
          </button>

          {/* Connected User Profile dropdown picker */}
          {activeProfile && (
            <div className="relative">
              <button
                onClick={() => setActiveNavDropdown(prev => prev === "profile" ? null : "profile")}
                className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center text-white text-sm font-bold border border-white/10 shadow-lg hover:scale-105 transition-transform">
                  <Smile className="w-4 h-4" />
                </div>
              </button>
              {activeNavDropdown === "profile" && (
                <div className="absolute top-full right-0 mt-3 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 flex flex-col text-zinc-300">
                  <div className="px-3 py-2 border-b border-zinc-800 mb-1.5 text-left select-none">
                    <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-zinc-500 block">Logged In As</span>
                    <p className="text-xs font-extrabold text-white truncate mt-0.5">{activeProfile}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveProfile("");
                      setActiveNavDropdown(null);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-zinc-800 cursor-pointer text-xs font-extrabold flex items-center gap-2"
                  >
                    <span>{localText.changeProf[currentLang]}</span>
                  </button>
                  <button
                    onClick={() => {
                      clearMyList();
                      setActiveNavDropdown(null);
                    }}
                    className="w-full text-left py-2.5 px-3 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer text-xs font-extrabold flex items-center gap-2"
                  >
                    <span>{localText.clearList[currentLang]}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hamburg menus for small resolutions */}
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className="xl:hidden p-2 bg-white/5 hover:bg-zinc-800 rounded-full text-white cursor-pointer hover:text-red-500 transition-colors"
          >
            <ListCollapse className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Mobile Accordion navigation panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden fixed inset-x-0 top-14 bg-zinc-950/98 backdrop-blur-2xl border-b border-zinc-800 z-30 py-6 px-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            {/* Direct listings mobile triggers */}
            {[
              { id: "all", label: localText.all[currentLang] },
              { id: "movieGrid", label: localText.movies[currentLang] },
              { id: "tvGrid", label: localText.tv[currentLang] },
              { id: "mylist", label: localText.mylist[currentLang] },
              { id: "history", label: localText.history[currentLang] }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setActiveSection(m.id);
                  resetFilters();
                  setIsMobileMenuOpen(false);
                }}
                className="text-left font-black text-sm text-zinc-300 py-2 border-b border-zinc-900 cursor-pointer"
              >
                {m.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container screen views */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* Active play theatre section gets preference */}
          {activePlayItem ? (
            <motion.div
              key="player"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
            >
              <VideoPlayer
                id={activePlayItem.id}
                type={activePlayItem.type}
                title={activePlayItem.title}
                currentLang={currentLang}
                initialSinhalaSub={activePlayItem.srtSi}
                initialEnglishSub={activePlayItem.srtEn}
                isInWatchList={isInWatchList}
                onToggleWatchList={onToggleWatchList}
                onClose={() => {
                  setActivePlayItem(null);
                  window.scrollTo({ top: 300, behavior: "smooth" });
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="homepage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10 pb-16"
            >
              {/* Cinematic Billboard Banner */}
              <HeroSection
                currentLang={currentLang}
                onPlay={(id, t, titleStr) => handleTriggerDirectPlay(titleStr, t)}
                isInWatchList={isInWatchList}
                onToggleWatchList={onToggleWatchList}
              />

              {/* Dynamically displayed listings rows */}
              <div className="px-4 md:px-12 space-y-12">
                
                {/* Active filters badge prompt */}
                {(activeGenreFilter || activeLangFilter || activeYearFilter) && (
                  <div className="p-4 bg-zinc-900 border border-zinc-805 rounded-xl flex items-center justify-between max-w-xl text-xs font-semibold select-none">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {localText.showingFilter[currentLang]} 
                      <b className="text-white">
                        {activeGenreFilter?.label || activeLangFilter?.label || activeYearFilter}
                      </b>
                    </span>
                    <button onClick={resetFilters} className="text-red-500 font-black cursor-pointer underline">
                      {localText.resetFilter[currentLang]}
                    </button>
                  </div>
                )}

                {/* Grid pages for movie list filters */}
                {activeSection === "movieGrid" && (
                  <div className="space-y-6">
                    <h2 className="font-display font-[900] text-xl md:text-3xl text-left border-b border-zinc-900 pb-3">
                      {localText.gridTitleMovies[currentLang]}
                    </h2>
                    <GridPage endpoint="/movie/popular" mode="movie" onPlayCard={handleSelectCardPlay} />
                  </div>
                )}

                {/* Grid pages for TV list filters */}
                {activeSection === "tvGrid" && (
                  <div className="space-y-6">
                    <h2 className="font-display font-[900] text-xl md:text-3xl text-left border-b border-zinc-900 pb-3">
                      {localText.gridTitleTV[currentLang]}
                    </h2>
                    <GridPage endpoint="/tv/popular" mode="tv" onPlayCard={handleSelectCardPlay} />
                  </div>
                )}

                {/* My list watchlists dashboard */}
                {activeSection === "mylist" && (
                  <div className="space-y-6">
                    <h2 className="font-display font-black text-xl md:text-3xl text-left border-b border-zinc-900 pb-3 flex items-center gap-2">
                      <Heart className="w-6 h-6 text-red-600 fill-red-600" />
                      <span>{localText.mylist[currentLang]}</span>
                    </h2>
                    {myList.length === 0 ? (
                      <div className="py-20 text-center text-zinc-500 font-semibold text-sm">
                        No saved watch list files. Use the finder or click '+ My List' to add cinema titles.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                        {myList.map(item => (
                          <MovieCard key={item.id} item={item} onPlayCard={handleSelectCardPlay} onRemove={() => onToggleWatchList(item)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Watch history timeline dashboard */}
                {activeSection === "history" && (
                  <div className="space-y-6">
                    <h2 className="font-display font-black text-xl md:text-3xl text-left border-b border-zinc-900 pb-3 flex items-center gap-2">
                      <History className="w-6 h-6 text-purple-400" />
                      <span>{localText.history[currentLang]}</span>
                    </h2>
                    {watchHistory.length === 0 ? (
                      <div className="py-20 text-center text-zinc-500 font-semibold text-sm">
                        You haven't played anything yet. Select a movie or show to track history listings.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                        {watchHistory.map(item => (
                          <MovieCard key={item.id} item={item} onPlayCard={handleSelectCardPlay} onRemove={() => removeHistoryItem(item.id)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Normal rows landing layouts */}
                {activeSection === "all" && (
                  <div className="space-y-12">
                    
                    {/* Saved watch list horizontal slider track (if has elements) */}
                    {myList.length > 0 && (
                      <RowSlider
                        title={localText.mylist[currentLang]}
                        items={myList}
                        onPlayCard={handleSelectCardPlay}
                      />
                    )}

                    {/* Standard trending week rows */}
                    <RowSlider
                      title={localText.trendingRow[currentLang]}
                      endpoint={activeGenreFilter ? `/discover/movie?with_genres=${activeGenreFilter.id}` : activeLangFilter ? `/discover/movie?with_original_language=${activeLangFilter.code}` : activeYearFilter ? `/discover/movie?primary_release_year=${activeYearFilter}` : "/trending/all/week"}
                      onPlayCard={handleSelectCardPlay}
                    />

                    {/* Popular movies rows */}
                    <RowSlider
                      title={localText.moviesRow[currentLang]}
                      endpoint={activeGenreFilter ? `/discover/movie?with_genres=${activeGenreFilter.id}` : activeLangFilter ? `/discover/movie?with_original_language=${activeLangFilter.code}` : activeYearFilter ? `/discover/movie?primary_release_year=${activeYearFilter}` : "/movie/popular"}
                      mode="movie"
                      onPlayCard={handleSelectCardPlay}
                    />

                    {/* Popular TV Series rows */}
                    <RowSlider
                      title={localText.tvRow[currentLang]}
                      endpoint={activeGenreFilter ? `/discover/tv?with_genres=${activeGenreFilter.id}` : activeLangFilter ? `/discover/tv?with_original_language=${activeLangFilter.code}` : activeYearFilter ? `/discover/tv?first_air_date_year=${activeYearFilter}` : "/tv/popular"}
                      mode="tv"
                      onPlayCard={handleSelectCardPlay}
                    />

                  </div>
                )}

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Floating AI chatbot companion bottom-right */}
      {activeProfile && (
        <AIChatBot currentLang={currentLang} activeProfile={activeProfile} />
      )}

      {/* General Footer limits and credits */}
      <footer className="bg-[#0b0b0d] border-t border-zinc-900 py-10 px-6 text-center select-none mt-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          <p className="text-xs text-zinc-500 font-semibold">
            {localText.footerCopyright[currentLang]}
          </p>
          <p className="text-[10px] text-zinc-600 max-w-xl mx-auto leading-relaxed">
            {localText.footerDisclaimer[currentLang]}
          </p>
        </div>
      </footer>

    </div>
  );
}

// ----------------------------------------------------
// CHILD INNER COMPONENTS FOR GRID PAGE AND CARD SLIDER
// ----------------------------------------------------

interface RowSliderProps {
  title: string;
  endpoint?: string;
  items?: MediaItem[];
  mode?: "movie" | "tv";
  onPlayCard: (item: MediaItem, mode?: string) => void;
}

function RowSlider({ title, endpoint, items: initialItems, mode = "movie", onPlayCard }: RowSliderProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
      setLoading(false);
      return;
    }

    if (!endpoint) return;

    fetch(`https://api.themoviedb.org/3${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=5c6ec82a535bb9fb80b786387a055019`)
      .then(res => res.json())
      .then(data => {
        setItems((data.results || []).filter((i: any) => i.poster_path));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [endpoint, initialItems]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider animate-pulse text-left">{title}</h3>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-[2/3] w-[44%] sm:w-[29%] md:w-[22%] lg:w-[15.5%] flex-shrink-0 bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-4 text-left">
      <h3 className="font-display font-[900] text-sm md:text-base text-white tracking-tight uppercase flex items-center gap-1.5">
        <Activity className="w-4 h-4 text-rose-500" />
        <span>{title}</span>
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-2 pt-1 no-scrollbar select-none smooth-scroll scroll-smooth snap-x">
        {items.slice(0, 16).map(item => {
          const titleStr = item.title || item.name || "Cinema Premiere";
          const dType = item.media_type || mode;
          const year = (item.release_date || item.first_air_date || "2026").substring(0, 4);
          const rating = item.vote_average ? item.vote_average.toFixed(1) : "8.1";
          const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://via.placeholder.com/500x750/141414/808080?text=No+Poster";

          return (
            <div
              key={item.id}
              onClick={() => onPlayCard(item, dType)}
              className="group relative flex-shrink-0 w-[44%] sm:w-[29%] md:w-[22%] lg:w-[15.5%] aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden cursor-pointer border border-zinc-800 transition-all duration-300 hover:scale-[1.04] hover:z-20 shadow-lg hover:shadow-2xl snap-start"
            >
              <img src={poster} alt="poster" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-red-650 bg-red-600 border border-white/10 shadow-lg flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 text-white">
                  <Play className="w-4.5 h-4.5 fill-white ml-0.5" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-[10px] font-bold text-white truncate">{titleStr}</p>
                <div className="flex items-center justify-between mt-1 text-[8.5px] font-mono font-bold text-zinc-400">
                  <span className="text-yellow-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-yellow-500" /> {rating}</span>
                  <span>{year}</span>
                  <span className="text-red-500 uppercase">{dType}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Grid pages lists
interface GridPageProps {
  endpoint: string;
  mode: "movie" | "tv";
  onPlayCard: (item: MediaItem, mode?: string) => void;
}

function GridPage({ endpoint, mode, onPlayCard }: GridPageProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3${endpoint}?api_key=5c6ec82a535bb9fb80b786387a055019`)
      .then(res => res.json())
      .then(data => {
        setItems((data.results || []).filter((i: any) => i.poster_path));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [endpoint]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
          <div key={i} className="aspect-[2/3] w-full bg-zinc-900 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
      {items.map(item => {
        const titleStr = item.title || item.name || "Cinema Premiere";
        const year = (item.release_date || item.first_air_date || "2026").substring(0, 4);
        const rating = item.vote_average ? item.vote_average.toFixed(1) : "8.1";
        const poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;

        return (
          <div
            key={item.id}
            onClick={() => onPlayCard(item, mode)}
            className="group relative bg-[#131315] rounded-xl overflow-hidden cursor-pointer border border-zinc-900 transition-all duration-300 hover:scale-[1.05] shadow-lg hover:shadow-2xl"
          >
            <div className="aspect-[2/3] w-full bg-zinc-950 overflow-hidden">
              <img src={poster} alt="poster" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            </div>

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-red-600 shadow-2xl flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 text-white border border-white/10">
                <Play className="w-4.5 h-4.5 fill-white ml-0.5" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-left">
              <p className="text-xs font-bold text-white truncate">{titleStr}</p>
              <div className="flex items-center justify-between mt-1 text-[9px] font-mono font-bold text-zinc-400">
                <span className="text-yellow-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-yellow-500" /> {rating}</span>
                <span>{year}</span>
                <span className="text-[#a78bfa] font-black uppercase text-[8px]">{mode}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Simple Movie Card for Dashboard layouts
interface MovieCardProps {
  key?: any;
  item: MediaItem;
  onPlayCard: (item: MediaItem, mediaTypeOverride?: string) => void;
  onRemove: () => void;
}

function MovieCard({ item, onPlayCard, onRemove }: MovieCardProps) {
  const titleStr = item.title || item.name || "Cinema Premiere";
  const year = (item.release_date || item.first_air_date || "2026").substring(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "8.1";
  const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://via.placeholder.com/500x750/141414/808080?text=No+Poster";

  return (
    <div
      onClick={() => onPlayCard(item)}
      className="group relative bg-[#131114] rounded-xl overflow-hidden cursor-pointer border border-zinc-900 transition-all duration-300 hover:scale-[1.04] shadow-lg hover:shadow-2xl text-left"
    >
      <div className="aspect-[2/3] w-full bg-zinc-950 overflow-hidden">
        <img src={poster} alt="poster" className="w-full h-full object-cover" loading="lazy" />
      </div>

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="w-11 h-11 rounded-full bg-red-650 bg-red-600 shadow-2xl flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 text-white border border-white/10">
          <Play className="w-4.5 h-4.5 fill-white ml-0.5" />
        </div>
      </div>

      {/* Delete trigger button directly visible on card hover */}
      <button
        onClick={e => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center border border-white/5 shadow-lg select-none cursor-pointer opacity-0 group-hover:opacity-100 hover:scale-105 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-xs font-bold text-white truncate">{titleStr}</p>
        <div className="flex items-center justify-between mt-1 text-[8.5px] font-mono font-bold text-zinc-400">
          <span className="text-yellow-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-yellow-500" /> {rating}</span>
          <span>{year}</span>
          <span className="text-red-500 uppercase">{item.media_type || "movie"}</span>
        </div>
      </div>
    </div>
  );
}
