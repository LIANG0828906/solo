import { useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '../store'
import { Particle } from '../types'
import './ParticleCanvas.css'

interface ParticleCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function ParticleCanvas({ canvasRef }: ParticleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const particlesRef = useRef<Particle[]>([])
  const { isPaused, updateParticles, setPaused, direction } = useAppStore()

  const particles = useAppStore((state) => state.particles)

  useEffect(() => {
    particlesRef.current = particles
  }, [particles])

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
  }, [canvasRef])

  const getRenderPos = (p: Particle) => {
    let px = p.x
    let py = p.y
    if (p.isReached) {
      px += p.shakeOffsetX || 0
      py += p.shakeOffsetY || 0
    }
    return { px, py }
  }

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, p: Particle, now: number) => {
    const { px, py } = getRenderPos(p)

    let glowIntensity = 0.6
    let glowSize = p.size * 1.5

    if (p.isFlashing) {
      const flashProgress = (now - p.flashStartTime) / p.flashDuration
      const flashEase = 1 - flashProgress
      glowIntensity = 0.6 + flashEase * 0.6
      glowSize = p.size * (1.5 + flashEase * 1.5)
    }

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(p.rotation)
    ctx.translate(-px, -py)

    const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowSize)
    gradient.addColorStop(0, `rgba(${p.currentColor.r}, ${p.currentColor.g}, ${p.currentColor.b}, 1)`)
    gradient.addColorStop(0.4, `rgba(${p.currentColor.r}, ${p.currentColor.g}, ${p.currentColor.b}, ${glowIntensity})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(px, py, glowSize, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(px - p.size * 0.2, py - p.size * 0.2, p.size * 0.25, 0, Math.PI * 2)
    ctx.fill()

    if (p.isFlashing) {
      const flashProgress = (now - p.flashStartTime) / p.flashDuration
      const flashEase = 1 - flashProgress
      const flashRingRadius = p.size * 2

      ctx.strokeStyle = `rgba(255, 255, 255, ${flashEase * 0.8})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, flashRingRadius, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }, [])

  const drawTrail = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    const trail = p.trail
    if (trail.length < 2) return

    for (let i = 0; i < trail.length; i++) {
      const tp = trail[i]
      if (tp.alpha <= 0) continue

      const gradient = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, tp.size)
      gradient.addColorStop(0, `rgba(${p.currentColor.r}, ${p.currentColor.g}, ${p.currentColor.b}, ${tp.alpha})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  const drawLabels = useCallback((ctx: CanvasRenderingContext2D, width: number) => {
    ctx.font = '14px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)'

    const leftLabel = direction === 'encrypt' ? '明文' : '密文'
    const rightLabel = direction === 'encrypt' ? '密文' : '明文'

    ctx.fillText(leftLabel, 80, 40)
    ctx.fillText(rightLabel, width - 80, 40)
  }, [direction])

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) {
      animationFrameRef.current = requestAnimationFrame(animate)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(animate)
      return
    }

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    if (!isPaused && !isDraggingRef.current) {
      updateParticles(timestamp)
    }

    const currentParticles = particlesRef.current

    ctx.clearRect(0, 0, width, height)

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
    bgGradient.addColorStop(0, '#0B132B')
    bgGradient.addColorStop(1, '#1C2541')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    drawLabels(ctx, width)

    for (const p of currentParticles) {
      if (p.trail.length > 0) {
        drawTrail(ctx, p)
      }
    }

    for (const p of currentParticles) {
      drawParticle(ctx, p, timestamp)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [canvasRef, isPaused, updateParticles, drawParticle, drawTrail, drawLabels])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    let scrollTimeout: number | null = null

    const onScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      isDraggingRef.current = true
      setPaused(true)
      scrollTimeout = window.setTimeout(() => {
        isDraggingRef.current = false
        setPaused(false)
      }, 150)
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [setPaused])

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  return (
    <div ref={containerRef} className="particle-canvas-container">
      <canvas ref={canvasRef} className="particle-canvas" />
    </div>
  )
}
