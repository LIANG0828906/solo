import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store/appStore'
import { waveformService, type WaveformSlice } from './audioEngine/waveformService'
import { segmentProcessor, type AudioSegment } from './audioEngine/segmentProcessor'
import { SegmentGrid } from './ui/segmentGrid'
import { CommentOverlay } from './ui/commentOverlay'

function App() {
  const {
    segments,
    isProcessing,
    audioFileName,
    setSegments,
    setIsProcessing,
    setAudioFileName,
    clearAll,
    exportData
  } = useStore()

  const [isDragging, setIsDragging] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const waveformContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let interval: number
    if (isPlaying) {
      interval = window.setInterval(() => {
        const time = waveformService.getCurrentTime()
        setCurrentTime(time)
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  useEffect(() => {
    return () => {
      waveformService.destroy()
    }
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.wav')) {
      alert('请上传WAV格式的音频文件')
      return
    }

    if (!waveformContainerRef.current) return

    setIsLoading(true)
    setLoadingProgress(0)
    setAudioFileName(file.name)
    clearAll()

    try {
      waveformService.destroy()

      const result = await waveformService.loadAudio(
        file,
        waveformContainerRef.current,
        (progress) => {
          setLoadingProgress(progress)
        }
      )

      setDuration(result.duration)
      setCurrentTime(0)

      await processSlices(result.slices)
    } catch (error) {
      console.error('音频加载失败:', error)
      alert('音频加载失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [clearAll, setAudioFileName])

  const processSlices = async (slices: WaveformSlice[]) => {
    setIsProcessing(true)
    try {
      const processedSegments = await segmentProcessor.processSlices(slices)
      setSegments(processedSegments)
    } catch (error) {
      console.error('切片处理失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handlePlayPause = () => {
    const playing = waveformService.togglePlay()
    setIsPlaying(playing)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * duration
    waveformService.seekTo(time)
    setCurrentTime(time)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0B0B1A',
        color: '#FFFFFF',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          backgroundColor: '#1A1A2ECC',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #3A3A5C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 50
        }}
      >
        <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          🎵 现场录音切片与情绪标注
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {segments.length > 0 && (
            <button
              onClick={exportData}
              style={{
                backgroundColor: '#6C63FF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5B52E0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6C63FF'
              }}
            >
              导出记忆墙
            </button>
          )}
        </div>
      </nav>

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '88px 24px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24
        }}
      >
        {segments.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              width: 400,
              height: 200,
              margin: '40px auto',
              border: `2px ${isDragging ? 'solid' : 'dashed'} ${isDragging ? '#8B82FF' : '#6C63FF'}`,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: isDragging ? '#6C63FF10' : 'transparent'
            }}
          >
            <span style={{ fontSize: 48 }}>🎙️</span>
            <span style={{ fontSize: 14, color: '#CCCCDD', textAlign: 'center' }}>
              点击或拖拽 WAV 文件到此处
            </span>
            <span style={{ fontSize: 12, color: '#666688' }}>
              支持 5 分钟左右的现场演出录音
            </span>
          </motion.div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".wav"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ color: '#8888AA', fontSize: 14, marginBottom: 12 }}>
                  正在加载波形... {Math.round(loadingProgress)}%
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 6,
                    backgroundColor: '#1A1A2E',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingProgress}%` }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #6C63FF, #E040FB)',
                      borderRadius: 3
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {audioFileName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                width: '100%',
                backgroundColor: '#1A1A2E',
                borderRadius: 12,
                padding: 16,
                marginBottom: -8
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#8888AA' }}>
                  📁 {audioFileName}
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #3A3A5C',
                    color: '#8888AA',
                    borderRadius: 6,
                    padding: '4px 12px',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  重新上传
                </button>
              </div>

              <div
                ref={waveformContainerRef}
                style={{
                  width: '100%',
                  height: 120,
                  backgroundColor: '#0B0B1A',
                  borderRadius: 8,
                  marginBottom: 12
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                  onClick={handlePlayPause}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: '#6C63FF',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>

                <div
                  onClick={handleSeek}
                  style={{
                    flex: 1,
                    height: 4,
                    backgroundColor: '#3A3A5C',
                    borderRadius: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(currentTime / (duration || 1)) * 100}%`,
                      background: 'linear-gradient(90deg, #6C63FF, #E040FB)',
                      borderRadius: 2
                    }}
                  />
                </div>

                <span style={{ fontSize: 12, color: '#8888AA', minWidth: 90, textAlign: 'right' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                textAlign: 'center',
                padding: 24,
                backgroundColor: '#1A1A2E',
                borderRadius: 12
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 32,
                  height: 32,
                  border: '3px solid #3A3A5C',
                  borderTopColor: '#6C63FF',
                  borderRadius: '50%',
                  margin: '0 auto 12px'
                }}
              />
              <div style={{ color: '#CCCCDD', fontSize: 14 }}>正在分析节奏变化...</div>
              <div style={{ color: '#666688', fontSize: 12, marginTop: 4 }}>
                检测高潮段落与过渡段落
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SegmentGrid />
        <CommentOverlay />
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          background-color: #0B0B1A;
        }
        
        @media (max-width: 768px) {
          nav {
            height: 48px !important;
            padding: 0 12px !important;
          }
          
          main {
            padding: 72px 12px 100px !important;
          }
          
          div[style*="400px"] {
            width: calc(100% - 24px) !important;
          }
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1A1A2E;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #3A3A5C;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #4A4A6C;
        }
      `}</style>
    </div>
  )
}

export default App
