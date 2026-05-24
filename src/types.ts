/**
 * Shared Type Definitions for Batcloud Xlive
 */

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv" | string;
  watchedAt?: string;
  overview?: string;
}

export interface SubtitleCue {
  id: string | number;
  start: number;
  end: number;
  text: string;
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface Profile {
  name: string;
  color: string;
  icon: string;
}

export interface ServerSource {
  name: string;
  badge: string;
  desc: string;
  movie: (tmdbId: string) => string;
  tv: (tmdbId: string, s: number, e: number) => string;
}
