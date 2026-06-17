import { useRef, useState, useCallback, useEffect } from 'react'
import { useAudioStore } from '@/store/audioStore'
import {
  loadAudio,
  startPlayback,
  stopPlayback,
  setVolume,
  isAudioLoaded,
} from '@/audio/audioProcessor'

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function ControlPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isPlaying, fileName, duration } = useAudioStore()
  const [volume, setVolumeState] = useState(0.7)
  const [isLoading, setIsLoading] = useState(false)

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return
      setIsLoading(true)
      try {
        await loadAudio(files[0])
      } catch (err) {
        console.error('Failed to load audio:', err)
      } finally {
        setIsLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    []
  )

  const handleTogglePlay = useCallback(() => {
    if (!isAudioLoaded()) {
      handleUploadClick()
      return
    }
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }, [isPlaying, handleUploadClick])

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      setVolumeState(val)
      setVolume(val)
    },
    []
  )

  useEffect(() => {
    setVolume(volume)
  }, [volume])

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    maxWidth: '900px',
    height: 80,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 16,
    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    zIndex: 100,
    gap: 24,
  }

  const uploadBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: 'rgba(124, 77, 255, 0.3)',
    border: '1px solid rgba(124, 77, 255, 0.5)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontWeight: 500,
    backdropFilter: 'blur(10px)',
    whiteSpace: 'nowrap',
  }

  const playBtnStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#7C4DFF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 16px rgba(124, 77, 255, 0.4)',
  }

  const fileInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflow: 'hidden',
  }

  return (
    <div style={panelStyle} className="fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button
        style={uploadBtnStyle}
        onClick={handleUploadClick}
        disabled={isLoading}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background =
            'rgba(124, 77, 255, 0.5)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background =
            'rgba(124, 77, 255, 0.3)'
        }}
      >
        {isLoading ? '加载中...' : '📁 上传音频'}
      </button>

      <div style={fileInfoStyle}>
        <div
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 14,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fileName || '尚未选择音频文件，点击左侧按钮上传'}
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 12,
          }}
        >
          {fileName ? `时长: ${formatDuration(duration)}` : '支持 MP3, WAV, OGG, FLAC 等格式'}
        </div>
      </div>

      <button
        style={playBtnStyle}
        onClick={handleTogglePlay}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.filter = 'brightness(1.1)'
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.filter = 'brightness(1)'
        }}
        onMouseDown={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.transform = 'scale(0.95)'
        }}
        onMouseUp={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.transform = 'scale(1)'
        }}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: 180,
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
          <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
        <div
          style={{
            flex: 1,
            position: 'relative',
            height: 20,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(to right, #7C4DFF, #B388FF)',
              opacity: 0.3,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: `${volume * 100}%`,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(to right, #7C4DFF, #B388FF)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            style={{
              position: 'absolute',
              width: '100%',
              height: 4,
              borderRadius: 2,
              background: 'transparent',
              appearance: 'none',
              WebkitAppearance: 'none',
              cursor: 'pointer',
              outline: 'none',
              margin: 0,
              padding: 0,
            }}
          />
        </div>
        <span
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
            width: 30,
            textAlign: 'right',
          }}
        >
          {Math.round(volume * 100)}
        </span>
      </div>
    </div>
  )
}
