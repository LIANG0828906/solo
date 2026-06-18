export interface Song {
  id: string
  title: string
  artist: string
  album: string
  cover: string
  url?: string
  duration: number
  lyrics?: string
  color: string
}

export interface Playlist {
  id: string
  name: string
  description: string
  cover: string
  songIds: string[]
  createdAt: number
  updatedAt: number
  shared: boolean
  color: string
}

export type LoopMode = 'single' | 'list' | 'shuffle'

export interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  loopMode: LoopMode
  currentSong: Song | null
  playlist: Song[]
  currentIndex: number
  isTransitioning: boolean
}

export interface MusicStoreState {
  songs: Song[]
  playlists: Playlist[]
  searchResults: Song[]
  player: PlayerState
}

export interface MusicStoreActions {
  searchSongs: (keyword: string) => void
  playSong: (song: Song, playlist?: Song[]) => void
  togglePlay: () => void
  nextSong: () => void
  prevSong: () => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  toggleLoopMode: () => void
  createPlaylist: (name: string, description: string) => Playlist
  addSongToPlaylist: (playlistId: string, songId: string) => boolean
  removeSongFromPlaylist: (playlistId: string, songId: string) => boolean
  getPlaylist: (id: string) => Playlist | undefined
  sharePlaylist: (playlistId: string) => string | null
  initializeStore: () => Promise<void>
}

export type MusicStore = MusicStoreState & MusicStoreActions
