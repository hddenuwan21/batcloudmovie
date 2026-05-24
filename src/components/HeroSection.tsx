import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Play, Info, Plus, Star, Clock, Check } from "lucide-react";
import { MediaItem } from "../types";

interface HeroSectionProps {
  currentLang: "si" | "en";
  onPlay: (id: number, type: "movie" | "tv", title: string) => void;
  isInWatchList: (id: number) => boolean;
  onToggleWatchList: (item: MediaItem) => void;
}

export default function HeroSection({ currentLang, onPlay, isInWatchList, onToggleWatchList }: HeroSectionProps) {
  const [heroItem, setHeroItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  const localText = {
    play: { si: "නරඹන්න", en: "Watch Now" },
    info: { si: "තොරතුරු", en: "More Info" },
    mylist: { si: "මගේ ලැයිස්තුව", en: "My List" },
    inlist: { si: "ලැයිස්තුවේ ඇත", en: "In My List" },
    featured: { si: "අද දින විශේෂාංගය (Featured)", en: "Featured Blockbuster" }
  };

  useEffect(() => {
    // Fetch a dynamic standard catalog now playing item
    const fetchHero = async () => {
      try {
        const resp = await fetch("https://api.themoviedb.org/3/movie/now_playing?api_key=5c6ec82a535bb9fb80b786387a055019");
        if (resp.ok) {
          const data = await resp.json();
          if (data.results && data.results.length > 0) {
            // Pick index
            const chosen = data.results[Math.floor(Math.random() * Math.min(6, data.results.length))];
            
            // Get deeper details for full overview metadata and runtime minutes
            const detailResp = await fetch(`https://api.themoviedb.org/3/movie/${chosen.id}?api_key=5c6ec82a535bb9fb80b786387a055019`);
            if (detailResp.ok) {
              const details = await detailResp.json();
              setHeroItem({
                ...chosen,
                overview: details.overview,
                runtime: details.runtime,
                genres: details.genres ? details.genres.slice(0, 2).map((g: any) => g.name).join(" • ") : "Action"
              });
            } else {
              setHeroItem(chosen);
            }
          }
        }
      } catch (err) {
        console.error("Failed fetching billboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHero();
  }, []);

  if (loading || !heroItem) {
    return (
      <div className="relative w-full h-[65vh] md:h-[80vh] bg-zinc-950 flex items-center justify-center animate-pulse">
        <div className="text-zinc-600 font-mono text-xs uppercase tracking-wider">Mounting cinematic display...</div>
      </div>
    );
  }

  const title = heroItem.title || "Cinema Premiere";
  const overview = heroItem.overview || "Streaming high speed links with dual Sinhala & English translations.";
  const rating = heroItem.vote_average ? heroItem.vote_average.toFixed(1) : "8.3";
  const year = (heroItem.release_date || "2026").substring(0, 4);
  const runtime = (heroItem as any).runtime ? `${(heroItem as any).runtime} min` : "124 min";
  const genresStr = (heroItem as any).genres || "Sci-Fi • Fantasy";
  const backdrop = heroItem.backdrop_path ? `https://image.tmdb.org/t/p/original${heroItem.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2625";

  const saved = isInWatchList(heroItem.id);

  return (
    <section className="relative w-full h-[70vh] md:h-[82vh] overflow-hidden flex items-center bg-black select-none leading-none">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${backdrop})`,
          backgroundPosition: "center top"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-[#0a0a0b]/30 z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0b] to-transparent z-15" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 w-full z-20 mt-12 md:mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl space-y-5 text-left"
        >
          {/* Featured tag highlight */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/10 backdrop-blur-md rounded-full text-xs font-semibold select-none">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-white uppercase tracking-wider text-[10px] font-black">
              {localText.featured[currentLang]}
            </span>
          </div>

          <h1 className="font-display font-black text-3xl md:text-6xl tracking-tight leading-[1.05] text-white drop-shadow-md">
            {title}
          </h1>

          {/* Specs meta attributes */}
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold text-zinc-400">
            <span className="text-yellow-500 flex items-center gap-1 font-mono hover:scale-105 transition-transform">
              <Star className="w-4.5 h-4.5 fill-yellow-500 text-yellow-500" />
              {rating} Ratings
            </span>
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
            <span className="font-mono">{year}</span>
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-4 h-4 text-zinc-500" />
              {runtime}
            </span>
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
            <span className="px-2.5 py-0.5 bg-red-600/15 border border-red-500/20 text-red-400 text-[10px] uppercase tracking-wider rounded-md font-black">
              {genresStr}
            </span>
          </div>

          <p className="text-zinc-300 text-sm md:text-base leading-relaxed text-left line-clamp-3 md:line-clamp-4 max-w-xl font-medium">
            {overview}
          </p>

          <div className="flex flex-wrap gap-4 pt-3">
            <button
              onClick={() => onPlay(heroItem.id, "movie", title)}
              className="px-6 py-3 bg-white text-black font-extrabold hover:bg-red-600 hover:text-white rounded-full transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer shadow-lg text-sm"
            >
              <Play className="w-4 h-4 fill-current text-current" />
              <span>{localText.play[currentLang]}</span>
            </button>

            <button
              onClick={() => onPlay(heroItem.id, "movie", title)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 font-extrabold rounded-full transition-all duration-300 transform hover:-translate-y-0.5 backdrop-blur-md flex items-center gap-2 cursor-pointer text-sm"
            >
              <Info className="w-4.5 h-4.5 text-red-500" />
              <span>{localText.info[currentLang]}</span>
            </button>

            <button
              onClick={() => onToggleWatchList(heroItem)}
              className="px-6 py-3 bg-black/40 hover:bg-black/85 text-white border border-white/5 font-bold rounded-full transition-all duration-300 transform hover:-translate-y-0.5 backdrop-blur-md flex items-center gap-2 cursor-pointer text-sm"
            >
              {saved ? (
                <>
                  <Check className="w-4.5 h-4.5 text-emerald-400" />
                  <span>{localText.inlist[currentLang]}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4.5 h-4.5" />
                  <span>{localText.mylist[currentLang]}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
