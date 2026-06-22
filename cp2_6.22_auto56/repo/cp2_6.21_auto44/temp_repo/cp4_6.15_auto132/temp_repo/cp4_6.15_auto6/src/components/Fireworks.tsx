import { useEffect, useRef } from 'react'

interface FireworksProps {
  active: boolean
  duration?: number
  onComplete?: () => void
}

type ParticleType = 'rocket' | 'particle' | 'sparkle'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  type: ParticleType
  color: string
  alpha: number
  size: number
  frames: number
  maxFrames: number
  trail?: { x: number; y: number; alpha: number }[]
  shape?: 'circle' | 'star' | 'ring'
}

const COLOR_THEMES = [
  ['#E63946', '#C1121F', '#780000'],
  ['#FFD700', '#FFB703', '#FB8500'],
  ['#FF9F1C', '#FFBF69', '#FF6B35'],
  ['#D00000', '#9D4EDD', '#C77DFF'],
  ['#2D6A4F', '#40916C', '#52B788'],
  ['#023E8A', '#0077B6', '#00B4D8'],
]

const MAX_PARTICLES = 1500

export default function Fireworks({ active, duration = 4000, onComplete }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const launchTimerRef = useRef<number>(0)
  const stopTimeRef = useRef<number>(0)
  const stoppedRef = useRef<boolean>(false)

  useEffect(() => {
    if (!active || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    const resizeCanvas = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    particlesRef.current = []
    stoppedRef.current = false
    stopTimeRef.current = Date.now() + duration

    const pickColors = (): string[] => {
      const theme = COLOR_THEMES[Math.floor(Math.random() * COLOR_THEMES.length)]
      const count = 2 + Math.floor(Math.random() * 2)
      const shuffled = [...theme].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, Math.min(count, shuffled.length))
    }

    const addParticle = (p: Particle) => {
      if (particlesRef.current.length >= MAX_PARTICLES) {
        particlesRef.current.shift()
      }
      particlesRef.current.push(p)
    }

    const createRocket = () => {
      const x = Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1
      const y = window.innerHeight + 10
      const targetY = Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.1
      const vy = -Math.sqrt(2 * 0.05 * (y - targetY)) * (0.9 + Math.random() * 0.2)
      const vx = (Math.random() - 0.5) * 1.5
      const colors = pickColors()

      addParticle({
        x,
        y,
        vx,
        vy,
        type: 'rocket',
        color: colors[0],
        alpha: 1,
        size: 3,
        frames: 0,
        maxFrames: Math.ceil((y - targetY) / Math.abs(vy)) + 5,
        trail: [],
        shape: 'circle',
      })

      ;(particlesRef.current[particlesRef.current.length - 1] as any).explosionColors = colors
      ;(particlesRef.current[particlesRef.current.length - 1] as any).explosionShape =
        ['circle', 'star', 'ring'][Math.floor(Math.random() * 3)]
    }

    const createExplosion = (rocket: Particle) => {
      const colors = (rocket as any).explosionColors || pickColors()
      const shape = (rocket as any).explosionShape || 'circle'
      const count = 80 + Math.floor(Math.random() * 41)

      addParticle({
        x: rocket.x,
        y: rocket.y,
        vx: 0,
        vy: 0,
        type: 'sparkle',
        color: '#ffffff',
        alpha: 1,
        size: 40,
        frames: 0,
        maxFrames: 15,
      })

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        let speed = 2 + Math.random() * 4

        if (shape === 'star') {
          const points = 5
          const starAngle = (angle * points) % (Math.PI * 2)
          const starFactor = 0.6 + 0.4 * Math.abs(Math.cos(starAngle))
          speed *= starFactor
        } else if (shape === 'ring') {
          speed = 3.5 + Math.random() * 0.5
        }

        const jitter = (Math.random() - 0.5) * 0.3
        const finalAngle = angle + jitter

        addParticle({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(finalAngle) * speed,
          vy: Math.sin(finalAngle) * speed,
          type: 'particle',
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          size: 2 + Math.random() * 2,
          frames: 0,
          maxFrames: 80 + Math.floor(Math.random() * 40),
          shape,
        })
      }
    }

    for (let i = 0; i < 3; i++) {
      setTimeout(createRocket, i * 150)
    }

    launchTimerRef.current = window.setTimeout(function scheduleLaunch() {
      if (stoppedRef.current || Date.now() >= stopTimeRef.current) return

      const launchCount = 1 + Math.floor(Math.random() * 2)
      for (let i = 0; i < launchCount; i++) {
        setTimeout(createRocket, i * 100)
      }

      const nextDelay = 400 + Math.random() * 300
      launchTimerRef.current = window.setTimeout(scheduleLaunch, nextDelay)
    }, 500)

    const animate = () => {
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

      ctx.globalCompositeOperation = 'lighter'

      const particles = particlesRef.current

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.frames++

        if (p.type === 'rocket') {
          p.trail = p.trail || []
          p.trail.push({ x: p.x, y: p.y, alpha: 1 })
          if (p.trail.length > 12) p.trail.shift()

          for (let t = 0; t < p.trail.length; t++) {
            const tp = p.trail[t]
            const trailAlpha = (t / p.trail.length) * 0.8 * p.alpha
            const trailSize = p.size * (t / p.trail.length) * 0.8
            ctx.globalAlpha = trailAlpha
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(tp.x, tp.y, trailSize, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.globalAlpha = p.alpha
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2)
          ctx.fill()

          ctx.globalAlpha = p.alpha * 0.6
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
          ctx.fill()

          p.x += p.vx
          p.y += p.vy
          p.vy += 0.05
          p.vx *= 0.99

          if (p.vy >= -0.5 || p.frames >= p.maxFrames) {
            createExplosion(p)
            particles.splice(i, 1)
            continue
          }
        } else if (p.type === 'particle') {
          const lifeRatio = 1 - p.frames / p.maxFrames
          if (lifeRatio <= 0) {
            particles.splice(i, 1)
            continue
          }

          p.alpha = lifeRatio <= 0.3 ? lifeRatio / 0.3 : 1
          const currentSize = p.size * (0.3 + 0.7 * lifeRatio)

          ctx.globalAlpha = p.alpha * 0.8
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, currentSize * 1.8, 0, Math.PI * 2)
          ctx.fill()

          ctx.globalAlpha = p.alpha
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(p.x, p.y, currentSize * 0.6, 0, Math.PI * 2)
          ctx.fill()

          p.x += p.vx
          p.y += p.vy
          p.vy += 0.05
          p.vx *= 0.99
          p.vy *= 0.99
        } else if (p.type === 'sparkle') {
          const lifeRatio = 1 - p.frames / p.maxFrames
          if (lifeRatio <= 0) {
            particles.splice(i, 1)
            continue
          }

          const currentSize = p.size * lifeRatio
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize)
          gradient.addColorStop(0, `rgba(255, 255, 255, ${lifeRatio})`)
          gradient.addColorStop(0.3, `rgba(255, 220, 150, ${lifeRatio * 0.8})`)
          gradient.addColorStop(1, 'rgba(255, 100, 50, 0)')

          ctx.globalAlpha = 1
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'

      if (stoppedRef.current && particles.length === 0) {
        cleanup()
        onComplete?.()
        return
      }

      if (Date.now() >= stopTimeRef.current && !stoppedRef.current) {
        stoppedRef.current = true
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    const cleanup = () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = 0
      }
      if (launchTimerRef.current) {
        clearTimeout(launchTimerRef.current)
        launchTimerRef.current = 0
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return cleanup
  }, [active, duration, onComplete])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9998,
        pointerEvents: 'none',
      }}
    />
  )
}
