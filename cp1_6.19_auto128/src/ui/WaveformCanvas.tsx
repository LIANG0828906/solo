import React, { useRef, useEffect } from 'react'

interface WaveformCanvasProps {
  samples: number[]
  color?: string
  height?: number
  className?: string
}

const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  samples,
  color = '#8B5CF6',
  height = 60,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = container.clientWidth

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    if (samples.length === 0) return

    const middle = height / 2
    const barWidth = width / samples.length
    const gap = Math.max(0, barWidth * 0.1)

    ctx.fillStyle = color
    ctx.beginPath()

    for (let i = 0; i < samples.length; i++) {
      const x = i * barWidth
      const sample = Math.abs(samples[i])
      const barHeight = Math.max(1, sample * 2)
      
      const x1 = x + gap / 2
      const x2 = x + barWidth - gap / 2
      
      ctx.moveTo(x1, middle - barHeight)
      ctx.lineTo(x2, middle - barHeight)
      ctx.lineTo(x2, middle + barHeight)
      ctx.lineTo(x1, middle + barHeight)
      ctx.closePath()
    }

    ctx.fill()

    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.globalAlpha = 0.5
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1

  }, [samples, color, height])

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const width = container.clientWidth

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [height])

  return (
    <div ref={containerRef} className={`waveform-canvas-container ${className}`} style={{ width: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}

export default WaveformCanvas
