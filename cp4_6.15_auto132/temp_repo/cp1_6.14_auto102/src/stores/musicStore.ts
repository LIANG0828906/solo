import { create } from 'zustand'
import type { Song } from '@/types'

interface MusicState {
  currentSong: Song | null
  isPlaying: boolean
  favorites: string[]
  purchases: string[]
  previewSong: Song | null
  isPreviewPlaying: boolean
  setCurrentSong: (song: Song | null) => void
  setIsPlaying: (playing: boolean) => void
  toggleFavorite: (id: string) => void
  addPurchase: (id: string) => void
  setPreviewSong: (song: Song | null) => void
  setIsPreviewPlaying: (playing: boolean) => void
}

export const useMusicStore = create<MusicState>((set) => ({
  currentSong: null,
  isPlaying: false,
  favorites: [],
  purchases: [],
  previewSong: null,
  isPreviewPlaying: false,
  setCurrentSong: (song) => set({ currentSong: song, isPlaying: !!song }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  toggleFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((fid) => fid !== id)
        : [...state.favorites, id],
    })),
  addPurchase: (id) =>
    set((state) => ({ purchases: [...state.purchases, id] })),
  setPreviewSong: (song) => set({ previewSong: song }),
  setIsPreviewPlaying: (playing) => set({ isPreviewPlaying: playing }),
}))
