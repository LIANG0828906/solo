import { useState, useRef, useCallback, useEffect } from 'react'
import { useAudioStore } from '../store/audioStore'
import { useGalaxyStore } from '../store/galaxyStore'

type SourceType = 'file' | 'mic' | null

export const ControlPanel = () => {
  const [sourceType, setSourceType] = useState<SourceType>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const { initAudio, startFileAudio, startMicAudio, stopAudio, sensitivity, setSensitivity, isPlaying, audioSource } = useAudioStore()
  const { resetView, isResettingView } = useGalaxyStore()

  useEffect(() => {
    setSourceType(audioSource)
  }, [audioSource])

  const handleSourceSelect = useCallback((type: 'file' | 'mic') => {
    initAudio()
    if (sourceType === type) {
      stopAudio()
      setSourceType(null)
      setFileName(null)
    } else {
      setSourceType(type)
      if (type === 'mic') {
        startMicAudio()
      }
    }
  }, [sourceType, initAudio, startMicAudio, stopAudio])

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('请选择音频文件')
      return
    }
    initAudio()
    setFileName(file.name)
    setSourceType('file')
    await startFileAudio(file)
  }, [initAudio, startFileAudio])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleStop = useCallback(() => {
    stopAudio()
    setSourceType(null)
    setFileName(null)
  }, [stopAudio])

  return (
    <div style={panelStyle}>
      <div style={sectionStyle}>
        <span style={labelStyle}>音频来源</span>
        <div style={buttonGroupStyle}>
          <button
            style={{
              ...buttonStyle,
              ...(sourceType === 'file' ? activeButtonStyle : {}),
              marginRight: '8px'
            }}
            onClick={() => handleSourceSelect('file')}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 212, 255, 0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
          >
            📁 文件
          </button>
          <button
            style={{
              ...buttonStyle,
              ...(sourceType === 'mic' ? activeButtonStyle : {})
            }}
            onClick={() => handleSourceSelect('mic')}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 212, 255, 0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
          >
            🎤 麦克风
          </button>
        </div>
      </div>

      {sourceType === 'file' && (
        <div style={sectionStyle}>
          <div
            ref={dropZoneRef}
            style={{
              ...dropZoneStyle,
              ...(isDragging ? dropZoneActiveStyle : {})
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            {fileName ? (
              <span style={dropZoneTextStyle}>🎵 {fileName}</span>
            ) : (
              <span style={dropZoneTextStyle}>拖入音频文件或点击选择</span>
            )}
          </div>
        </div>
      )}

      <div style={sectionStyle}>
        <div style={rowStyle}>
          <span style={labelStyle}>灵敏度</span>
          <span style={valueStyle}>{sensitivity.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={sensitivity}
          onChange={(e) => setSensitivity(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <div style={sectionStyle}>
        <button
          style={{
            ...buttonStyle,
            width: '100%',
            ...(isResettingView ? activeButtonStyle : {})
          }}
          onClick={resetView}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 212, 255, 0.3)' }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
          disabled={isResettingView}
        >
          🔄 重置视角
        </button>
      </div>

      {isPlaying && (
        <div style={sectionStyle}>
          <button
            style={{
              ...buttonStyle,
              width: '100%',
              background: 'rgba(255, 107, 107, 0.2)',
              borderColor: '#ff6b6b'
            }}
            onClick={handleStop}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
          >
            ⏹ 停止播放
          </button>
        </div>
      )}

      <div style={statusStyle}>
        <div style={statusRowStyle}>
          <span style={statusLabelStyle}>状态:</span>
          <span style={{ ...statusValueStyle, color: isPlaying ? '#00d4ff' : '#666' }}>
            {isPlaying ? '▶ 播放中' : '○ 待机'}
          </span>
        </div>
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  left: '20px',
  bottom: '20px',
  background: 'rgba(20, 20, 40, 0.85)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  padding: '20px',
  width: '280px',
  zIndex: 1000,
  border: '1px solid rgba(0, 212, 255, 0.2)',
  transition: 'box-shadow 0.2s ease'
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '16px'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#888',
  fontSize: '12px',
  marginBottom: '8px',
  fontWeight: 500,
  letterSpacing: '0.5px'
}

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex'
}

const buttonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '2px solid transparent',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.2s ease',
  fontWeight: 500
}

const activeButtonStyle: React.CSSProperties = {
  borderColor: '#00d4ff',
  boxShadow: '0 0 15px rgba(0, 212, 255, 0.4)',
  background: 'rgba(0, 212, 255, 0.15)'
}

const dropZoneStyle: React.CSSProperties = {
  border: '2px dashed #666',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  background: 'rgba(255, 255, 255, 0.02)'
}

const dropZoneActiveStyle: React.CSSProperties = {
  borderColor: '#00d4ff',
  borderStyle: 'solid',
  transform: 'scale(1.05)',
  boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
  background: 'rgba(0, 212, 255, 0.1)'
}

const dropZoneTextStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '13px',
  userSelect: 'none'
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
}

const valueStyle: React.CSSProperties = {
  color: '#00d4ff',
  fontSize: '13px',
  fontWeight: 600
}

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  background: 'linear-gradient(to right, #333 0%, #00d4ff 100%)',
  outline: 'none',
  WebkitAppearance: 'none',
  appearance: 'none',
  cursor: 'pointer'
}

const statusStyle: React.CSSProperties = {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
}

const statusRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const statusLabelStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '12px'
}

const statusValueStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500
}
