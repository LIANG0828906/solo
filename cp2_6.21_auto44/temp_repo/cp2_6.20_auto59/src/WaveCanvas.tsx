import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import type { PathPoint } from './types'

export interface WaveCanvasHandle {
  clearCanvas: () => void
  paintFrame: (waveformData: Float32Array) => void
  drawPath: (points: PathPoint[]) => void
  drawPitchIndicator: (x: number, y: number, pitch: string) => void
  setCanvasSize: (width: number, height: number) => void
}

interface WaveCanvasProps {
  width: number
  height: number
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseUp?: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLCanvasElement>) => void
}

export const WaveCanvas = forwardRef<WaveCanvasHandle, WaveCanvasProps>(function WaveCanvas({
  width,
  height,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasSizeRef = useRef({ width, height })
  const pathPointsRef = useRef<PathPoint[]>([])
  const indicatorRef = useRef<{ x: number; y: number; pitch: string; visible: boolean }>({ x: 0, y: 0, pitch: '', visible: false })

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pathPointsRef.current = []
    },
    paintFrame: (waveformData: Float32Array) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { width: w, height: h } = canvasSizeRef.current
      ctx.fillStyle = '#0b0e14'
      ctx.fillRect(0, 0, w, h)
      drawGrid(ctx, w, h)
      if (waveformData.length > 0) {
        drawWaveform(ctx, waveformData, w, h)
      }
      drawPath(ctx, pathPointsRef.current, w, h)
      if (indicatorRef.current.visible) {
        drawPitchIndicator(ctx, indicatorRef.current.x, indicatorRef.current.y, indicatorRef.current.pitch)
      }
    },
    drawPath: (points: PathPoint[]) => {
      pathPointsRef.current = points
    },
    drawPitchIndicator: (x: number, y: number, pitch: string) => {
      indicatorRef.current = { x, y, pitch, visible: true }
    },
    setCanvasSize: (w: number, h: number) => {
      canvasSizeRef.current = { width: w, height: h }
      if (canvasRef.current) {
        canvasRef.current.width = w
        canvasRef.current.height = h
      }
    }
  }))

  useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  canvas.width = width
  canvas.height = height
  canvasSizeRef.current = { width, height }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#0b0e14'
  ctx.fillRect(0, 0, width, height)
  drawGrid(ctx, width, height)
}, [width, height])

  return (
    <canvas
      ref={canvasRef}
      className="wave-canvas"
      style={{
        display: 'block',
        borderRadius: '16px',
        cursor: 'crosshair'
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    />
  )
})

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.strokeStyle = 'rgba(42, 58, 90, 0.3)'
  ctx.lineWidth = 1
  const gridSize = 40
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(138, 180, 248, 0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.stroke()
}

function drawWaveform(ctx: CanvasRenderingContext2D, data: Float32Array, width: number, height: number): void {
  const centerY = height / 2
  const amplitude = height * 0.35
  ctx.beginPath()
  ctx.strokeStyle = '#8ab4f8'
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(138, 180, 248, 0.5)'
  ctx.shadowBlur = 10
  const step = width / data.length
  for (let i = 0; i < data.length; i++) {
    const x = i * step
    const y = centerY + data[i] * amplitude
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(138, 180, 248, 0.3)'
  for (let i = 0; i < data.length; i++) {
    const x = i * step
    const y = centerY + data[i] * amplitude
    if (Math.abs(data[i]) > 0.8) {
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

function drawPath(ctx: CanvasRenderingContext2D, points: PathPoint[], width: number, height: number): void {
  if (points.length < 2) return
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.moveTo(points[0].x * width, points[0].y * height)
  for (let i = 1; i < points.length; i++) {
    const x0 = points[i - 1]
    const x1 = points[i]
    const cpx = (x0.x + x1.x) / 2 * width
    const cpy = (x0.y + x1.y) / 2 * height
    ctx.quadraticCurveTo(x0.x * width, x0.y * height, cpx, cpy)
  }
  const last = points[points.length - 1]
  ctx.lineTo(last.x * width, last.y * height)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  for (const p of points) {
    ctx.beginPath()
    ctx.arc(p.x * width, p.y * height, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPitchIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, pitch: string): void {
  ctx.save()
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30)
  gradient.addColorStop(0, 'rgba(138, 180, 248, 0.4)')
  gradient.addColorStop(1, 'rgba(138, 180, 248, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, 30, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(138, 180, 248, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 20, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 12px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(pitch, x, y)
  ctx.restore()
}
