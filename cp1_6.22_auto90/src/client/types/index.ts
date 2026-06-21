export interface Episode {
  id: string;
  podcastId: string;
  title: string;
  duration: number;
  audioUrl: string;
}

export interface Podcast {
  id: string;
  title: string;
  cover: string;
  description: string;
  episodeCount: number;
  tags: string[];
  episodes: Episode[];
}

export interface Playlist {
  id: string;
  name: string;
  podcastIds: string[];
  createdAt: number;
}

export interface Note {
  id: string;
  podcastId: string;
  episodeId?: string;
  content: string;
  rating: number;
  createdAt: number;
  updatedAt: number;
}

export interface DailyMinutes {
  date: string;
  minutes: number;
}

export interface ListeningStats {
  totalMinutes: number;
  completedEpisodes: number;
  averageRating: number;
  dailyMinutes: DailyMinutes[];
}

export interface PlaybackProgress {
  currentTime: number;
  duration: number;
  completed: boolean;
  lastPlayedAt: number;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export interface PlayerState {
  isPlaying: boolean;
  currentPodcastId: string | null;
  currentEpisodeId: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  playbackSpeed: PlaybackSpeed;
  isMuted: boolean;
  isSidebarOpen: boolean;
}

export type PlaybackProgressMap = Record<string, PlaybackProgress>;

export type ListeningHistory = DailyMinutes[];
