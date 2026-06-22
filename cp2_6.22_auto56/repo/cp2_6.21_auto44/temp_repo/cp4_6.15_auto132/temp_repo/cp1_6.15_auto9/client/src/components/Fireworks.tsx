import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  alpha: number
  decay: number
  size: number
}

interface Firework {
  x: number
  y: number
  targetY: number
  vy: number
  color: string
  exploded: boolean
  particles: Particle[]
}

interface FireworksProps {
  active?: boolean
  duration?: number
}

const COLORS = [
  '#3EB489',
  '#1E3A5F',
  '#FF6B6B',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#FF6EC7',
  '#FF8C42',
]

export default function Fireworks({ active = true, duration }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const fireworksRef = useRef<Firework[]>([])
  const startTimeRef = useRef<number>(Date.now())
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
    if (active) {
      startTimeRef.current = Date.now()
      fireworksRef.current = []
    }
  }, [active])

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const createFirework = (): Firework => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      return {
        x: Math.random() * canvas.offsetWidth,
        y: canvas.offsetHeight,
        targetY: Math.random() * (canvas.offsetHeight * 0.5) + 50,
        vy: -(Math.random() * 3 + 4),
        color,
        exploded: false,
        particles: [],
      }
    }

    const explode = (firework: Firework) => {
      const particleCount = 80 + Math.floor(Math.random() * 40)
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount
        const speed = Math.random() * 4 + 2
        firework.particles.push({
          x: firework.x,
          y: firework.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: firework.color,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.01,
          size: Math.random() * 2 + 1,
        })
      }
      firework.exploded = true
    }

    const launchInterval = setInterval(() => {
      if (!activeRef.current) return
      if (fireworksRef.current.length < 8) {
        fireworksRef.current.push(createFirework())
      }
    }, 400)

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current
      const maxDuration = duration ?? (3000 + Math.random() * 2000)

      if (elapsed > maxDuration || !activeRef.current) {
        const activeParticles = fireworksRef.current.some(
          (f) => f.exploded && f.particles.some((p) => p.alpha > 0)
        )
        if (!activeParticles) {
          ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
          return
        }
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      fireworksRef.current = fireworksRef.current.filter((firework) => {
        if (!firework.exploded) {
          firework.y += firework.vy
          firework.vy += 0.05

          ctx.beginPath()
          ctx.arc(firework.x, firework.y, 3, 0, Math.PI * 2)
          ctx.fillStyle = firework.color
          ctx.fill()

          ctx.beginPath()
          ctx.moveTo(firework.x, firework.y)
          ctx.lineTo(firework.x, firework.y + 8)
          ctx.strokeStyle = firework.color
          ctx.lineWidth = 2
          ctx.stroke()

          if (firework.y <= firework.targetY || firework.vy >= 0) {
            explode(firework)
          }
          return true
        } else {
          firework.particles.forEach((particle) => {
            particle.x += particle.vx
            particle.y += particle.vy
            particle.vy += 0.05
            particle.vx *= 0.99
            particle.vy *= 0.99
            particle.alpha -= particle.decay

            if (particle.alpha > 0) {
              ctx.save()
              ctx.globalAlpha = particle.alpha
              ctx.beginPath()
              ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
              ctx.fillStyle = particle.color
              ctx.fill()

              ctx.shadowBlur = 10
              ctx.shadowColor = particle.color
              ctx.fill()
              ctx.restore()
            }
          })

          return firework.particles.some((p) => p.alpha > 0)
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      clearInterval(launchInterval)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active, duration])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50"
    />
  )
}
