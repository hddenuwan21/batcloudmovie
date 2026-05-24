import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Play, Pause, RotateCcw, FastForward, Rewind, Settings, ChevronUp, Clock, Eye, Star, Heart, Plus, Check, Award, Sparkles, EyeOff, Loader2 } from "lucide-react";
import { MediaItem, SubtitleCue, ServerSource } from "../types";

interface VideoPlayerProps {
  id: number;
  type: "movie" | "tv";
  title: string;
  onClose: () => void;
  currentLang: "si" | "en";
  initialSinhalaSub?: string;
  initialEnglishSub?: string;
  isInWatchList: (id: number) => boolean;
  onToggleWatchList: (item: MediaItem) => void;
}

export const STREAM_SERVERS: ServerSource[] = [
  {
    name: "Server 1 [AutoEmbed]",
    badge: "1080p Auto",
    desc: "Premium high-speed source with integrated multilingual subtitles.",
    movie: (id) => `https://autoembed.co/movie/tmdb/${id}`,
    tv: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`
  },
  {
    name: "Server 2 [SmashyStream]",
    badge: "HD Premium",
    desc: "Highly compatible, works flawlessly on all mobile devices.",
    movie: (id) => `https://embed.smashystream.com/playere.php?tmdb/${id}`,
    tv: (id, s, e) => `https://embed.smashystream.com/playere.php?tmdb/${id}&season=${s}&ep=${e}`
  },
  {
    name: "Server 3 [MultiEmbed]",
    badge: "4K Stream",
    desc: "Instant play multi-quality adaptive high bit-rate buffer stream.",
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
  {
    name: "Server 4 [Vsrc.su]",
    badge: "Auto Res",
    desc: "Excellent desktop player with multi-language embedded CC choices.",
    movie: (id) => `https://vsrc.su/embed/movie?tmdb/${id}`,
    tv: (id, s, e) => `https://vsrc.su/embed/tv?tmdb/${id}&season=${s}&episode=${e}`
  },
  {
    name: "Server 5 [VidSrc.cc]",
    badge: "HD Mirror",
    desc: "Alternative backup routing stream.",
    movie: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`
  }
];

export default function VideoPlayer({
  id,
  type,
  title,
  onClose,
  currentLang,
  initialSinhalaSub,
  initialEnglishSub,
  isInWatchList,
  onToggleWatchList
}: VideoPlayerProps) {
  // Navigation states
  const [activeServerIdx, setActiveServerIdx] = useState(0);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [imdbId, setImdbId] = useState("");

  // Media Details metadata states
  const [details, setDetails] = useState<any | null>(null);
  const [credits, setCredits] = useState<any | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Subtitles custom parser states
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [activeSubLang, setActiveSubLang] = useState<"si" | "en" | "off">("si");
  const [subOffset, setSubOffset] = useState(0.0);
  const [simulatedTime, setSimulatedTime] = useState(0.0);
  const [isSubPaused, setIsSubPaused] = useState(false);
  const [subColor, setSubColor] = useState("#ffeaa7");
  const [subSize, setSubSize] = useState("text-xl md:text-2xl");
  const [showSubController, setShowSubController] = useState(true);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [activeQuality, setActiveQuality] = useState("Auto 1080p");

  const tickerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse SRT format
  const parseSRT = (text: string): SubtitleCue[] => {
    const parts = text.split(/\r?\n\r?\n/);
    const cuesList: SubtitleCue[] = [];
    
    parts.forEach((part, idx) => {
      const lines = part.trim().split(/\r?\n/);
      if (lines.length >= 2) {
        let timeLine = lines[1];
        let textLineIndex = 2;
        if (!timeLine.includes("-->") && lines.length >= 3) {
          timeLine = lines[2];
          textLineIndex = 3;
        }
        if (timeLine && timeLine.includes("-->")) {
          const cueText = lines.slice(textLineIndex).join("<br>");
          const times = timeLine.split("-->");
          if (times.length === 2) {
            const startStr = times[0].trim().replace(",", ".");
            const endStr = times[1].trim().replace(",", ".");
            const start = timeToSeconds(startStr);
            const end = timeToSeconds(endStr);
            cuesList.push({ id: idx, start, end, text: cueText });
          }
        }
      }
    });
    return cuesList;
  };

  const timeToSeconds = (t: string): number => {
    const parts = t.split(":");
    let secs = 0;
    if (parts.length === 3) {
      secs += parseFloat(parts[0]) * 3600;
      secs += parseFloat(parts[1]) * 60;
      secs += parseFloat(parts[2]);
    } else if (parts.length === 2) {
      secs += parseFloat(parts[0]) * 60;
      secs += parseFloat(parts[1]);
    }
    return secs;
  };

  // Synchronise Subtitle queues dynamically on mount or change of selection
  useEffect(() => {
    let subContent = "";
    if (activeSubLang === "si" && initialSinhalaSub) {
      subContent = initialSinhalaSub;
    } else if (activeSubLang === "en" && initialEnglishSub) {
      subContent = initialEnglishSub;
    }

    if (subContent) {
      const parsedCues = parseSRT(subContent);
      setCues(parsedCues);
      setSimulatedTime(0.0);
      setIsSubPaused(false);
    } else {
      setCues([]);
    }
  }, [activeSubLang, initialSinhalaSub, initialEnglishSub]);

  // Synchronised subtitle ticker running loop
  useEffect(() => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (cues.length === 0 || isSubPaused || activeSubLang === "off") return;

    tickerRef.current = setInterval(() => {
      setSimulatedTime(prev => prev + 0.5);
    }, 500);

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [cues, isSubPaused, activeSubLang]);

  // Fetch Movie details and cast
  useEffect(() => {
    const fetchCoreResources = async () => {
      setLoadingDetails(true);
      try {
        const apiKeyParam = "?api_key=5c6ec82a535bb9fb80b786387a055019";
        const [detRes, credRes, recRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/${type}/${id}${apiKeyParam}`),
          fetch(`https://api.themoviedb.org/3/${type}/${id}/credits${apiKeyParam}`),
          fetch(`https://api.themoviedb.org/3/${type}/${id}/recommendations${apiKeyParam}`)
        ]);

        if (detRes.ok) {
          const detData = await detRes.json();
          setDetails(detData);
          if (type === "tv") {
            const ssnFiltered = (detData.seasons || []).filter((s: any) => s.season_number > 0);
            setSeasons(ssnFiltered.length > 0 ? ssnFiltered : detData.seasons || []);
          }
        }
        if (credRes.ok) setCredits(await credRes.json());
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecommendations(recData.results ? recData.results.slice(0, 6) : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchCoreResources();
  }, [id, type]);

  // Load episodes when season loads or changes
  useEffect(() => {
    if (type !== "tv") return;
    const fetchEpisodes = async () => {
      try {
        const resp = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${currentSeason}?api_key=5c6ec82a535bb9fb80b786387a055019`);
        if (resp.ok) {
          const data = await resp.json();
          setEpisodes(data.episodes || []);
          if (data.episodes && data.episodes.length > 0) {
            setCurrentEpisode(data.episodes[0].episode_number);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEpisodes();
  }, [currentSeason, id, type]);

  const activeServer = STREAM_SERVERS[activeServerIdx];
  const iframeSrc = type === "movie" 
    ? activeServer.movie(id.toString())
    : activeServer.tv(id.toString(), currentSeason, currentEpisode);

  // Active cue matching calculation
  const currentSyncTime = simulatedTime + subOffset;
  const activeCue = cues.find(c => currentSyncTime >= c.start && currentSyncTime <= c.end);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const nextMaxTime = cues.length > 0 ? cues[cues.length - 1].end : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-6 space-y-6 animate-[fadeInUp_0.5s_ease] select-none text-left leading-none">
      
      {/* Header back-navigation bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <button
          onClick={onClose}
          className="self-start px-5 py-2.5 bg-white/5 hover:bg-zinc-800 border border-zinc-800/60 hover:border-zinc-500 rounded-full text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentLang === "si" ? "ප්‍රධාන පිටුවට" : "Back to Home"}</span>
        </button>
        <div className="md:text-right min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#a78bfa] block">
            NOW STREAMING ON BATCLOUD XLIVE
          </span>
          <h3 className="text-sm md:text-base font-extrabold text-white truncate mt-1">
            {title} {type === "tv" ? ` - Season ${currentSeason} Ep ${currentEpisode}` : ""}
          </h3>
        </div>
      </div>

      {/* Cinematic Theater Canvas with overlay subtitles */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 group/player">
        <iframe
          src={iframeSrc}
          className="w-full h-full border-none shadow-2xl block"
          allowFullScreen
          allow="autoplay; encrypted-media"
          title="Video Player Source Client"
        />

        {/* Sync-rendered subtitle ticker card */}
        <AnimatePresence>
          {activeCue && activeSubLang !== "off" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 bottom-8 md:bottom-14 flex justify-center pointer-events-none z-30 px-6"
            >
              <div
                className="bg-black/85 px-6 py-2.5 rounded-2xl border border-white/10 text-center shadow-xl backdrop-blur-md max-w-[90%]"
                style={{ color: "#ffeaa7" }}
              >
                <div
                  className="text-xl md:text-2xl font-black tracking-wide filter drop-shadow-[0_2px_4px_rgba(0,0,0,1)] leading-normal"
                  dangerouslySetInnerHTML={{ __html: activeCue.text }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quality preset settings widget */}
        <div className="absolute bottom-4 right-4 z-40 select-none">
          <button
            onClick={() => setIsQualityOpen(prev => !prev)}
            className="px-3.5 py-1.5 bg-black/90 hover:bg-zinc-950 border border-zinc-800 rounded-full text-xs font-mono font-bold text-white cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-2xl"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Resolution: {activeQuality}</span>
            <ChevronUp className={`w-3 h-3 text-zinc-400 transition-transform ${isQualityOpen ? "rotate-180" : ""}`} />
          </button>
          
          <AnimatePresence>
            {isQualityOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full right-0 mb-2 w-36 bg-black border border-zinc-800 rounded-xl p-1 shadow-2xl"
              >
                {["Auto 1080p", "Premium 4K", "HD 720p"].map(q => (
                  <button
                    key={q}
                    onClick={() => {
                      setActiveQuality(q);
                      setIsQualityOpen(false);
                    }}
                    className={`w-full py-2 px-3 text-left font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      activeQuality === q ? "bg-red-600 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Servers bar & Custom dropdown selector row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-900 p-5 rounded-2xl border border-zinc-800/60">
        
        {/* Servers tab select */}
        <div className="space-y-2 col-span-1">
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
            Select Active Server Connection:
          </label>
          <div className="flex flex-wrap gap-2 animate-[pulse_5s_infinite]">
            {STREAM_SERVERS.map((server, idx) => (
              <button
                key={server.name}
                onClick={() => setActiveServerIdx(idx)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                  idx === activeServerIdx
                    ? "bg-red-500 text-white border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span>{server.name.replace(/Server \d+ /, "")}</span>
                <span className="ml-1 px-1 bg-black/40 rounded text-[9px] text-red-400 border border-white/5 uppercase font-mono">
                  {server.badge}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[9px] text-purple-400 italic">
            * Connection: <b>{activeServer.name}</b> • {activeServer.desc}
          </p>
        </div>

        {/* TV control selection */}
        {type === "tv" && seasons.length > 0 && (
          <div className="col-span-1 flex flex-col justify-center border-t md:border-t-0 md:border-x border-zinc-800/60 pt-4 md:pt-0 md:px-6 space-y-2">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
              Choose Season & Episode:
            </label>
            <div className="flex gap-2.5">
              <select
                value={currentSeason}
                onChange={e => setCurrentSeason(parseInt(e.target.value))}
                className="flex-1 bg-zinc-950 text-white text-xs font-bold rounded-xl border border-zinc-800 px-3 py-2.5 focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                {seasons.map(s => (
                  <option key={s.season_number} value={s.season_number}>
                    {s.name || `Season ${s.season_number}`}
                  </option>
                ))}
              </select>

              <select
                value={currentEpisode}
                onChange={e => setCurrentEpisode(parseInt(e.target.value))}
                className="flex-[2] bg-zinc-950 text-white text-xs font-bold rounded-xl border border-zinc-800 px-3 py-2.5 focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                {episodes.map(e => (
                  <option key={e.episode_number} value={e.episode_number}>
                    E{e.episode_number}: {e.name || `Episode ${e.episode_number}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Subtitle selection */}
        <div className={`col-span-1 flex flex-col justify-center border-t md:border-t-0 border-zinc-800/60 pt-4 md:pt-0 ${
          type === "tv" ? "md:pl-6 md:border-l" : "md:col-span-2 md:pl-8 md:border-l"
        } space-y-2`}>
          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
            Bilingual Subtitle Engine Track:
          </label>
          {cues.length > 0 ? (
            <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/50 gap-1.5">
              <button
                onClick={() => setActiveSubLang("si")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeSubLang === "si" ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-white"
                }`}
              >
                Sinhala Sub (සිංහල srt)
              </button>
              <button
                onClick={() => setActiveSubLang("en")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeSubLang === "en" ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-white"
                }`}
              >
                English Sub
              </button>
              <button
                onClick={() => setActiveSubLang("off")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeSubLang === "off" ? "bg-zinc-800 text-zinc-300" : "text-zinc-500 hover:text-white"
                }`}
              >
                Turn Off
              </button>
            </div>
          ) : (
            <div className="bg-zinc-950 text-zinc-500 font-mono text-[9px] uppercase tracking-wide py-3 px-4 rounded-xl border border-zinc-800 font-bold text-center">
              ⚠️ No Dual Finder Subtitle active. Use the Finder box to load.
            </div>
          )}

          {/* Subtitle track options */}
        </div>
      </div>

      {/* Real Content Details split block (Credits, Synopsis, MCU tags) */}
      <div id="playerDetailsContainer" className="space-y-6">
        {loadingDetails || !details ? (
          <div className="flex justify-center items-center py-20 flex-col gap-2.5">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="text-zinc-500 text-xs font-mono select-none uppercase tracking-widest">
              Fetching Cinematic Database...
            </span>
          </div>
        ) : (
          <div className="space-y-6 text-left selection:bg-red-600 select-text">
            
            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (Poster) */}
              <div className="lg:col-span-4 space-y-5 flex flex-col items-center lg:items-stretch">
                <div className="relative w-full max-w-[280px] lg:max-w-none aspect-[2/3] rounded-2xl overflow-hidden border-2 border-zinc-850 shadow-2xl group select-none">
                  <img
                    src={details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : "https://via.placeholder.com/500x750/141414/808080?text=No+Poster"}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded shadow-md">
                    WEB-DL
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur-md text-yellow-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-white/5">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span>{details.vote_average ? details.vote_average.toFixed(1) : "8.2"}</span>
                  </div>
                </div>

                <div className="w-full max-w-[280px] lg:max-w-none bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-3 font-semibold text-xs text-zinc-400">
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Rating:</span>
                    <span className="text-yellow-500 font-bold font-mono flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                      {details.vote_average ? details.vote_average.toFixed(1) : "8.0"} (TMDB)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Duration:</span>
                    <span className="text-white font-mono font-bold">
                      {type === "movie" 
                        ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
                        : `${details.number_of_seasons} Seasons`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-500">Popularity:</span>
                    <span className="text-white font-mono font-bold">
                      {details.popularity ? Math.floor(details.popularity) : "N/A"} pts
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-zinc-500">Language:</span>
                    <span className="px-2 py-0.5 bg-red-600/15 text-red-400 font-bold rounded uppercase text-[9px]">
                      {details.original_language ? details.original_language.toUpperCase() : "EN"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column (Meta information) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl md:text-2xl text-white leading-tight">
                      {details.title || details.name} ({ (details.release_date || details.first_air_date || "2026").substring(0, 4) })
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-3 font-semibold">
                      {(details.genres || []).map((g: any) => (
                        <span key={g.id} className="px-2.5 py-1 bg-zinc-950 text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-zinc-900">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 select-none">
                    <button
                      onClick={() => onToggleWatchList(details)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-500 text-white font-extrabold rounded-full transition-all duration-300 flex items-center gap-2 cursor-pointer text-xs"
                    >
                      {isInWatchList(details.id) ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Remove from My List</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add to My List</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/60 p-5 rounded-xl border border-zinc-800/80 text-xs">
                  <div className="flex gap-2.5 py-2 border-b border-zinc-800 sm:border-r sm:border-b-0 pr-2">
                    <span className="text-zinc-500 font-bold w-24">Director:</span>
                    <span className="text-white font-bold truncate">
                      {credits?.crew?.find((m: any) => m.job === "Director")?.name || "Andrew Bernstein"}
                    </span>
                  </div>
                  <div className="flex gap-2.5 py-2 border-b border-zinc-800">
                    <span className="text-zinc-500 font-bold w-24">Year:</span>
                    <span className="text-white font-mono font-bold">
                      {(details.release_date || details.first_air_date || "2026").substring(0, 4)}
                    </span>
                  </div>
                  <div className="flex gap-2.5 py-2 sm:border-r sm:border-b-0 pr-2">
                    <span className="text-zinc-500 font-bold w-24">Subtitle By:</span>
                    <span className="text-purple-400 font-black">ධනංජය (Batcloud Xlive)</span>
                  </div>
                  <div className="flex gap-2.5 py-2">
                    <span className="text-zinc-505 text-zinc-500 font-bold w-24">Country:</span>
                    <span className="text-white truncate font-medium">
                      {details.production_countries?.[0]?.name || "United States"}
                    </span>
                  </div>
                </div>

                {/* Cast horizontally scrollable stream */}
                {credits?.cast?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-800 flex items-center justify-between select-none">
                      <span className="flex items-center gap-1.5">🎬 Cast / නළු නිළියන්</span>
                      <span className="text-[10px] text-zinc-500">Swipe & explore</span>
                    </h4>
                    <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
                      {credits.cast.slice(0, 10).map((actor: any) => (
                        <div key={actor.id} className="flex-shrink-0 w-24 text-center">
                          <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-zinc-800 relative shadow">
                            <img
                              src={actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : "https://via.placeholder.com/150?text=Profile"}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-[10px] font-extrabold text-white truncate mt-2 leading-tight">
                            {actor.name}
                          </p>
                          <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                            {actor.character || "Actor"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtitle details notice badge alert */}
                <div className="p-4 rounded-xl border border-purple-900/40 bg-purple-950/20 text-[11px] leading-relaxed text-purple-300 font-medium select-none">
                  💡 <span className="font-extrabold underline">Batcloud Elite Subtitle Engine:</span> All subtitles provided are dynamically synchronized to play matching servers. If you select TV Episodes, subtitles will automatically search/match details. Switch servers if any bandwidth buffering delays occur on your preview block.
                </div>

                {/* Plot synopsis story overview */}
                <div className="space-y-2 border-t border-zinc-800/80 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {currentLang === "si" ? "කථා සාරාංශය (Synopsis)" : "Synopsis"}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans select-text whitespace-pre-line">
                    {details.overview || "No plot summary details loaded from database / දත්ත නොමැත."}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations Grid block columns */}
            {recommendations.length > 0 && (
              <div className="mt-8 border-t border-zinc-800/50 pt-6">
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
                  <Award className="w-4 h-4 text-red-500" />
                  <span>
                    {currentLang === "si" 
                      ? "ඔබ කැමති විය හැකි වෙනත් නිර්දේශ (Recommended)" 
                      : "Recommendations & Relative Releases"}
                  </span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {recommendations.map(item => {
                    const rTitle = item.title || item.name || "Untitled";
                    const rPoster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://via.placeholder.com/500x750/141414/808080?text=No+Poster";
                    const rYear = (item.release_date || item.first_air_date || "2026").substring(0, 4);
                    const rType = item.media_type || type;
                    return (
                      <div
                        key={item.id}
                        onClick={() => onClose()} // Force closing and reopening player trigger on parent
                        className="group bg-zinc-900 rounded-xl overflow-hidden cursor-pointer shadow border border-white/5 hover:border-red-500/55 transition-all duration-300 hover:scale-[1.04]"
                      >
                        <div className="aspect-[2/3] w-full bg-zinc-950 overflow-hidden relative">
                          <img src={rPoster} alt="poster" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                          <span className="absolute top-2 left-2 bg-black/80 font-mono text-[8px] text-white px-1.5 py-0.5 rounded uppercase font-bold">
                            WEB-DL
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="text-[10px] font-bold text-white truncate">{rTitle}</p>
                          <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-1 font-mono font-bold">
                            <span>{rYear}</span>
                            <span className="text-red-500 uppercase tracking-wider">{rType}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
