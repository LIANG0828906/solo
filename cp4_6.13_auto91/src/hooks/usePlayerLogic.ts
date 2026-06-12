import { useReducer, useEffect, useRef, useCallback } from 'react'
import { songs, Song } from '../data/songs'

export interface PlayerState {
  currentSongIndex: number
  currentSong: Song
  isPlaying: boolean
  progress: number
  volume: number
}

export type PlayerAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'NEXT_SONG' }
  | { type: 'PREV_SONG' }
  | { type: 'SET_SONG'; payload: number }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SYNC_STATE'; payload: Partial<PlayerState> }

const initialState: PlayerState = {
  currentSongIndex: 0,
  currentSong: songs[0],
  isPlaying: false,
  progress: 0,
  volume: 0.7,
}

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY':
      return { ...state, isPlaying: true }
    case 'PAUSE':
      return { ...state, isPlaying: false }
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying }
    case 'NEXT_SONG': {
      const nextIndex = (state.currentSongIndex + 1) % songs.length
      return {
        ...state,
        currentSongIndex: nextIndex,
        currentSong: songs[nextIndex],
        progress: 0,
      }
    }
    case 'PREV_SONG': {
      const prevIndex = (state.currentSongIndex - 1 + songs.length) % songs.length
      return {
        ...state,
        currentSongIndex: prevIndex,
        currentSong: songs[prevIndex],
        progress: 0,
      }
    }
    case 'SET_SONG': {
      const index = action.payload
      if (index < 0 || index >= songs.length) return state
      return {
        ...state,
        currentSongIndex: index,
        currentSong: songs[index],
        progress: 0,
        isPlaying: true,
      }
    }
    case 'SET_PROGRESS':
      return { ...state, progress: Math.max(0, Math.min(1, action.payload)) }
    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.payload)) }
    case 'SYNC_STATE':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

export function usePlayerLogic() {
  const [state, dispatch] = useReducer(playerReducer, initialState)
  const intervalRef = useRef<number | null>(null)
  const progressRef = useRef<number>(initialState.progress)
  const durationRef = useRef<number>(initialState.currentSong.duration)

  useEffect(() => {
    progressRef.current = state.progress
  }, [state.progress])

  useEffect(() => {
    durationRef.current = state.currentSong.duration
  }, [state.currentSong.duration])

  useEffect(() => {
    if (state.isPlaying) {
      intervalRef.current = window.setInterval(() => {
        const progressIncrement = 1 / durationRef.current
        const newProgress = progressRef.current + progressIncrement
        progressRef.current = newProgress
        dispatch({ type: 'SET_PROGRESS', payload: newProgress })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.isPlaying])

  useEffect(() => {
    if (state.progress >= 1 && state.isPlaying) {
      dispatch({ type: 'NEXT_SONG' })
    }
  }, [state.progress, state.isPlaying])

  const play = useCallback(() => dispatch({ type: 'PLAY' }), [])
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), [])
  const togglePlay = useCallback(() => dispatch({ type: 'TOGGLE_PLAY' }), [])
  const nextSong = useCallback(() => {
    progressRef.current = 0
    dispatch({ type: 'NEXT_SONG' })
  }, [])
  const prevSong = useCallback(() => {
    progressRef.current = 0
    dispatch({ type: 'PREV_SONG' })
  }, [])
  const setSong = useCallback((index: number) => {
    progressRef.current = 0
    dispatch({ type: 'SET_SONG', payload: index })
  }, [])
  const setProgress = useCallback((progress: number) => {
    progressRef.current = progress
    dispatch({ type: 'SET_PROGRESS', payload: progress })
  }, [])
  const setVolume = useCallback((volume: number) => dispatch({ type: 'SET_VOLUME', payload: volume }), [])
  const syncState = useCallback((newState: Partial<PlayerState>) => {
    if (newState.progress !== undefined) {
      progressRef.current = newState.progress
    }
    dispatch({ type: 'SYNC_STATE', payload: newState })
  }, [])

  return {
    state,
    dispatch,
    play,
    pause,
    togglePlay,
    nextSong,
    prevSong,
    setSong,
    setProgress,
    setVolume,
    syncState,
    songs,
  }
}
