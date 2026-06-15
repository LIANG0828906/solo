import { useEffect, useRef, useState, useCallback } from 'react'
import {
  GRID_RESOLUTION,
  PathPoint,
  computeContourLevels,
  ContourLevel,
  screenToGrid,
  gridToScreen,
  worldToGrid,
  gridToWorld,
  easeOutCubic,
  GRID_SIZE,
} from './api'

interface PathPlannerProps {
  heights: Float32Array
  amplitude: number
  pathPoints: PathPoint[]
  onAddPoint: (point: PathPoint) => void
  onUpdatePoint: (index: number, point: PathPoint) => void
  onClearPath: () => void
  compact?: boolean
}

interface DraggingState {
  index: number
  startX: number
  startY: number
}

interface AnimState {
  startPoints: { x: number; y: number }[]
  targetPoints: { x: number; y: number }[]
  startTime: number
  duration: number
  durationMs: number
}

export default function PathPlanner({
  heights,
  amplitude,
  pathPoints,
  onAddPoint,
  onUpdatePoint,
  onClearPath,
  compact = false,
}: PathPlannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<DraggingState | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const animRef = useRef<AnimState | null>(null)
  const animRafRef = useRef<number>(0)
  const displayPointsRef = useRef<{ x: number; y: number }[]>([])
  const targetPointsRef = useRef<{ x: number; y: number }[]>([])
  const dragPendingRef = useRef<{ index: number; target: { x: number; y: number } } | null>(null)
  const dragRafRef = useRef<number>(0)
  const renderedSizeRef = useRef({ w: 0, h: 0 })

  const getCanvasSize = useCallback(() => {
    if (compact) return { w: 200, h: 150 }
    const container = containerRef.current
    if (!container) return { w: 400, h: 400 }
    return { w: container.clientWidth, h: container.clientHeight }
  }, [compact])

  const drawContours = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      try {
        const levels: ContourLevel[] = computeContourLevels(amplitude)
        const safeHeights = heights && heights.length > 0 ? heights : new Float32Array(GRID_RESOLUTION * GRID_RESOLUTION)
        const safeRes = GRID_RESOLUTION

        for (let li = 0; li < levels.length; li++) {
          const level = levels[li]
          ctx.strokeStyle = level.color
          ctx.lineWidth = compact ? 0.4 : 0.9
          ctx.lineCap = 'round'

          ctx.beginPath()
          let hasSegments = false

          for (let gy = 0; gy < safeRes - 1; gy++) {
            for (let gx = 0; gx < safeRes - 1; gx++) {
              const idx00 = gy * safeRes + gx
              const h00 = safeHeights[idx00] || 0
              const h10 = safeHeights[idx00 + 1] || 0
              const h01 = safeHeights[idx00 + safeRes] || 0
              const h11 = safeHeights[idx00 + safeRes + 1] || 0
              const lh = level.height

              if ((h00 < lh) !== (h10 < lh)) {
                const t = (lh - h00) / (h10 - h00)
                const p = gridToScreen(gx + t, gy, w, h)
                if (!hasSegments) { ctx.moveTo(p.x, p.y); hasSegments = true }
                else ctx.lineTo(p.x, p.y)
              }
              if ((h10 < lh) !== (h11 < lh)) {
                const t = (lh - h10) / (h11 - h10)
                const p = gridToScreen(gx + 1, gy + t, w, h)
                if (!hasSegments) { ctx.moveTo(p.x, p.y); hasSegments = true }
                else ctx.lineTo(p.x, p.y)
              }
              if ((h11 < lh) !== (h01 < lh)) {
                const t = (lh - h11) / (h01 - h11)
                const p = gridToScreen(gx + (1 - t), gy + 1, w, h)
                if (!hasSegments) { ctx.moveTo(p.x, p.y); hasSegments = true }
                else ctx.lineTo(p.x, p.y)
              }
              if ((h01 < lh) !== (h00 < lh)) {
                const t = (lh - h01) / (h00 - h01)
                const p = gridToScreen(gx, gy + (1 - t), w, h)
                if (!hasSegments) { ctx.moveTo(p.x, p.y); hasSegments = true }
                else ctx.lineTo(p.x, p.y)
              }
            }
          }
          ctx.stroke()
        }
      } catch (e) {
        console.error('drawContours error:', e)
      }
    },
    [heights, amplitude, compact]
  )

  const drawPath = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      try {
        const points = displayPointsRef.current
        if (!points) return

        if (points.length > 1) {
          ctx.strokeStyle = '#ff7b00'
          ctx.lineWidth = compact ? 1.5 : 2.5
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          const first = gridToScreen(points[0].x, points[0].y, w, h)
          ctx.moveTo(first.x, first.y)
          for (let i = 1; i < points.length; i++) {
            const p = gridToScreen(points[i].x, points[i].y, w, h)
            ctx.lineTo(p.x, p.y)
          }
          ctx.stroke()
        }

        for (let i = 0; i < points.length; i++) {
          const gp = points[i]
          if (!gp) continue
          const sp = gridToScreen(gp.x, gp.y, w, h)
          const radius = compact ? 3 : 6
          const isHovered = hoveredIndex === i
          const isDragging = dragging?.index === i

          ctx.beginPath()
          ctx.arc(sp.x, sp.y, radius + 1, 0, Math.PI * 2)
          ctx.fillStyle = '#ff7b00'
          ctx.fill()

          ctx.beginPath()
          ctx.arc(sp.x, sp.y, radius, 0, Math.PI * 2)
          ctx.fillStyle = isHovered || isDragging ? '#ffe0b3' : '#ffffff'
          ctx.fill()

          if (!compact) {
            ctx.fillStyle = '#1a2332'
            ctx.font = `bold ${radius}px sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(String(i + 1), sp.x, sp.y)
          }
        }
      } catch (e) {
        console.error('drawPath error:', e)
      }
    },
    [compact, hoveredIndex, dragging]
  )

  const render = useCallback(() => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { w, h } = getCanvasSize()
      if (w <= 0 || h <= 0) return

      renderedSizeRef.current = { w, h }
      canvas.width = w * window.devicePixelRatio
      canvas.height = h * window.devicePixelRatio
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

      ctx.fillStyle = '#0f1722'
      ctx.fillRect(0, 0, w, h)

      drawContours(ctx, w, h)

      ctx.strokeStyle = '#2a3b4a'
      ctx.lineWidth = 0.5
      ctx.strokeRect(0, 0, w, h)

      drawPath(ctx, w, h)
    } catch (e) {
      console.error('PathPlanner render error:', e)
    }
  }, [drawContours, drawPath, getCanvasSize])

  const cancelAnim = useCallback(() => {
    if (animRafRef.current) {
      cancelAnimationFrame(animRafRef.current)
      animRafRef.current = 0
    }
    animRef.current = null
  }, [])

  const startPointsAnim = useCallback((from: { x: number; y: number }[], to: { x: number; y: number }[], duration = 300) => {
    try {
      cancelAnim()

      if (from.length === 0 || to.length === 0) {
        displayPointsRef.current = [...to]
        targetPointsRef.current = [...to]
        render()
        return
      }

      animRef.current = {
        startPoints: from.map(p => ({ ...p })),
        targetPoints: to.map(p => ({ ...p })),
        startTime: performance.now(),
        duration,
        durationMs: duration,
      }

      const step = () => {
        const anim = animRef.current
        if (!anim) return

        const now = performance.now()
        const t = Math.min(1, (now - anim.startTime) / anim.durationMs)
        const eased = easeOutCubic(t)
        const count = Math.min(anim.startPoints.length, anim.targetPoints.length)

        for (let i = 0; i < count; i++) {
          const s = anim.startPoints[i]
          const e2 = anim.targetPoints[i]
          displayPointsRef.current[i] = {
            x: s.x + (e2.x - s.x) * eased,
            y: s.y + (e2.y - s.y) * eased,
          }
        }

        render()

        if (t < 1) {
          animRafRef.current = requestAnimationFrame(step)
        } else {
          displayPointsRef.current = [...anim.targetPoints]
          targetPointsRef.current = [...anim.targetPoints]
          animRef.current = null
          animRafRef.current = 0
        }
      }

      animRafRef.current = requestAnimationFrame(step)
    } catch (e) {
      console.error('startPointsAnim error:', e)
    }
  }, [cancelAnim, render])

  const cancelDragAnim = useCallback(() => {
    if (dragRafRef.current) {
      cancelAnimationFrame(dragRafRef.current)
      dragRafRef.current = 0
    }
  }, [])

  const applyPendingDrag = useCallback(() => {
    try {
      const pending = dragPendingRef.current
      dragPendingRef.current = null

      if (!pending) return

      const { index, target } = pending

      if (index >= 0 && index < targetPointsRef.current.length) {
        targetPointsRef.current[index] = { ...target }
        if (!animRef.current) {
          displayPointsRef.current[index] = { ...target }
        }
      }

      render()

      if (dragging && dragging.index === index) {
        dragRafRef.current = requestAnimationFrame(applyPendingDrag)
      } else {
        dragRafRef.current = 0
      }
    } catch (e) {
      console.error('applyPendingDrag error:', e)
    }
  }, [dragging, render])

  useEffect(() => {
    try {
      const newTargets: { x: number; y: number }[] = []
      for (let i = 0; i < pathPoints.length; i++) {
        const p = pathPoints[i]
        if (p && typeof p.x === 'number' && isFinite(p.x)) {
          const g = worldToGrid(p.x, p.z)
          newTargets.push({ x: g.x, y: g.y })
        }
      }

      cancelAnim()
      cancelDragAnim()

      const from = targetPointsRef.current.length > 0 && targetPointsRef.current.length === newTargets.length
        ? [...targetPointsRef.current]
        : newTargets.length > 0
        ? newTargets.map(p => ({ ...p }))
        : []

      targetPointsRef.current = newTargets.map(p => ({ ...p }))

      if (from.length > 0) {
        startPointsAnim(from, newTargets, 250)
      } else {
        displayPointsRef.current = [...newTargets]
        render()
      }
    } catch (e) {
      console.error('pathPoints effect error:', e)
    }
  }, [pathPoints, cancelAnim, cancelDragAnim, startPointsAnim, render])

  useEffect(() => {
    try {
      render()
    } catch (_) { /* ignore */ }
  }, [heights, amplitude, render])

  useEffect(() => {
    const onResize = () => {
      try { render() } catch (_) { /* ignore */ }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [render])

  useEffect(() => {
    return () => {
      cancelAnim()
      cancelDragAnim()
    }
  }, [cancelAnim, cancelDragAnim])

  const findPointAt = useCallback(
    (clientX: number, clientY: number): number => {
      try {
        const canvas = canvasRef.current
        if (!canvas) return -1
        const rect = canvas.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top
        const { w, h } = renderedSizeRef.current
        const threshold = compact ? 10 : 18
        const thresholdSq = threshold * threshold

        const points = displayPointsRef.current
        for (let i = points.length - 1; i >= 0; i--) {
          const gp = points[i]
          if (!gp) continue
          const sp = gridToScreen(gp.x, gp.y, w, h)
          const dx = x - sp.x
          const dy = y - sp.y
          if (dx * dx + dy * dy <= thresholdSq) {
            return i
          }
        }
        return -1
      } catch (e) {
        console.error('findPointAt error:', e)
        return -1
      }
    },
    [compact]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (compact) return
      if (dragging) return
      try {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const { w, h } = renderedSizeRef.current
        if (w <= 0 || h <= 0) return
        const grid = screenToGrid(x, y, w, h)
        const world = gridToWorld(grid.x, grid.y, heights)
        if (world && typeof world.x === 'number' && isFinite(world.x)) {
          onAddPoint(world)
        }
      } catch (e) {
        console.error('handleClick error:', e)
      }
    },
    [compact, dragging, heights, onAddPoint]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (compact) return
      try {
        if (e.button !== 0) return
        const idx = findPointAt(e.clientX, e.clientY)
        if (idx >= 0 && displayPointsRef.current[idx]) {
          setDragging({ index: idx, startX: e.clientX, startY: e.clientY })
          e.preventDefault()
        }
      } catch (_) { /* ignore */ }
    },
    [compact, findPointAt]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (compact) return

      if (dragging) {
        try {
          const canvas = canvasRef.current
          if (!canvas) return
          const rect = canvas.getBoundingClientRect()
          const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
          const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
          const { w, h } = renderedSizeRef.current
          const grid = screenToGrid(x, y, w, h)

          dragPendingRef.current = {
            index: dragging.index,
            target: { x: grid.x, y: grid.y },
          }

          if (!dragRafRef.current) {
            dragRafRef.current = requestAnimationFrame(applyPendingDrag)
          }
        } catch (_) { /* ignore */ }
      } else {
        try {
          const idx = findPointAt(e.clientX, e.clientY)
          if (idx !== hoveredIndex) {
            setHoveredIndex(idx >= 0 ? idx : null)
          }
        } catch (_) { /* ignore */ }
      }
    },
    [compact, dragging, hoveredIndex, findPointAt, applyPendingDrag]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return
      try {
        const pending = dragPendingRef.current
        const targetIdx = pending && pending.index === dragging.index
          ? pending.target
          : targetPointsRef.current[dragging.index]

        setDragging(null)
        dragPendingRef.current = null

        if (targetIdx && heights) {
          const world = gridToWorld(targetIdx.x, targetIdx.y, heights)
          if (world && typeof world.x === 'number' && isFinite(world.x)) {
            onUpdatePoint(dragging.index, world)
          }
        }

        if (hoveredIndex !== null) {
          const idx = findPointAt(e.clientX, e.clientY)
          setHoveredIndex(idx >= 0 ? idx : null)
        }
      } catch (e) {
        console.error('handleMouseUp error:', e)
        setDragging(null)
      }
    },
    [dragging, heights, hoveredIndex, findPointAt, onUpdatePoint]
  )

  const handleMouseLeave = useCallback(() => {
    try {
      setDragging(null)
      dragPendingRef.current = null
      setHoveredIndex(null)
    } catch (_) { /* ignore */ }
  }, [])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      try {
        e.preventDefault()
        if (!compact) {
          onClearPath()
        }
      } catch (_) { /* ignore */ }
    },
    [compact, onClearPath]
  )

  let cursor: string
  if (compact) {
    cursor = 'default'
  } else if (dragging) {
    cursor = 'grabbing'
  } else if (hoveredIndex !== null) {
    cursor = 'grab'
  } else {
    cursor = 'crosshair'
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        style={{
          cursor,
          borderRadius: compact ? '4px' : '8px',
          border: compact ? '1px solid #2a3b4a' : '1px solid #3a4b5a',
          boxShadow: compact ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
          userSelect: 'none',
          touchAction: 'none',
        }}
      />
      {!compact && displayPointsRef.current.length === 0 && (
        <div
          style={{
            position: 'absolute',
            color: '#5a6b7a',
            fontSize: '14px',
            pointerEvents: 'none',
            textAlign: 'center',
            bottom: '20px',
            left: 0,
            right: 0,
          }}
        >
          点击添加路径点 · 拖拽调整 · 右键清空
        </div>
      )}
    </div>
  )
}
