export interface Song {
  id: string
  name: string
  artist: string
  album: string
  playCount: number
  duration: number
  genres: string[]
  lyrics: string
  color: string
}

export interface GradientScheme {
  id: string
  name: string
  colors: string[]
}

export interface PosterData {
  songs: Song[]
  topArtist: string
  totalDuration: number
  genres: { name: string; count: number }[]
  selectedGradient: GradientScheme
  lyricsStartTime: number
  topSong: Song
}

export type PageView = 'input' | 'poster'
