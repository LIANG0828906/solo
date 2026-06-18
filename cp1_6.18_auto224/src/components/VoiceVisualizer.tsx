import { useEffect, useRef } from 'react'

interface VoiceVisualizerProps {
  audioLevel: number
  isActive: boolean
}

export default function VoiceVisualizer({ audioLevel, isActive }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const smoothedLevelRef = useRef(0)
  const ringPhasesRef = useRef([0, 0, 0])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = [
      { inner: 'rgba(192, 132, 252, 0.7)', outer: 'rgba(192, 132, 252, 0)' },
      { inner: 'rgba(139, 92, 246, 0.5)', outer: 'rgba(139, 92, 246, 0)' },
      { inner: 'rgba(139, 92, 246, 0.3)', outer: 'rgba(139, 92, 246, 0)' },
    ]

    const render = () => {
      const w = canvas.width / (window.devicePixelRatio || 1)
      const h = canvas.height / (window.devicePixelRatio || 1)
      ctx.clearRect(0, 0, w, h)

      if (!isActive) {
        animRef.current = requestAnimationFrame(render)
        return
      }

      smoothedLevelRef.current += (audioLevel - smoothedLevelRef.current) * 0.15
      const level = smoothedLevelRef.current

      const cx = w / 2
      const cy = h / 2
      const baseRadius = 35

      for (let i = 0; i < 3; i++) {
        ringPhasesRef.current[i] += 0.02 + i * 0.005
        const phase = ringPhasesRef.current[i]
        const amp = level * 30 * (1 - i * 0.2)
        const radius = baseRadius + i * 18 + Math.sin(phase) * 3

        const gradient = ctx.createRadialGradient(cx, cy, radius - 10, cx, cy, radius + amp + 5)
        gradient.addColorStop(0, colors[i].inner)
        gradient.addColorStop(1, colors[i].outer)

        ctx.beginPath()
        ctx.strokeStyle = gradient
        ctx.lineWidth = 3

        for (let a = 0; a <= Math.PI * 2; a += 0.05) {
          const wobble = Math.sin(a * 8 + phase * 3 + i) * amp * 0.5
          const noise = Math.sin(a * 3 + phase * 2) * amp * 0.3
          const r = radius + wobble + noise

          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a) * r

          if (a === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.stroke()
      }

      animRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [audioLevel, isActive])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '0px',
        transform: 'translateX(-50%)',
        width: '200px',
        height: '200px',
        pointerEvents: 'none',
      }}
    />
  )
}
