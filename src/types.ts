export interface UserProfile {
  name: string;
  color: string;
  icon: string;
}

export type MediaType = "movie" | "tv";

export interface MediaItem {
  id: number | string;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  media_type?: string;
  watchedAt?: string;
}

export interface SubtitleCue {
  id: string | number;
  start: number;
  end: number;
  text: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface StreamServer {
  name: string;
  badge: string;
  desc: string;
  movie: (id: string) => string;
  tv: (id: string, season: number, episode: number) => string;
}
