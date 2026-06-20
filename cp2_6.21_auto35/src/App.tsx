import { useRef, useState, useCallback, useEffect } from 'react'
import { AppCanvas } from '@/components/Canvas'
import { ControlPanel } from '@/components/ControlPanel'
import { useEditorStore } from '@/store/useEditorStore'
import { exportPNG, exportGif } from '@/utils/exporter'

const GIF_FRAMES = 120
const GIF_FPS = 60

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const isExporting = useEditorStore((s) => s.isExporting)
  const glowIntensity = useEditorStore((s) => s.glowIntensity)
  const setExporting = useEditorStore((s) => s.setExporting)
  const setShutterFlash = useEditorStore((s) => s.setShutterFlash)

  const [isExportingGif, setIsExportingGif] = useState(false)
  const [gifProgress, setGifProgress] = useState(0)
  const [gifProgressModal, setGifProgressModal] = useState(0)

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const runShutterAnimation = useCallback(async () => {
    const original = glowIntensity
    const flashSequence = [
      { value: 0, duration: 100 },
      { value: original, duration: 100 },
      { value: 0, duration: 100 },
      { value: original, duration: 100 },
      { value: 0, duration: 100 },
      { value: original, duration: 100 },
    ]
    for (const step of flashSequence) {
      setShutterFlash(step.value)
      await sleep(step.duration)
    }
    setShutterFlash(null)
  }, [glowIntensity, setShutterFlash])

  const handleExportPNG = useCallback(async () => {
    if (isExporting) return
    setExporting(true)
    try {
      await runShutterAnimation()
      await sleep(50)
      const canvas = canvasRef.current
      if (canvas) {
        await exportPNG(canvas, `neon-text-${Date.now()}.png`)
      }
    } catch (err) {
      console.error('PNG export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [isExporting, setExporting, runShutterAnimation])

  const handleExportGIF = useCallback(async () => {
    if (isExporting) return
    setExporting(true)
    setIsExportingGif(true)
    setGifProgress(0)
    setGifProgressModal(0)

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const width = canvas.width
      const height = canvas.height

      await exportGif({
        canvas,
        width,
        height,
        totalFrames: GIF_FRAMES,
        fps: GIF_FPS,
        onProgress: (frame, total) => {
          const prog = frame / total
          setGifProgress(prog)
          setGifProgressModal(prog)
        },
        onFrame: async (_frameIdx) => {
          await sleep(5)
        },
        filename: `neon-text-${Date.now()}.gif`,
      })
    } catch (err) {
      console.error('GIF export failed:', err)
    } finally {
      setExporting(false)
      setIsExportingGif(false)
      setGifProgress(0)
      setGifProgressModal(0)
    }
  }, [isExporting, setExporting])

  useEffect(() => {
    return () => {
      setShutterFlash(null)
    }
  }, [setShutterFlash])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0e' }}>
      <div
        ref={viewportRef}
        id="viewport-container"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <AppCanvas
          canvasRef={canvasRef}
          isExportingGif={isExportingGif}
          gifProgress={gifProgress}
        />
      </div>

      <ControlPanel
        onExportPNG={handleExportPNG}
        onExportGIF={handleExportGIF}
        isExporting={isExporting}
      />

      {isExporting && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div
            style={{
              color: '#00ffff',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 14,
              letterSpacing: 1,
              textShadow: '0 0 8px #00ffff',
            }}
          >
            正在导出...
          </div>
        </div>
      )}

      {isExportingGif && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div
              className="neon-title"
              style={{
                fontSize: 18,
                marginBottom: 12,
                color: '#ff00ff',
                textShadow: '0 0 8px #ff00ff, 0 0 16px #ff00ff',
              }}
            >
              正在生成 GIF
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 13,
                marginBottom: 4,
                textAlign: 'center',
              }}
            >
              渲染中，请稍候...
            </div>
            <div
              style={{
                color: '#00ffff',
                fontSize: 14,
                fontFamily: 'Orbitron, monospace',
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              {Math.round(gifProgressModal * 100)}%
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${gifProgressModal * 100}%` }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              60 FPS · 2 秒 · 120 帧
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
