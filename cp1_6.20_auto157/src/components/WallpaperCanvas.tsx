import { useEffect, useRef, useCallback } from 'react'
import type { AudioAnalyzer } from '../utils/audioProcessor'

export type WaveformType = 'bars' | 'line' | 'dots'

export interface CanvasConfig {
  waveformType: WaveformType
  gradientColors: [string, string]
  backgroundColor: string
  samples: number[]
  smoothness: number
}

interface WallpaperCanvasProps {
  config: CanvasConfig
  audioAnalyzer: AudioAnalyzer | null
  isPlaying: boolean
  canvasRef?: React.RefObject<HTMLCanvasElement>
}

export default function WallpaperCanvas({
  config,
  audioAnalyzer,
  isPlaying,
  canvasRef: externalRef,
}: WallpaperCanvasProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = externalRef || internalCanvasRef
  const animationRef = useRef<number>(0)
  const targetValuesRef = useRef<number[]>([])
  const currentValuesRef = useRef<number[]>([])
  const timeRef = useRef(0)

  const lerp = useCallback((start: number, end: number, factor: number): number => {
    return start + (end - start) * factor
  }, [])

  const createGradient = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number): CanvasGradient => {
      const gradient = ctx.createLinearGradient(0, 0, width, 0)
      gradient.addColorStop(0, config.gradientColors[0])
      gradient.addColorStop(1, config.gradientColors[1])
      return gradient
    },
    [config.gradientColors]
  )

  const drawBars = useCallback(
    (ctx: CanvasRenderingContext2D, values: number[], width: number, height: number) => {
      const barCount = 64
      const gap = 3
      const barWidth = (width - gap * (barCount - 1)) / barCount
      const maxHeight = height * 0.7
      const startY = (height - maxHeight) / 2 + maxHeight

      ctx.fillStyle = createGradient(ctx, width, height)

      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * values.length)
        const value = values[idx] || 0
        const barHeight = Math.max(4, value * maxHeight)
        const x = i * (barWidth + gap)
        const y = startY - barHeight

        ctx.beginPath()
        const radius = Math.min(barWidth / 2, 6)
        ctx.roundRect(x, y, barWidth, barHeight, radius)
        ctx.fill()
      }
    },
    [createGradient]
  )

  const drawLine = useCallback(
    (ctx: CanvasRenderingContext2D, values: number[], width: number, height: number) => {
      const centerY = height / 2
      const amplitude = height * 0.35

      ctx.strokeStyle = createGradient(ctx, width, height)
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      const points = 128
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * width
        const idx = Math.floor((i / points) * values.length)
        const value = values[idx] || 0
        const y = centerY + Math.sin((i / points) * Math.PI * 4 + timeRef.current * 2) * value * amplitude * 0.3 - value * amplitude

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      ctx.lineWidth = 2
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * width
        const idx = Math.floor((i / points) * values.length)
        const value = values[idx] || 0
        const y = centerY - Math.sin((i / points) * Math.PI * 4 + timeRef.current * 2) * value * amplitude * 0.3 + value * amplitude

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    },
    [createGradient]
  )

  const drawDots = useCallback(
    (ctx: CanvasRenderingContext2D, values: number[], width: number, height: number) => {
      const centerY = height / 2
      const amplitude = height * 0.35
      const dotCount = 48
      const spacing = width / dotCount

      ctx.fillStyle = createGradient(ctx, width, height)

      for (let i = 0; i < dotCount; i++) {
        const idx = Math.floor((i / dotCount) * values.length)
        const value = values[idx] || 0
        const x = spacing * i + spacing / 2
        const baseRadius = 3
        const radius = baseRadius + value * 8

        for (let j = -3; j <= 3; j++) {
          const offsetY = j * amplitude * 0.25 * value
          const alpha = 1 - Math.abs(j) * 0.2
          const dotRadius = radius * (1 - Math.abs(j) * 0.15)
          ctx.globalAlpha = alpha
          ctx.beginPath()
          ctx.arc(x, centerY + offsetY, Math.max(1, dotRadius), 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    },
    [createGradient]
  )

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height

    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, width, height)

    let liveData: number[] = config.samples
    if (audioAnalyzer && isPlaying) {
      liveData = audioAnalyzer.getFrequencyData()
    }

    if (targetValuesRef.current.length !== liveData.length) {
      targetValuesRef.current = [...liveData]
      currentValuesRef.current = [...liveData]
    } else {
      targetValuesRef.current = [...liveData]
    }

    const smoothFactor = 0.12
    for (let i = 0; i < currentValuesRef.current.length; i++) {
      currentValuesRef.current[i] = lerp(
        currentValuesRef.current[i],
        targetValuesRef.current[i],
        smoothFactor
      )
    }

    timeRef.current += 0.016

    switch (config.waveformType) {
      case 'bars':
        drawBars(ctx, currentValuesRef.current, width, height)
        break
      case 'line':
        drawLine(ctx, currentValuesRef.current, width, height)
        break
      case 'dots':
        drawDots(ctx, currentValuesRef.current, width, height)
        break
    }

    animationRef.current = requestAnimationFrame(render)
  }, [canvasRef, config, audioAnalyzer, isPlaying, lerp, drawBars, drawLine, drawDots])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [render])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        borderRadius: '16px',
      }}
    />
  )
}
