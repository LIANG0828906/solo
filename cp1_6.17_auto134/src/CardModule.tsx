import React, { useEffect, useRef } from 'react'
import type { SolarTerm } from './DataProvider'
import { getSeasonColor, hexToRgba } from './utils'

interface CardModuleProps {
  solarTerm: SolarTerm
  originPosition?: { x: number; y: number }
  onRecordClick: () => void
  animationKey: number
}

const CardModule: React.FC<CardModuleProps> = ({ solarTerm, originPosition, onRecordClick, animationKey }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(Date.now())
  const particlesRef = useRef<Array<{ x: number; y: number; baseX: number; baseY: number; size: number; angle: number; speed: number }>>([])

  const color = getSeasonColor(solarTerm.season)

  const initParticles = (type: string, width: number, height: number) => {
    const particles: typeof particlesRef.current = []
    const count = 80

    switch (type) {
      case 'willow':
      case 'swallow':
      case 'pear':
      case 'peony':
      case 'peach':
      case 'rain':
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            baseX: Math.random() * width,
            baseY: Math.random() * height,
            size: 2 + Math.random() * 4,
            angle: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.5
          })
        }
        break
      case 'lotus':
      case 'lotus2':
      case 'wheat':
      case 'ear':
      case 'sunflower':
      case 'jasmine':
        for (let i = 0; i < count; i++) {
          particles.push({
            x: width / 2 + (Math.random() - 0.5) * width * 0.6,
            y: height / 2 + (Math.random() - 0.5) * height * 0.6,
            baseX: width / 2 + (Math.random() - 0.5) * width * 0.6,
            baseY: height / 2 + (Math.random() - 0.5) * height * 0.6,
            size: 3 + Math.random() * 5,
            angle: Math.random() * Math.PI * 2,
            speed: 0.2 + Math.random() * 0.4
          })
        }
        break
      case 'maple':
      case 'osmanthus':
      case 'reed':
      case 'chrysanthemum':
      case 'ginkgo':
      case 'persimmon':
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            baseX: Math.random() * width,
            baseY: Math.random() * height,
            size: 4 + Math.random() * 6,
            angle: Math.random() * Math.PI * 2,
            speed: 0.25 + Math.random() * 0.45
          })
        }
        break
      default:
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            baseX: Math.random() * width,
            baseY: Math.random() * height,
            size: 2 + Math.random() * 5,
            angle: Math.random() * Math.PI * 2,
            speed: 0.2 + Math.random() * 0.5
          })
        }
    }
    return particles
  }

  const drawWillow = (ctx: CanvasRenderingContext2D, w: number, h: number, pulse: number) => {
    ctx.strokeStyle = hexToRgba(color, 0.5)
    ctx.lineWidth = 1.5
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      const startX = w * (0.1 + i * 0.11)
      ctx.moveTo(startX, 0)
      for (let y = 0; y < h; y += 10) {
        const sway = Math.sin(y * 0.02 + pulse * Math.PI * 2 + i * 0.5) * 15
        ctx.lineTo(startX + sway, y)
      }
      ctx.stroke()
    }
  }

  const drawFlower = (ctx: CanvasRenderingContext2D, w: number, h: number, pulse: number) => {
    const cx = w / 2
    const cy = h / 2
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + pulse * Math.PI * 0.2
      const petalSize = 30 + pulse * 10
      const px = cx + Math.cos(angle) * (25 + pulse * 8)
      const py = cy + Math.sin(angle) * (25 + pulse * 8)
      ctx.beginPath()
      ctx.ellipse(px, py, petalSize * 0.6, petalSize, angle, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(color, 0.35 + pulse * 0.2)
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(cx, cy, 15 + pulse * 5, 0, Math.PI * 2)
    ctx.fillStyle = hexToRgba('#F4D03F', 0.8)
    ctx.fill()
  }

  const drawLeaves = (ctx: CanvasRenderingContext2D, w: number, h: number, pulse: number, particles: typeof particlesRef.current) => {
    particles.forEach((p, i) => {
      const t = pulse + i * 0.01
      p.x = p.baseX + Math.sin(t * Math.PI * 2 + p.angle) * 20
      p.y = p.baseY + Math.cos(t * Math.PI * 2 + p.angle) * 15
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (0.8 + pulse * 0.4), 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(color, 0.4 + pulse * 0.3)
      ctx.fill()
    })
  }

  const drawSnow = (ctx: CanvasRenderingContext2D, w: number, h: number, pulse: number, particles: typeof particlesRef.current) => {
    particles.forEach((p, i) => {
      p.y = (p.baseY + Date.now() * 0.02 * p.speed) % h
      p.x = p.baseX + Math.sin(p.y * 0.02 + pulse * Math.PI * 2) * 20
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (0.7 + pulse * 0.3), 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(color, 0.5 + pulse * 0.3)
      ctx.fill()
    })
  }

  const drawCirclePattern = (ctx: CanvasRenderingContext2D, w: number, h: number, pulse: number) => {
    const cx = w / 2
    const cy = h / 2
    for (let r = 0; r < 5; r++) {
      ctx.beginPath()
      ctx.arc(cx, cy, 30 + r * 20 + pulse * 15, 0, Math.PI * 2)
      ctx.strokeStyle = hexToRgba(color, 0.15 + r * 0.08)
      ctx.lineWidth = 2
      ctx.stroke()
    }
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + pulse * Math.PI * 0.3
      const radius = 50 + pulse * 20
      const px = cx + Math.cos(angle) * radius
      const py = cy + Math.sin(angle) * radius
      ctx.beginPath()
      ctx.arc(px, py, 6 + pulse * 3, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(color, 0.5 + pulse * 0.3)
      ctx.fill()
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const displayWidth = 300
    const displayHeight = 220
    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`
    ctx.scale(dpr, dpr)

    startTimeRef.current = Date.now()
    particlesRef.current = initParticles(solarTerm.illustrationType, displayWidth, displayHeight)

    const animate = () => {
      if (!ctx || !canvas) return
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const pulse = (Math.sin(elapsed * Math.PI * 2 / 4) + 1) / 2

      ctx.clearRect(0, 0, displayWidth, displayHeight)
      const gradient = ctx.createRadialGradient(
        displayWidth / 2, displayHeight / 2, 0,
        displayWidth / 2, displayHeight / 2, displayWidth * 0.7
      )
      gradient.addColorStop(0, hexToRgba(color, 0.08))
      gradient.addColorStop(1, hexToRgba(color, 0.02))
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, displayWidth, displayHeight)

      const illType = solarTerm.illustrationType
      if (['willow', 'swallow', 'pear', 'rain'].includes(illType)) {
        drawWillow(ctx, displayWidth, displayHeight, pulse)
        drawLeaves(ctx, displayWidth, displayHeight, pulse, particlesRef.current)
      } else if (['peach', 'peony', 'lotus', 'lotus2', 'jasmine'].includes(illType)) {
        drawFlower(ctx, displayWidth, displayHeight, pulse)
        drawLeaves(ctx, displayWidth, displayHeight, pulse, particlesRef.current)
      } else if (['maple', 'ginkgo', 'persimmon', 'osmanthus', 'chrysanthemum', 'reed'].includes(illType)) {
        drawLeaves(ctx, displayWidth, displayHeight, pulse, particlesRef.current)
        drawCirclePattern(ctx, displayWidth, displayHeight, pulse)
      } else if (['wheat', 'ear', 'sunflower'].includes(illType)) {
        drawCirclePattern(ctx, displayWidth, displayHeight, pulse)
        drawLeaves(ctx, displayWidth, displayHeight, pulse, particlesRef.current)
      } else if (['snow', 'snowflake', 'wintersweet', 'pine', 'narcissus', 'plum'].includes(illType)) {
        drawSnow(ctx, displayWidth, displayHeight, pulse, particlesRef.current)
        drawCirclePattern(ctx, displayWidth, displayHeight, pulse)
      } else {
        drawCirclePattern(ctx, displayWidth, displayHeight, pulse)
        drawLeaves(ctx, displayWidth, displayHeight, pulse, particlesRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [solarTerm.id, solarTerm.illustrationType, color])

  const cardStyle: React.CSSProperties = {
    width: 340,
    background: '#ffffff',
    borderRadius: 16,
    padding: '28px 24px 24px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  }

  if (originPosition) {
    cardStyle.position = 'fixed'
    cardStyle.left = originPosition.x - 170
    cardStyle.top = originPosition.y - 100
    cardStyle.zIndex = 100
  }

  return (
    <div key={animationKey} className="card-fly-in" style={cardStyle}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: color
        }}
      />

      <div
        className="kaiti"
        style={{
          fontSize: 32,
          fontWeight: 600,
          color,
          textAlign: 'center',
          marginBottom: 16,
          letterSpacing: 4
        }}
      >
        {solarTerm.name}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 20,
          borderRadius: 12,
          background: hexToRgba(color, 0.05),
          padding: 10
        }}
      >
        <canvas ref={canvasRef} style={{ borderRadius: 8 }} />
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 300,
          color: '#444444',
          lineHeight: 1.8,
          marginBottom: 20,
          textAlign: 'justify'
        }}
      >
        {solarTerm.phenology}
      </div>

      <button
        onClick={onRecordClick}
        style={{
          width: '100%',
          padding: '12px 20px',
          background: '#2C3E50',
          color: '#ffffff',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: 1
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#34495E'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#2C3E50'
        }}
      >
        记录本地的物候
      </button>
    </div>
  )
}

export default CardModule
