import { useEffect, useRef, useCallback, DragEvent } from 'react'
import { useAudioStore } from './store/useAudioStore'
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer'
import { Visualizer } from './components/Visualizer'

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const {
    audioFile,
    isPlaying,
    volume,
    currentTime,
    duration,
    frequencyData,
    waveformData,
    setAudioFile,
  } = useAudioStore()

  const { togglePlay, changeVolume } = useAudioAnalyzer()

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert('文件大小不能超过10MB')
      return
    }

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']
    const validExtensions = ['.mp3', '.wav', '.ogg']
    const fileName = file.name.toLowerCase()
    const isValidType = validTypes.includes(file.type) ||
      validExtensions.some((ext) => fileName.endsWith(ext))

    if (!isValidType) {
      alert('仅支持 mp3、wav、ogg 格式')
      return
    }

    setAudioFile(file)
  }, [setAudioFile])

  useEffect(() => {
    const input = document.getElementById('audio-input') as HTMLInputElement | null
    if (input) {
      const handleChange = (e: Event) => {
        const target = e.target as HTMLInputElement
        const file = target.files?.[0]
        if (file) {
          handleFileSelect(file)
        }
      }
      input.addEventListener('change', handleChange)
      return () => input.removeEventListener('change', handleChange)
    }
  }, [handleFileSelect])

  const handleUploadClick = () => {
    const input = document.getElementById('audio-input') as HTMLInputElement | null
    if (input) {
      input.click()
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    if (containerRef.current) {
      containerRef.current.style.borderColor = '#2EA043'
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = false
    if (containerRef.current) {
      containerRef.current.style.borderColor = '#30363D'
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = false
    if (containerRef.current) {
      containerRef.current.style.borderColor = '#30363D'
    }

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          backgroundColor: '#161B22',
          border: '1px solid #30363D',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '900px',
          width: '100%',
          transition: 'border-color 0.2s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '24px',
            fontFamily: 'monospace',
            color: '#B0B0B0',
            fontSize: '14px',
          }}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <h1
          style={{
            color: '#FFFFFF',
            fontSize: '28px',
            fontWeight: 600,
            textAlign: 'center',
            margin: '0 0 30px 0',
            background: 'linear-gradient(90deg, #00FFFF, #FF00FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          音律视界
        </h1>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
          <button
            onClick={handleUploadClick}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'
            }}
            style={{
              background: 'linear-gradient(180deg, #238636, #2EA043)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'filter 0.2s ease',
            }}
          >
            {audioFile ? '重新上传音频' : '上传音频文件'}
          </button>
        </div>

        {audioFile && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <Visualizer
                frequencyData={frequencyData}
                waveformData={waveformData}
                volume={volume}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
              }}
            >
              <button
                onClick={togglePlay}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'
                }}
                style={{
                  background: isPlaying
                    ? 'linear-gradient(180deg, #DA3633, #F85149)'
                    : 'linear-gradient(180deg, #238636, #2EA043)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 28px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  minWidth: '100px',
                  transition: 'filter 0.2s ease',
                }}
              >
                {isPlaying ? '暂停' : '播放'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#B0B0B0', fontSize: '13px', minWidth: '32px' }}>
                  {volume}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  style={{
                    width: '180px',
                    height: '4px',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundColor: '#30363D',
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          </>
        )}

        {!audioFile && (
          <div
            style={{
              border: '2px dashed #30363D',
              borderRadius: '8px',
              padding: '60px 20px',
              textAlign: 'center',
              color: '#8B949E',
            }}
          >
            <p style={{ margin: 0, fontSize: '14px' }}>
              拖拽音频文件到此处，或点击上方按钮上传
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6E7681' }}>
              支持 mp3、wav、ogg 格式，最大 10MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
