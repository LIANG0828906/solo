import { useEffect, useRef, useState, useCallback } from 'react'
import {
  GRID_RESOLUTION,
  PathPoint,
  computeContourLevels,
  screenToGrid,
  gridToScreen,
  worldToGrid,
  gridToWorld,
  easeOutCubic,
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
  const animPointsRef = useRef<{ x: number; y: number }[]>([])
  const animTargetRef = useRef<{ x: number; y: number }[]>([])
  const animStartRef = useRef<number>(0)
  const isAnimatingRef = useRef(false)
  const rafRef = useRef<number>(0)

  const getCanvasSize = useCallback(() => {
    if (compact) return { w: 200, h: 150 }
    const container = containerRef.current
    if (!container) return { w: 400, h: 400 }
    return { w: container.clientWidth, h: container.clientHeight }
  }, [compact])

  const drawContours = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const levels = computeContourLevels(amplitude)
      const minH = -amplitude - 2
      const maxH = amplitude + 2

      for (let level of levels) {
        const intensity = Math.floor(((level - minH) / (maxH - minH)) * 255)
        const gray = Math.max(40, Math.min(180, intensity))
        ctx.strokeStyle = `rgb(${gray}, ${gray}, ${gray + 10})`
        ctx.lineWidth = compact ? 0.3 : 0.8

        for (let gy = 0; gy < GRID_RESOLUTION - 1; gy++) {
          for (let gx = 0; gx < GRID_RESOLUTION - 1; gx++) {
            const h00 = heights[gy * GRID_RESOLUTION + gx]
            const h10 = heights[gy * GRID_RESOLUTION + gx + 1]
            const h01 = heights[(gy + 1) * GRID_RESOLUTION + gx]
            const h11 = heights[(gy + 1) * GRID_RESOLUTION + gx + 1]

            const crossings: { x: number; y: number }[] = []

            const checkEdge = (ha: number, hb: number, xa: number, ya: number, xb: number, yb: number) => {
              if ((ha - level) * (hb - level) < 0) {
                const t = (level - ha) / (hb - ha)
                crossings.push({
                  x: xa + t * (xb - xa),
                  y: ya + t * (yb - ya),
                })
              }
            }

            checkEdge(h00, h10, gx, gy, gx + 1, gy)
            checkEdge(h10, h11, gx + 1, gy, gx + 1, gy + 1)
            checkEdge(h11, h01, gx + 1, gy + 1, gx, gy + 1)
            checkEdge(h01, h00, gx, gy + 1, gx, gy)

            if (crossings.length >= 2) {
              const p1 = gridToScreen(crossings[0].x, crossings[0].y, w, h)
              const p2 = gridToScreen(crossings[1].x, crossings[1].y, w, h)
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.stroke()
            }
          }
        }
      }
    },
    [heights, amplitude, compact]
  )

  const drawPath = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const points = isAnimatingRef.current ? animPointsRef.current : animTargetRef.current

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

      points.forEach((gp, i) => {
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
      })
    },
    [compact, hoveredIndex, dragging]
  )

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { w, h } = getCanvasSize()
    canvas.width = w * window.devicePixelRatio
    canvas.height = h * window.devicePixelRatio
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    ctx.fillStyle = '#0f1722'
    ctx.fillRect(0, 0, w, h)

    drawContours(ctx, w, h)

    ctx.strokeStyle = '#2a3b4a'
    ctx.lineWidth = 0.5
    ctx.strokeRect(0, 0, w, h)

    drawPath(ctx, w, h)
  }, [drawContours, drawPath, getCanvasSize])

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return
    isAnimatingRef.current = true
    animStartRef.current = performance.now()

    const step = () => {
      const elapsed = performance.now() - animStartRef.current
      const t = Math.min(1, elapsed / 300)
      const eased = easeOutCubic(t)

      for (let i = 0; i < animPointsRef.current.length; i++) {
        const start = animPointsRef.current[i]
        const target = animTargetRef.current[i]
        if (start && target) {
          animPointsRef.current[i] = {
            x: start.x + (target.x - start.x) * eased,
            y: start.y + (target.y - start.y) * eased,
          }
        }
      }

      render()

      if (t < 1 && isAnimatingRef.current) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        isAnimatingRef.current = false
        animPointsRef.current = [...animTargetRef.current]
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }, [render])

  useEffect(() => {
    const newTargets: { x: number; y: number }[] = pathPoints.map((p) => {
      const g = worldToGrid(p.x, p.z)
      return { x: g.x, y: g.y }
    })

    if (isAnimatingRef.current) {
      cancelAnimationFrame(rafRef.current)
      isAnimatingRef.current = false
    }

    if (animTargetRef.current.length > 0 && animTargetRef.current.length === newTargets.length) {
      animPointsRef.current = animTargetRef.current.map((p) => ({ ...p }))
    } else {
      animPointsRef.current = newTargets.map((p) => ({ ...p }))
    }
    animTargetRef.current = newTargets

    if (pathPoints.length > 0) {
      startAnimation()
    } else {
      animPointsRef.current = []
      animTargetRef.current = []
      render()
    }
  }, [pathPoints, startAnimation, render])

  useEffect(() => {
    render()
  }, [heights, amplitude, render])

  useEffect(() => {
    const onResize = () => render()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [render])

  const findPointAt = useCallback(
    (clientX: number, clientY: number): number => {
      const canvas = canvasRef.current
      if (!canvas) return -1
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      const { w, h } = getCanvasSize()
      const threshold = compact ? 8 : 15

      const points = isAnimatingRef.current ? animPointsRef.current : animTargetRef.current
      for (let i = points.length - 1; i >= 0; i--) {
        const sp = gridToScreen(points[i].x, points[i].y, w, h)
        const dx = x - sp.x
        const dy = y - sp.y
        if (dx * dx + dy * dy <= threshold * threshold) {
          return i
        }
      }
      return -1
    },
    [getCanvasSize, compact]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (compact || dragging) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const { w, h } = getCanvasSize()
      const grid = screenToGrid(x, y, w, h)
      const world = gridToWorld(grid.x, grid.y, heights)
      onAddPoint(world)
    },
    [compact, dragging, heights, getCanvasSize, onAddPoint]
  )

  const handleDoubleClick = useCallback(() => {
    if (compact) return
  }, [compact])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (compact) return
      const idx = findPointAt(e.clientX, e.clientY)
      if (idx >= 0) {
        setDragging({ index: idx, startX: e.clientX, startY: e.clientY })
        e.preventDefault()
      }
    },
    [compact, findPointAt]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (compact) return

      if (dragging) {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
        const { w, h } = getCanvasSize()
        const grid = screenToGrid(x, y, w, h)
        const world = gridToWorld(grid.x, grid.y, heights)

        animTargetRef.current[dragging.index] = { x: grid.x, y: grid.y }
        if (!isAnimatingRef.current) {
          animPointsRef.current[dragging.index] = { x: grid.x, y: grid.y }
        }
        render()
      } else {
        const idx = findPointAt(e.clientX, e.clientY)
        setHoveredIndex(idx >= 0 ? idx : null)
      }
    },
    [compact, dragging, heights, getCanvasSize, findPointAt, render]
  )

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      const canvas = canvasRef.current
      if (!canvas) {
        setDragging(null)
        return
      }
      const target = animTargetRef.current[dragging.index]
      if (target) {
        const world = gridToWorld(target.x, target.y, heights)
        onUpdatePoint(dragging.index, world)
      }
      setDragging(null)
    }
  }, [dragging, heights, onUpdatePoint])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!compact) onClearPath()
    },
    [compact, onClearPath]
  )

  const cursor = dragging ? 'grabbing' : hoveredIndex !== null ? 'grab' : 'crosshair'

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
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{
          cursor: compact ? 'default' : cursor,
          borderRadius: compact ? '4px' : '8px',
          border: compact ? '1px solid #2a3b4a' : '1px solid #3a4b5a',
          boxShadow: compact ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
        }}
      />
      {!compact && pathPoints.length === 0 && (
        <div
          style={{
            position: 'absolute',
            color: '#5a6b7a',
            fontSize: '14px',
            pointerEvents: 'none',
            textAlign: 'center',
            bottom: '20px',
          }}
        >
          点击添加路径点 · 拖拽调整 · 右键清空
        </div>
      )}
    </div>
  )
}
