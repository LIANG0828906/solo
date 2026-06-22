import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store'
import { renderHeatmap } from './textureEngine'

export function TextureModule() {
  const capturedImage = useStore((s) => s.capturedImage)
  const sensitivity = useStore((s) => s.sensitivity)
  const setSensitivity = useStore((s) => s.setSensitivity)
  const setWrinkleStats = useStore((s) => s.setWrinkleStats)

  const sourceCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (!capturedImage) {
      setImageLoaded(false)
      setWrinkleStats(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const srcCanvas = sourceCanvasRef.current
      if (!srcCanvas) return
      srcCanvas.width = img.width
      srcCanvas.height = img.height
      const ctx = srcCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
      }
      setImageLoaded(true)
    }
    img.src = capturedImage
  }, [capturedImage, setWrinkleStats])

  useEffect(() => {
    if (!imageLoaded) return
    const srcCanvas = sourceCanvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    if (!srcCanvas || !overlayCanvas) return
    const stats = renderHeatmap(overlayCanvas, srcCanvas, sensitivity)
    setWrinkleStats(stats)
  }, [imageLoaded, sensitivity, setWrinkleStats])

  const handleExport = () => {
    if (!capturedImage || !imageLoaded) return
    setIsExporting(true)
    const timer = setTimeout(() => {
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = 1024
      exportCanvas.height = 768
      const ectx = exportCanvas.getContext('2d')!
      const srcCanvas = sourceCanvasRef.current
      const overlayCanvas = overlayCanvasRef.current
      if (srcCanvas) {
        ectx.drawImage(srcCanvas, 0, 0, 1024, 768)
      }
      if (overlayCanvas) {
        ectx.drawImage(overlayCanvas, 0, 0, 1024, 768)
      }
      const link = document.createElement('a')
      link.download = 'wrinkle-texture.png'
      link.href = exportCanvas.toDataURL('image/png')
      link.click()
      setIsExporting(false)
    }, 500)
    setTimeout(() => setIsExporting(false), 2000)
    return () => clearTimeout(timer)
  }

  return (
    <div style={styles.container}>
      <div style={styles.workspace}>
        {capturedImage ? (
          <div style={styles.imageWrapper}>
            <canvas ref={sourceCanvasRef} style={styles.hiddenCanvas} />
            <canvas
              id="texture-overlay"
              ref={overlayCanvasRef}
              style={{
                ...styles.overlayCanvas,
                transition: 'opacity 0.2s ease',
              }}
            />
            <img
              src={capturedImage}
              alt="captured"
              style={styles.capturedImage}
              onLoad={() => {
                // handled by effect
              }}
            />
          </div>
        ) : (
          <div style={styles.placeholder}>
            <div style={styles.placeholderIcon}>📷</div>
            <div style={styles.placeholderText}>点击左侧"拍照抓取"按钮开始检测</div>
          </div>
        )}
        {isExporting && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
          </div>
        )}
      </div>

      <div style={styles.controls}>
        <div style={styles.sliderLabelRow}>
          <span style={styles.sliderLabel}>纹理敏感度</span>
          <span style={styles.sliderValue}>{sensitivity}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={sensitivity}
          onChange={(e) => setSensitivity(Number(e.target.value))}
          style={styles.slider}
        />
        <button style={styles.exportButton} onClick={handleExport} disabled={!capturedImage}>
          下载纹理图
        </button>
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
    height: '100%',
  },
  workspace: {
    position: 'relative',
    flex: 1,
    background: '#F5F5F5',
    borderRadius: '8px',
    overflow: 'hidden',
    minHeight: '480px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  hiddenCanvas: {
    display: 'none',
  },
  overlayCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  placeholder: {
    textAlign: 'center',
    color: '#90A4AE',
  },
  placeholderIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  placeholderText: {
    fontSize: '16px',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255,255,255,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(21, 101, 192, 0.2)',
    borderTop: '3px solid #1565C0',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  controls: {
    background: '#ECEFF1',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sliderLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    color: '#0D47A1',
    fontWeight: 600,
    fontSize: '14px',
  },
  sliderValue: {
    color: '#1565C0',
    fontWeight: 500,
    fontSize: '14px',
  },
  slider: {
    width: '100%',
    height: '6px',
    WebkitAppearance: 'none',
    appearance: 'none',
    background: '#BDBDBD',
    borderRadius: '3px',
    outline: 'none',
    transition: 'box-shadow 0.3s ease',
    cursor: 'pointer',
  },
  exportButton: {
    alignSelf: 'flex-start',
    padding: '10px 20px',
    background: '#64B5F6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.3s ease, box-shadow 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
}
