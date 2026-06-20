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
  const [, setAnimatingStrokes] = useState<Set<string>>(new Set())
  const [displayRotation, setDisplayRotation] = useState<{ id: string; angle: number } | null>(null)

  const offsetRef = useRef(offset)
  const zoomRef = useRef(zoom)
  const strokesRef = useRef(strokes)
  const selectedIdsRef = useRef(selectedIds)
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
  })
  const inertiaRef = useRef({ vx: 0, vy: 0, lastX: 0, lastY: 0, lastTime: 0 })
  const touchRef = useRef<{ distance: number; midX: number; midY: number } | null>(null)
  const animationFrameRef = useRef<number>(0)

  useEffect(() => { offsetRef.current = offset }, [offset])
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { strokesRef.current = strokes }, [strokes])
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])

  const screenToCanvas = useCallback((sx: number, sy: number): Point => {
    return {
      x: (sx - offsetRef.current.x) / zoomRef.current,
      y: (sy - offsetRef.current.y) / zoomRef.current,
    }
  }, [])



  const getTransformedBounds = useCallback((stroke: DoodleStroke) => {
    const cx = stroke.x + stroke.width / 2
    const cy = stroke.y + stroke.height / 2
    const cos = Math.cos(stroke.rotation)
    const sin = Math.sin(stroke.rotation)
    const corners = [
      { x: stroke.x, y: stroke.y },
      { x: stroke.x + stroke.width * stroke.scaleX, y: stroke.y },
      { x: stroke.x + stroke.width * stroke.scaleX, y: stroke.y + stroke.height * stroke.scaleY },
      { x: stroke.x, y: stroke.y + stroke.height * stroke.scaleY },
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
    const handleSize = 10 / zoomRef.current
    const { minX, minY, maxX, maxY } = bounds
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2
    const handleDist = 22 / zoomRef.current
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

    if (Math.abs(pt.x - rotateX) <= handleSize * 1.2 && Math.abs(pt.y - rotateY) <= handleSize * 1.2) {
      return 'rotate'
    }
    return null
  }, [getTransformedBounds])

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

    strokesRef.current.forEach(stroke => {
      if (stroke.points.length < 2) return
      ctx.save()
      const cx = stroke.x + stroke.width / 2
      const cy = stroke.y + stroke.height / 2
      ctx.translate(cx, cy)
      ctx.rotate(stroke.rotation)
      ctx.scale(stroke.scaleX, stroke.scaleY)
      ctx.translate(-stroke.width / 2, -stroke.height / 2)

      ctx.strokeStyle = stroke.color
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const pts = stroke.points
      ctx.lineWidth = stroke.thickness
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)

      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1]
        const p1 = pts[i]
        const cpx = (p0.x + p1.x) / 2
        const cpy = (p0.y + p1.y) / 2
        ctx.quadraticCurveTo(p0.x, p0.y, cpx, cpy)
      }
      if (pts.length >= 2) {
        const last = pts[pts.length - 1]
        ctx.lineTo(last.x, last.y)
      }
      ctx.stroke()

      ctx.restore()
    })

    if (currentStroke && currentStroke.length >= 2) {
      ctx.strokeStyle = brushColor
      ctx.lineWidth = brushThickness
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const pts = currentStroke
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1]
        const p1 = pts[i]
        const cpx = (p0.x + p1.x) / 2
        const cpy = (p0.y + p1.y) / 2
        ctx.quadraticCurveTo(p0.x, p0.y, cpx, cpy)
      }
      if (pts.length >= 2) {
        const last = pts[pts.length - 1]
        ctx.lineTo(last.x, last.y)
      }
      ctx.stroke()
    }

    selectedIdsRef.current.forEach(id => {
      const stroke = strokesRef.current.find(s => s.id === id)
      if (!stroke) return
      const bounds = getTransformedBounds(stroke)
      const { minX, minY, maxX, maxY, cx, cy } = bounds
      const bw = maxX - minX
      const bh = maxY - minY

      ctx.save()
      ctx.strokeStyle = '#3498db'
      ctx.lineWidth = 1.5 / z
      ctx.setLineDash([6 / z, 4 / z])
      ctx.strokeRect(minX, minY, bw, bh)

      ctx.setLineDash([])
      ctx.fillStyle = 'white'
      ctx.strokeStyle = '#3498db'
      const handleSize = 8 / z
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

      const handleDist = 22 / z
      const rotateX = (minX + maxX) / 2
      const rotateY = minY - handleDist
      ctx.beginPath()
      ctx.arc(rotateX, rotateY, 7 / z, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#3498db'
      ctx.stroke()

      ctx.beginPath()
      ctx.setLineDash([3 / z, 3 / z])
      ctx.moveTo(rotateX, rotateY + 7 / z)
      ctx.lineTo(rotateX, minY)
      ctx.stroke()
      ctx.setLineDash([])

      if (displayRotation && displayRotation.id === id) {
        const angleText = `${Math.round((displayRotation.angle * 180) / Math.PI)}°`
        ctx.font = `${12 / z}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(138, 127, 110, 0.9)'
        const tw = ctx.measureText(angleText).width
        ctx.fillStyle = 'rgba(250, 243, 224, 0.9)'
        const padX = 8 / z
        const padY = 4 / z
        ctx.fillRect(cx - tw / 2 - padX, cy - 10 / z - padY, tw + padX * 2, 20 / z + padY * 2)
        ctx.fillStyle = '#6b5f4e'
        ctx.fillText(angleText, cx, cy + 4 / z)
      }

      ctx.restore()
    })

    ctx.restore()
  }, [brushColor, brushThickness, currentStroke, displayRotation, getTransformedBounds])

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
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.size > 0) {
        setStrokes(prev => prev.filter(s => !selectedIdsRef.current.has(s.id)))
        setSelectedIds(new Set())
        onSelectionChange(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
      interactionRef.current.isDrawing = true
      setCurrentStroke([addJitter(pt, 0.3)])
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
          interactionRef.current.originalStroke = hitStroke
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
        if (e.shiftKey) {
          const newSet = new Set(selectedIdsRef.current)
          if (newSet.has(clickedStroke.id)) newSet.delete(clickedStroke.id)
          else newSet.add(clickedStroke.id)
          setSelectedIds(newSet)
          onSelectionChange(newSet.size)
        } else if (!selectedIdsRef.current.has(clickedStroke.id)) {
          const newSet = new Set([clickedStroke.id])
          setSelectedIds(newSet)
          onSelectionChange(1)
        }

        if (selectedIdsRef.current.size > 0 || (e.shiftKey && false)) {
          interactionRef.current.isDragging = true
          interactionRef.current.dragStart = { x: pt.x, y: pt.y }
          const originals = new Map<string, { x: number; y: number }>()
          selectedIdsRef.current.forEach(id => {
            const s = strokesRef.current.find(st => st.id === id)
            if (s) originals.set(id, { x: s.x, y: s.y })
          })
          interactionRef.current.originalStrokes = originals
        }
      } else {
        if (!e.shiftKey) {
          setSelectedIds(new Set())
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

    if (ia.isDrawing && currentStroke) {
      const jittered = addJitter(pt, 0.4)
      setCurrentStroke(prev => prev ? [...prev, jittered] : [jittered])
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

      if (ia.resizeHandle.includes('e')) newW = Math.max(10, baseW + dx)
      if (ia.resizeHandle.includes('w')) { newW = Math.max(10, baseW - dx); newX = orig.x + (baseW - newW) }
      if (ia.resizeHandle.includes('s')) newH = Math.max(10, baseH + dy)
      if (ia.resizeHandle.includes('n')) { newH = Math.max(10, baseH - dy); newY = orig.y + (baseH - newH) }

      if (e.shiftKey || ia.resizeHandle.length === 1) {
        if (ia.resizeHandle.length === 2) {
          const ratio = Math.max(newW / baseW, newH / baseH)
          newW = baseW * ratio
          newH = baseH * ratio
          if (ia.resizeHandle.includes('w')) newX = orig.x + (baseW - newW)
          if (ia.resizeHandle.includes('n')) newY = orig.y + (baseH - newH)
        }
      }

      const scaleX = newW / orig.width
      const scaleY = newH / orig.height

      setStrokes(prev => prev.map(s =>
        s.id === orig.id ? { ...s, x: newX, y: newY, scaleX, scaleY } : s
      ))
    } else if (ia.isRotating && ia.originalStroke) {
      const angle = Math.atan2(pt.y - ia.rotateOrigin.y, pt.x - ia.rotateOrigin.x) + Math.PI / 2
      const newRot = ia.originalRotation + (angle - ia.originalRotation)
      setStrokes(prev => prev.map(s =>
        s.id === ia.originalStroke!.id ? { ...s, rotation: newRot } : s
      ))
      setDisplayRotation({ id: ia.originalStroke.id, angle: newRot })
    }
  }, [currentStroke, onMouseMove, screenToCanvas])

  const handleMouseUp = useCallback((_e: React.MouseEvent) => {
    const ia = interactionRef.current

    if (ia.isDrawing && currentStroke && currentStroke.length >= 2) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      currentStroke.forEach(p => {
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x
        if (p.y > maxY) maxY = p.y
      })
      const padding = brushThickness
      const newStroke: DoodleStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        points: currentStroke,
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
      setTimeout(() => setDisplayRotation(null), 500)
    }

    setCurrentStroke(null)
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
    }
  }, [brushColor, brushThickness, currentStroke])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent
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

      const ratio = newDist / touchRef.current.distance
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * ratio))
      const zRatio = newZoom / zoomRef.current
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const mx = touchRef.current.midX - rect.left
        const my = touchRef.current.midY - rect.top
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
    const animating = new Set<string>()
    setStrokes(prev => prev.map(s => {
      if (!selectedIdsRef.current.has(s.id)) return s
      const bounds = getTransformedBounds(s)
      const cx = (bounds.minX + bounds.maxX) / 2
      const cy = (bounds.minY + bounds.maxY) / 2
      const targetX = Math.round(cx / GRID_SIZE) * GRID_SIZE
      const targetY = Math.round(cy / GRID_SIZE) * GRID_SIZE
      const dx = targetX - cx
      const dy = targetY - cy
      animating.add(s.id)
      return { ...s, x: s.x + dx, y: s.y + dy }
    }))
    setAnimatingStrokes(animating)
    setTimeout(() => setAnimatingStrokes(new Set()), 600)
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
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <style>{`
        @keyframes gridPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
})

DoodleCanvas.displayName = 'DoodleCanvas'

export default DoodleCanvas
