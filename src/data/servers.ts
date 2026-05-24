import { StreamServer } from "../types";

export const streamServers: StreamServer[] = [
  {
    name: "Server 1 [AutoEmbed]",
    badge: "1080p Auto",
    desc: "Premium fast source with integrated multilingual sub options.",
    movie: (id: string) => `https://autoembed.co/movie/tmdb/${id}`,
    tv: (id: string, s: number, e: number) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`
  },
  {
    name: "Server 2 [SmashyStream]",
    badge: "HD Premium",
    desc: "Highly compatible, works flawlessly on mobile devices.",
    movie: (id: string) => `https://embed.smashystream.com/playere.php?tmdb/${id}`,
    tv: (id: string, s: number, e: number) => `https://embed.smashystream.com/playere.php?tmdb/${id}&season=${s}&ep=${e}`
  },
  {
    name: "Server 3 [MultiEmbed]",
    badge: "4K Stream",
    desc: "Instant multi-quality adaptive high bit-rate buffer stream.",
    movie: (id: string) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id: string, s: number, e: number) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
  {
    name: "Server 4 [Vsrc.su]",
    badge: "Auto Res",
    desc: "Excellent player with multi-language embedded CC choices.",
    movie: (id: string) => `https://vsrc.su/embed/movie?tmdb/${id}`,
    tv: (id: string, s: number, e: number) => `https://vsrc.su/embed/tv?tmdb/${id}&season=${s}&episode=${e}`
  },
  {
    name: "Server 5 [VidSrc.cc]",
    badge: "HD Mirror",
    desc: "Alternative backup routing stream.",
    movie: (id: string) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`
  }
];
