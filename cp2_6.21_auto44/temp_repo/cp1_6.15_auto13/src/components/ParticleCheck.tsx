import { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  alpha: number
}

interface ParticleCheckProps {
  checked: boolean
  size?: number
}

export default function ParticleCheck({ checked, size = 20 }: ParticleCheckProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const prevCheckedRef = useRef(checked)
  const [showCheck, setShowCheck] = useState(checked)
  const [checkScale, setCheckScale] = useState(checked ? 1 : 0)

  useEffect(() => {
    if (checked && !prevCheckedRef.current) {
      setShowCheck(true)
      setCheckScale(0)
      const springStart = performance.now()
      const springDuration = 400
      const animateSpring = (now: number) => {
        const elapsed = now - springStart
        const progress = Math.min(elapsed / springDuration, 1)
        const t = progress
        const c4 = (2 * Math.PI) / 3
        const bounce = t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
        setCheckScale(bounce)
        if (progress < 1) {
          requestAnimationFrame(animateSpring)
        }
      }
      requestAnimationFrame(animateSpring)

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const centerX = size / 2
          const centerY = size / 2
          const particles: Particle[] = []
          const colors = ['#7CB342', '#FFC107']

          for (let i = 0; i < 16; i++) {
            const angle = (Math.random() * 360 * Math.PI) / 180
            const velocity = 1 + Math.random() * 3
            particles.push({
              x: centerX,
              y: centerY,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: 2 + Math.random() * 2,
              alpha: 1,
            })
          }

          const render = () => {
            ctx.clearRect(0, 0, size, size)
            let alive = false
            particles.forEach((p) => {
              if (p.alpha > 0) {
                alive = true
                p.x += p.vx
                p.y += p.vy
                p.vy += 0.1
                p.alpha -= 0.02
                ctx.globalAlpha = Math.max(0, p.alpha)
                ctx.fillStyle = p.color
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fill()
              }
            })
            ctx.globalAlpha = 1
            if (alive) {
              rafRef.current = requestAnimationFrame(render)
            }
          }
          rafRef.current = requestAnimationFrame(render)
        }
      }
    } else if (!checked) {
      setShowCheck(false)
      setCheckScale(0)
    }
    prevCheckedRef.current = checked
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [checked, size])

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid #D4B896`,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />
      {showCheck && (
        <svg
          className="check-icon-svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{
            position: 'relative',
            zIndex: 1,
            transform: `scale(${checkScale})`,
          }}
        >
          <path
            d="M5 12l5 5L20 7"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}
