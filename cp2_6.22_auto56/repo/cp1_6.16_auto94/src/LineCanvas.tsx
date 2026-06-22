import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface Point {
  x: number
  y: number
  timestamp: number
}

export interface LineData {
  id: string
  points: Point[]
  color: string
  widths: number[]
  startTime: number
  endTime: number
}

interface LineCanvasProps {
  lines: LineData[]
  onLineComplete: (line: LineData) => void
  isReplaying: boolean
  onReplayComplete: () => void
  colorPool: string[]
  currentColorIndex: number
}

export interface LineCanvasHandle {
  clearCanvas: () => void
  startReplay: () => void
  stopReplay: () => void
}

const PARTICLE_COUNT = 20
const PARTICLE_RADIUS = 15
const MIN_LINE_WIDTH = 2
const MAX_LINE_WIDTH = 10
const GLOW_DURATION = 300

const LineCanvas = forwardRef<LineCanvasHandle, LineCanvasProps>((
  { lines, onLineComplete, isReplaying, onReplayComplete, colorPool, currentColorIndex },
  ref
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const currentLine = useRef<LineData | null>(null)
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([])
  const animationFrameId = useRef<number | null>(null)
  const replayState = useRef<{
    startTime: number
    lineIndex: number
    pointIndex: number
    lineStartTimes: number[]
    glowStartTimes: Map<string, number>
  }>({
    startTime: 0,
    lineIndex: 0,
    pointIndex: 0,
    lineStartTimes: [],
    glowStartTimes: new Map(),
  })
  const dpr = useRef(1)
  const lastMousePos = useRef<{ x: number; y: number } | null>(null)
  const lastDrawTime = useRef(0)

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
    startReplay: () => {
      if (lines.length === 0) return
      const state = replayState.current
      state.startTime = performance.now()
      state.lineIndex = 0
      state.pointIndex = 0
      state.glowStartTimes = new Map()
      
      let cumulativeTime = 0
      state.lineStartTimes = lines.map(line => {
        const start = cumulativeTime
        cumulativeTime += line.endTime - line.startTime
        return start
      })

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    },
    stopReplay: () => {
      replayState.current.lineIndex = 0
      replayState.current.pointIndex = 0
    },
  }))

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    dpr.current = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr.current
    canvas.height = rect.height * dpr.current
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr.current, dpr.current)
    }
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [resizeCanvas])

  const calculateLineWidth = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const dt = p2.timestamp - p1.timestamp
    if (dt === 0) return MAX_LINE_WIDTH
    const speed = distance / dt
    const normalizedSpeed = Math.min(speed / 5, 1)
    return MAX_LINE_WIDTH - normalizedSpeed * (MAX_LINE_WIDTH - MIN_LINE_WIDTH)
  }

  const initParticles = (x: number, y: number) => {
    particles.current = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5
      const speed = Math.random() * 2 + 1
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
      })
    }
  }

  const updateParticles = () => {
    particles.current = particles.current.filter(p => {
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.05
      return p.life > 0
    })
    while (particles.current.length < PARTICLE_COUNT) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * PARTICLE_RADIUS
      const lastPoint = currentLine.current?.points[currentLine.current.points.length - 1]
      if (!lastPoint) break
      particles.current.push({
        x: lastPoint.x + Math.cos(angle) * radius,
        y: lastPoint.y + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: Math.random() * 0.3,
      })
    }
  }

  const drawParticles = (ctx: CanvasRenderingContext2D, color: string) => {
    for (const p of particles.current) {
      const alpha = p.life * 0.3
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(color, alpha)
      ctx.fill()
    }
  }

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const sampleQuadraticBezier = (
    p0: Point,
    p1: Point,
    control: { x: number; y: number },
    steps: number
  ): { x: number; y: number }[] => {
    const result: { x: number; y: number }[] = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const mt = 1 - t
      const x = mt * mt * p0.x + 2 * mt * t * control.x + t * t * p1.x
      const y = mt * mt * p0.y + 2 * mt * t * control.y + t * t * p1.y
      result.push({ x, y })
    }
    return result
  }

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    widths: number[],
    color: string,
    endIndex?: number
  ) => {
    const len = endIndex !== undefined ? Math.min(endIndex + 1, points.length) : points.length
    if (len < 2) {
      if (len === 1) {
        const w = widths[0] || MIN_LINE_WIDTH
        ctx.beginPath()
        ctx.fillStyle = color
        ctx.arc(points[0].x, points[0].y, w / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      return
    }

    ctx.fillStyle = color

    const w0 = widths[0] || MIN_LINE_WIDTH
    ctx.beginPath()
    ctx.arc(points[0].x, points[0].y, w0 / 2, 0, Math.PI * 2)
    ctx.fill()

    for (let i = 1; i < len; i++) {
      const p0 = points[i - 1]
      const p1 = points[i]
      const width0 = widths[i - 1] || MIN_LINE_WIDTH
      const width1 = widths[i] || MIN_LINE_WIDTH

      const dx = p1.x - p0.x
      const dy = p1.y - p0.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 0.5) continue

      const steps = Math.max(2, Math.ceil(dist / 1.5))

      let controlX: number, controlY: number
      if (i === 1 && len === 2) {
        controlX = (p0.x + p1.x) / 2
        controlY = (p0.y + p1.y) / 2
      } else if (i < len - 1 && i < points.length - 1) {
        const p2 = points[i + 1]
        controlX = p1.x + (p0.x - p2.x) * 0.2
        controlY = p1.y + (p0.y - p2.y) * 0.2
      } else {
        controlX = p1.x
        controlY = p1.y
      }

      const samples = sampleQuadraticBezier(p0, p1, { x: controlX, y: controlY }, steps)

      for (let j = 1; j <= steps; j++) {
        const t = j / steps
        const w = width0 + (width1 - width0) * t
        const s = samples[j]
        ctx.beginPath()
        ctx.arc(s.x, s.y, w / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const drawGlow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    progress: number
  ) => {
    const maxRadius = 50
    const radius = maxRadius * progress
    const alpha = 0.5 * (1 - progress)

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, hexToRgba(color, alpha))
    gradient.addColorStop(1, hexToRgba(color, 0))

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }

  const getCanvasPoint = (e: React.MouseEvent | MouseEvent): Point | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: performance.now(),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isReplaying) return
    const point = getCanvasPoint(e)
    if (!point) return

    isDrawing.current = true
    const color = colorPool[currentColorIndex % colorPool.length]
    currentLine.current = {
      id: uuidv4(),
      points: [point],
      color,
      widths: [MIN_LINE_WIDTH],
      startTime: point.timestamp,
      endTime: point.timestamp,
    }
    lastMousePos.current = { x: point.x, y: point.y }
    initParticles(point.x, point.y)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current || !currentLine.current) return
    const point = getCanvasPoint(e)
    if (!point) return

    const points = currentLine.current.points
    const lastPoint = points[points.length - 1]
    const dx = point.x - lastPoint.x
    const dy = point.y - lastPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 3) return

    const width = calculateLineWidth(lastPoint, point)
    currentLine.current.points.push(point)
    currentLine.current.widths.push(width)
    currentLine.current.endTime = point.timestamp
    lastMousePos.current = { x: point.x, y: point.y }
  }

  const handleMouseUp = () => {
    if (!isDrawing.current || !currentLine.current) return
    isDrawing.current = false

    if (currentLine.current.points.length >= 2) {
      onLineComplete(currentLine.current)
    }
    currentLine.current = null
    particles.current = []
  }

  const handleMouseLeave = () => {
    if (isDrawing.current) {
      handleMouseUp()
    }
  }

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)

    if (isReplaying) {
      const state = replayState.current
      const now = performance.now()
      const elapsed = now - state.startTime

      let totalDrawn = 0

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineStartTime = state.lineStartTimes[i]
        const lineDuration = line.endTime - line.startTime
        const lineElapsed = elapsed - lineStartTime

        if (lineElapsed < 0) break

        if (lineElapsed >= lineDuration) {
          drawLine(ctx, line.points, line.widths, line.color)
          totalDrawn++
        } else {
          let pointIdx = 0
          for (let j = 1; j < line.points.length; j++) {
            const pointTime = line.points[j].timestamp - line.startTime
            if (pointTime <= lineElapsed) {
              pointIdx = j
            } else {
              break
            }
          }
          drawLine(ctx, line.points, line.widths, line.color, pointIdx)

          if (!state.glowStartTimes.has(line.id) && pointIdx > 0) {
            state.glowStartTimes.set(line.id, now)
          }

          const glowStartTime = state.glowStartTimes.get(line.id)
          if (glowStartTime !== undefined) {
            const glowElapsed = now - glowStartTime
            if (glowElapsed < GLOW_DURATION) {
              const glowProgress = glowElapsed / GLOW_DURATION
              const glowPoint = line.points[Math.min(pointIdx, line.points.length - 1)]
              drawGlow(ctx, glowPoint.x, glowPoint.y, line.color, glowProgress)
            }
          }

          break
        }
      }

      if (totalDrawn >= lines.length) {
        onReplayComplete()
      }
    } else {
      for (const line of lines) {
        drawLine(ctx, line.points, line.widths, line.color)
      }

      if (currentLine.current && isDrawing.current) {
        drawLine(ctx, currentLine.current.points, currentLine.current.widths, currentLine.current.color)
        updateParticles()
        drawParticles(ctx, currentLine.current.color)
      }
    }

    animationFrameId.current = requestAnimationFrame(render)
  }, [lines, isReplaying, onReplayComplete])

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(render)
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [render])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: isReplaying ? 'default' : 'crosshair',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  )
})

LineCanvas.displayName = 'LineCanvas'

export default LineCanvas
