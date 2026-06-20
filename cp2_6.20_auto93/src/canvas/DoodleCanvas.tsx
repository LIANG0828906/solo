import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Point, DoodleStroke } from '../utils/exportUtils'

export type ToolMode = 'brush' | 'select'

export interface DoodleCanvasHandle {
  alignToGrid: () => void
  exportStrokes: () => DoodleStroke[]
  getExportBounds: () => { width: number; height: number }
}

interface DoodleCanvasProps {
  mode: ToolMode
  brushColor: string
  brushThickness: number
  onSelectionChange: (count: number) => void
  onMouseMove: (x: number, y: number) => void
  onZoomChange: (zoom: number) => void
}

const GRID_SIZE = 30
const GRID_COLOR = '#e0d8c8'
const BG_COLOR = '#faf3e0'
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const JITTER_AMOUNT = 0.8
const TIP_LENGTH_RATIO = 0.25

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate'

interface InteractionState {
  isDrawing: boolean
  isPanning: boolean
  isDragging: boolean
  isResizing: boolean
  isRotating: boolean
  resizeHandle: HandlePosition | null
  startPan: { x: number; y: number }
  startOffset: { x: number; y: number }
  dragStart: { x: number; y: number }
  originalStrokes: Map<string, { x: number; y: number }>
  resizeOrigin: { x: number; y: number }
  originalStroke: DoodleStroke | null
  rotateOrigin: { x: number; y: number }
  originalRotation: number
  shiftPressed: boolean
}

interface BounceAnimation {
  id: string
  startX: number
  startY: number
  targetX: number
  targetY: number
  startTime: number
  duration: number
}

interface BezierPoint extends Point {
  cp1x: number
  cp1y: number
  cp2x: number
  cp2y: number
  thickness: number
}

const DoodleCanvas = forwardRef<DoodleCanvasHandle, DoodleCanvasProps>(({
  mode,
  brushColor,
  brushThickness,
  onSelectionChange,
  onMouseMove,
  onZoomChange,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [strokes, setStrokes] = useState<DoodleStroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [displayRotation, setDisplayRotation] = useState<{ id: string; angle: number } | null>(null)
  const [bounceAnimations, setBounceAnimations] = useState<BounceAnimation[]>([])

  const offsetRef = useRef(offset)
  const zoomRef = useRef(zoom)
  const strokesRef = useRef(strokes)
  const selectedIdsRef = useRef(selectedIds)
  const bounceAnimationsRef = useRef<BounceAnimation[]>([])
  const currentStrokeRef = useRef<Point[] | null>(null)
  const bezierCacheRef = useRef<Map<string, BezierPoint[]>>(new Map())
  const interactionRef = useRef<InteractionState>({
    isDrawing: false,
    isPanning: false,
    isDragging: false,
    isResizing: false,
    isRotating: false,
    resizeHandle: null,
    startPan: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 },
    dragStart: { x: 0, y: 0 },
    originalStrokes: new Map(),
    resizeOrigin: { x: 0, y: 0 },
    originalStroke: null,
    rotateOrigin: { x: 0, y: 0 },
    originalRotation: 0,
    shiftPressed: false,
  })
  const inertiaRef = useRef({ vx: 0, vy: 0, lastX: 0, lastY: 0, lastTime: 0 })
  const touchRef = useRef<{ distance: number; midX: number; midY: number } | null>(null)
  const animationFrameRef = useRef<number>(0)

  useEffect(() => { offsetRef.current = offset }, [offset])
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { strokesRef.current = strokes }, [strokes])
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])
  useEffect(() => { bounceAnimationsRef.current = bounceAnimations }, [bounceAnimations])
  useEffect(() => { currentStrokeRef.current = currentStroke }, [currentStroke])

  const screenToCanvas = useCallback((sx: number, sy: number): Point => {
    return {
      x: (sx - offsetRef.current.x) / zoomRef.current,
      y: (sy - offsetRef.current.y) / zoomRef.current,
    }
  }, [])

  const getTransformedBounds = useCallback((stroke: DoodleStroke, overridePos?: { x: number; y: number }) => {
    const sx = overridePos?.x ?? stroke.x
    const sy = overridePos?.y ?? stroke.y
    const cx = sx + stroke.width / 2
    const cy = sy + stroke.height / 2
    const cos = Math.cos(stroke.rotation)
    const sin = Math.sin(stroke.rotation)
    const corners = [
      { x: sx, y: sy },
      { x: sx + stroke.width * stroke.scaleX, y: sy },
      { x: sx + stroke.width * stroke.scaleX, y: sy + stroke.height * stroke.scaleY },
      { x: sx, y: sy + stroke.height * stroke.scaleY },
    ].map(p => {
      const dx = p.x - cx
      const dy = p.y - cy
      return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      }
    })
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    corners.forEach(p => {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    })
    return { minX, minY, maxX, maxY, cx, cy }
  }, [])

  const hitTestStroke = useCallback((pt: Point, stroke: DoodleStroke): boolean => {
    const bounds = getTransformedBounds(stroke)
    const padding = 8 / zoomRef.current
    if (pt.x < bounds.minX - padding || pt.x > bounds.maxX + padding ||
        pt.y < bounds.minY - padding || pt.y > bounds.maxY + padding) {
      return false
    }
    const cx = stroke.x + stroke.width / 2
    const cy = stroke.y + stroke.height / 2
    const cos = Math.cos(-stroke.rotation)
    const sin = Math.sin(-stroke.rotation)
    const dx = pt.x - cx
    const dy = pt.y - cy
    const localX = cx + dx * cos - dy * sin
    const localY = cy + dx * sin + dy * cos
    const scaledW = stroke.width * stroke.scaleX
    const scaledH = stroke.height * stroke.scaleY
    return localX >= stroke.x - padding && localX <= stroke.x + scaledW + padding &&
           localY >= stroke.y - padding && localY <= stroke.y + scaledH + padding
  }, [getTransformedBounds])

  const hitTestHandle = useCallback((pt: Point, stroke: DoodleStroke): HandlePosition | null => {
    const bounds = getTransformedBounds(stroke)
    const handleSize = 14 / zoomRef.current
    const { minX, minY, maxX, maxY } = bounds
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2
    const handleDist = 24 / zoomRef.current
    const rotateX = midX
    const rotateY = minY - handleDist

    const handles: { pos: HandlePosition; x: number; y: number }[] = [
      { pos: 'nw', x: minX, y: minY },
      { pos: 'n', x: midX, y: minY },
      { pos: 'ne', x: maxX, y: minY },
      { pos: 'e', x: maxX, y: midY },
      { pos: 'se', x: maxX, y: maxY },
      { pos: 's', x: midX, y: maxY },
      { pos: 'sw', x: minX, y: maxY },
      { pos: 'w', x: minX, y: midY },
    ]

    for (const h of handles) {
      if (Math.abs(pt.x - h.x) <= handleSize && Math.abs(pt.y - h.y) <= handleSize) {
        return h.pos
      }
    }

    if (Math.abs(pt.x - rotateX) <= handleSize * 1.5 && Math.abs(pt.y - rotateY) <= handleSize * 1.5) {
      return 'rotate'
    }
    return null
  }, [getTransformedBounds])

  const easeOutBounce = (t: number): number => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  }

  const computeBezierPoints = useCallback((pts: Point[], baseThickness: number): BezierPoint[] => {
    if (pts.length < 2) return []
    const result: BezierPoint[] = []
    const totalLen = pts.length
    const tipStartIdx = Math.max(0, totalLen - Math.floor(totalLen * TIP_LENGTH_RATIO))

    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[Math.min(pts.length - 1, i + 1)]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]

      let thickness = baseThickness
      if (i >= tipStartIdx) {
        const progress = (i - tipStartIdx) / Math.max(1, (totalLen - 1) - tipStartIdx)
        thickness = baseThickness * (1 - progress * 0.85)
      }
      if (i <= 2) {
        const startProgress = (i + 1) / 3
        thickness = baseThickness * Math.min(1, startProgress * 1.2)
      }

      const jitter = JITTER_AMOUNT * (baseThickness / 8)
      const cp1x = p1.x + (p2.x - p0.x) / 6 + (Math.random() - 0.5) * jitter
      const cp1y = p1.y + (p2.y - p0.y) / 6 + (Math.random() - 0.5) * jitter
      const cp2x = p2.x - (p3.x - p1.x) / 6 + (Math.random() - 0.5) * jitter
      const cp2y = p2.y - (p3.y - p1.y) / 6 + (Math.random() - 0.5) * jitter

      result.push({
        x: p2.x,
        y: p2.y,
        cp1x,
        cp1y,
        cp2x,
        cp2y,
        thickness: Math.max(0.5, thickness),
      })
    }

    return result
  }, [])

  const drawStrokeWithJitterAndTip = useCallback((
    ctx: CanvasRenderingContext2D,
    pts: Point[],
    color: string,
    baseThickness: number,
    strokeId?: string,
  ) => {
    if (pts.length < 2) return

    let bezierPts: BezierPoint[]
    if (strokeId) {
      const cacheKey = `${strokeId}-${baseThickness}-${pts.length}`
      const cached = bezierCacheRef.current.get(cacheKey)
      if (cached) {
        bezierPts = cached
      } else {
        bezierPts = computeBezierPoints(pts, baseThickness)
        bezierCacheRef.current.set(cacheKey, bezierPts)
      }
    } else {
      bezierPts = computeBezierPoints(pts, baseThickness)
    }

    if (bezierPts.length < 2) return

    ctx.strokeStyle = color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = color

    ctx.lineWidth = bezierPts[0].thickness
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)

    for (let i = 0; i < bezierPts.length; i++) {
      const bp = bezierPts[i]
      ctx.lineWidth = bp.thickness
      ctx.bezierCurveTo(bp.cp1x, bp.cp1y, bp.cp2x, bp.cp2y, bp.x, bp.y)
      ctx.stroke()

      if (i < bezierPts.length - 1) {
        ctx.beginPath()
        ctx.arc(bp.x, bp.y, bp.thickness / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(bp.x, bp.y)
      }
    }

    ctx.strokeStyle = color
    ctx.lineWidth = bezierPts[bezierPts.length - 1].thickness * 0.8
    ctx.beginPath()
    const lastIdx = pts.length - 1
    ctx.moveTo(pts[lastIdx - 1].x, pts[lastIdx - 1].y)
    ctx.lineTo(pts[lastIdx].x, pts[lastIdx].y)
    ctx.stroke()
  }, [computeBezierPoints])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const z = zoomRef.current
    const ox = offsetRef.current.x
    const oy = offsetRef.current.y

    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = GRID_COLOR
    const startX = ((-ox) % (GRID_SIZE * z) + GRID_SIZE * z) % (GRID_SIZE * z)
    const startY = ((-oy) % (GRID_SIZE * z) + GRID_SIZE * z) % (GRID_SIZE * z)
    const dotRadius = Math.max(1, 1.2 * z)
    for (let x = startX; x < w; x += GRID_SIZE * z) {
      for (let y = startY; y < h; y += GRID_SIZE * z) {
        ctx.beginPath()
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.save()
    ctx.translate(ox, oy)
    ctx.scale(z, z)

    const now = performance.now()
    const activeBounces = bounceAnimationsRef.current.filter(b => now - b.startTime < b.duration)

    strokesRef.current.forEach(stroke => {
      if (stroke.points.length < 2) return
      ctx.save()

      let renderX = stroke.x
      let renderY = stroke.y
      const bounce = activeBounces.find(b => b.id === stroke.id)
      if (bounce) {
        const t = Math.min(1, (now - bounce.startTime) / bounce.duration)
        const eased = easeOutBounce(t)
        renderX = bounce.startX + (bounce.targetX - bounce.startX) * eased
        renderY = bounce.startY + (bounce.targetY - bounce.startY) * eased
      }

      const cx = renderX + stroke.width / 2
      const cy = renderY + stroke.height / 2
      ctx.translate(cx, cy)
      ctx.rotate(stroke.rotation)
      ctx.scale(stroke.scaleX, stroke.scaleY)
      ctx.translate(-stroke.width / 2, -stroke.height / 2)

      drawStrokeWithJitterAndTip(ctx, stroke.points, stroke.color, stroke.thickness, stroke.id)

      ctx.restore()
    })

    if (bounceAnimationsRef.current.length !== activeBounces.length) {
      setBounceAnimations(activeBounces)
    }

    const liveStroke = currentStrokeRef.current
    if (liveStroke && liveStroke.length >= 2) {
      drawStrokeWithJitterAndTip(ctx, liveStroke, brushColor, brushThickness)
    }

    selectedIdsRef.current.forEach(id => {
      const stroke = strokesRef.current.find(s => s.id === id)
      if (!stroke) return

      let renderX = stroke.x
      let renderY = stroke.y
      const bounce = activeBounces.find(b => b.id === stroke.id)
      if (bounce) {
        const t = Math.min(1, (now - bounce.startTime) / bounce.duration)
        const eased = easeOutBounce(t)
        renderX = bounce.startX + (bounce.targetX - bounce.startX) * eased
        renderY = bounce.startY + (bounce.targetY - bounce.startY) * eased
      }

      const bounds = getTransformedBounds(stroke, { x: renderX, y: renderY })
      const { minX, minY, maxX, maxY, cx, cy } = bounds
      const bw = maxX - minX
      const bh = maxY - minY

      ctx.save()
      ctx.strokeStyle = '#3498db'
      ctx.lineWidth = 2 / z
      ctx.setLineDash([8 / z, 6 / z])
      ctx.strokeRect(minX, minY, bw, bh)

      ctx.setLineDash([])
      ctx.fillStyle = 'white'
      ctx.strokeStyle = '#3498db'
      ctx.lineWidth = 2 / z
      const handleSize = 10 / z
      const handlePositions = [
        { x: minX, y: minY },
        { x: (minX + maxX) / 2, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: (minY + maxY) / 2 },
        { x: maxX, y: maxY },
        { x: (minX + maxX) / 2, y: maxY },
        { x: minX, y: maxY },
        { x: minX, y: (minY + maxY) / 2 },
      ]
      handlePositions.forEach(p => {
        ctx.beginPath()
        ctx.rect(p.x - handleSize / 2, p.y - handleSize / 2, handleSize, handleSize)
        ctx.fill()
        ctx.stroke()
      })

      const handleDist = 26 / z
      const rotateX = (minX + maxX) / 2
      const rotateY = minY - handleDist
      ctx.beginPath()
      ctx.arc(rotateX, rotateY, 9 / z, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#3498db'
      ctx.lineWidth = 2 / z
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(rotateX, rotateY, 3 / z, 0, Math.PI * 2)
      ctx.fillStyle = '#3498db'
      ctx.fill()

      ctx.beginPath()
      ctx.setLineDash([5 / z, 4 / z])
      ctx.lineWidth = 1.2 / z
      ctx.moveTo(rotateX, rotateY + 9 / z)
      ctx.lineTo(rotateX, minY)
      ctx.stroke()
      ctx.setLineDash([])

      if (displayRotation && displayRotation.id === id) {
        const angleText = `${Math.round((displayRotation.angle * 180) / Math.PI)}°`
        ctx.font = `bold ${14 / z}px -apple-system, BlinkMacSystemFont, sans-serif`
        ctx.textAlign = 'center'
        const tw = ctx.measureText(angleText).width
        const padX = 12 / z
        ctx.fillStyle = 'rgba(250, 243, 224, 0.95)'
        ctx.strokeStyle = 'rgba(212, 203, 184, 0.6)'
        ctx.lineWidth = 1 / z
        const bgW = tw + padX * 2
        const bgH = 26 / z
        const bgX = cx - bgW / 2
        const bgY = cy - bgH / 2
        ctx.beginPath()
        ctx.roundRect(bgX, bgY, bgW, bgH, 5 / z)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#6b5f4e'
        ctx.fillText(angleText, cx, cy + 5 / z)
      }

      ctx.restore()
    })

    ctx.restore()
  }, [brushColor, brushThickness, displayRotation, getTransformedBounds, drawStrokeWithJitterAndTip])

  useEffect(() => {
    const loop = () => {
      render()
      animationFrameRef.current = requestAnimationFrame(loop)
    }
    animationFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [render])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const delta = e.ctrlKey ? -e.deltaY * 0.01 : -e.deltaY * 0.0015
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * (1 + delta)))
    const ratio = newZoom / zoomRef.current
    const newOx = mx - (mx - offsetRef.current.x) * ratio
    const newOy = my - (my - offsetRef.current.y) * ratio
    setZoom(newZoom)
    setOffset({ x: newOx, y: newOy })
    onZoomChange(newZoom)
  }, [onZoomChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      interactionRef.current.shiftPressed = e.shiftKey
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.size > 0) {
        setStrokes(prev => prev.filter(s => !selectedIdsRef.current.has(s.id)))
        setSelectedIds(new Set())
        onSelectionChange(0)
        bezierCacheRef.current.clear()
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      interactionRef.current.shiftPressed = e.shiftKey
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onSelectionChange])

  const addJitter = (p: Point, amount: number = 0.5): Point => {
    return {
      x: p.x + (Math.random() - 0.5) * amount,
      y: p.y + (Math.random() - 0.5) * amount,
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const pt = screenToCanvas(sx, sy)
    onMouseMove(pt.x, pt.y)

    if (mode === 'brush') {
      bezierCacheRef.current.clear()
      interactionRef.current.isDrawing = true
      const startPt = addJitter(pt, 0.3)
      const newStroke = [startPt]
      setCurrentStroke(newStroke)
      currentStrokeRef.current = newStroke
    } else if (mode === 'select') {
      let hitStroke: DoodleStroke | null = null
      let hitHandle: HandlePosition | null = null
      for (const id of selectedIdsRef.current) {
        const s = strokesRef.current.find(st => st.id === id)
        if (!s) continue
        const handle = hitTestHandle(pt, s)
        if (handle) {
          hitStroke = s
          hitHandle = handle
          break
        }
      }

      if (hitStroke && hitHandle) {
        if (hitHandle === 'rotate') {
          interactionRef.current.isRotating = true
          interactionRef.current.originalStroke = { ...hitStroke }
          const bounds = getTransformedBounds(hitStroke)
          interactionRef.current.rotateOrigin = { x: bounds.cx, y: bounds.cy }
          interactionRef.current.originalRotation = hitStroke.rotation
          setDisplayRotation({ id: hitStroke.id, angle: hitStroke.rotation })
        } else {
          interactionRef.current.isResizing = true
          interactionRef.current.resizeHandle = hitHandle
          interactionRef.current.originalStroke = { ...hitStroke }
          const bounds = getTransformedBounds(hitStroke)
          interactionRef.current.resizeOrigin = {
            x: hitHandle.includes('e') ? bounds.minX :
               hitHandle.includes('w') ? bounds.maxX : bounds.cx,
            y: hitHandle.includes('s') ? bounds.minY :
               hitHandle.includes('n') ? bounds.maxY : bounds.cy,
          }
        }
        return
      }

      let clickedStroke: DoodleStroke | null = null
      for (let i = strokesRef.current.length - 1; i >= 0; i--) {
        if (hitTestStroke(pt, strokesRef.current[i])) {
          clickedStroke = strokesRef.current[i]
          break
        }
      }

      if (clickedStroke) {
        let newSelectedSet: Set<string>
        if (e.shiftKey) {
          newSelectedSet = new Set(selectedIdsRef.current)
          if (newSelectedSet.has(clickedStroke.id)) {
            newSelectedSet.delete(clickedStroke.id)
          } else {
            newSelectedSet.add(clickedStroke.id)
          }
        } else if (selectedIdsRef.current.has(clickedStroke.id)) {
          newSelectedSet = new Set(selectedIdsRef.current)
        } else {
          newSelectedSet = new Set([clickedStroke.id])
        }

        setSelectedIds(newSelectedSet)
        selectedIdsRef.current = newSelectedSet
        onSelectionChange(newSelectedSet.size)

        if (newSelectedSet.size > 0) {
          interactionRef.current.isDragging = true
          interactionRef.current.dragStart = { x: pt.x, y: pt.y }
          const originals = new Map<string, { x: number; y: number }>()
          newSelectedSet.forEach(id => {
            const s = strokesRef.current.find(st => st.id === id)
            if (s) originals.set(id, { x: s.x, y: s.y })
          })
          interactionRef.current.originalStrokes = originals
        }
      } else {
        if (!e.shiftKey) {
          setSelectedIds(new Set())
          selectedIdsRef.current = new Set()
          onSelectionChange(0)
        }
        interactionRef.current.isPanning = true
        interactionRef.current.startPan = { x: sx, y: sy }
        interactionRef.current.startOffset = { ...offsetRef.current }
        inertiaRef.current = { vx: 0, vy: 0, lastX: sx, lastY: sy, lastTime: performance.now() }
      }
    }
  }, [mode, onMouseMove, onSelectionChange, screenToCanvas, hitTestHandle, hitTestStroke, getTransformedBounds])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const pt = screenToCanvas(sx, sy)
    onMouseMove(pt.x, pt.y)

    const ia = interactionRef.current

    if (ia.isDrawing) {
      const liveStroke = currentStrokeRef.current
      if (liveStroke && liveStroke.length > 0) {
        const lastPt = liveStroke[liveStroke.length - 1]
        const dist = Math.sqrt((pt.x - lastPt.x) ** 2 + (pt.y - lastPt.y) ** 2)
        if (dist > 1.2) {
          const jitterAmount = JITTER_AMOUNT * (brushThickness / 10)
          const jittered = addJitter(pt, jitterAmount)
          const updated = [...liveStroke, jittered]
          currentStrokeRef.current = updated
          setCurrentStroke(updated)
        }
      }
    } else if (ia.isPanning) {
      const now = performance.now()
      const dt = Math.max(1, now - inertiaRef.current.lastTime)
      const dx = sx - ia.startPan.x
      const dy = sy - ia.startPan.y
      inertiaRef.current.vx = (sx - inertiaRef.current.lastX) / dt * 16
      inertiaRef.current.vy = (sy - inertiaRef.current.lastY) / dt * 16
      inertiaRef.current.lastX = sx
      inertiaRef.current.lastY = sy
      inertiaRef.current.lastTime = now
      setOffset({ x: ia.startOffset.x + dx, y: ia.startOffset.y + dy })
    } else if (ia.isDragging && ia.originalStrokes.size > 0) {
      const dx = pt.x - ia.dragStart.x
      const dy = pt.y - ia.dragStart.y
      setStrokes(prev => prev.map(s => {
        const orig = ia.originalStrokes.get(s.id)
        if (!orig) return s
        return { ...s, x: orig.x + dx, y: orig.y + dy }
      }))
    } else if (ia.isResizing && ia.originalStroke && ia.resizeHandle) {
      const orig = ia.originalStroke
      const dx = pt.x - ia.resizeOrigin.x
      const dy = pt.y - ia.resizeOrigin.y
      const baseW = orig.width * orig.scaleX
      const baseH = orig.height * orig.scaleY
      let newW = baseW
      let newH = baseH
      let newX = orig.x
      let newY = orig.y

      const handle = ia.resizeHandle
      if (handle.includes('e')) newW = Math.max(10, baseW + dx)
      if (handle.includes('w')) { newW = Math.max(10, baseW - dx); newX = orig.x + (baseW - newW) }
      if (handle.includes('s')) newH = Math.max(10, baseH + dy)
      if (handle.includes('n')) { newH = Math.max(10, baseH - dy); newY = orig.y + (baseH - newH) }

      if (ia.shiftPressed && (handle.length === 2 || handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se')) {
        const ratio = Math.max(newW / baseW, newH / baseH)
        newW = baseW * ratio
        newH = baseH * ratio
        if (handle.includes('w')) newX = orig.x + (baseW - newW)
        if (handle.includes('n')) newY = orig.y + (baseH - newH)
      }

      const scaleX = newW / orig.width
      const scaleY = newH / orig.height

      bezierCacheRef.current.clear()
      setStrokes(prev => prev.map(s =>
        s.id === orig.id ? { ...s, x: newX, y: newY, scaleX, scaleY } : s
      ))
    } else if (ia.isRotating && ia.originalStroke) {
      const orig = ia.originalStroke
      const dx = pt.x - ia.rotateOrigin.x
      const dy = pt.y - ia.rotateOrigin.y
      const newRot = Math.atan2(dy, dx) + Math.PI / 2
      bezierCacheRef.current.clear()
      setStrokes(prev => prev.map(s =>
        s.id === orig.id ? { ...s, rotation: newRot } : s
      ))
      setDisplayRotation({ id: orig.id, angle: newRot })
    }
  }, [brushThickness, onMouseMove, screenToCanvas])

  const handleMouseUp = useCallback((_e: React.MouseEvent) => {
    const ia = interactionRef.current

    if (ia.isDrawing) {
      const liveStroke = currentStrokeRef.current
      if (liveStroke && liveStroke.length >= 2) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        liveStroke.forEach(p => {
          if (p.x < minX) minX = p.x
          if (p.y < minY) minY = p.y
          if (p.x > maxX) maxX = p.x
          if (p.y > maxY) maxY = p.y
        })
        const padding = brushThickness * 1.5
        const newStroke: DoodleStroke = {
          id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          points: liveStroke,
          color: brushColor,
          thickness: brushThickness,
          x: minX - padding / 2,
          y: minY - padding / 2,
          width: (maxX - minX) + padding,
          height: (maxY - minY) + padding,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        }
        const normalized = {
          ...newStroke,
          points: newStroke.points.map(p => ({ x: p.x - newStroke.x, y: p.y - newStroke.y })),
        }
        setStrokes(prev => [...prev, normalized])
      }
    }

    if (ia.isPanning) {
      const animateInertia = () => {
        if (Math.abs(inertiaRef.current.vx) < 0.1 && Math.abs(inertiaRef.current.vy) < 0.1) return
        setOffset(prev => ({
          x: prev.x + inertiaRef.current.vx,
          y: prev.y + inertiaRef.current.vy,
        }))
        inertiaRef.current.vx *= 0.92
        inertiaRef.current.vy *= 0.92
        requestAnimationFrame(animateInertia)
      }
      animateInertia()
    }

    if (ia.isRotating) {
      setTimeout(() => setDisplayRotation(null), 600)
    }

    setCurrentStroke(null)
    currentStrokeRef.current = null
    interactionRef.current = {
      isDrawing: false,
      isPanning: false,
      isDragging: false,
      isResizing: false,
      isRotating: false,
      resizeHandle: null,
      startPan: { x: 0, y: 0 },
      startOffset: { x: 0, y: 0 },
      dragStart: { x: 0, y: 0 },
      originalStrokes: new Map(),
      resizeOrigin: { x: 0, y: 0 },
      originalStroke: null,
      rotateOrigin: { x: 0, y: 0 },
      originalRotation: 0,
      shiftPressed: interactionRef.current.shiftPressed,
    }
  }, [brushColor, brushThickness])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, shiftKey: false } as React.MouseEvent
      handleMouseDown(fakeEvent)
    } else if (e.touches.length === 2) {
      e.preventDefault()
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dx = t2.clientX - t1.clientX
      const dy = t2.clientY - t1.clientY
      touchRef.current = {
        distance: Math.sqrt(dx * dx + dy * dy),
        midX: (t1.clientX + t2.clientX) / 2,
        midY: (t1.clientY + t2.clientY) / 2,
      }
      interactionRef.current.isPanning = true
      interactionRef.current.startOffset = { ...offsetRef.current }
    }
  }, [handleMouseDown])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && !touchRef.current) {
      const touch = e.touches[0]
      const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent
      handleMouseMove(fakeEvent)
    } else if (e.touches.length === 2 && touchRef.current) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dx = t2.clientX - t1.clientX
      const dy = t2.clientY - t1.clientY
      const newDist = Math.sqrt(dx * dx + dy * dy)
      const newMidX = (t1.clientX + t2.clientX) / 2
      const newMidY = (t1.clientY + t2.clientY) / 2

      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const mx = newMidX - rect.left
        const my = newMidY - rect.top
        const zRatio = newDist / touchRef.current.distance
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * zRatio))
        const panDx = newMidX - touchRef.current.midX
        const panDy = newMidY - touchRef.current.midY
        const newOx = mx - (mx - offsetRef.current.x) * zRatio + panDx
        const newOy = my - (my - offsetRef.current.y) * zRatio + panDy
        setZoom(newZoom)
        setOffset({ x: newOx, y: newOy })
        onZoomChange(newZoom)
      }
      touchRef.current = { distance: newDist, midX: newMidX, midY: newMidY }
    }
  }, [handleMouseMove, onZoomChange])

  const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
    if (!touchRef.current) {
      const fakeEvent = { clientX: 0, clientY: 0 } as React.MouseEvent
      handleMouseUp(fakeEvent)
    }
    if (_e.touches.length < 2) {
      touchRef.current = null
      interactionRef.current.isPanning = false
    }
    if (_e.touches.length === 0) {
      touchRef.current = null
    }
  }, [handleMouseUp])

  const alignToGrid = useCallback(() => {
    if (selectedIdsRef.current.size === 0) return

    const now = performance.now()
    const newBounces: BounceAnimation[] = []

    bezierCacheRef.current.clear()

    setStrokes(prev => prev.map(s => {
      if (!selectedIdsRef.current.has(s.id)) return s
      const bounds = getTransformedBounds(s)
      const cx = (bounds.minX + bounds.maxX) / 2
      const cy = (bounds.minY + bounds.maxY) / 2
      const targetX = Math.round(cx / GRID_SIZE) * GRID_SIZE
      const targetY = Math.round(cy / GRID_SIZE) * GRID_SIZE
      const dx = targetX - cx
      const dy = targetY - cy

      newBounces.push({
        id: s.id,
        startX: s.x,
        startY: s.y,
        targetX: s.x + dx,
        targetY: s.y + dy,
        startTime: now,
        duration: 500,
      })

      return { ...s, x: s.x + dx, y: s.y + dy }
    }))

    setBounceAnimations(prev => [...prev.filter(b => now - b.startTime < b.duration), ...newBounces])
  }, [getTransformedBounds])

  const getExportBounds = useCallback(() => {
    if (strokesRef.current.length === 0) return { width: 1200, height: 800 }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    strokesRef.current.forEach(s => {
      const b = getTransformedBounds(s)
      if (b.minX < minX) minX = b.minX
      if (b.minY < minY) minY = b.minY
      if (b.maxX > maxX) maxX = b.maxX
      if (b.maxY > maxY) maxY = b.maxY
    })
    const padding = 60
    return {
      width: Math.ceil(maxX - minX + padding * 2),
      height: Math.ceil(maxY - minY + padding * 2),
      offsetX: minX - padding,
      offsetY: minY - padding,
    } as any
  }, [getTransformedBounds])

  useImperativeHandle(ref, () => ({
    alignToGrid,
    exportStrokes: () => strokesRef.current,
    getExportBounds: () => {
      const b = getExportBounds() as any
      return { width: b.width, height: b.height }
    },
  }))

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 40,
        cursor: mode === 'brush' ? 'crosshair' : mode === 'select' ? 'default' : 'grab',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
})

DoodleCanvas.displayName = 'DoodleCanvas'

export default DoodleCanvas
