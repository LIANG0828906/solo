import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../../store'
import { getUserMedia, stopStream, captureFrame } from './cameraUtils'

const PREVIEW_WIDTH = 640
const PREVIEW_HEIGHT = 480

function CameraModule() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { setCapturedImage, reset, triggerDownload, capturedImage } = useStore()

  const initCamera = useCallback(async () => {
    if (!videoRef.current) return
    setError(null)
    const stream = await getUserMedia(videoRef.current, PREVIEW_WIDTH, PREVIEW_HEIGHT)
    streamRef.current = stream
    if (!stream) {
      setError('无法访问摄像头，请检查权限设置')
    }
  }, [])

  useEffect(() => {
    initCamera()
    return () => {
      stopStream(streamRef.current)
    }
  }, [initCamera])

  const handleCapture = () => {
    if (!videoRef.current) return
    const imageData = captureFrame(videoRef.current, PREVIEW_WIDTH, PREVIEW_HEIGHT)
    setCapturedImage(imageData)
  }

  const handleReset = () => {
    reset()
  }

  const handleDownload = () => {
    triggerDownload()
  }

  return (
    <div style={styles.container}>
      <div style={styles.previewWrapper}>
        <video
          ref={videoRef}
          style={styles.video}
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          muted
          playsInline
        />
        {error && (
          <div style={styles.errorOverlay}>
            <p style={styles.errorText}>{error}</p>
            <button style={styles.retryButton} onClick={initCamera}>
              重试
            </button>
          </div>
        )}
        <div style={styles.controlsBar}>
          <button
            style={{
              ...styles.controlButton,
              opacity: error ? 0.5 : 1,
              cursor: error ? 'not-allowed' : 'pointer',
            }}
            onClick={handleCapture}
            disabled={!!error}
            onMouseEnter={(e) => {
              if (!error) e.currentTarget.style.backgroundColor = '#42A5F5'
            }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#64B5F6')}
          >
            拍照抓取
          </button>
          <button
            style={styles.controlButton}
            onClick={handleReset}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#42A5F5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#64B5F6')}
          >
            重置
          </button>
          <button
            style={{
              ...styles.controlButton,
              opacity: capturedImage ? 1 : 0.5,
              cursor: capturedImage ? 'pointer' : 'not-allowed',
            }}
            onClick={handleDownload}
            disabled={!capturedImage}
            onMouseEnter={(e) => {
              if (capturedImage) e.currentTarget.style.backgroundColor = '#42A5F5'
            }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#64B5F6')}
          >
            下载纹理图
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  previewWrapper: {
    position: 'relative',
    width: 640,
    maxWidth: '100%',
    borderRadius: 8,
    border: '2px solid #424242',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    display: 'block',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
  },
  controlsBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  controlButton: {
    backgroundColor: '#64B5F6',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 18px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  errorOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#64B5F6',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 20px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 500,
  },
}

export default CameraModule
