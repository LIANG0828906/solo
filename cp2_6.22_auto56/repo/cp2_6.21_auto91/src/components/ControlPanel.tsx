import React, { useRef, useCallback } from 'react'
import type { ThemeConfig } from '../themeConfig'

interface ControlPanelProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  currentTheme: string
  themes: ThemeConfig[]
  uploadProgress: number
  isLoading: boolean
  fileName: string | null
  onFileUpload: (file: File) => void
  onPlayPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (value: number) => void
  onThemeChange: (themeName: string) => void
  layoutMode: 'desktop' | 'tablet' | 'mobile'
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  currentTheme,
  themes,
  uploadProgress,
  isLoading,
  fileName,
  onFileUpload,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onThemeChange,
  layoutMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileUpload(file)
      }
    },
    [onFileUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith('audio/')) {
        onFileUpload(file)
      }
    },
    [onFileUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!duration || !progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      onSeek(percent * duration)
    },
    [duration, onSeek]
  )

  const isDesktop = layoutMode === 'desktop'
  const isTablet = layoutMode === 'tablet'

  const currentThemeConfig = themes.find((t) => t.name === currentTheme) || themes[0]
  const gradientStart = currentThemeConfig?.barGradient[0] || '#8b5cf6'
  const gradientEnd = currentThemeConfig?.barGradient[currentThemeConfig.barGradient.length - 1] || '#ec4899'

  const containerClass = isDesktop
    ? 'control-panel control-panel--desktop'
    : isTablet
      ? 'control-panel control-panel--tablet'
      : 'control-panel control-panel--mobile'

  const playButtonStyle = {
    background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
    boxShadow: `0 4px 20px ${gradientStart}66`,
  }

  const progressFillStyle = {
    background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`,
  }

  const uploadButtonStyle = {
    background: `linear-gradient(135deg, ${gradientStart}33, ${gradientEnd}33)`,
  }

  return (
    <div className={containerClass} onDrop={handleDrop} onDragOver={handleDragOver}>
      {isDesktop && (
        <div className="control-panel__header">
          <h1 className="control-panel__title">音乐可视化</h1>
          <p className="control-panel__subtitle">Music Visualizer</p>
        </div>
      )}

      <div className="control-panel__section">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="control-panel__file-input"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="control-panel__upload-btn" style={uploadButtonStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>{fileName || '上传音乐'}</span>
        </label>
        {isLoading && (
          <div className="control-panel__upload-progress">
            <div className="control-panel__progress-bar">
              <div
                className="control-panel__progress-fill"
                style={{ width: `${uploadProgress}%`, ...progressFillStyle }}
              />
            </div>
            <span className="control-panel__progress-text">
              {uploadProgress.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <div className="control-panel__section control-panel__play-section">
        <button
          className={`control-panel__play-btn ${isPlaying ? 'control-panel__play-btn--playing' : ''}`}
          onClick={onPlayPause}
          disabled={!fileName && !isLoading}
          aria-label={isPlaying ? '暂停' : '播放'}
          style={playButtonStyle}
        >
          {isPlaying ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
          )}
        </button>
      </div>

      <div className="control-panel__section">
        <div
          ref={progressRef}
          className="control-panel__progress"
          onClick={handleProgressClick}
        >
          <div className="control-panel__progress-track">
            <div
              className="control-panel__progress-fill"
              style={{ 
                width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                ...progressFillStyle,
              }}
            />
          </div>
          <div className="control-panel__time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="control-panel__section">
        <div className="control-panel__volume">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="control-panel__volume-slider"
            aria-label="音量"
          />
          <span className="control-panel__volume-value">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      <div className="control-panel__section">
        <div className="control-panel__themes">
          {themes.map((theme) => (
            <button
              key={theme.name}
              className={`control-panel__theme-btn ${currentTheme === theme.name ? 'control-panel__theme-btn--active' : ''}`}
              onClick={() => onThemeChange(theme.name)}
              style={{
                background: `linear-gradient(135deg, ${theme.barGradient[0]}, ${theme.barGradient[theme.barGradient.length - 1]})`,
              }}
              title={theme.displayName}
            >
              <span className="control-panel__theme-name">{theme.displayName}</span>
            </button>
          ))}
        </div>
      </div>

      {isDesktop && (
        <div className="control-panel__footer">
          <p>拖拽MP3文件到此处</p>
          <p className="control-panel__hint">支持MP3, WAV, OGG等格式</p>
        </div>
      )}
    </div>
  )
}

export default ControlPanel
