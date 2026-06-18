import { create } from 'zustand'
import {
  Song,
  Playlist,
  LoopMode,
  PlayerState,
  MusicStore,
  MusicStoreState,
} from '@/types'
import {
  searchSongs,
  getAllSongs,
  getAllPlaylists,
  savePlaylist,
  addSongToPlaylist as addSongToPlaylistApi,
  removeSongFromPlaylist as removeSongFromPlaylistApi,
  updatePlaylist,
} from '@/utils/api'
import {
  debounce,
  generateId,
  generateShareLink,
  clamp,
  shuffleArray,
  generateRandomColor,
} from '@/utils/helpers'

const STORAGE_KEY = 'music_app_data'
const FADE_DURATION = 300
const LOOP_MODE_ORDER: LoopMode[] = ['list', 'single', 'shuffle']

interface PersistedData {
  songs: Song[]
  playlists: Playlist[]
  volume: number
  loopMode: LoopMode
}

const getDefaultPlayerState = (): PlayerState => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  loopMode: 'list',
  currentSong: null,
  playlist: [],
  currentIndex: -1,
  isTransitioning: false,
})

const getDefaultState = (): MusicStoreState => ({
  songs: [],
  playlists: [],
  searchResults: [],
  player: getDefaultPlayerState(),
})

const loadFromStorage = (): PersistedData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data) as PersistedData
    }
  } catch (error) {
    console.error('从 localStorage 加载数据失败:', error)
  }
  return null
}

const saveToStorage = (state: Partial<MusicStore>): void => {
  try {
    const data: PersistedData = {
      songs: state.songs || [],
      playlists: state.playlists || [],
      volume: state.player?.volume ?? 0.7,
      loopMode: state.player?.loopMode ?? 'list',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('保存数据到 localStorage 失败:', error)
  }
}

export const useMusicStore = create<MusicStore>((set, get) => {
  const performSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      set({ searchResults: [] })
      return
    }

    const { songs } = get()
    const lowerKeyword = keyword.toLowerCase().trim()
    const localResults = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerKeyword) ||
        song.artist.toLowerCase().includes(lowerKeyword) ||
        song.album.toLowerCase().includes(lowerKeyword)
    )

    set({ searchResults: localResults })

    try {
      const apiResults = await searchSongs(keyword)
      if (apiResults && apiResults.length > 0) {
        const combinedResults = [...localResults]
        apiResults.forEach((apiSong: Song) => {
          if (!combinedResults.find((s) => s.id === apiSong.id)) {
            combinedResults.push(apiSong)
          }
        })
        set({ searchResults: combinedResults })
      }
    } catch (error) {
      console.error('API 搜索失败，使用本地结果:', error)
    }
  }

  const debouncedSearch = debounce(performSearch as (...args: unknown[]) => unknown, 200)

  const playSongWithFade = async (song: Song, playlist?: Song[]) => {
    const { player } = get()

    if (player.isTransitioning) return

    set((state) => ({
      player: {
        ...state.player,
        isTransitioning: true,
        isPlaying: false,
      },
    }))

    await new Promise((resolve) => setTimeout(resolve, FADE_DURATION))

    const newPlaylist = playlist || player.playlist
    const newIndex = newPlaylist.findIndex((s) => s.id === song.id)

    set((state) => ({
      player: {
        ...state.player,
        currentSong: song,
        playlist: newPlaylist,
        currentIndex: newIndex >= 0 ? newIndex : 0,
        currentTime: 0,
        duration: song.duration,
        isPlaying: true,
        isTransitioning: false,
      },
    }))
  }

  const getNextIndex = (): number => {
    const { player } = get()
    const { loopMode, currentIndex, playlist } = player

    if (playlist.length === 0) return -1

    switch (loopMode) {
      case 'single':
        return currentIndex
      case 'shuffle': {
        const shuffled = shuffleArray(
          playlist.map((_, i) => i).filter((i) => i !== currentIndex)
        )
        return shuffled[0] ?? currentIndex
      }
      case 'list':
      default:
        return (currentIndex + 1) % playlist.length
    }
  }

  const getPrevIndex = (): number => {
    const { player } = get()
    const { loopMode, currentIndex, playlist } = player

    if (playlist.length === 0) return -1

    switch (loopMode) {
      case 'single':
        return currentIndex
      case 'shuffle': {
        const shuffled = shuffleArray(
          playlist.map((_, i) => i).filter((i) => i !== currentIndex)
        )
        return shuffled[0] ?? currentIndex
      }
      case 'list':
      default:
        return currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    }
  }

  return {
    ...getDefaultState(),

    searchSongs: (keyword: string) => {
      debouncedSearch(keyword)
    },

    playSong: (song: Song, playlist?: Song[]) => {
      playSongWithFade(song, playlist)
    },

    togglePlay: () => {
      set((state) => ({
        player: {
          ...state.player,
          isPlaying: !state.player.isPlaying,
        },
      }))
    },

    nextSong: () => {
      const { player } = get()
      const nextIndex = getNextIndex()
      if (nextIndex >= 0 && player.playlist[nextIndex]) {
        playSongWithFade(player.playlist[nextIndex], player.playlist)
      }
    },

    prevSong: () => {
      const { player } = get()
      const prevIndex = getPrevIndex()
      if (prevIndex >= 0 && player.playlist[prevIndex]) {
        playSongWithFade(player.playlist[prevIndex], player.playlist)
      }
    },

    setVolume: (volume: number) => {
      const clampedVolume = clamp(volume, 0, 1)
      set((state) => {
        const newState = {
          player: {
            ...state.player,
            volume: clampedVolume,
          },
        }
        saveToStorage({ ...state, ...newState })
        return newState
      })
    },

    setCurrentTime: (time: number) => {
      set((state) => ({
        player: {
          ...state.player,
          currentTime: Math.max(0, Math.min(time, state.player.duration)),
        },
      }))
    },

    toggleLoopMode: () => {
      set((state) => {
        const currentModeIndex = LOOP_MODE_ORDER.indexOf(state.player.loopMode)
        const nextModeIndex = (currentModeIndex + 1) % LOOP_MODE_ORDER.length
        const newLoopMode = LOOP_MODE_ORDER[nextModeIndex]

        const newState = {
          player: {
            ...state.player,
            loopMode: newLoopMode,
          },
        }
        saveToStorage({ ...state, ...newState })
        return newState
      })
    },

    createPlaylist: (name: string, description: string): Playlist => {
      const newPlaylist: Playlist = {
        id: generateId(),
        name,
        description,
        cover: `https://picsum.photos/seed/${encodeURIComponent(name)}/300/300`,
        songIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        shared: false,
        color: generateRandomColor(),
      }

      set((state) => {
        const newState = {
          playlists: [...state.playlists, newPlaylist],
        }
        saveToStorage({ ...state, ...newState })
        return newState
      })

      savePlaylist({ name, description, songIds: [], shared: false }).catch((error) => {
        console.error('同步创建歌单到服务器失败:', error)
      })

      return newPlaylist
    },

    addSongToPlaylist: (playlistId: string, songId: string): boolean => {
      const { playlists } = get()
      const playlist = playlists.find((p) => p.id === playlistId)

      if (!playlist || playlist.songIds.includes(songId)) {
        return false
      }

      set((state) => {
        const newState = {
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songIds: [...p.songIds, songId], updatedAt: Date.now() }
              : p
          ),
        }
        saveToStorage({ ...state, ...newState })
        return newState
      })

      addSongToPlaylistApi(playlistId, songId).catch((error) => {
        console.error('同步添加歌曲到服务器失败:', error)
      })

      return true
    },

    removeSongFromPlaylist: (playlistId: string, songId: string): boolean => {
      const { playlists } = get()
      const playlist = playlists.find((p) => p.id === playlistId)

      if (!playlist || !playlist.songIds.includes(songId)) {
        return false
      }

      set((state) => {
        const newState = {
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songIds: p.songIds.filter((id) => id !== songId), updatedAt: Date.now() }
              : p
          ),
        }
        saveToStorage({ ...state, ...newState })
        return newState
      })

      removeSongFromPlaylistApi(playlistId, songId).catch((error) => {
        console.error('同步从服务器删除歌曲失败:', error)
      })

      return true
    },

    getPlaylist: (id: string): Playlist | undefined => {
      return get().playlists.find((p) => p.id === id)
    },

    sharePlaylist: (playlistId: string): string | null => {
      const { playlists } = get()
      const playlist = playlists.find((p) => p.id === playlistId)

      if (!playlist) {
        return null
      }

      set((state) => {
        const newState = {
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, shared: true, updatedAt: Date.now() } : p
          ),
        }
        saveToStorage({ ...state, ...newState })
        return newState
      })

      updatePlaylist(playlistId, { shared: true }).catch((error) => {
        console.error('同步分享歌单到服务器失败:', error)
      })

      return generateShareLink(playlistId)
    },

    initializeStore: async () => {
      const persistedData = loadFromStorage()

      try {
        const [songsData, playlistsData] = await Promise.all([
          getAllSongs(),
          getAllPlaylists(),
        ])

        const songs: Song[] =
          songsData && songsData.length > 0
            ? songsData
            : persistedData?.songs || []
        const playlists: Playlist[] =
          playlistsData && playlistsData.length > 0
            ? playlistsData
            : persistedData?.playlists || []

        set((state) => {
          const newState = {
            songs,
            playlists,
            player: {
              ...state.player,
              volume: persistedData?.volume ?? state.player.volume,
              loopMode: persistedData?.loopMode ?? state.player.loopMode,
            },
          }
          saveToStorage(newState)
          return newState
        })
      } catch (error) {
        console.error('初始化数据失败，使用本地存储数据:', error)

        if (persistedData) {
          set((state) => ({
            songs: persistedData.songs,
            playlists: persistedData.playlists,
            player: {
              ...state.player,
              volume: persistedData.volume,
              loopMode: persistedData.loopMode,
            },
          }))
        }
      }
    },
  }
})

export default useMusicStore
