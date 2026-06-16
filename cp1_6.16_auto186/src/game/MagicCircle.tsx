import React, { useRef, useEffect } from 'react'

interface MagicCircleProps {
  size?: number
  isCasting: boolean
  activeColor?: string
}

const RUNE_SYMBOLS = ['⚶', '⚷', '⚸', '⚹', '⚺', '⚻', '⚼', '⛤', '⛥', '⛦', '⛧', '☽']

export const MagicCircle: React.FC<MagicCircleProps> = ({
  size = 600,
  isCasting = false,
  activeColor = '#9b59ff'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const rotationRef = useRef<number>(0)
  const pulseRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 10

    const render = () => {
      ctx.clearRect(0, 0, size, size)

      rotationRef.current += 0.003
      pulseRef.current += 0.02
      const pulse = Math.sin(pulseRef.current) * 0.1 + 0.9

      ctx.save()
      ctx.translate(centerX, centerY)

      const glowGradient = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius * 1.1)
      glowGradient.addColorStop(0, 'rgba(155, 89, 255, 0)')
      glowGradient.addColorStop(0.7, 'rgba(155, 89, 255, 0.15)')
      glowGradient.addColorStop(1, 'rgba(155, 89, 255, 0)')

      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = isCasting ? activeColor : 'rgba(212, 175, 55, 0.6)'
      ctx.lineWidth = 3
      ctx.shadowColor = isCasting ? activeColor : 'rgba(212, 175, 55, 0.8)'
      ctx.shadowBlur = isCasting ? 25 : 10
      ctx.beginPath()
      ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(155, 89, 255, 0.5)'
      ctx.lineWidth = 1.5
      ctx.shadowBlur = 5
      ctx.beginPath()
      ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)'
      ctx.lineWidth = 1
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(0, 0, radius * (0.3 + i * 0.2), 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.rotate(rotationRef.current)
      const runeCount = 12
      const runeRadius = radius * 0.75

      for (let i = 0; i < runeCount; i++) {
        const angle = (i / runeCount) * Math.PI * 2
        const x = Math.cos(angle) * runeRadius
        const y = Math.sin(angle) * runeRadius

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle + Math.PI / 2)

        ctx.fillStyle = isCasting ? activeColor : 'rgba(212, 175, 55, 0.7)'
        ctx.font = '18px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = isCasting ? activeColor : 'rgba(212, 175, 55, 0.8)'
        ctx.shadowBlur = 8
        ctx.fillText(RUNE_SYMBOLS[i % RUNE_SYMBOLS.length], 0, 0)

        ctx.restore()
      }

      ctx.rotate(-rotationRef.current * 2)
      ctx.strokeStyle = 'rgba(155, 89, 255, 0.4)'
      ctx.lineWidth = 1

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        const x = Math.cos(angle) * radius * 0.5
        const y = Math.sin(angle) * radius * 0.5

        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(x, y)
        ctx.stroke()
      }

      const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20)
      centerGradient.addColorStop(0, isCasting ? activeColor : 'rgba(212, 175, 55, 0.8)')
      centerGradient.addColorStop(1, 'rgba(155, 89, 255, 0)')

      ctx.fillStyle = centerGradient
      ctx.shadowColor = isCasting ? activeColor : 'rgba(212, 175, 55, 1)'
      ctx.shadowBlur = isCasting ? 30 : 15
      ctx.beginPath()
      ctx.arc(0, 0, 20, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [size, isCasting, activeColor])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  )
}
