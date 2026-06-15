import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import './Playback.scss'

export default function Playback() {
  const {
    playbackState,
    setPlaybackState,
    stepForward,
    goToStep,
    resetCanvas,
    history
  } = useStore()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handlePlayPause = useCallback(() => {
    const newIsPlaying = !playbackState.isPlaying
    setPlaybackState({ isPlaying: newIsPlaying })
  }, [playbackState.isPlaying, setPlaybackState])

  const handleReset = useCallback(() => {
    resetCanvas()
  }, [resetCanvas])

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const step = parseInt(e.target.value, 10)
    goToStep(step)
  }, [goToStep])

  const handleStepForward = useCallback(() => {
    stepForward()
  }, [stepForward])

  useEffect(() => {
    if (playbackState.isPlaying) {
      intervalRef.current = setInterval(() => {
        const { historyIndex, history } = useStore.getState()
        if (historyIndex >= history.length - 1) {
          setPlaybackState({ isPlaying: false })
        } else {
          stepForward()
        }
      }, 200 / playbackState.speed)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [playbackState.isPlaying, playbackState.speed, stepForward, setPlaybackState])

  const totalSteps = history.length - 1
  const progress = totalSteps > 0 ? (playbackState.currentStep / totalSteps) * 100 : 0

  return (
    <div className="playback-container">
      <div className="playback-progress">
        <span className="progress-label">
          步骤 {playbackState.currentStep} / {totalSteps}
        </span>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min="0"
            max={Math.max(0, totalSteps)}
            value={playbackState.currentStep}
            onChange={handleSliderChange}
            className="progress-slider"
          />
        </div>
      </div>
      <div className="playback-controls">
        <button
          className="control-button reset"
          onClick={handleReset}
          title="重置画布"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button
          className="control-button step-back"
          onClick={() => useStore.getState().stepBackward()}
          disabled={playbackState.currentStep <= 0}
          title="上一步"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="19 20 9 12 19 4 19 20" />
            <line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </button>
        <button
          className="control-button play-pause"
          onClick={handlePlayPause}
          title={playbackState.isPlaying ? '暂停' : '播放'}
        >
          {playbackState.isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
        <button
          className="control-button step-forward"
          onClick={handleStepForward}
          disabled={playbackState.currentStep >= totalSteps}
          title="下一步"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
        <div className="speed-control">
          <label htmlFor="speed">速度:</label>
          <select
            id="speed"
            value={playbackState.speed}
            onChange={(e) => setPlaybackState({ speed: parseFloat(e.target.value) })}
            className="speed-select"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
          </select>
        </div>
      </div>
    </div>
  )
}
