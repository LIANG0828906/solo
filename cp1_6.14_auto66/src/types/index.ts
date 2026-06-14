export interface Song {
  id: string
  title: string
  artist: string
  genre: 'pop' | 'folk' | 'electronic'
  coverGradient: string
  audioSrc: string
  duration: number
  sections: Section[]
}

export interface Section {
  id: number
  startTime: number
  endTime: number
  lyrics: string[]
  beats: Beat[]
}

export interface Beat {
  time: number
  volume: number
  pitch: number
}

export interface WordFragment {
  id: string
  text: string
  x: number
  y: number
  originX: number
  originY: number
  size: number
  color: string
  glowColor: string
  opacity: number
  rotation: number
  animationType: 'sine' | 'rotate' | 'sway'
  animationOffset: number
  animationSpeed: number
  captured: boolean
  beatIndex: number
  entering: boolean
}

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'success' | 'failed' | 'gameover'

export interface GameState {
  currentSong: Song | null
  currentSectionIndex: number
  score: number
  combo: number
  maxCombo: number
  lives: number
  isPlaying: boolean
  isPaused: boolean
  capturedWords: string[]
  errorCount: number
  gameStatus: GameStatus
  fragments: WordFragment[]
  particles: Particle[]
  sectionProgress: number
  songProgress: number
  completedSections: number
}
