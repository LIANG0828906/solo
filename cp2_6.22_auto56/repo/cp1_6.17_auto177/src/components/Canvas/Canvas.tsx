import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Save, Undo2 } from 'lucide-react'
import { WatercolorEngine } from '../../WatercolorEngine'
import { eventBus } from '../../EventBus'
import { usePaintStore } from '../../store/paintStore'
import { galleryManager } from '../../GalleryManager'
import { PAPER_CONFIGS } from '../../types'
import styles from '../../styles/canvas.module.css'
import { Toolbar } from './Toolbar'
import { ColorPalette } from './ColorPalette'

const CANVAS_W = 900
const CANVAS_H = 620

interface Point { x: number; y: number; t: number }

export const CanvasPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<WatercolorEngine | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<Point | null>(null)
  const rafRef = useRef<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [fading, setFading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [undoCount, setUndoCount] = useState(galleryManager.undoCount)
  const params = usePaintStore()

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 1800)
  }

  const commitUndoSnapshot = useCallback(() => {
    if (!engineRef.current) return
    const snap = engineRef.current.exportBase64()
    galleryManager.pushUndo(snap)
    setUndoCount(galleryManager.undoCount)
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const engine = engineRef.current
    if (!canvas || !engine) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    engine.renderTo(ctx)
  }, [])

  useEffect(() => {
    const engine = new WatercolorEngine(CANVAS_W, CANVAS_H, params.paperType)
    engineRef.current = engine
    const canvas = canvasRef.current!
    canvas.width = CANVAS_W
    canvas.height = CANVAS_H
    render()
    return () => {
      engine.destroy()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPaper(params.paperType)
    }
  }, [params.paperType])

  const loop = useCallback(() => {
    render()
    rafRef.current = requestAnimationFrame(loop)
  }, [render])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [loop])

  const getPos = (e: React.PointerEvent): Point | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)
    return { x, y, t: performance.now() }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const p = getPos(e); if (!p) return
    const engine = engineRef.current; if (!engine) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    if (params.isPipette) {
      const col = engine.getPixelColor(p.x, p.y)
      params.setColor(col)
      params.setPipette(false)
      showToast(`取色：${col.r},${col.g},${col.b}`)
      return
    }

    commitUndoSnapshot()
    drawingRef.current = true
    lastPointRef.current = p
    const fullParams = {
      size: params.size,
      waterContent: params.waterContent,
      textureStrength: params.textureStrength,
      paperType: params.paperType,
      currentColor: params.currentColor,
    }
    engine.stroke(p.x, p.y, 0, 0.8, params.currentColor, fullParams)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const p = getPos(e); if (!p) return
    const engine = engineRef.current; if (!engine) return
    if (!drawingRef.current || params.isPipette) return
    const last = lastPointRef.current
    if (!last) { lastPointRef.current = p; return }
    const dx = p.x - last.x, dy = p.y - last.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const dt = Math.max(1, p.t - last.t)
    const speed = Math.min(2, dist / dt * 8)
    const steps = Math.max(1, Math.ceil(dist / 3))
    const fullParams = {
      size: params.size,
      waterContent: params.waterContent,
      textureStrength: params.textureStrength,
      paperType: params.paperType,
      currentColor: params.currentColor,
    }
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const x = last.x + dx * t
      const y = last.y + dy * t
      engine.stroke(x, y, speed, 0.5 + 0.3 * (1 - t), params.currentColor, fullParams)
    }
    lastPointRef.current = p
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPointRef.current = null
    engineRef.current?.lift()
  }

  const doUndo = useCallback(() => {
    const snap = galleryManager.popUndo()
    setUndoCount(galleryManager.undoCount)
    if (!snap || !engineRef.current) return
    setFading(true)
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
      engineRef.current!.setImageData(id)
      setTimeout(() => setFading(false), 140)
    }
    img.src = snap
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        doUndo()
      }
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey) {
        params.togglePipette()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doUndo, params])

  const saveArtwork = () => {
    if (!engineRef.current || saving) return
    setSaving(true)
    const full = engineRef.current.exportBase64()
    const thumb = engineRef.current.exportThumbnail(220)
    const engine = engineRef.current
    eventBus.emit({
      type: 'save',
      payload: {
        fullImage: full,
        thumbnail: thumb,
        width: engine.width,
        height: engine.height,
        paperType: engine.paperType,
      },
    })
    window.setTimeout(() => {
      setSaving(false)
      showToast('✓ 作品已保存到画廊')
    }, 700)
  }

  const paperFilter = PAPER_CONFIGS[params.paperType].filter

  return (
    <div className={styles.page}>
      <Toolbar />
      <main className={`${styles.canvasWrap} ${styles.withPalette}`}>
        <div className={styles.canvasCard}>
          <canvas
            ref={canvasRef}
            className={`${styles.canvas} ${params.isPipette ? styles.pipette : ''} ${fading ? styles.fading : ''}`}
            style={{ filter: paperFilter }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        </div>

        <button
          className={`${styles.saveBtn} ${saving ? styles.saving : ''}`}
          onClick={saveArtwork}
          title="保存作品（保存到画廊）"
        >
          <Save size={22} />
        </button>
        <button
          className={styles.undoBtn}
          onClick={doUndo}
          disabled={undoCount === 0}
          title="撤销（Ctrl+Z）"
        >
          <Undo2 size={20} />
        </button>

        {toast && <div className={styles.toast}>{toast}</div>}
      </main>

      <ColorPalette />
    </div>
  )
}
