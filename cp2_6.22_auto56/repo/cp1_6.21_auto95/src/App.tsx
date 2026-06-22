import React, { useState, useEffect, useRef, useCallback } from 'react'
import { WaveformViewer } from './WaveformViewer'
import { MarkerPanel } from './MarkerPanel'
import { AudioWaveform, type WaveformData } from './AudioWaveform'
import {
  BeatMarkerManager,
  type BeatGrid,
  type Marker,
  type Selection,
} from './BeatMarkerManager'

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

const App: React.FC = () => {
  const audioWaveformRef = useRef<AudioWaveform | null>(null)
  const beatMarkerManagerRef = useRef<BeatMarkerManager | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [waveformData, setWaveformData] = useState<WaveformData | null>(null)
  const [beatGrid, setBeatGrid] = useState<BeatGrid | null>(null)
  const [markers, setMarkers] = useState<Marker[]>([])
  const [selection, setSelection] = useState<Selection | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [fileName, setFileName] = useState<string>('')

  useEffect(() => {
    audioWaveformRef.current = new AudioWaveform()
    beatMarkerManagerRef.current = new BeatMarkerManager()

    const selectionUnsubscribe = beatMarkerManagerRef.current.onSelectionChange((sel) => {
      setSelection(sel)
    })

    const markersUnsubscribe = beatMarkerManagerRef.current.onMarkersChange((m) => {
      setMarkers(m)
    })

    return () => {
      selectionUnsubscribe()
      markersUnsubscribe()
      audioWaveformRef.current?.destroy()
    }
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    if (!audioWaveformRef.current || !beatMarkerManagerRef.current) return

    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3']
    const validExtensions = ['.wav', '.mp3']
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('请上传WAV或MP3格式的音频文件')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过10MB')
      return
    }

    setIsLoading(true)
    setError(null)
    setFileName(file.name)
    setZoomLevel(1)
    setSelection(null)

    try {
      const startTime = performance.now()
      const data = await audioWaveformRef.current.loadAudio(file)
      const parseTime = performance.now() - startTime

      if (parseTime > 500) {
        console.warn(`音频解析耗时 ${parseTime.toFixed(0)}ms，超过500ms目标`)
      }

      setWaveformData(data)
      setCurrentTime(data.duration / 2)

      const gridStartTime = performance.now()
      const grid = beatMarkerManagerRef.current.calculateBeatGrid(data)
      const gridTime = performance.now() - gridStartTime

      if (gridTime > 100) {
        console.warn(`节拍计算耗时 ${gridTime.toFixed(0)}ms`)
      }

      setBeatGrid(grid)
      setMarkers([])
      beatMarkerManagerRef.current.setSelection(null)
    } catch (err) {
      setError('音频文件解析失败，请检查文件是否损坏')
      console.error('Audio parsing error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleSelectionChange = useCallback((sel: Selection | null) => {
    beatMarkerManagerRef.current?.setSelection(sel)
  }, [])

  const handleAddMarker = useCallback((marker: Omit<Marker, 'id'>) => {
    const startTime = performance.now()
    beatMarkerManagerRef.current?.addMarker(marker)
    const elapsed = performance.now() - startTime
    if (elapsed > 100) {
      console.warn(`添加标记耗时 ${elapsed.toFixed(0)}ms，超过100ms目标`)
    }
  }, [])

  const handleRemoveMarker = useCallback((id: string) => {
    const startTime = performance.now()
    beatMarkerManagerRef.current?.removeMarker(id)
    const elapsed = performance.now() - startTime
    if (elapsed > 100) {
      console.warn(`删除标记耗时 ${elapsed.toFixed(0)}ms，超过100ms目标`)
    }
  }, [])

  const handleReorderMarkers = useCallback((newOrder: string[]) => {
    beatMarkerManagerRef.current?.reorderMarkers(newOrder)
  }, [])

  const handleSelectMarker = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0F0F1A',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '16px 24px',
          backgroundColor: '#1A1A2E',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            音乐波形可视化编辑器
          </h1>
          {fileName && (
            <span
              style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.6)',
                padding: '4px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
              }}
            >
              {fileName}
            </span>
          )}
          {beatGrid && (
            <span
              style={{
                fontSize: '13px',
                color: '#4CAF50',
                padding: '4px 12px',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderRadius: '12px',
              }}
            >
              {beatGrid.bpm} BPM · {beatGrid.timeSignature}/4拍
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {waveformData && (
            <span
              style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              缩放: {Math.round(zoomLevel * 100)}%
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,.mp3"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 20px',
              backgroundColor: '#1E88E5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1976D2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1E88E5'
            }}
          >
            上传音频
          </button>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '65%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          {selection && (
            <div
              style={{
                position: 'absolute',
                top: '32px',
                left: '32px',
                zIndex: 10,
                padding: '12px 16px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '4px',
                }}
              >
                选中区域
              </div>
              <div>
                开始: <span style={{ color: '#4CAF50', fontWeight: 500 }}>{formatTime(selection.start)}</span>
              </div>
              <div>
                结束: <span style={{ color: '#FDD835', fontWeight: 500 }}>{formatTime(selection.end)}</span>
              </div>
              <div>
                时长:{' '}
                <span style={{ color: '#1E88E5', fontWeight: 500 }}>
                  {formatTime(selection.end - selection.start)}
                </span>
              </div>
            </div>
          )}

          {!waveformData && !isLoading && !error && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(30, 136, 229, 0.5)'
                e.currentTarget.style.backgroundColor = 'rgba(30, 136, 229, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  marginBottom: '20px',
                  color: '#1E88E5',
                  opacity: 0.8,
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                点击或拖拽上传音频文件
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                支持 WAV / MP3 格式，最大 10MB
              </div>
            </div>
          )}

          {isLoading && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '3px solid rgba(255, 255, 255, 0.1)',
                  borderTopColor: '#1E88E5',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '16px',
                }}
              />
              <div
                style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                正在解析音频...
              </div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {error && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                }}
              >
                ⚠️
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#E53935',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
              <button
                onClick={() => {
                  setError(null)
                  fileInputRef.current?.click()
                }}
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'transparent',
                  color: '#1E88E5',
                  border: '1px solid #1E88E5',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 136, 229, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                重新上传
              </button>
            </div>
          )}

          {waveformData && !isLoading && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>鼠标滚轮缩放 · 拖拽选择区域 · 右侧添加标记</span>
                <span>时长: {formatTime(waveformData.duration)}</span>
              </div>
              <WaveformViewer
                waveformData={waveformData}
                beatGrid={beatGrid}
                markers={markers}
                selection={selection}
                zoomLevel={zoomLevel}
                onSelectionChange={handleSelectionChange}
                onZoomChange={setZoomLevel}
              />
            </div>
          )}
        </div>

        <div
          style={{
            width: '30%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <MarkerPanel
            markers={markers}
            selection={selection}
            currentTime={currentTime}
            onAddMarker={handleAddMarker}
            onRemoveMarker={handleRemoveMarker}
            onReorderMarkers={handleReorderMarkers}
            onSelectMarker={handleSelectMarker}
          />
        </div>
      </div>
    </div>
  )
}

export default App
