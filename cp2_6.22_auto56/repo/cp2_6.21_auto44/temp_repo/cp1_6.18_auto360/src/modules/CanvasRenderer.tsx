import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useElementStore, PostcardElement, TextureType, TextElement } from '../store/elementStore'
import {
  getHandles,
  getRotateHandle,
  hitTestHandle,
  pointInElement,
  createTransformState,
  applyTransform,
  applyMove,
  TransformState,
  HandleType,
  HANDLE_SIZE,
} from './ElementEditor'

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600

const STICKER_SVGS: Record<string, string> = {
  envelope: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="25" width="80" height="55" rx="4" fill="#FFF" stroke="#FFB300" stroke-width="3"/><path d="M10 27 L50 58 L90 27" stroke="#FFB300" stroke-width="3" fill="none"/><circle cx="50" cy="50" r="6" fill="#E53935"/></svg>',
  stamp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" fill="#FDF5E6" stroke="#5D4037" stroke-width="2" stroke-dasharray="4 3"/><rect x="18" y="18" width="64" height="64" fill="none" stroke="#5D4037" stroke-width="1.5"/><circle cx="50" cy="45" r="14" fill="none" stroke="#5D4037" stroke-width="1.5"/><path d="M35 60 L50 40 L65 60 Z" fill="none" stroke="#5D4037" stroke-width="1.5"/><text x="50" y="78" text-anchor="middle" font-size="10" fill="#5D4037" font-family="Georgia">POST</text></svg>',
  sunflower: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g><ellipse cx="50" cy="30" rx="8" ry="18" fill="#FFB300"/><ellipse cx="50" cy="30" rx="8" ry="18" fill="#FFB300" transform="rotate(45 50 50)"/><ellipse cx="50" cy="30" rx="8" ry="18" fill="#FFB300" transform="rotate(90 50 50)"/><ellipse cx="50" cy="30" rx="8" ry="18" fill="#FFB300" transform="rotate(135 50 50)"/><ellipse cx="50" cy="30" rx="8" ry="18" fill="#FFB300" transform="rotate(180 50 50)"/><ellipse cx="50" cy="30" rx="8" ry="18" fill="#FFB300" transform="rotate(225 50 50)"/><ellipse cx="50" cy="30" rx="8" ry="18" fill="#FFB300" transform="rotate(270 50 50)"/><ellipse cx="50" cy="30" rx="8" ry="18" fill="#FFB300" transform="rotate(315 50 50)"/></g><circle cx="50" cy="50" r="16" fill="#5D4037"/></svg>',
  heart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 85 C20 60 10 40 25 25 C38 13 50 25 50 35 C50 25 62 13 75 25 C90 40 80 60 50 85 Z" fill="#E53935"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 10 L60 38 L90 40 L68 58 L76 88 L50 72 L24 88 L32 58 L10 40 L40 38 Z" fill="#FFB300" stroke="#5D4037" stroke-width="2"/></svg>',
  leaf: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20 80 Q15 40 50 15 Q85 40 80 80 Q50 90 20 80 Z" fill="#43A047"/><path d="M50 18 L50 82" stroke="#2E7D32" stroke-width="2"/><path d="M50 35 Q40 42 30 50" stroke="#2E7D32" stroke-width="1.5" fill="none"/><path d="M50 35 Q60 42 70 50" stroke="#2E7D32" stroke-width="1.5" fill="none"/><path d="M50 55 Q40 62 32 68" stroke="#2E7D32" stroke-width="1.5" fill="none"/><path d="M50 55 Q60 62 68 68" stroke="#2E7D32" stroke-width="1.5" fill="none"/></svg>',
  coffee: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M25 35 L28 80 Q28 88 40 88 L60 88 Q72 88 72 80 L75 35 Z" fill="#8D6E63" stroke="#5D4037" stroke-width="2"/><rect x="20" y="30" width="60" height="8" rx="2" fill="#5D4037"/><path d="M75 45 Q90 45 90 60 Q90 75 75 75" fill="none" stroke="#5D4037" stroke-width="3"/><path d="M40 18 Q42 14 44 18 Q46 22 44 26" stroke="#8D6E63" stroke-width="2" fill="none"/><path d="M52 18 Q54 14 56 18 Q58 22 56 26" stroke="#8D6E63" stroke-width="2" fill="none"/></svg>',
  bird: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M15 55 Q20 30 50 30 Q70 30 80 50 L75 55 L85 58 L70 65 Q60 75 45 70 Q30 72 20 65 Q10 62 15 55 Z" fill="#1E88E5"/><circle cx="62" cy="45" r="4" fill="#FFF"/><circle cx="62" cy="45" r="2" fill="#333"/><path d="M78 50 L90 48 L78 54 Z" fill="#FFB300"/><path d="M35 72 Q40 82 45 78" fill="none" stroke="#1565C0" stroke-width="2"/></svg>',
  camera: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="30" width="80" height="55" rx="6" fill="#5D4037"/><path d="M22 30 L30 20 L50 20 L58 30 Z" fill="#5D4037"/><circle cx="50" cy="58" r="18" fill="#333" stroke="#FFB300" stroke-width="3"/><circle cx="50" cy="58" r="10" fill="#5D4037"/><rect x="72" y="38" width="10" height="6" rx="1" fill="#FFB300"/></svg>',
  music: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M38 25 L38 72" stroke="#5D4037" stroke-width="3"/><path d="M70 18 L70 65" stroke="#5D4037" stroke-width="3"/><path d="M38 25 L70 18 L70 28 L38 35 Z" fill="#8E24AA"/><ellipse cx="28" cy="75" rx="12" ry="8" fill="#8E24AA"/><ellipse cx="60" cy="68" rx="12" ry="8" fill="#8E24AA"/></svg>',
  flower: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="28" r="12" fill="#D81B60"/><circle cx="28" cy="42" r="12" fill="#D81B60"/><circle cx="72" cy="42" r="12" fill="#D81B60"/><circle cx="34" cy="62" r="12" fill="#D81B60"/><circle cx="66" cy="62" r="12" fill="#D81B60"/><circle cx="50" cy="48" r="10" fill="#FFB300"/><path d="M50 70 L50 88" stroke="#43A047" stroke-width="3"/><path d="M50 80 Q42 78 38 82" fill="none" stroke="#43A047" stroke-width="2"/></svg>',
  butterfly: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="30" cy="40" rx="22" ry="25" fill="#8E24AA"/><ellipse cx="30" cy="40" rx="12" ry="15" fill="#CE93D8"/><ellipse cx="70" cy="40" rx="22" ry="25" fill="#8E24AA"/><ellipse cx="70" cy="40" rx="12" ry="15" fill="#CE93D8"/><ellipse cx="26" cy="68" rx="12" ry="14" fill="#AB47BC"/><ellipse cx="74" cy="68" rx="12" ry="14" fill="#AB47BC"/><ellipse cx="50" cy="50" rx="4" ry="25" fill="#5D4037"/><path d="M48 22 Q44 12 40 14" fill="none" stroke="#5D4037" stroke-width="2"/><path d="M52 22 Q56 12 60 14" fill="none" stroke="#5D4037" stroke-width="2"/><circle cx="40" cy="14" r="2" fill="#5D4037"/><circle cx="60" cy="14" r="2" fill="#5D4037"/></svg>',
}

export const STICKER_TYPES = Object.keys(STICKER_SVGS)

function drawTexture(ctx: CanvasRenderingContext2D, type: TextureType) {
  ctx.fillStyle = '#FAFAFA'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  switch (type) {
    case 'grid': {
      ctx.strokeStyle = 'rgba(93, 64, 55, 0.12)'
      ctx.lineWidth = 1
      const step = 30
      for (let x = 0; x <= CANVAS_WIDTH; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_HEIGHT)
        ctx.stroke()
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += step) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_WIDTH, y)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(229, 57, 53, 0.4)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(60, 0)
      ctx.lineTo(60, CANVAS_HEIGHT)
      ctx.stroke()
      break
    }
    case 'watercolor': {
      const spots = [
        { x: 150, y: 120, r: 100, c: 'rgba(255, 179, 0, 0.18)' },
        { x: 650, y: 150, r: 130, c: 'rgba(30, 136, 229, 0.14)' },
        { x: 120, y: 480, r: 110, c: 'rgba(142, 36, 170, 0.13)' },
        { x: 680, y: 470, r: 120, c: 'rgba(67, 160, 71, 0.15)' },
        { x: 400, y: 300, r: 150, c: 'rgba(216, 27, 96, 0.10)' },
      ]
      for (const s of spots) {
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r)
        grad.addColorStop(0, s.c)
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      }
      break
    }
    case 'vintage': {
      ctx.fillStyle = '#FDF5E6'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      for (let i = 0; i < 2000; i++) {
        ctx.fillStyle = `rgba(93, 64, 55, ${Math.random() * 0.06})`
        ctx.fillRect(
          Math.random() * CANVAS_WIDTH,
          Math.random() * CANVAS_HEIGHT,
          1 + Math.random() * 2,
          1 + Math.random() * 2
        )
      }
      ctx.strokeStyle = 'rgba(93, 64, 55, 0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(15, 15, CANVAS_WIDTH - 30, CANVAS_HEIGHT - 30)
      ctx.setLineDash([])
      const drawCorner = (x: number, y: number, rot: number) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rot)
        ctx.strokeStyle = 'rgba(93, 64, 55, 0.7)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(0, 20)
        ctx.lineTo(0, 0)
        ctx.lineTo(20, 0)
        ctx.stroke()
        ctx.restore()
      }
      drawCorner(25, 25, 0)
      drawCorner(CANVAS_WIDTH - 25, 25, Math.PI / 2)
      drawCorner(CANVAS_WIDTH - 25, CANVAS_HEIGHT - 25, Math.PI)
      drawCorner(25, CANVAS_HEIGHT - 25, -Math.PI / 2)
      break
    }
    case 'kraft': {
      ctx.fillStyle = '#D7CCC8'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = `rgba(141, 110, 99, ${Math.random() * 0.15})`
        ctx.fillRect(
          Math.random() * CANVAS_WIDTH,
          Math.random() * CANVAS_HEIGHT,
          Math.random() * 1.5,
          Math.random() * 1.5
        )
      }
      for (let i = 0; i < 150; i++) {
        ctx.strokeStyle = `rgba(93, 64, 55, ${Math.random() * 0.1})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        const y = Math.random() * CANVAS_HEIGHT
        ctx.moveTo(0, y)
        ctx.bezierCurveTo(
          CANVAS_WIDTH * 0.3, y + (Math.random() - 0.5) * 10,
          CANVAS_WIDTH * 0.6, y + (Math.random() - 0.5) * 10,
          CANVAS_WIDTH, y + (Math.random() - 0.5) * 10
        )
        ctx.stroke()
      }
      break
    }
    case 'plain':
    default:
      break
  }
}

function drawBezier(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  if (pts.length < 2) return
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2
    const midY = (pts[i].y + pts[i + 1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY)
  }
  if (pts.length >= 2) {
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
  }
  ctx.stroke()
}

interface DragState {
  mode: 'move' | 'transform'
  handle: HandleType
  startX: number
  startY: number
  ts: TransformState
  original: PostcardElement
  moved: boolean
}

export interface CanvasRendererProps {
  onExportRequested?: (canvas: HTMLCanvasElement) => void
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ onExportRequested }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<DragState | null>(null)
  const lastRender = useRef<number>(0)
  const [scale, setScale] = useState(1)

  const state = useElementStore()

  const getCanvasCoords = (e: React.MouseEvent | MouseEvent): [number, number] => {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]
    const rect = canvas.getBoundingClientRect()
    return [
      ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    ]
  }

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const t0 = performance.now()

    ctx.save()
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    drawTexture(ctx, state.backgroundTexture)

    for (const el of state.elements) {
      ctx.save()
      if (el.type === 'brush') {
        ctx.strokeStyle = el.strokeColor
        ctx.lineWidth = el.strokeWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        drawBezier(ctx, el.points)
      } else {
        const cx = el.x + el.width / 2
        const cy = el.y + el.height / 2
        ctx.translate(cx, cy)
        ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.translate(-cx, -cy)

        if (state.selectedId === el.id && dragState.current && dragState.current.mode !== 'transform') {
          ctx.globalAlpha = 0.65
        }

        if (el.type === 'text') {
          const fontStr = [
            el.bold ? 'bold' : '',
            el.italic ? 'italic' : '',
            `${el.fontSize}px ${el.fontFamily}`,
          ].filter(Boolean).join(' ')
          ctx.font = fontStr
          ctx.fillStyle = el.color
          ctx.textBaseline = 'top'

          const words = el.content.split('\n')
          const lineHeight = el.fontSize * 1.2
          const drawY = el.y + (el.height - words.length * lineHeight) / 2

          words.forEach((word, i) => {
            let x = el.x
            const metrics = ctx.measureText(word)
            if (metrics.width < el.width) {
              x = el.x
            }
            const y = drawY + i * lineHeight
            ctx.fillText(word, x, y, el.width)
            if (el.underline) {
              ctx.strokeStyle = el.color
              ctx.lineWidth = Math.max(1, el.fontSize / 16)
              const w = Math.min(metrics.width, el.width)
              ctx.beginPath()
              ctx.moveTo(x, y + el.fontSize + 2)
              ctx.lineTo(x + w, y + el.fontSize + 2)
              ctx.stroke()
            }
          })
        } else if (el.type === 'sticker') {
          const svgStr = STICKER_SVGS[el.stickerType]
          if (svgStr) {
            const img = svgCacheRef.current.get(el.stickerType)
            if (img && img.complete) {
              ctx.drawImage(img, el.x, el.y, el.width, el.height)
            }
          }
        }
      }
      ctx.restore()
    }
    ctx.restore()

    lastRender.current = performance.now() - t0
  }, [state.elements, state.backgroundTexture, state.selectedId])

  const svgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    for (const [key, svg] of Object.entries(STICKER_SVGS)) {
      if (!svgCacheRef.current.has(key)) {
        const img = new Image()
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
        svgCacheRef.current.set(key, img)
        img.onload = () => render()
      }
    }
  }, [render])

  useEffect(() => {
    const frame = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frame)
  }, [render])

  useEffect(() => {
    if (onExportRequested) {
      const handler = () => {
        const canvas = canvasRef.current
        if (canvas) onExportRequested(canvas)
      }
      ;(window as any).__requestExport = handler
      return () => { delete (window as any).__requestExport }
    }
  }, [onExportRequested])

  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth
      if (w < 900) {
        const available = Math.min(w - 32, 800)
        setScale(available / CANVAS_WIDTH)
      } else {
        setScale(1)
      }
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    const [cx, cy] = getCanvasCoords(e)
    const tool = state.currentTool
    state.setEditingTextId(null)

    if (tool === 'brush') {
      state.startBrushStroke(cx, cy)
      return
    }

    if (tool === 'text') {
      state.addTextElement(cx - 120, cy - 20)
      return
    }

    const elements = [...state.elements].reverse()
    for (const el of elements) {
      if (el.type === 'brush') continue
      if (state.selectedId === el.id) {
        const handle = hitTestHandle(el, cx, cy)
        if (handle) {
          dragState.current = {
            mode: 'transform',
            handle,
            startX: cx,
            startY: cy,
            ts: createTransformState(handle, cx, cy, el),
            original: { ...el },
            moved: false,
          }
          return
        }
      }
      if (pointInElement(el, cx, cy)) {
        state.selectElement(el.id)
        state.pushHistory()
        dragState.current = {
          mode: 'move',
          handle: 'se',
          startX: cx,
          startY: cy,
          ts: createTransformState('se', cx, cy, el),
          original: { ...el },
          moved: false,
        }
        return
      }
    }
    state.selectElement(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const [cx, cy] = getCanvasCoords(e)
    const tool = state.currentTool

    if (tool === 'brush' && state.selectedId) {
      state.continueBrushStroke(cx, cy)
      return
    }

    const ds = dragState.current
    if (!ds) return
    ds.moved = true
    const el = state.elements.find((x) => x.id === ds.original.id)
    if (!el) return

    if (ds.mode === 'move') {
      const upd = applyMove(ds.original, ds.startX, ds.startY, cx, cy)
      state.updateElement(el.id, upd)
    } else if (ds.mode === 'transform') {
      const upd = applyTransform(ds.ts, cx, cy, e.shiftKey)
      if (el.type === 'text' && (upd.width || upd.height)) {
        const ratio = (upd.width ?? el.width) / ds.original.width
        const newFont = Math.max(8, Math.round(ds.original.fontSize * ratio))
        state.updateElement(el.id, { ...upd, fontSize: newFont } as Partial<PostcardElement>)
        return
      }
      state.updateElement(el.id, upd)
    }
  }

  const handleMouseUp = () => {
    const tool = state.currentTool
    if (tool === 'brush') {
      state.finishBrushStroke()
      return
    }
    dragState.current = null
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    const [cx, cy] = getCanvasCoords(e)
    const elements = [...state.elements].reverse()
    for (const el of elements) {
      if (el.type === 'text' && pointInElement(el, cx, cy)) {
        state.setEditingTextId(el.id)
        return
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.shiftKey) return
    e.preventDefault()
    const el = state.elements.find((x) => x.id === state.selectedId)
    if (!el || el.type === 'brush') return
    state.pushHistory()
    const delta = e.deltaY > 0 ? -3 : 3
    state.updateElement(el.id, { rotation: el.rotation + delta })
  }

  const selected = state.elements.find((x) => x.id === state.selectedId)
  const editingText = state.editingTextId
    ? (state.elements.find((x) => x.id === state.editingTextId) as TextElement | undefined)
    : undefined

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'relative',
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        borderRadius: 4,
        overflow: 'visible',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
          display: 'block',
          cursor:
            state.currentTool === 'text'
              ? 'text'
              : state.currentTool === 'brush'
                ? 'crosshair'
                : 'default',
          borderRadius: 4,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />
      {selected && selected.type !== 'brush' && (
        <div
          style={{
            position: 'absolute',
            left: selected.x * scale,
            top: selected.y * scale,
            width: selected.width * scale,
            height: selected.height * scale,
            transform: `rotate(${selected.rotation}deg)`,
            transformOrigin: 'center center',
            pointerEvents: 'none',
            border: '1.5px dashed #FFB300',
            boxSizing: 'border-box',
          }}
        />
      )}
      {selected && selected.type !== 'brush' && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: CANVAS_WIDTH * scale,
            height: CANVAS_HEIGHT * scale,
            pointerEvents: 'none',
          }}
        >
          {getHandles(selected).map((h) => (
            <div
              key={h.type}
              style={{
                position: 'absolute',
                left: h.x * scale - HANDLE_SIZE,
                top: h.y * scale - HANDLE_SIZE,
                width: HANDLE_SIZE * 2,
                height: HANDLE_SIZE * 2,
                background: '#FFFFFF',
                border: '1px solid #999',
                borderRadius: '50%',
                pointerEvents: 'auto',
                cursor: h.cursor,
                transform: 'translate(-50%, -50%)',
                marginLeft: HANDLE_SIZE,
                marginTop: HANDLE_SIZE,
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                const [cx, cy] = getCanvasCoords(e.nativeEvent)
                state.pushHistory()
                dragState.current = {
                  mode: 'transform',
                  handle: h.type,
                  startX: cx,
                  startY: cy,
                  ts: createTransformState(h.type, cx, cy, selected),
                  original: { ...selected },
                  moved: false,
                }
              }}
            />
          ))}
          {(() => {
            const rh = getRotateHandle(selected)
            const handles = getHandles(selected)
            const topHandle = handles.find((x) => x.type === 'n')
            return (
              <>
                {topHandle && (
                  <div
                    style={{
                      position: 'absolute',
                      left: rh.x * scale,
                      top: topHandle.y * scale,
                      width: 1,
                      height: (rh.y - topHandle.y) * scale,
                      background: '#BBB',
                      pointerEvents: 'none',
                      transform: 'translate(-50%, 0)',
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    left: rh.x * scale,
                    top: rh.y * scale,
                    width: 18,
                    height: 18,
                    background: '#FFB300',
                    border: '2px solid #FFF',
                    borderRadius: '50%',
                    pointerEvents: 'auto',
                    cursor: 'grab',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    const [cx, cy] = getCanvasCoords(e.nativeEvent)
                    state.pushHistory()
                    dragState.current = {
                      mode: 'transform',
                      handle: 'rotate',
                      startX: cx,
                      startY: cy,
                      ts: createTransformState('rotate', cx, cy, selected),
                      original: { ...selected },
                      moved: false,
                    }
                  }}
                >
                  ↻
                </div>
              </>
            )
          })()}
        </div>
      )}
      {editingText && (
        <textarea
          autoFocus
          value={editingText.content}
          onChange={(e) => {
            const newContent = e.target.value
            state.updateElement(editingText.id, { content: newContent })
          }}
          onBlur={() => state.setEditingTextId(null)}
          style={{
            position: 'absolute',
            left: editingText.x * scale,
            top: editingText.y * scale,
            width: editingText.width * scale,
            height: editingText.height * scale,
            transform: `rotate(${editingText.rotation}deg)`,
            transformOrigin: 'center center',
            background: 'rgba(255,255,255,0.9)',
            border: '2px solid #FFB300',
            borderRadius: 4,
            outline: 'none',
            resize: 'none',
            padding: 2,
            fontFamily: editingText.fontFamily,
            fontSize: editingText.fontSize * scale,
            fontWeight: editingText.bold ? 'bold' : 'normal',
            fontStyle: editingText.italic ? 'italic' : 'normal',
            textDecoration: editingText.underline ? 'underline' : 'none',
            color: editingText.color,
            lineHeight: 1.2,
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}

export function exportPostcard(filename: string = 'postcard.png') {
  const handler = (window as any).__requestExport
  if (!handler) return
  const canvas: HTMLCanvasElement = handler()
  if (!canvas) return
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
