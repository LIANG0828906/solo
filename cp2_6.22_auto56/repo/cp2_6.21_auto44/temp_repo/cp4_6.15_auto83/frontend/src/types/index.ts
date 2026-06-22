export interface Mood {
  id: string;
  name: string;
  label: string;
  emoji: string;
  gradient: string;
  color: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  previewUrl: string;
}

export interface HistoryItem {
  id: string;
  mood: string;
  moodLabel: string;
  emoji: string;
  color: string;
  songs: Song[];
  timestamp: number;
  songCount: number;
}

export interface MoodState {
  moods: Mood[];
  currentMood: Mood | null;
  playlist: Song[];
  history: HistoryItem[];
  favorites: string[];
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
}

export interface MoodActions {
  setMoods: (moods: Mood[]) => void;
  setCurrentMood: (mood: Mood) => void;
  setPlaylist: (songs: Song[]) => void;
  addToHistory: (mood: Mood, songs: Song[]) => void;
  clearHistory: () => void;
  toggleFavorite: (songId: string) => void;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (vol: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (dur: number) => void;
  nextSong: () => void;
  prevSong: () => void;
}

export type MoodStore = MoodState & MoodActions;
