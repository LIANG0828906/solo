import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import { useAudioStore, PRESETS } from '@/store/AudioStore'

export interface ParticleCanvasHandle {
  clearCanvas: () => void
  saveScreenshot: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  baseVx: number
  baseVy: number
  hue: number
  radius: number
  life: number
  maxLife: number
}

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  opacity: number
  color: string
  startTime: number
}

interface BeatBurst {
  startTime: number
  duration: number
}

const GRAVITY_RADIUS = 150
const GRAVITY_STRENGTH = 0.3
const REPEL_STRENGTH = 0.5
const CURSOR_RADIUS = 8
const BASE_PARTICLES = 800
const REDUCED_PARTICLES = 600
const BURST_DURATION = 200
const RIPPLE_COLORS = [
  '#FF6B6B', '#58A6FF', '#3FB950', '#F0883E',
  '#D2A8FF', '#FF7B72', '#79C0FF', '#56D364'
]

export const ParticleCanvas = forwardRef<ParticleCanvasHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const ripplesRef = useRef<Ripple[]>([])
  const beatBurstsRef = useRef<BeatBurst[]>([])
  const mouseRef = useRef({ x: 0, y: 0, isDown: false, isOver: false })
  const animationRef = useRef<number>(0)
  const fpsFramesRef = useRef<number>(0)
  const fpsLastTimeRef = useRef<number>(performance.now())
  const [fadeOpacity, setFadeOpacity] = useState(1)
  const [clearRequested, setClearRequested] = useState(false)

  const presetKey = useAudioStore(s => s.presetKey)
  const particleCount = useAudioStore(s => s.particleCount)
  const setParticleCount = useAudioStore(s => s.setParticleCount)
  const backgroundHex = useAudioStore(s => s.backgroundHex)

  const createParticle = useCallback((width: number, height: number, preset: typeof PRESETS[string]): Particle => {
    const x = Math.random() * width
    const y = Math.random() * height
    const baseVx = (Math.random() - 0.5) * preset.speedBase
    const baseVy = (Math.random() - 0.5) * preset.speedBase
    const hueRange = preset.hueEnd - preset.hueStart
    const hue = preset.hueStart + Math.random() * hueRange

    return {
      x,
      y,
      vx: baseVx,
      vy: baseVy,
      baseVx,
      baseVy,
      hue,
      radius: 2 + Math.random() * 2,
      life: 1,
      maxLife: 1,
    }
  }, [])

  const initParticles = useCallback((count: number, width: number, height: number) => {
    const preset = PRESETS[presetKey]
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(width, height, preset))
    }
    particlesRef.current = particles
  }, [presetKey, createParticle])

  const adjustParticleCount = useCallback((targetCount: number, width: number, height: number) => {
    const preset = PRESETS[presetKey]
    const current = particlesRef.current
    if (current.length < targetCount) {
      for (let i = current.length; i < targetCount; i++) {
        current.push(createParticle(width, height, preset))
      }
    } else if (current.length > targetCount) {
      current.length = targetCount
    }
  }, [presetKey, createParticle])

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      setFadeOpacity(0)
      setClearRequested(true)
    },
    saveScreenshot: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const link = document.createElement('a')
      link.download = `soundcanvas-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    },
  }))

  useEffect(() => {
    if (clearRequested && fadeOpacity === 0) {
      const canvas = canvasRef.current
      if (canvas) {
        initParticles(particleCount, canvas.width, canvas.height)
      }
      const timer = setTimeout(() => {
        setFadeOpacity(1)
        setClearRequested(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [fadeOpacity, clearRequested, particleCount, initParticles])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)

      if (particlesRef.current.length === 0) {
        initParticles(particleCount, rect.width, rect.height)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [initParticles, particleCount])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    adjustParticleCount(particleCount, rect.width, rect.height)
  }, [particleCount, adjustParticleCount])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const state = useAudioStore.getState()
    let lastBeatTimestamp = state.beatTimestamp
    let beatChecked = true

    const render = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        animationRef.current = requestAnimationFrame(render)
        return
      }

      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const H = rect.height

      fpsFramesRef.current++
      const now = performance.now()
      if (now - fpsLastTimeRef.current >= 1000) {
        const fps = fpsFramesRef.current * 1000 / (now - fpsLastTimeRef.current)
        if (fps < 55 && particleCount === BASE_PARTICLES) {
          setParticleCount(REDUCED_PARTICLES)
        }
        fpsFramesRef.current = 0
        fpsLastTimeRef.current = now
      }

      const currentState = useAudioStore.getState()
      const spectrum = currentState.spectrum
      const volume = currentState.volume
      const bgColor = currentState.backgroundHex
      const isBeat = currentState.beatTimestamp !== lastBeatTimestamp
      if (isBeat) {
        lastBeatTimestamp = currentState.beatTimestamp
        beatBurstsRef.current.push({ startTime: Date.now(), duration: BURST_DURATION })
        const color = RIPPLE_COLORS[Math.floor(Math.random() * RIPPLE_COLORS.length)]
        ripplesRef.current.push({
          x: W / 2,
          y: H / 2,
          radius: 0,
          maxRadius: 200,
          opacity: 0.8,
          color,
          startTime: Date.now(),
        })
      }

      const lowFreqStart = 0
      const lowFreqEnd = Math.floor(256 * (4000 / 22050))
      let lowFreqSum = 0
      for (let i = lowFreqStart; i < lowFreqEnd; i++) {
        lowFreqSum += spectrum[i]
      }
      const lowFreqAvg = lowFreqSum / (lowFreqEnd - lowFreqStart)

      const highFreqStart = Math.floor(256 * (12000 / 22050))
      const highFreqEnd = Math.floor(256 * (20000 / 22050))
      let highFreqSum = 0
      for (let i = highFreqStart; i < highFreqEnd; i++) {
        highFreqSum += spectrum[i]
      }
      const highFreqAvg = highFreqSum / Math.max(1, highFreqEnd - highFreqStart)

      const speedBoost = lowFreqAvg * 2
      const hueShift = highFreqAvg * 360
      const alpha = 0.2 + (volume / 100) * 0.4

      const burstMultiplier = beatBurstsRef.current.reduce((mult, burst) => {
        const elapsed = Date.now() - burst.startTime
        if (elapsed < burst.duration) {
          return Math.max(mult, 3)
        }
        return mult
      }, 1)
      beatBurstsRef.current = beatBurstsRef.current.filter(
        b => Date.now() - b.startTime < b.duration
      )

      const preset = PRESETS[presetKey]
      const hueRange = preset.hueEnd - preset.hueStart

      ctx.fillStyle = bgColor
      ctx.globalAlpha = 1
      ctx.fillRect(0, 0, W, H)

      const particles = particlesRef.current
      const mouse = mouseRef.current

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        p.vx = p.baseVx + speedBoost * (Math.random() - 0.5)
        p.vy = p.baseVy + speedBoost * (Math.random() - 0.5)

        if (burstMultiplier > 1) {
          const dx = p.x - W / 2
          const dy = p.y - H / 2
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          p.vx += (dx / dist) * burstMultiplier * 0.5
          p.vy += (dy / dist) * burstMultiplier * 0.5
        }

        if (mouse.isOver) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < GRAVITY_RADIUS && dist > 0) {
            const force = (1 - dist / GRAVITY_RADIUS)
            const strength = mouse.isDown ? REPEL_STRENGTH : GRAVITY_STRENGTH
            const sign = mouse.isDown ? -1 : 1
            p.vx += sign * (dx / dist) * force * strength
            p.vy += sign * (dy / dist) * force * strength
          }
        }

        p.x += p.vx
        p.y += p.vy

        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10) p.y = H + 10
        if (p.y > H + 10) p.y = -10

        let targetHue = preset.hueStart + ((p.hue + hueShift) % hueRange)
        if (preset.hueStart === 0 && preset.hueEnd === 360) {
          targetHue = (p.hue + hueShift) % 360
        }

        const sizeFactor = 1 + lowFreqAvg * 2
        const r = Math.max(2, Math.min(12, p.radius * sizeFactor))

        ctx.globalAlpha = alpha * fadeOpacity
        ctx.fillStyle = `hsl(${targetHue}, ${preset.saturation}%, ${preset.value}%)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()

        ctx.globalAlpha = alpha * 0.3 * fadeOpacity
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const ripple = ripplesRef.current[i]
        const elapsed = Date.now() - ripple.startTime
        const progress = Math.min(elapsed / 1000, 1)
        ripple.radius = ripple.maxRadius * progress
        ripple.opacity = 0.8 * (1 - progress)

        if (progress >= 1) {
          ripplesRef.current.splice(i, 1)
          continue
        }

        ctx.strokeStyle = ripple.color
        ctx.globalAlpha = ripple.opacity
        ctx.lineWidth = 3 * (1 - progress * 0.5)
        ctx.beginPath()
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (mouse.isOver) {
        const gradient = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, GRAVITY_RADIUS
        )
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, GRAVITY_RADIUS, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, CURSOR_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [presetKey, particleCount, setParticleCount, fadeOpacity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
    }

    const handleMouseDown = () => { mouseRef.current.isDown = true }
    const handleMouseUp = () => { mouseRef.current.isDown = false }
    const handleMouseEnter = () => { mouseRef.current.isOver = true }
    const handleMouseLeave = () => {
      mouseRef.current.isOver = false
      mouseRef.current.isDown = false
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseenter', handleMouseEnter)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseenter', handleMouseEnter)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: backgroundHex,
        cursor: 'none',
        transition: 'opacity 0.5s ease',
        opacity: fadeOpacity,
      }}
    />
  )
})

ParticleCanvas.displayName = 'ParticleCanvas'
