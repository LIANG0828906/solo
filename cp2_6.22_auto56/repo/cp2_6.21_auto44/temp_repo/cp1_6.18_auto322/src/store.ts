import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { saveToStorage, loadFromStorage, hashColor, randomDarkColor, randomLightColor } from './utils/storage'

export type MusicGenre = 'electronic' | 'folk' | 'rock' | 'pop' | 'jazz' | 'classical' | 'hiphop' | 'rnb'

export const GENRE_LABELS: Record<MusicGenre, string> = {
  electronic: '电子',
  folk: '民谣',
  rock: '摇滚',
  pop: '流行',
  jazz: '爵士',
  classical: '古典',
  hiphop: '嘻哈',
  rnb: 'R&B',
}

export interface Artist {
  id: string
  name: string
  bio: string
  genres: MusicGenre[]
  avatarColor: string
  createdAt: number
}

export interface Song {
  id: string
  artistId: string
  title: string
  note: string
  duration: number
  playCount: number
  coverColor: string
  audioData: string
  createdAt: number
}

export interface Message {
  id: string
  artistId: string
  visitorName: string
  content: string
  avatarColor: string
  createdAt: number
}

export interface Like {
  id: string
  songId: string
  visitorName: string
  createdAt: number
}

export interface AppState {
  artists: Artist[]
  songs: Song[]
  messages: Message[]
  likes: Like[]
  currentArtistId: string | null
  currentSongId: string | null
  isPlayerOpen: boolean
  currentVisitorName: string
  createArtist: (artist: Omit<Artist, 'id' | 'avatarColor' | 'createdAt'>) => Artist
  updateArtist: (id: string, updates: Partial<Artist>) => void
  addSong: (song: Omit<Song, 'id' | 'playCount' | 'coverColor' | 'createdAt'>) => Song
  deleteSong: (id: string) => void
  incrementPlayCount: (songId: string) => void
  addMessage: (message: Omit<Message, 'id' | 'avatarColor' | 'createdAt'>) => Message
  addLike: (like: Omit<Like, 'id' | 'createdAt'>) => Like
  getLikesForSong: (songId: string) => Like[]
  hasLikedSong: (songId: string, visitorName: string) => boolean
  getTopFans: (artistId: string, limit: number) => { name: string; count: number }[]
  getSongsByArtist: (artistId: string) => Song[]
  getMessagesByArtist: (artistId: string) => Message[]
  openPlayer: (songId: string) => void
  closePlayer: () => void
  setCurrentArtist: (artistId: string | null) => void
  setCurrentVisitorName: (name: string) => void
  exportData: () => string
  importData: (json: string) => void
  resetStore: () => void
}

function getInitialState() {
  const stored = loadFromStorage()
  if (stored) {
    return stored
  }
  return {
    artists: [],
    songs: [],
    messages: [],
    likes: [],
    currentArtistId: null,
    currentSongId: null,
    isPlayerOpen: false,
    currentVisitorName: '访客' + Math.floor(Math.random() * 10000),
  }
}

export const useStore = create<AppState>((set, get) => ({
  ...getInitialState(),

  createArtist: (artistData) => {
    const artist: Artist = {
      ...artistData,
      id: uuidv4(),
      avatarColor: hashColor(artistData.name),
      createdAt: Date.now(),
    }
    set((state) => {
      const newState = { ...state, artists: [...state.artists, artist] }
      saveToStorage(newState)
      return newState
    })
    return artist
  },

  updateArtist: (id, updates) => {
    set((state) => {
      const newState = {
        ...state,
        artists: state.artists.map((a) =>
          a.id === id ? { ...a, ...updates, avatarColor: updates.name ? hashColor(updates.name) : a.avatarColor } : a
        ),
      }
      saveToStorage(newState)
      return newState
    })
  },

  addSong: (songData) => {
    const song: Song = {
      ...songData,
      id: uuidv4(),
      playCount: 0,
      coverColor: randomDarkColor(),
      createdAt: Date.now(),
    }
    set((state) => {
      const newState = { ...state, songs: [...state.songs, song] }
      saveToStorage(newState)
      return newState
    })
    return song
  },

  deleteSong: (id) => {
    set((state) => {
      const newState = {
        ...state,
        songs: state.songs.filter((s) => s.id !== id),
        likes: state.likes.filter((l) => l.songId !== id),
      }
      saveToStorage(newState)
      return newState
    })
  },

  incrementPlayCount: (songId) => {
    set((state) => {
      const newState = {
        ...state,
        songs: state.songs.map((s) =>
          s.id === songId ? { ...s, playCount: s.playCount + 1 } : s
        ),
      }
      saveToStorage(newState)
      return newState
    })
  },

  addMessage: (messageData) => {
    const message: Message = {
      ...messageData,
      id: uuidv4(),
      avatarColor: randomLightColor(),
      createdAt: Date.now(),
    }
    set((state) => {
      const newState = { ...state, messages: [...state.messages, message] }
      saveToStorage(newState)
      return newState
    })
    return message
  },

  addLike: (likeData) => {
    const like: Like = {
      ...likeData,
      id: uuidv4(),
      createdAt: Date.now(),
    }
    set((state) => {
      const newState = { ...state, likes: [...state.likes, like] }
      saveToStorage(newState)
      return newState
    })
    return like
  },

  getLikesForSong: (songId) => {
    return get().likes.filter((l) => l.songId === songId)
  },

  hasLikedSong: (songId, visitorName) => {
    return get().likes.some((l) => l.songId === songId && l.visitorName === visitorName)
  },

  getTopFans: (artistId, limit) => {
    const state = get()
    const artistSongs = state.songs.filter((s) => s.artistId === artistId)
    const artistSongIds = new Set(artistSongs.map((s) => s.id))
    const fanCounts: Record<string, number> = {}

    state.likes.forEach((like) => {
      if (artistSongIds.has(like.songId)) {
        fanCounts[like.visitorName] = (fanCounts[like.visitorName] || 0) + 1
      }
    })

    return Object.entries(fanCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  },

  getSongsByArtist: (artistId) => {
    return get().songs.filter((s) => s.artistId === artistId)
  },

  getMessagesByArtist: (artistId) => {
    return get().messages
      .filter((m) => m.artistId === artistId)
      .sort((a, b) => b.createdAt - a.createdAt)
  },

  openPlayer: (songId) => {
    set({ currentSongId: songId, isPlayerOpen: true })
  },

  closePlayer: () => {
    set({ isPlayerOpen: false })
  },

  setCurrentArtist: (artistId) => {
    set({ currentArtistId: artistId })
  },

  setCurrentVisitorName: (name) => {
    set({ currentVisitorName: name })
  },

  exportData: () => {
    return JSON.stringify(get(), null, 2)
  },

  importData: (json) => {
    try {
      const data = JSON.parse(json) as AppState
      set(data)
      saveToStorage(data)
    } catch (e) {
      console.error('Failed to import data:', e)
    }
  },

  resetStore: () => {
    const initialState = {
      artists: [],
      songs: [],
      messages: [],
      likes: [],
      currentArtistId: null,
      currentSongId: null,
      isPlayerOpen: false,
      currentVisitorName: '访客' + Math.floor(Math.random() * 10000),
    }
    set(initialState)
    saveToStorage(initialState)
  },
}))
