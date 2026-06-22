import { useRef, useState, useCallback } from 'react'
import { useAudioStore } from '../store/audioStore'
import './PlaybackBar.css'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function PlaybackBar() {
  const { isPlaying, togglePlay, currentTime, duration, getCurrentPreset, setCurrentTime } = useAudioStore()
  const progressRef = useRef<HTMLDivElement>(null)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  const currentPreset = getCurrentPreset()
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handlePlayClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples((prev) => [...prev, { id, x, y }])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)

    togglePlay()
  }

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      const newTime = Math.max(0, Math.min(duration, percent * duration))
      setCurrentTime(newTime)
    },
    [duration, setCurrentTime]
  )

  return (
    <div className="playback-bar">
      <div className="playback-preset-info">
        <div className="preset-badge" />
        <span className="preset-name">{currentPreset?.name || '未选择模式'}</span>
      </div>

      <div className="playback-center">
        <button className={`play-btn ${isPlaying ? 'playing' : ''}`} onClick={handlePlayClick}>
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="ripple"
              style={{ left: ripple.x, top: ripple.y }}
            />
          ))}
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            {isPlaying ? (
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            ) : (
              <path d="M8 5v14l11-7z" />
            )}
          </svg>
        </button>

        <div className="progress-container">
          <span className="time-text">{formatTime(currentTime)}</span>
          <div
            className="progress-bar"
            ref={progressRef}
            onClick={handleProgressClick}
          >
            <div className="progress-bg" />
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="progress-thumb"
              style={{ left: `calc(${progress}% - 6px)` }}
            >
              {isPlaying && <span className="pulse-dot" />}
            </div>
          </div>
          <span className="time-text">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="playback-spacer" />
    </div>
  )
}
