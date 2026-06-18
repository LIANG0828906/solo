import React from 'react'
import { FiPlay, FiPause, FiSquare, FiRepeat, FiFastForward } from 'react-icons/fi'
import { useApp } from './AppContext'

import './PlaybackBar.css'

const PlaybackBar: React.FC = () => {
  const { isPlaying, currentTime, duration, bpm, loop, playPause, stop, seekTo, setBpm, setLoop } = useApp()

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    seekTo(percent * duration)
  }

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value, 10)
    setBpm(newBpm)
  }

  return (
    <div className="playback-bar">
      <div className="playback-left">
        <div className="transport-controls">
          <button 
            className="transport-btn stop-btn" 
            onClick={stop}
            title="停止"
          >
            <FiSquare />
          </button>
          <button 
            className={`transport-btn play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={playPause}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
          <button 
            className={`transport-btn loop-btn ${loop ? 'active' : ''}`}
            onClick={() => setLoop(!loop)}
            title={loop ? '关闭循环' : '循环播放'}
          >
            <FiRepeat />
          </button>
        </div>
      </div>

      <div className="playback-center">
        <div className="progress-container">
          <span className="time-display">{formatTime(currentTime)}</span>
          <div 
            className="progress-bar"
            onClick={handleProgressClick}
          >
            <div 
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
            <div 
              className="progress-thumb"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          <span className="time-display">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="playback-right">
        <div className="bpm-control">
          <FiFastForward size={14} />
          <span className="bpm-label">BPM</span>
          <input
            type="range"
            min="60"
            max="180"
            step="1"
            value={bpm}
            onChange={handleBpmChange}
            className="bpm-slider"
          />
          <span className="bpm-value">{bpm}</span>
        </div>
      </div>
    </div>
  )
}

export default PlaybackBar
