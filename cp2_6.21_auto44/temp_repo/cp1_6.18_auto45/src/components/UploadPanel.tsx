import React, { useRef, useCallback, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AudioAnalyzer } from '@/audio/AudioAnalyzer'
import { UI_CONFIG, COLORS } from '@/config/constants'

export const UploadPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const {
    audioFile,
    isAnalyzing,
    analysisProgress,
    isPlaying,
    error,
    setAudioFile,
    setAudioBuffer,
    setIsAnalyzing,
    setIsPlaying,
    setAnalysisProgress,
    setAudioAnalyzer,
    setError,
    resetAudio,
  } = useAppStore()

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return

    const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/x-wav']
    const validExtensions = ['.wav', '.mp3']
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('请上传 WAV 或 MP3 格式的音频文件')
      return
    }

    setError(null)
    setAudioFile(file)
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      const analyzer = new AudioAnalyzer()
      setAnalysisProgress(20)

      const buffer = await analyzer.decodeAudioFile(file)
      setAnalysisProgress(60)

      analyzer.setupAnalysis(buffer)
      setAnalysisProgress(100)

      setAudioBuffer(buffer)
      setAudioAnalyzer(analyzer)
      
      setTimeout(() => {
        setIsAnalyzing(false)
        analyzer.play()
        setIsPlaying(true)
      }, 500)
    } catch (err: any) {
      setError(err.message || '音频解析失败')
      setIsAnalyzing(false)
      setAudioFile(null)
    }
  }, [setAudioFile, setAudioBuffer, setIsAnalyzing, setAnalysisProgress, setAudioAnalyzer, setError, setIsPlaying])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleClick = useCallback(() => {
    if (!isAnalyzing) {
      fileInputRef.current?.click()
    }
  }, [isAnalyzing])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '24px',
        bottom: '24px',
        width: `${UI_CONFIG.UPLOAD_PANEL_WIDTH}px`,
        background: COLORS.PANEL_BG,
        borderRadius: `${UI_CONFIG.PANEL_BORDER_RADIUS}px`,
        border: `${UI_CONFIG.BORDER_WIDTH}px solid ${COLORS.BORDER}`,
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".wav,.mp3,audio/wav,audio/mpeg,audio/mp3"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          cursor: isAnalyzing ? 'default' : 'pointer',
          padding: '24px',
          borderRadius: '12px',
          border: `2px dashed ${isDragging ? COLORS.SLIDER_THUMB : COLORS.BORDER}`,
          background: isDragging ? 'rgba(78, 205, 196, 0.05)' : 'transparent',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          marginBottom: '16px',
          minHeight: '100px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {audioFile ? (
          <div style={{ width: '100%' }}>
            <div
              style={{
                color: COLORS.TEXT,
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {audioFile.name}
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              {formatFileSize(audioFile.size)}
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${COLORS.PROGRESS_START}, ${COLORS.PROGRESS_END})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={{ color: COLORS.TEXT, fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
              点击或拖拽上传音频
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              支持 WAV / MP3，最长 30 秒
            </div>
          </>
        )}
      </div>

      {isAnalyzing && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              width: '100%',
              height: `${UI_CONFIG.PROGRESS_HEIGHT}px`,
              background: COLORS.SLIDER_TRACK,
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${analysisProgress}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${COLORS.PROGRESS_START}, ${COLORS.PROGRESS_END})`,
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div
            style={{
              color: '#888',
              fontSize: '12px',
              marginTop: '8px',
              textAlign: 'center',
            }}
          >
            正在解析音频... {analysisProgress}%
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            color: COLORS.LOW_FREQ_START,
            fontSize: '12px',
            textAlign: 'center',
            marginTop: '8px',
          }}
        >
          {error}
        </div>
      )}

      {audioFile && !isAnalyzing && !error && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const analyzer = useAppStore.getState().audioAnalyzer
              if (analyzer) {
                if (isPlaying) {
                  analyzer.pause()
                  setIsPlaying(false)
                } else {
                  analyzer.play()
                  setIsPlaying(true)
                }
              }
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: `linear-gradient(135deg, ${COLORS.PROGRESS_START}, ${COLORS.PROGRESS_END})`,
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '44px',
              transition: 'transform 0.2s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isPlaying ? '暂停' : '播放'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const analyzer = useAppStore.getState().audioAnalyzer
              if (analyzer) {
                analyzer.stop()
              }
              resetAudio()
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${COLORS.BORDER}`,
              background: 'transparent',
              color: COLORS.TEXT,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '44px',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            重新上传
          </button>
        </div>
      )}
    </div>
  )
}
