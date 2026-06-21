import { useEffect, useRef, useState, useCallback } from 'react'
import { AudioEngine } from './audioEngine'
import { VisualRenderer } from './visualRenderer'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioEngineRef = useRef<AudioEngine | null>(null)
  const visualRendererRef = useRef<VisualRenderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [hasAudio, setHasAudio] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    audioEngineRef.current = new AudioEngine()
    visualRendererRef.current = new VisualRenderer()

    if (canvasRef.current && visualRendererRef.current) {
      visualRendererRef.current.setCanvas(canvasRef.current)
    }

    const handleResize = () => {
      if (canvasRef.current && visualRendererRef.current) {
        visualRendererRef.current.setCanvas(canvasRef.current)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      visualRendererRef.current?.stop()
      audioEngineRef.current?.destroy()
    }
  }, [])

  const animate = useCallback(() => {
    const engine = audioEngineRef.current
    const renderer = visualRendererRef.current
    if (!engine || !renderer) return

    renderer.clear()

    if (engine.hasAudio) {
      const amplitudeData = engine.getAmplitudeData()
      const lowEnergy = engine.getBandEnergy(0, 200)
      const highEnergy = engine.getBandEnergy(2000, 8000)

      renderer.renderWaveform(amplitudeData)
      renderer.renderParticles(lowEnergy, highEnergy)

      setCurrentTime(engine.getCurrentTime())
      if (engine.isPlaying !== isPlaying) {
        setIsPlaying(engine.isPlaying)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [isPlaying])

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !audioEngineRef.current) return

    try {
      setFileName(file.name)
      await audioEngineRef.current.decodeAudioFile(file)
      setHasAudio(true)
      setDuration(audioEngineRef.current.getDuration())
      setCurrentTime(0)
      setIsPlaying(false)
    } catch (err) {
      console.error('音频解码失败:', err)
      alert('音频文件解码失败，请尝试其他文件')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const togglePlayPause = () => {
    const engine = audioEngineRef.current
    if (!engine || !engine.hasAudio) return

    if (engine.isPlaying) {
      engine.pause()
      setIsPlaying(false)
    } else {
      engine.play()
      setIsPlaying(true)
    }
  }

  const handleReset = () => {
    const engine = audioEngineRef.current
    if (!engine) return
    engine.seek(0)
    setCurrentTime(0)
  }

  const handleSnapshot = () => {
    const renderer = visualRendererRef.current
    if (!renderer) return

    const dataUrl = renderer.snapshot()
    const link = document.createElement('a')
    link.download = `audio-visualizer-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setVolume(value)
    audioEngineRef.current?.setVolume(value)
  }

  const seekFromClientX = (clientX: number) => {
    const engine = audioEngineRef.current
    const progressBar = progressRef.current
    if (!engine || !progressBar || !duration) return

    const rect = progressBar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const time = ratio * duration
    engine.seek(time)
    setCurrentTime(time)
  }

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    if (!hasAudio) return
    isDraggingRef.current = true
    seekFromClientX(e.clientX)

    const handleMouseMove = (ev: MouseEvent) => {
      if (isDraggingRef.current) {
        seekFromClientX(ev.clientX)
      }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0D1117',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Fira Code', monospace",
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #334155',
        }}
      >
        <button
          onClick={handleUploadClick}
          style={{
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontFamily: "'Fira Code', monospace",
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          UPLOAD
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            onClick={togglePlayPause}
            disabled={!hasAudio}
            style={{
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontFamily: "'Fira Code', monospace",
              cursor: hasAudio ? 'pointer' : 'not-allowed',
              opacity: hasAudio ? 1 : 0.5,
              transition: 'all 0.2s ease',
              width: '44px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (hasAudio) {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="2" width="3" height="12" rx="1" />
                <rect x="10" y="2" width="3" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2.5v11l9-5.5-9-5.5z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={!hasAudio}
            style={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontFamily: "'Fira Code', monospace",
              cursor: hasAudio ? 'pointer' : 'not-allowed',
              opacity: hasAudio ? 1 : 0.5,
              transition: 'all 0.2s ease',
              width: '44px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (hasAudio) {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 8a6 6 0 1 1 1.76 4.24" />
              <path d="M2 12V8h4" />
            </svg>
          </button>

          <button
            onClick={handleSnapshot}
            disabled={!hasAudio}
            style={{
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontFamily: "'Fira Code', monospace",
              cursor: hasAudio ? 'pointer' : 'not-allowed',
              opacity: hasAudio ? 1 : 0.5,
              transition: 'all 0.2s ease',
              width: '44px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (hasAudio) {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3a1 1 0 0 1 1-1h2l1.2-1.6A1 1 0 0 1 7 1h2a1 1 0 0 1 .8.4L11 2h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3zm6 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
            </svg>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: '8px',
              paddingLeft: '12px',
              borderLeft: '1px solid #334155',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="#94A3B8"
              style={{ flexShrink: 0 }}
            >
              <path d="M3 7v2h2l3 3V4L5 7H3zm8.5 1a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 11.5 8z" />
            </svg>
            <div
              style={{
                position: 'relative',
                width: '120px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#374151',
                  borderRadius: '2px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: `${volume * 100}%`,
                  height: '4px',
                  backgroundColor: '#F59E0B',
                  borderRadius: '2px',
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
                  height: '16px',
                  opacity: 0,
                  cursor: 'pointer',
                  margin: 0,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: `calc(${volume * 100}% - 8px)`,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#F59E0B',
                  pointerEvents: 'none',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.5)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '80%',
            height: '80%',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '8px',
            }}
          />
        </div>

        {!hasAudio && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '14px',
              pointerEvents: 'none',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                stroke="#374151"
                strokeWidth="2"
                style={{ margin: '0 auto' }}
              >
                <path d="M24 6v28" />
                <circle cx="18" cy="34" r="6" />
                <circle cx="32" cy="34" r="6" />
                <path d="M24 6l12 4" />
              </svg>
            </div>
            点击左上角 UPLOAD 按钮上传音频文件
            <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}>
              支持 .mp3 和 .wav 格式
            </div>
          </div>
        )}

        {fileName && (
          <div
            style={{
              position: 'absolute',
              top: '28px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '14px',
              color: '#94A3B8',
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fileName}
          </div>
        )}
      </div>

      <div
        style={{
          padding: '16px 20px 24px',
          borderTop: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          ref={progressRef}
          onMouseDown={handleProgressMouseDown}
          style={{
            width: '80%',
            height: '6px',
            backgroundColor: '#374151',
            borderRadius: '3px',
            position: 'relative',
            cursor: hasAudio ? 'pointer' : 'default',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#3B82F6',
              borderRadius: '3px',
              transition: isDraggingRef.current ? 'none' : 'width 0.1s linear',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${progressPercent}%`,
              transform: 'translate(-50%, -50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#3B82F6',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.5)',
              opacity: hasAudio ? 1 : 0,
            }}
          />
        </div>
        <div
          style={{
            width: '80%',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: '#94A3B8',
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
