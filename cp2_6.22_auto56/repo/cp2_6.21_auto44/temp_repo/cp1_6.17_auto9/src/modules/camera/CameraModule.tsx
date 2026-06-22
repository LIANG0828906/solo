import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store'
import { startCamera, stopCamera, captureFrame } from './cameraUtils'

export function CameraModule() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const setCapturedImage = useStore((s) => s.setCapturedImage)
  const capturedImage = useStore((s) => s.capturedImage)
  const wrinkleStats = useStore((s) => s.wrinkleStats)
  const sensitivity = useStore((s) => s.sensitivity)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (videoRef.current) {
        const stream = await startCamera(videoRef.current)
        if (mounted) {
          if (!stream) {
            setError('无法访问摄像头，请检查权限设置')
          }
          streamRef.current = stream
        }
      }
    })()
    return () => {
      mounted = false
      stopCamera(streamRef.current)
      streamRef.current = null
    }
  }, [])

  const handleCapture = () => {
    if (videoRef.current) {
      const dataUrl = captureFrame(videoRef.current)
      setCapturedImage(dataUrl)
    }
  }

  const handleReset = () => {
    setCapturedImage(null)
  }

  const handleDownload = () => {
    if (!capturedImage) return
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      canvas.width = 1024
      canvas.height = 768
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const overlay = document.getElementById('texture-overlay') as HTMLCanvasElement | null
      if (overlay) {
        const overlayCtx = overlay.getContext('2d')
        if (overlayCtx) {
          ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height)
        }
      }
      const link = document.createElement('a')
      link.download = 'wrinkle-texture.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = capturedImage
  }

  return (
    <div style={styles.container}>
      <div style={styles.previewWrapper}>
        <video
          ref={videoRef}
          style={styles.video}
          playsInline
          muted
        />
        <div style={styles.buttonBar}>
          <button style={styles.button} onClick={handleCapture}>
            拍照抓取
          </button>
          <button style={styles.button} onClick={handleReset}>
            重置
          </button>
          <button style={styles.button} onClick={handleDownload} disabled={!capturedImage}>
            下载纹理图
          </button>
        </div>
        {error && <div style={styles.errorText}>{error}</div>}
      </div>
      <div style={styles.statsBox}>
        <div style={styles.statsTitle}>褶皱分析</div>
        <div style={styles.statsRow}>
          <span style={styles.statsLabel}>敏感度:</span>
          <span style={styles.statsValue}>{sensitivity}</span>
        </div>
        <div style={styles.statsRow}>
          <span style={styles.statsLabel}>平均强度:</span>
          <span style={styles.statsValue}>
            {wrinkleStats ? `${wrinkleStats.averageIntensity.toFixed(1)}%` : '--'}
          </span>
        </div>
        <div style={styles.statsRow}>
          <span style={styles.statsLabel}>最大褶皱坐标:</span>
          <span style={styles.statsValue}>
            {wrinkleStats
              ? `(${wrinkleStats.maxPosition.x}, ${wrinkleStats.maxPosition.y})`
              : '--'}
          </span>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    width: '100%',
    boxSizing: 'border-box',
  },
  previewWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '640px',
    aspectRatio: '640 / 480',
    borderRadius: '8px',
    border: '2px solid #424242',
    overflow: 'hidden',
    background: '#000',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  buttonBar: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    right: '12px',
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  button: {
    padding: '8px 16px',
    background: '#64B5F6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.3s ease, box-shadow 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  errorText: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    right: '12px',
    color: '#E53935',
    background: 'rgba(255,255,255,0.9)',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '13px',
  },
  statsBox: {
    background: '#ECEFF1',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statsTitle: {
    color: '#0D47A1',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '14px',
  },
  statsLabel: {
    color: '#424242',
  },
  statsValue: {
    color: '#0D47A1',
    fontWeight: 500,
  },
}
