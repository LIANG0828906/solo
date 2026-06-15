import React, { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export const ScoreRing: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { lastScoreResult } = useGameStore()
  const currentScore = lastScoreResult?.score ?? 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 140
    canvas.width = size
    canvas.height = size

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 10
    const lineWidth = 8

    let animationProgress = 0
    const startProgress = 0
    const endProgress = currentScore / 100
    const animationDuration = 800
    const startTime = performance.now()

    const getColor = (progress: number): string => {
      const r = Math.floor(255 - progress * 100)
      const g = Math.floor(50 + progress * 150)
      const b = Math.floor(50)
      return `rgb(${r}, ${g}, ${b})`
    }

    const draw = () => {
      if (!ctx) return

      ctx.clearRect(0, 0, size, size)

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.stroke()

      const gradient = ctx.createLinearGradient(0, 0, size, size)
      const progressColor = getColor(animationProgress)
      gradient.addColorStop(0, '#ff4444')
      gradient.addColorStop(0.5, '#ffaa00')
      gradient.addColorStop(1, progressColor)

      ctx.beginPath()
      ctx.arc(
        centerX,
        centerY,
        radius,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * animationProgress,
      )
      ctx.strokeStyle = gradient
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.shadowColor = progressColor
      ctx.shadowBlur = 15
      ctx.stroke()
      ctx.shadowBlur = 0

      ctx.save()
      const glowRadius = radius + lineWidth + 2
      const endAngle = -Math.PI / 2 + Math.PI * 2 * animationProgress
      const glowX = centerX + Math.cos(endAngle) * glowRadius
      const glowY = centerY + Math.sin(endAngle) * glowRadius
      const glowGradient = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 12)
      glowGradient.addColorStop(0, progressColor)
      glowGradient.addColorStop(1, 'transparent')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(glowX, glowY, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      ctx.fillStyle = 'white'
      ctx.font = 'bold 32px "Cinzel Decorative", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = progressColor
      ctx.shadowBlur = 10
      ctx.fillText(`${Math.round(animationProgress * 100)}`, centerX, centerY - 5)
      ctx.shadowBlur = 0

      ctx.font = '11px "Noto Sans SC", sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText('匹配度', centerX, centerY + 20)
    }

    const animate = (now: number) => {
      const elapsed = now - startTime
      animationProgress = Math.min(1, elapsed / animationDuration)
      const eased = 1 - Math.pow(1 - animationProgress, 3)
      const displayProgress = startProgress + (endProgress - startProgress) * eased

      animationProgress = displayProgress
      draw()

      if (elapsed < animationDuration) {
        requestAnimationFrame(animate)
      } else {
        animationProgress = endProgress
        draw()
      }
    }

    requestAnimationFrame(animate)
  }, [currentScore])

  return (
    <div className="relative flex flex-col items-center">
      <canvas ref={canvasRef} width={140} height={140} className="drop-shadow-2xl" />
    </div>
  )
}
