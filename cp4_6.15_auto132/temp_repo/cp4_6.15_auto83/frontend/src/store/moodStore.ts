import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Mood, Song, MoodStore } from '../types';

export const useMoodStore = create<MoodStore>((set, get) => ({
  moods: [],
  currentMood: null,
  playlist: [],
  history: [],
  favorites: [],
  currentSong: null,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,

  setMoods: (moods: Mood[]) => set({ moods }),

  setCurrentMood: (mood: Mood) => set({ currentMood: mood }),

  setPlaylist: (songs: Song[]) => set({ playlist: songs }),

  addToHistory: (mood: Mood, songs: Song[]) => {
    const historyItem = {
      id: uuidv4(),
      mood: mood.name,
      moodLabel: mood.label,
      emoji: mood.emoji,
      color: mood.color,
      songs,
      timestamp: Date.now(),
      songCount: songs.length,
    };
    set((state) => ({
      history: [historyItem, ...state.history],
    }));
  },

  clearHistory: () => set({ history: [] }),

  toggleFavorite: (songId: string) =>
    set((state) => ({
      favorites: state.favorites.includes(songId)
        ? state.favorites.filter((id) => id !== songId)
        : [...state.favorites, songId],
    })),

  setCurrentSong: (song: Song | null) => set({ currentSong: song }),

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setVolume: (vol: number) => set({ volume: vol }),

  setCurrentTime: (time: number) => set({ currentTime: time }),

  setDuration: (dur: number) => set({ duration: dur }),

  nextSong: () => {
    const { playlist, currentSong } = get();
    if (playlist.length === 0) return;
    const currentIndex = currentSong
      ? playlist.findIndex((s) => s.id === currentSong.id)
      : -1;
    const nextIndex = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
    set({ currentSong: playlist[nextIndex], currentTime: 0 });
  },

  prevSong: () => {
    const { playlist, currentSong } = get();
    if (playlist.length === 0) return;
    const currentIndex = currentSong
      ? playlist.findIndex((s) => s.id === currentSong.id)
      : -1;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    set({ currentSong: playlist[prevIndex], currentTime: 0 });
  },
}));
