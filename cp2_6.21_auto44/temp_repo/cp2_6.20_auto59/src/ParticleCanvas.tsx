import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import type { Particle } from './types'

export interface ParticleCanvasHandle {
  emitParticle: (x: number, y: number, pitch: number, velocity: number) => void
  animate: (lfoIntensity: number) => void
  setCanvasSize: (width: number, height: number) => void
}

interface ParticleCanvasProps {
  width: number
  height: number
}

const MAX_PARTICLES = 1500

export const ParticleCanvas = forwardRef<ParticleCanvasHandle, ParticleCanvasProps>(function ParticleCanvas({ width, height }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const canvasSizeRef = useRef({ width, height })

  useImperativeHandle(ref, () => ({
    emitParticle: (x: number, y: number, pitch: number, velocity: number) => {
      const count = Math.floor(3 + velocity * 8)
      for (let i = 0; i < count; i++) {
        if (particlesRef.current.length >= MAX_PARTICLES) break
        const angle = Math.random() * Math.PI * 2
        const speed = 1 + Math.random() * 3 + velocity * 3
        const hue = 270 - (pitch / 1200) * 240 + 30
        const size = 2 + Math.random() * 4 + velocity * 6
        const particle: Particle = {
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 60 + Math.random() * 60,
          size,
          color: `hsl(${hue}, 85%, 65%)`,
          alpha: 0.9
        }
        particlesRef.current.push(particle)
      }
    },
    animate: (lfoIntensity: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { width: w, height: h } = canvasSizeRef.current
      ctx.clearRect(0, 0, w, h)
      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.vx += (Math.random() - 0.5) * 0.1
        p.vy += (Math.random() - 0.5) * 0.1
        p.vx *= 0.98
        p.vy *= 0.98
        p.x += p.vx * (1 + lfoIntensity * 0.5)
        p.y += p.vy * (1 + lfoIntensity * 0.5)
        p.life -= 1 / p.maxLife
        p.alpha = p.life * 0.9
        const sizeMod = 1 + Math.sin(Date.now() * 0.01 * lfoIntensity) * 0.3
        const adjustedSize = p.size * sizeMod
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = p.alpha
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, adjustedSize * 2)
        gradient.addColorStop(0, p.color)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, adjustedSize * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, adjustedSize * 0.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
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
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        borderRadius: '16px'
      }}
    />
  )
})
