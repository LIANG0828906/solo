import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

const ChartPanel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const history = useAppStore((state) => state.history)
  const eventMarkers = useAppStore((state) => state.eventMarkers)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 320
    const height = 130
    const padding = { top: 10, right: 15, bottom: 25, left: 35 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    ctx.clearRect(0, 0, width, height)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + chartWidth, y)
      ctx.stroke()
    }

    const now = performance.now()
    const windowMs = 60000
    const recentHistory = history.filter(h => now - h.timestamp <= windowMs)

    if (recentHistory.length < 2) return

    const drawLine = (dataKey: 'focus' | 'emotion' | 'transition', color: string) => {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.shadowColor = color
      ctx.shadowBlur = 4

      recentHistory.forEach((point, i) => {
        const x = padding.left + (1 - (now - point.timestamp) / windowMs) * chartWidth
        const y = padding.top + (1 - point[dataKey]) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
      ctx.shadowBlur = 0
    }

    drawLine('focus', '#4FC3F7')
    drawLine('emotion', '#FF7043')
    drawLine('transition', '#81C784')

    eventMarkers.forEach(marker => {
      const x = padding.left + (1 - (now - marker.timestamp) / windowMs) * chartWidth
      if (x < padding.left || x > width - padding.right) return

      const y = padding.top + (1 - marker.value) * chartHeight

      const flash = (Math.sin(now * 0.01) + 1) / 2
      const alpha = 0.5 + flash * 0.5

      ctx.save()
      ctx.translate(x, y)
      ctx.fillStyle = marker.type === 'focus' ? '#4FC3F7' : marker.type === 'emotion' ? '#FF7043' : '#81C784'
      ctx.globalAlpha = alpha
      ctx.shadowColor = ctx.fillStyle as string
      ctx.shadowBlur = 10

      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
        const radius = i % 2 === 0 ? 5 : 2.5
        const px = Math.cos(angle) * radius
        const py = Math.sin(angle) * radius
        if (i === 0) {
          ctx.moveTo(px, py)
        } else {
          ctx.lineTo(px, py)
        }
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    })

    ctx.fillStyle = '#666666'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('-60s', padding.left + chartWidth * 0.1, height - 8)
    ctx.fillText('-30s', padding.left + chartWidth * 0.5, height - 8)
    ctx.fillText('现在', padding.left + chartWidth, height - 8)

    ctx.textAlign = 'right'
    ctx.fillText('100%', padding.left - 5, padding.top + 4)
    ctx.fillText('50%', padding.left - 5, padding.top + chartHeight / 2)
    ctx.fillText('0%', padding.left - 5, padding.top + chartHeight + 4)

  }, [history, eventMarkers])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '320px',
        height: 'auto',
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 0 20px rgba(100, 150, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 100,
      }}
    >
      <div style={{
        padding: '8px 12px',
        fontSize: '12px',
        color: '#AAAAAA',
        fontFamily: 'monospace',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: '12px',
      }}>
        <span style={{ color: '#4FC3F7', textShadow: '0 0 6px rgba(79, 195, 247, 0.4)' }}>● 专注度</span>
        <span style={{ color: '#FF7043', textShadow: '0 0 6px rgba(255, 112, 67, 0.4)' }}>● 情绪值</span>
        <span style={{ color: '#81C784', textShadow: '0 0 6px rgba(129, 199, 132, 0.4)' }}>● 跃迁率</span>
      </div>
      <canvas
        ref={canvasRef}
        width={320}
        height={130}
        style={{ display: 'block' }}
      />
    </motion.div>
  )
}

export default ChartPanel
