import { useEffect, useRef } from 'react'

interface RadarChartProps {
  scores: {
    life: number
    transport: number
    quiet: number
    green: number
    neighbor: number
  }
}

const DIMENSIONS = [
  { key: 'life', label: '生活便利度' },
  { key: 'transport', label: '交通便利度' },
  { key: 'quiet', label: '安静程度' },
  { key: 'green', label: '绿化程度' },
  { key: 'neighbor', label: '邻里友善度' },
] as const

export default function RadarChart({ scores }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const prevScoresRef = useRef(scores)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 280
    const centerX = size / 2
    const centerY = size / 2
    const maxRadius = 90
    const sides = 5
    const angleStep = (Math.PI * 2) / sides
    const startAngle = -Math.PI / 2

    const targetScores = DIMENSIONS.map((dim) => scores[dim.key])
    const startScores = DIMENSIONS.map((dim) => prevScoresRef.current[dim.key])
    prevScoresRef.current = scores

    let progress = 0
    const duration = 800
    const startTime = performance.now()

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const draw = (currentProgress: number) => {
      ctx.clearRect(0, 0, size, size)

      for (let level = 5; level >= 1; level--) {
        const levelRadius = (maxRadius * level) / 5
        ctx.beginPath()
        for (let i = 0; i <= sides; i++) {
          const angle = startAngle + i * angleStep
          const x = centerX + Math.cos(angle) * levelRadius
          const y = centerY + Math.sin(angle) * levelRadius
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()
        ctx.strokeStyle = 'rgba(45, 155, 142, 0.2)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      for (let i = 0; i < sides; i++) {
        const angle = startAngle + i * angleStep
        const x = centerX + Math.cos(angle) * maxRadius
        const y = centerY + Math.sin(angle) * maxRadius
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(x, y)
        ctx.strokeStyle = 'rgba(45, 155, 142, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.beginPath()
      for (let i = 0; i <= sides; i++) {
        const idx = i % sides
        const angle = startAngle + idx * angleStep
        const currentScore = startScores[idx] + (targetScores[idx] - startScores[idx]) * currentProgress
        const radius = (maxRadius * currentScore) / 5
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, 0, size, size)
      gradient.addColorStop(0, '#2D9B8E')
      gradient.addColorStop(1, '#4ECDC4')
      ctx.fillStyle = gradient
      ctx.globalAlpha = 0.4
      ctx.fill()
      ctx.globalAlpha = 1

      ctx.strokeStyle = '#2D9B8E'
      ctx.lineWidth = 2
      ctx.stroke()

      for (let i = 0; i < sides; i++) {
        const idx = i % sides
        const angle = startAngle + idx * angleStep
        const currentScore = startScores[idx] + (targetScores[idx] - startScores[idx]) * currentProgress
        const radius = (maxRadius * currentScore) / 5
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#2D9B8E'
        ctx.fill()
      }

      ctx.fillStyle = '#374151'
      ctx.font = '12px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      for (let i = 0; i < sides; i++) {
        const angle = startAngle + i * angleStep
        const labelRadius = maxRadius + 28
        const x = centerX + Math.cos(angle) * labelRadius
        const y = centerY + Math.sin(angle) * labelRadius
        ctx.fillText(DIMENSIONS[i].label, x, y)
      }
    }

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime
      progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)
      draw(easedProgress)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [scores])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={280}
      className="block"
    />
  )
}
