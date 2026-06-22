import React, { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import { RuneEngine } from '../runes/RuneEngine'

interface PortalParticle {
  angle: number
  radius: number
  targetRadius: number
  size: number
  color: string
  alpha: number
  twinkleSpeed: number
  twinkleOffset: number
}

const PortalCore: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const particlesRef = useRef<PortalParticle[]>([])
  const phaseRef = useRef<'init' | 'accelerate' | 'sustain' | 'collapse' | 'flash' | 'done'>('init')

  const { isPortalActive, selectedRunes, setCurrentScene, setTransitioning, setPortalActive, setInteractionDisabled, clearRunes } = useGameStore()

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 255, b: 255 }
  }

  const interpolateColor = (color1: string, color2: string, t: number): string => {
    const c1 = hexToRgb(color1)
    const c2 = hexToRgb(color2)
    const r = Math.round(lerp(c1.r, c2.r, t))
    const g = Math.round(lerp(c1.g, c2.g, t))
    const b = Math.round(lerp(c1.b, c2.b, t))
    return `rgb(${r}, ${g}, ${b})`
  }

  const initParticles = useCallback(() => {
    const particles: PortalParticle[] = []
    const particleCount = 80

    for (let i = 0; i < particleCount; i++) {
      const colorT = Math.random()
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 30 + Math.random() * 40,
        targetRadius: 60 + Math.random() * 40,
        size: 2 + Math.random() * 4,
        color: interpolateColor('#00FFFF', '#8A2BE2', colorT),
        alpha: 0.6 + Math.random() * 0.4,
        twinkleSpeed: 2 + Math.random() * 4,
        twinkleOffset: Math.random() * Math.PI * 2
      })
    }
    particlesRef.current = particles
  }, [])

  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const width = canvas.width
      const height = canvas.height
      const cx = width / 2
      const cy = height / 2
      const elapsed = (timestamp - startTimeRef.current) / 1000

      let scale = 1
      let rotationSpeed = 0.1
      let expandProgress = 0

      if (phaseRef.current === 'init') {
        rotationSpeed = 0.1
        if (elapsed > 0.3) {
          phaseRef.current = 'accelerate'
          startTimeRef.current = timestamp
        }
      } else if (phaseRef.current === 'accelerate') {
        const t = Math.min(elapsed / 1.0, 1)
        rotationSpeed = lerp(0.1, 0.5, t)
        expandProgress = t
        if (t >= 1) {
          phaseRef.current = 'sustain'
          startTimeRef.current = timestamp
        }
      } else if (phaseRef.current === 'sustain') {
        rotationSpeed = 0.5
        expandProgress = 1
        if (elapsed > 1.2) {
          phaseRef.current = 'collapse'
          startTimeRef.current = timestamp
        }
      } else if (phaseRef.current === 'collapse') {
        rotationSpeed = 0.5 * (1 - elapsed / 0.5)
        expandProgress = 1
        const t = Math.min(elapsed / 0.5, 1)
        scale = 1 - t
        if (t >= 1) {
          phaseRef.current = 'flash'
          startTimeRef.current = timestamp

          const result = RuneEngine.validate(selectedRunes)
          if (result.valid && result.scene) {
            const targetScene = result.scene
            setTimeout(() => {
              setTransitioning(true)
              setTimeout(() => {
                setCurrentScene(targetScene)
                setTimeout(() => {
                  setTransitioning(false)
                  setPortalActive(false)
                  setInteractionDisabled(false)
                  clearRunes()
                }, 500)
              }, 400)
            }, 200)
          }
        }
      } else if (phaseRef.current === 'flash') {
        if (elapsed > 0.5) {
          phaseRef.current = 'done'
          return
        }
      } else {
        return
      }

      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(scale, scale)

      const baseRadius = 100
      for (let i = 0; i < 4; i++) {
        const ringRadius = baseRadius - i * 8
        const ringAlpha = 0.15 - i * 0.03
        const gradient = ctx.createRadialGradient(0, 0, ringRadius - 10, 0, 0, ringRadius + 10)
        gradient.addColorStop(0, `rgba(0, 255, 255, 0)`)
        gradient.addColorStop(0.5, `rgba(0, 255, 255, ${ringAlpha})`)
        gradient.addColorStop(1, `rgba(138, 43, 226, 0)`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(0, 0, ringRadius + 10, 0, Math.PI * 2)
        ctx.fill()
      }

      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const currentRadius = lerp(p.radius, p.targetRadius, expandProgress) + expandProgress * 20
        const twinkle = 0.5 + 0.5 * Math.sin(timestamp / 1000 * p.twinkleSpeed + p.twinkleOffset)
        const alpha = p.alpha * (0.6 + 0.4 * twinkle) * expandProgress

        const x = Math.cos(p.angle + timestamp / 1000 * rotationSpeed) * currentRadius
        const y = Math.sin(p.angle + timestamp / 1000 * rotationSpeed) * currentRadius

        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(x, y, p.size * (0.8 + 0.4 * twinkle), 0, Math.PI * 2)
        ctx.fill()

        ctx.globalAlpha = alpha * 0.3
        ctx.beginPath()
        ctx.arc(x, y, p.size * 2.5, 0, Math.PI * 2)
        ctx.fill()

        p.angle += 0.002 + i * 0.0001
      }

      ctx.globalAlpha = 1
      const centerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 50)
      centerGlow.addColorStop(0, `rgba(255, 255, 255, ${0.4 * expandProgress})`)
      centerGlow.addColorStop(0.5, `rgba(0, 255, 255, ${0.2 * expandProgress})`)
      centerGlow.addColorStop(1, `rgba(138, 43, 226, 0)`)
      ctx.fillStyle = centerGlow
      ctx.beginPath()
      ctx.arc(0, 0, 50, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
      animationRef.current = requestAnimationFrame(render)
    },
    [selectedRunes, setCurrentScene, setTransitioning, setPortalActive, setInteractionDisabled, clearRunes]
  )

  useEffect(() => {
    if (isPortalActive) {
      phaseRef.current = 'init'
      startTimeRef.current = performance.now()
      initParticles()
      animationRef.current = requestAnimationFrame(render)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPortalActive, initParticles, render])

  if (!isPortalActive) return null

  return (
    <>
      <div className="portal-overlay">
        <canvas
          ref={canvasRef}
          className="portal-canvas"
          width={400}
          height={400}
        />
      </div>
      <div className="flash-overlay" />
    </>
  )
}

export default PortalCore
