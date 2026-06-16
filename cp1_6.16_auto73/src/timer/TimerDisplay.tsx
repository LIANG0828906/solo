import { useEffect, useRef } from 'react'
import { useTimer } from './Timer'

interface TimerDisplayProps {
  compact?: boolean
}

export default function TimerDisplay({ compact = false }: TimerDisplayProps) {
  const { timerMode, currentTimeLeft, focusDuration, breakDuration } = useTimer()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = compact ? 80 : 280
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    const draw = () => {
      ctx.clearRect(0, 0, size, size)
      const cx = size / 2
      const cy = size / 2
      const lineWidth = compact ? 4 : 8
      const radius = (size - lineWidth * 2) / 2 - (compact ? 4 : 8)

      const total = timerMode === 'break' ? breakDuration : focusDuration
      const progress = 1 - (currentTimeLeft / total)

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = timerMode === 'idle' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)'
      ctx.lineWidth = lineWidth
      ctx.stroke()

      if (timerMode !== 'idle' || progress > 0) {
        const startAngle = -Math.PI / 2
        const endAngle = startAngle + Math.PI * 2 * progress
        const gradient = ctx.createLinearGradient(
          cx - radius, cy - radius,
          cx + radius, cy + radius
        )
        if (timerMode === 'break') {
          gradient.addColorStop(0, '#FFB74D')
          gradient.addColorStop(1, '#FF8A65')
        } else {
          gradient.addColorStop(0, '#66BB6A')
          gradient.addColorStop(0.5, '#FFD54F')
          gradient.addColorStop(1, '#EF5350')
        }

        ctx.beginPath()
        ctx.arc(cx, cy, radius, startAngle, endAngle)
        ctx.strokeStyle = gradient
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [timerMode, currentTimeLeft, focusDuration, breakDuration, compact])

  const size = compact ? 80 : 280
  const fontSize = compact ? 16 : 52

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      <div style={{
        fontSize,
        fontWeight: 700,
        color: timerMode === 'idle' ? (compact ? '#5C6B7A' : '#4A5568') : '#ffffff',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: compact ? '0.5px' : '2px',
        zIndex: 1
      }}>
        {formatTime(currentTimeLeft)}
      </div>
    </div>
  )
}
