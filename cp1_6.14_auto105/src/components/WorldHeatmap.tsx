import { useRef, useEffect, useState, useCallback } from 'react'
import type { TravelStats } from '@/types'

type CountryCount = TravelStats['countryCounts'][number]

interface ContinentShape {
  name: string
  points: [number, number][]
}

const CONTINENT_SHAPES: ContinentShape[] = [
  {
    name: 'North America',
    points: [
      [0.05, 0.12], [0.18, 0.08], [0.32, 0.12], [0.38, 0.22],
      [0.35, 0.35], [0.28, 0.42], [0.22, 0.45], [0.15, 0.42],
      [0.10, 0.35], [0.06, 0.28], [0.04, 0.20]
    ]
  },
  {
    name: 'South America',
    points: [
      [0.22, 0.48], [0.30, 0.46], [0.35, 0.52], [0.36, 0.62],
      [0.33, 0.72], [0.28, 0.80], [0.24, 0.85], [0.20, 0.78],
      [0.19, 0.68], [0.20, 0.58]
    ]
  },
  {
    name: 'Europe',
    points: [
      [0.45, 0.12], [0.55, 0.10], [0.58, 0.18], [0.55, 0.28],
      [0.50, 0.32], [0.46, 0.30], [0.44, 0.22]
    ]
  },
  {
    name: 'Africa',
    points: [
      [0.47, 0.35], [0.57, 0.34], [0.60, 0.42], [0.58, 0.55],
      [0.54, 0.65], [0.50, 0.70], [0.46, 0.65], [0.44, 0.55],
      [0.43, 0.45]
    ]
  },
  {
    name: 'Asia',
    points: [
      [0.58, 0.10], [0.75, 0.08], [0.88, 0.15], [0.92, 0.25],
      [0.88, 0.38], [0.78, 0.42], [0.68, 0.40], [0.60, 0.35],
      [0.56, 0.28], [0.55, 0.18]
    ]
  },
  {
    name: 'Oceania',
    points: [
      [0.78, 0.52], [0.88, 0.50], [0.92, 0.58], [0.90, 0.68],
      [0.84, 0.72], [0.78, 0.70], [0.76, 0.62]
    ]
  }
]

function getColorByCount(count: number, maxCount: number): string {
  if (count <= 0) return '#E0D5C7'
  const ratio = Math.min(count / maxCount, 1)
  const lightGreen = { r: 198, g: 233, b: 198 }
  const darkGreen = { r: 39, g: 174, b: 96 }
  const r = Math.round(lightGreen.r + (darkGreen.r - lightGreen.r) * ratio)
  const g = Math.round(lightGreen.g + (darkGreen.g - lightGreen.g) * ratio)
  const b = Math.round(lightGreen.b + (darkGreen.b - lightGreen.b) * ratio)
  return `rgb(${r}, ${g}, ${b})`
}

export default function WorldHeatmap({ countryCounts }: { countryCounts: CountryCount[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const progressRef = useRef(0)

  const getContinentCount = useCallback((continentName: string): number => {
    return countryCounts
      .filter(c => c.continent === continentName)
      .reduce((sum, c) => sum + c.count, 0)
  }, [countryCounts])

  const getMaxCount = useCallback((): number => {
    const continentCounts = CONTINENT_SHAPES.map(s => getContinentCount(s.name))
    return Math.max(...continentCounts, 1)
  }, [getContinentCount])

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
    ctx.clearRect(0, 0, width, height)

    const maxCount = getMaxCount()
    const padding = 20
    const drawWidth = width - padding * 2
    const drawHeight = height - padding * 2

    CONTINENT_SHAPES.forEach((continent) => {
      const count = getContinentCount(continent.name)
      const baseColor = getColorByCount(count, maxCount)
      const alpha = progress
      
      const points = continent.points.map(([px, py]): [number, number] => [
        padding + px * drawWidth,
        padding + py * drawHeight
      ])

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1])
      }
      ctx.closePath()
      ctx.fillStyle = baseColor
      ctx.fill()
      ctx.strokeStyle = count > 0 ? '#27AE60' : '#B8C4D0'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()
    })
  }, [getContinentCount, getMaxCount])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    progressRef.current += 0.025
    if (progressRef.current >= 1) {
      progressRef.current = 1
      draw(ctx, dimensions.width, dimensions.height, 1)
      return
    }

    draw(ctx, dimensions.width, dimensions.height, easeOutCubic(progressRef.current))
    animationRef.current = requestAnimationFrame(animate)
  }, [dimensions, draw])

  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

  const handleResize = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    setDimensions({ width: rect.width * dpr, height: rect.height * dpr })
    
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return

    progressRef.current = 0
    animate()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, animate])

  return (
    <div ref={containerRef} className="chart-container world-map-container">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="chart-canvas"
      />
    </div>
  )
}
