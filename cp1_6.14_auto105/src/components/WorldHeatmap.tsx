import { useRef, useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import type { TravelStats } from '@/types'
import { COUNTRY_NAMES_ZH_TO_EN } from '@/utils/geo'

type CountryCount = TravelStats['countryCounts'][number]

interface GeoFeature {
  type: string
  id?: string | number
  properties: { name?: string; id?: string | number }
  geometry: {
    type: string
    coordinates: number[][][] | number[][][][]
  }
}

interface GeoJSONData {
  type: string
  features: GeoFeature[]
}

function getColorByCount(count: number, maxCount: number): string {
  if (count <= 0) return '#E8E4DC'
  const ratio = Math.min(count / Math.max(maxCount, 1), 1)
  const lightGreen = { r: 198, g: 233, b: 198 }
  const darkGreen = { r: 39, g: 174, b: 96 }
  const r = Math.round(lightGreen.r + (darkGreen.r - lightGreen.r) * ratio)
  const g = Math.round(lightGreen.g + (darkGreen.g - lightGreen.g) * ratio)
  const b = Math.round(lightGreen.b + (darkGreen.b - lightGreen.b) * ratio)
  return `rgb(${r}, ${g}, ${b})`
}

function lngLatToCanvas(
  lng: number,
  lat: number,
  width: number,
  height: number,
  padding: number
): [number, number] {
  const drawWidth = width - padding * 2
  const drawHeight = height - padding * 2
  const x = padding + ((lng + 180) / 360) * drawWidth
  const y = padding + ((90 - lat) / 180) * drawHeight
  return [x, y]
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  coordinates: number[][],
  width: number,
  height: number,
  padding: number,
  dpr: number
) {
  if (coordinates.length < 3) return
  ctx.beginPath()
  const [startX, startY] = lngLatToCanvas(
    coordinates[0][0],
    coordinates[0][1],
    width,
    height,
    padding
  )
  ctx.moveTo(startX * dpr, startY * dpr)
  for (let i = 1; i < coordinates.length; i++) {
    const [x, y] = lngLatToCanvas(
      coordinates[i][0],
      coordinates[i][1],
      width,
      height,
      padding
    )
    ctx.lineTo(x * dpr, y * dpr)
  }
  ctx.closePath()
}

function processCoordinates(
  ctx: CanvasRenderingContext2D,
  geometry: GeoFeature['geometry'],
  width: number,
  height: number,
  padding: number,
  dpr: number
) {
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates as number[][][]
    if (coords.length > 0) {
      drawPolygon(ctx, coords[0], width, height, padding, dpr)
    }
  } else if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates as number[][][][]
    coords.forEach((polygon) => {
      if (polygon.length > 0) {
        drawPolygon(ctx, polygon[0], width, height, padding, dpr)
      }
    })
  }
}

const GEOJSON_URL =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'

export default function WorldHeatmap({
  countryCounts,
}: {
  countryCounts: CountryCount[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const progressRef = useRef(0)

  const visitedMap = useCallback(() => {
    const map = new Map<string, number>()
    countryCounts.forEach((c) => {
      const enName = COUNTRY_NAMES_ZH_TO_EN[c.country] || c.country
      map.set(enName.toLowerCase(), c.count)
    })
    return map
  }, [countryCounts])

  const maxVisitCount = useCallback(() => {
    if (countryCounts.length === 0) return 1
    return Math.max(...countryCounts.map((c) => c.count), 1)
  }, [countryCounts])

  useEffect(() => {
    let cancelled = false
    axios
      .get<GeoJSONData>(GEOJSON_URL, { timeout: 15000 })
      .then((res) => {
        if (!cancelled && res.data && res.data.features) {
          setGeoData(res.data)
        }
      })
      .catch((err) => {
        console.warn('加载世界地图数据失败:', err)
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
      ctx.clearRect(0, 0, width, height)
      if (!geoData) return

      const dpr = window.devicePixelRatio || 1
      const padding = 10 * dpr
      const vMap = visitedMap()
      const maxCount = maxVisitCount()

      geoData.features.forEach((feature) => {
        const featureName = (
          feature.properties.name || ''
        ).toLowerCase()
        const count = vMap.get(featureName) || 0

        const baseColor = getColorByCount(count, maxCount)

        ctx.save()
        ctx.globalAlpha = progress

        processCoordinates(
          ctx,
          feature.geometry,
          width / dpr,
          height / dpr,
          padding / dpr,
          dpr
        )

        ctx.fillStyle = baseColor
        ctx.fill()

        ctx.strokeStyle = count > 0
          ? 'rgba(39, 174, 96, 0.6)'
          : 'rgba(184, 196, 208, 0.5)'
        ctx.lineWidth = 0.5 * dpr
        ctx.stroke()

        ctx.restore()
      })
    },
    [geoData, visitedMap, maxVisitCount]
  )

  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

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
    if (dimensions.width === 0 || dimensions.height === 0 || !geoData) return

    progressRef.current = 0
    animate()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, geoData, animate])

  return (
    <div ref={containerRef} className="chart-container world-map-container">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="chart-canvas"
      />
      {!geoData && !loadError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#8D6E63',
          fontSize: '0.9rem',
        }}>
          正在加载世界地图数据...
        </div>
      )}
      {loadError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#8D6E63',
          fontSize: '0.9rem',
          textAlign: 'center',
        }}>
          地图数据加载失败
          <br />
          <span style={{ fontSize: '0.8rem' }}>请检查网络连接后刷新页面</span>
        </div>
      )}
    </div>
  )
}
