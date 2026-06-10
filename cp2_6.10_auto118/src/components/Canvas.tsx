import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../store'
import type { InkDrop, Particle } from '../types'
import { INK_CONFIGS } from '../types'
import './Canvas.scss'

function drawInkDrops(
  ctx: CanvasRenderingContext2D,
  inkDrops: InkDrop[],
  zoom: number
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  inkDrops.forEach(drop => {
    if (drop.type === 'eraser') return

    const config = INK_CONFIGS[drop.type as Exclude<keyof typeof INK_CONFIGS, 'eraser'>]
    const progress = drop.diffusionProgress

    ctx.save()
    ctx.scale(zoom, zoom)

    drawParticleLayer(ctx, drop.particles, progress, config.color)
    drawInkDropBase(ctx, drop, progress, config.color)

    ctx.restore()
  })
}

function drawParticleLayer(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  progress: number,
  baseColor: string
) {
  particles.forEach(particle => {
    if (particle.life <= 0) return

    const alpha = particle.alpha * Math.max(0, particle.life) * (0.3 + 0.7 * (1 - progress))

    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fillStyle = hexToRgba(baseColor, alpha)
    ctx.fill()
  })
}

function drawInkDropBase(
  ctx: CanvasRenderingContext2D,
  drop: InkDrop,
  progress: number,
  baseColor: string
) {
  const { x, y, currentRadius, initialRadius } = drop

  const centerAlpha = 1
  const edgeAlpha = 0.3

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius)
  gradient.addColorStop(0, hexToRgba(baseColor, centerAlpha * (0.6 + 0.4 * (1 - progress))))
  gradient.addColorStop(0.6, hexToRgba(baseColor, 0.6 * (0.5 + 0.5 * (1 - progress))))
  gradient.addColorStop(1, hexToRgba(baseColor, edgeAlpha))

  ctx.beginPath()

  const points = 60
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    const jitter = 1 + (Math.sin(angle * 3 + drop.time * 0.01) * 0.05)
    const radius = currentRadius * jitter
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius

    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  }

  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  if (progress < 0.3) {
    const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, initialRadius * 0.8)
    innerGradient.addColorStop(0, hexToRgba(baseColor, 0.9 * (1 - progress * 3)))
    innerGradient.addColorStop(1, hexToRgba(baseColor, 0))

    ctx.beginPath()
    ctx.arc(x, y, initialRadius * 0.8, 0, Math.PI * 2)
    ctx.fillStyle = innerGradient
    ctx.fill()
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isToolbarOpen, setIsToolbarOpen] = useState(false)

  const {
    inkDrops,
    activeInkType,
    zoom,
    addInkDrop,
    updateParticles,
    setZoom,
    playbackState
  } = useStore()

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
  }, [])

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    }
  }, [zoom])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (playbackState.isPlaying) return

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY)
    addInkDrop(x, y)
  }, [addInkDrop, getCanvasCoordinates, playbackState.isPlaying])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || playbackState.isPlaying) return

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY)
    addInkDrop(x, y)
  }, [isDragging, addInkDrop, getCanvasCoordinates, playbackState.isPlaying])

  const handleMouseDown = () => {
    if (!playbackState.isPlaying) {
      setIsDragging(true)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(zoom + delta)
  }, [zoom, setZoom])

  useEffect(() => {
    let touchStartDistance = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        touchStartDistance = Math.sqrt(dx * dx + dy * dy)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const currentDistance = Math.sqrt(dx * dx + dy * dy)
        const scale = currentDistance / touchStartDistance
        setZoom(zoom * scale)
        touchStartDistance = currentDistance
      }
    }

    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart)
        canvas.removeEventListener('touchmove', handleTouchMove)
      }
    }
  }, [zoom, setZoom])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [resizeCanvas])

  useEffect(() => {
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time
      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = time

      if (!playbackState.isPlaying) {
        updateParticles(deltaTime)
      }

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          drawInkDrops(ctx, inkDrops, zoom)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [inkDrops, zoom, updateParticles, playbackState.isPlaying])

  const cursorColor = activeInkType === 'eraser' 
    ? '#f5e6c8' 
    : INK_CONFIGS[activeInkType as Exclude<keyof typeof INK_CONFIGS, 'eraser'>]?.color || '#606060'

  return (
    <div 
      className="canvas-container" 
      ref={containerRef}
      style={{ cursor: `crosshair` }}
    >
      <div 
        className="cursor-indicator"
        style={{ 
          '--cursor-color': cursorColor,
          display: playbackState.isPlaying ? 'none' : 'block'
        } as React.CSSProperties}
      />
      <canvas
        ref={canvasRef}
        className="ink-canvas"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <div className="zoom-indicator">
        {Math.round(zoom * 100)}%
      </div>
      <button
        className="toolbar-toggle"
        onClick={() => setIsToolbarOpen(!isToolbarOpen)}
      >
        {isToolbarOpen ? '收起工具' : '展开工具'}
      </button>
      <div className={`mobile-toolbar ${isToolbarOpen ? 'open' : ''}`}>
        <div className="mobile-toolbar-content">
          {activeInkType && <span>当前工具</span>}
        </div>
      </div>
    </div>
  )
}
