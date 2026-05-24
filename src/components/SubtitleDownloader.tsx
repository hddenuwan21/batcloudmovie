import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Film, Tv, Search, Download, Play, AlertCircle } from "lucide-react";

interface SubtitleDownloaderProps {
  currentLang: "si" | "en";
  onTriggerDirectPlay: (title: string, type: "movie" | "tv", season?: number, episode?: number, srtSi?: string, srtEn?: string) => void;
}

export default function SubtitleDownloader({ currentLang, onTriggerDirectPlay }: SubtitleDownloaderProps) {
  const [currentType, setCurrentType] = useState<"movie" | "tv">("movie");
  const [movieName, setMovieName] = useState("");
  const [seasonNum, setSeasonNum] = useState("");
  const [episodeNum, setEpisodeNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const localText = {
    title: { si: "Dual Subtitle Finder", en: "Dual Subtitle Finder" },
    tag: { si: "ක්ෂණික සිංහල සහ ඉංග්‍රීසි උපසිරැසි ලබාගන්න", en: "Get Sinhala & English Subtitles Instantly" },
    movieOpt: { si: "චිත්‍රපට (Movie)", en: "Movie" },
    seriesOpt: { si: "ටීවී කතාමාලා (TV Series)", en: "TV Series" },
    inputPlaceholder: { si: "උදා: Breaking Bad, Interstellar...", en: "e.g. Breaking Bad, Interstellar, Avatar..." },
    season: { si: "Season", en: "Season (e.g. 2)" },
    episode: { si: "Episode", en: "Episode (e.g. 1)" },
    btnSearch: { si: "උපසිරැසි සොයන්න", en: "Find Subtitles" },
    errName: { si: "කරුණාකර නම ඇතුළත් කරන්න!", en: "Please enter the movie/series name!" },
    errSpecs: { si: "කරුණාකර Season සහ Episode ඇතුළත් කරන්න!", en: "Please fill in season and episode values!" },
    dlSinhala: { si: "සිංහල උපසිරැසි බාගන්න", en: "Download Sinhala .SRT" },
    dlEnglish: { si: "ඉංග්‍රීසි උපසිරැසි බාගන්න", en: "Download English .SRT" },
    btnPlay: { si: "උපසිරැසි සමඟ නරඹන්න", en: "Stream Now with Subtitles" },
    subTitleMark: { si: " Batcloud Xlive මඟින් උපසිරැසි ලබාදෙන ලදි.", en: " Subtitle files fully synchronized." }
  };

  const handleFetchSubtitle = async () => {
    const trimmedName = movieName.trim();
    if (!trimmedName) {
      alert(localText.errName[currentLang]);
      return;
    }

    if (currentType === "tv" && (!seasonNum.trim() || !episodeNum.trim())) {
      alert(localText.errSpecs[currentLang]);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let url = `/api/subtitles?movie_name=${encodeURIComponent(trimmedName)}`;
      if (currentType === "tv") {
        url += `&season=${seasonNum.trim()}&episode=${episodeNum.trim()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.status === "success") {
        // Build download URLs via Blobs
        let sinhalaBlobUrl = "";
        let englishBlobUrl = "";

        if (data.sinhala_sub) {
          const blob = new Blob([data.sinhala_sub], { type: "text/plain;charset=utf-8" });
          sinhalaBlobUrl = URL.createObjectURL(blob);
        }

        if (data.english_sub) {
          const blob = new Blob([data.english_sub], { type: "text/plain;charset=utf-8" });
          englishBlobUrl = URL.createObjectURL(blob);
        }

        setResult({
          ...data,
          sinhalaBlobUrl,
          englishBlobUrl
        });
      } else {
        alert(data.message || "Failed to find subtitles.");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching subtitles from the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md select-none text-left">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center mx-auto text-white shadow-lg shadow-red-500/20">
          <Download className="w-6 h-6 animate-bounce" />
        </div>
        <h2 className="font-display font-black text-2xl text-white tracking-tight">
          {localText.title[currentLang]}
        </h2>
        <p className="text-xs text-zinc-400 font-medium">
          {localText.tag[currentLang]}
        </p>
      </div>

      {/* Selector pills */}
      <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-900 gap-1.5">
        <button
          onClick={() => {
            setCurrentType("movie");
            setResult(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            currentType === "movie" ? "bg-red-600 text-white shadow" : "text-zinc-500 hover:text-white"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>{localText.movieOpt[currentLang]}</span>
        </button>
        <button
          onClick={() => {
            setCurrentType("tv");
            setResult(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            currentType === "tv" ? "bg-red-600 text-white shadow" : "text-zinc-500 hover:text-white"
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>{localText.seriesOpt[currentLang]}</span>
        </button>
      </div>

      {/* Input sets */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={movieName}
            onChange={e => setMovieName(e.target.value)}
            placeholder={localText.inputPlaceholder[currentLang]}
            className="w-full bg-zinc-950 text-white text-xs px-10 py-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-600 transition-colors uppercase tracking-wide font-black"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
        </div>

        {currentType === "tv" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            <input
              type="number"
              value={seasonNum}
              onChange={e => setSeasonNum(e.target.value)}
              placeholder={localText.season[currentLang]}
              className="bg-zinc-950 font-bold border border-zinc-800 focus:border-red-600 text-white rounded-xl px-4 py-3 text-xs focus:outline-none"
            />
            <input
              type="number"
              value={episodeNum}
              onChange={e => setEpisodeNum(e.target.value)}
              placeholder={localText.episode[currentLang]}
              className="bg-zinc-950 font-bold border border-zinc-800 focus:border-red-600 text-white rounded-xl px-4 py-3 text-xs focus:outline-none"
            />
          </motion.div>
        )}

        <button
          onClick={handleFetchSubtitle}
          disabled={loading}
          className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span>{localText.btnSearch[currentLang]}</span>
        </button>
      </div>

      {/* Loading state indicator */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80 space-y-4"
          >
            <div className="flex items-center gap-4">
              <img
                src={result.poster}
                alt="poster"
                className="w-16 h-24 object-cover rounded-lg shadow-md border border-zinc-800"
              />
              <div className="space-y-1">
                <span className="text-[10px] bg-red-600/10 text-red-500 font-extrabold px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest font-mono">
                  {currentType}
                </span>
                <h3 className="font-display font-black text-white text-base leading-tight">
                  {result.title}
                </h3>
                <p className="text-xs text-zinc-500 font-mono font-bold">
                  Year: {result.year}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {result.sinhalaBlobUrl && (
                <a
                  href={result.sinhalaBlobUrl}
                  download={`${result.filename}_Sinhala.srt`}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 border border-[#7c3aed]/20 hover:border-[#7c3aed] text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer select-none"
                >
                  <Download className="w-4 h-4 text-[#a78bfa] animate-pulse" />
                  <span>{localText.dlSinhala[currentLang]}</span>
                </a>
              )}
              {result.englishBlobUrl && (
                <a
                  href={result.englishBlobUrl}
                  download={`${result.filename}_English.srt`}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800/85 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer select-none"
                >
                  <Download className="w-4 h-4 text-zinc-400" />
                  <span>{localText.dlEnglish[currentLang]}</span>
                </a>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800/50">
              <button
                onClick={() =>
                  onTriggerDirectPlay(
                    result.title,
                    currentType,
                    seasonNum ? parseInt(seasonNum) : undefined,
                    episodeNum ? parseInt(episodeNum) : undefined,
                    result.sinhala_sub,
                    result.english_sub
                  )
                }
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-lg cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{localText.btnPlay[currentLang]}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
