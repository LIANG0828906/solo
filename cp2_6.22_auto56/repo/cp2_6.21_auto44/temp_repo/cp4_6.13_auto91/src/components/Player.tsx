import { useState, useRef, useEffect, useCallback } from 'react'
import { usePlayerLogic } from '../hooks/usePlayerLogic'
import { useSyncChannel } from '../hooks/useSyncChannel'
import { Song } from '../data/songs'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function MusicNoteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z"/>
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  )
}

function PrevIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
    </svg>
  )
}

function NextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
    </svg>
  )
}

function VolumeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="volume-icon">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  )
}

function PlaylistIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.7)' }}>
      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
    </svg>
  )
}

export default function Player() {
  const { state, togglePlay, nextSong, prevSong, setSong, setProgress, setVolume, syncState, songs } = usePlayerLogic()
  const { broadcastState, isSyncing } = useSyncChannel(state, syncState)
  const [playlistOpen, setPlaylistOpen] = useState(false)
  const [isDraggingProgress, setIsDraggingProgress] = useState(false)
  const [isDraggingVolume, setIsDraggingVolume] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)

  const handleTogglePlay = useCallback(() => {
    togglePlay()
    broadcastState({ isPlaying: !state.isPlaying })
  }, [togglePlay, broadcastState, state.isPlaying])

  const handleNextSong = useCallback(() => {
    nextSong()
    const nextIndex = (state.currentSongIndex + 1) % songs.length
    broadcastState({
      currentSongIndex: nextIndex,
      currentSong: songs[nextIndex],
      progress: 0,
      isPlaying: state.isPlaying,
    })
  }, [nextSong, broadcastState, state.currentSongIndex, state.isPlaying, songs])

  const handlePrevSong = useCallback(() => {
    prevSong()
    const prevIndex = (state.currentSongIndex - 1 + songs.length) % songs.length
    broadcastState({
      currentSongIndex: prevIndex,
      currentSong: songs[prevIndex],
      progress: 0,
      isPlaying: state.isPlaying,
    })
  }, [prevSong, broadcastState, state.currentSongIndex, state.isPlaying, songs])

  const handleSetSong = useCallback((index: number) => {
    setSong(index)
    broadcastState({
      currentSongIndex: index,
      currentSong: songs[index],
      progress: 0,
      isPlaying: true,
    })
  }, [setSong, broadcastState, songs])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const progress = (e.clientX - rect.left) / rect.width
    setProgress(progress)
    broadcastState({ progress })
  }, [setProgress, broadcastState])

  const handleProgressDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setIsDraggingProgress(true)
  }, [])

  const handleVolumeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeSliderRef.current) return
    const rect = volumeSliderRef.current.getBoundingClientRect()
    const volume = (e.clientX - rect.left) / rect.width
    setVolume(volume)
    broadcastState({ volume })
  }, [setVolume, broadcastState])

  const handleVolumeDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setIsDraggingVolume(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress && progressBarRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect()
        const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        setProgress(progress)
      }
      if (isDraggingVolume && volumeSliderRef.current) {
        const rect = volumeSliderRef.current.getBoundingClientRect()
        const volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        setVolume(volume)
      }
    }

    const handleMouseUp = () => {
      if (isDraggingProgress) {
        setIsDraggingProgress(false)
        broadcastState({ progress: state.progress })
      }
      if (isDraggingVolume) {
        setIsDraggingVolume(false)
        broadcastState({ volume: state.volume })
      }
    }

    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingProgress, isDraggingVolume, setProgress, setVolume, broadcastState, state.progress, state.volume])

  const currentTime = state.progress * state.currentSong.duration
  const totalTime = state.currentSong.duration

  return (
    <div className="player-container">
      <button
        className="playlist-toggle"
        onClick={() => setPlaylistOpen(!playlistOpen)}
        aria-label="播放列表"
      >
        <PlaylistIcon />
      </button>

      <div className={`sync-indicator ${isSyncing ? 'active' : ''}`} />

      <div className={`playlist-panel ${playlistOpen ? 'open' : ''}`}>
        <div className="playlist-title">播放列表</div>
        {songs.map((song: Song, index: number) => (
          <div
            key={song.id}
            className={`playlist-item ${index === state.currentSongIndex ? 'active' : ''}`}
            onClick={() => handleSetSong(index)}
          >
            <span className="playlist-item-index">{index + 1}</span>
            <div className="playlist-item-info">
              <div className="playlist-item-title">{song.title}</div>
              <div className="playlist-item-artist">{song.artist}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="cover-container">
        <div className="cover">
          {state.currentSong.cover ? (
            <img src={state.currentSong.cover} alt={state.currentSong.title} />
          ) : (
            <MusicNoteIcon />
          )}
        </div>
      </div>

      <div className="song-info">
        <div className="song-title">{state.currentSong.title}</div>
        <div className="song-artist">{state.currentSong.artist}</div>
      </div>

      <div className="progress-container">
        <div
          ref={progressBarRef}
          className="progress-bar"
          onClick={handleProgressClick}
          onMouseDown={handleProgressClick}
        >
          <div
            className="progress-fill"
            style={{ width: `${state.progress * 100}%` }}
          >
            <div
              className={`progress-thumb ${isDraggingProgress ? 'dragging' : ''}`}
              onMouseDown={handleProgressDragStart}
            />
          </div>
        </div>
        <div className="progress-time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>

      <div className="controls">
        <div className="volume-control">
          <VolumeIcon />
          <div
            ref={volumeSliderRef}
            className={`volume-slider ${isDraggingVolume ? 'dragging' : ''}`}
            onClick={handleVolumeClick}
            onMouseDown={handleVolumeClick}
          >
            <div
              className="volume-fill"
              style={{ width: `${state.volume * 100}%` }}
            >
              <div
                className="volume-thumb"
                onMouseDown={handleVolumeDragStart}
              />
            </div>
          </div>
        </div>

        <div className="control-buttons">
          <button className="control-btn" onClick={handlePrevSong} aria-label="上一首">
            <PrevIcon />
          </button>
          <button className={`control-btn play-pause ${state.isPlaying ? 'is-playing' : ''}`} onClick={handleTogglePlay} aria-label="播放/暂停">
            <span className="play-pause-icon play-icon">
              <PlayIcon />
            </span>
            <span className="play-pause-icon pause-icon">
              <PauseIcon />
            </span>
          </button>
          <button className="control-btn" onClick={handleNextSong} aria-label="下一首">
            <NextIcon />
          </button>
        </div>

        <div className="volume-placeholder" />
      </div>

      <div className="song-index">
        {state.currentSongIndex + 1}/{songs.length}
      </div>
    </div>
  )
}
