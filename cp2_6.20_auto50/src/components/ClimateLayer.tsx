import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useClimateStore } from '@/store/useClimateStore'
import { getColorScale } from '@/utils/colorScale'
import { latLonToVector3 } from '@/utils/geoUtils'
import * as THREE from 'three'
import type { Points, Texture } from 'three'

const MAX_PARTICLES = 5000

function createCircleTexture(): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  if (!context) return new THREE.Texture()
  
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export default function ClimateLayer() {
  const pointsRef = useRef<Points>(null)
  const currentYear = useClimateStore((state) => state.currentYear)
  const dataType = useClimateStore((state) => state.dataType)
  const climateData = useClimateStore((state) => state.climateData)
  const displayYearRef = useRef(currentYear)

  const particleTexture = useMemo(() => createCircleTexture(), [])

  const years = useMemo(() => {
    return Object.keys(climateData).map(Number).sort((a, b) => a - b)
  }, [climateData])

  const { yearDataList, count, isLowDetail } = useMemo(() => {
    if (years.length === 0) {
      return { yearDataList: [], count: 0, isLowDetail: false }
    }

    const firstYear = years[0]
    const firstYearData = climateData[firstYear]
    const firstDataPoints = firstYearData?.[dataType] || []
    const limitedCount = Math.min(firstDataPoints.length, MAX_PARTICLES)
    const isLowDetail = limitedCount > 2000
    const colorScale = getColorScale(dataType)

    const yearDataList: Array<{
      positions: Float32Array
      colors: Float32Array
    }> = []

    for (let y = 0; y < years.length; y++) {
      const year = years[y]
      const yearData = climateData[year]
      const dataPoints = yearData?.[dataType] || []

      const posArray = new Float32Array(limitedCount * 3)
      const colArray = new Float32Array(limitedCount * 3)

      for (let i = 0; i < limitedCount; i++) {
        const point = dataPoints[i] || firstDataPoints[i]

        const [x, yp, z] = latLonToVector3(point.lat, point.lon, 1.02)
        posArray[i * 3] = x
        posArray[i * 3 + 1] = yp
        posArray[i * 3 + 2] = z

        const color = new THREE.Color(colorScale(point.value))
        colArray[i * 3] = color.r
        colArray[i * 3 + 1] = color.g
        colArray[i * 3 + 2] = color.b
      }

      yearDataList.push({ positions: posArray, colors: colArray })
    }

    return { yearDataList, count: limitedCount, isLowDetail }
  }, [climateData, dataType, years])

  useEffect(() => {
    if (pointsRef.current && yearDataList.length > 0) {
      const geometry = pointsRef.current.geometry
      const posAttr = geometry.attributes.position
      const colAttr = geometry.attributes.color
      if (posAttr && colAttr) {
        posAttr.needsUpdate = true
        colAttr.needsUpdate = true
      }
    }
  }, [yearDataList, count])

  useFrame((_state, delta) => {
    displayYearRef.current += (currentYear - displayYearRef.current) * delta * 2

    if (!pointsRef.current || yearDataList.length === 0) return
    const geometry = pointsRef.current.geometry
    if (!geometry) return

    const posAttr = geometry.attributes.position
    const colAttr = geometry.attributes.color
    if (!posAttr || !colAttr) return

    let year0 = years[0]
    let year1 = years[years.length - 1]
    let idx0 = 0
    let idx1 = years.length - 1

    for (let i = 0; i < years.length - 1; i++) {
      if (displayYearRef.current >= years[i] && displayYearRef.current <= years[i + 1]) {
        idx0 = i
        idx1 = i + 1
        year0 = years[i]
        year1 = years[i + 1]
        break
      }
    }

    if (displayYearRef.current <= years[0]) {
      idx0 = 0
      idx1 = 0
      year0 = years[0]
      year1 = years[0]
    }
    if (displayYearRef.current >= years[years.length - 1]) {
      idx0 = years.length - 1
      idx1 = years.length - 1
      year0 = years[years.length - 1]
      year1 = years[years.length - 1]
    }

    const t = year1 !== year0 ? (displayYearRef.current - year0) / (year1 - year0) : 0
    const clampedT = Math.max(0, Math.min(1, t))

    const posArray = posAttr.array as Float32Array
    const colArray = colAttr.array as Float32Array
    const data0 = yearDataList[idx0]
    const data1 = yearDataList[idx1]

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      posArray[i3] = lerp(data0.positions[i3], data1.positions[i3], clampedT)
      posArray[i3 + 1] = lerp(data0.positions[i3 + 1], data1.positions[i3 + 1], clampedT)
      posArray[i3 + 2] = lerp(data0.positions[i3 + 2], data1.positions[i3 + 2], clampedT)

      colArray[i3] = lerp(data0.colors[i3], data1.colors[i3], clampedT)
      colArray[i3 + 1] = lerp(data0.colors[i3 + 1], data1.colors[i3 + 1], clampedT)
      colArray[i3 + 2] = lerp(data0.colors[i3 + 2], data1.colors[i3 + 2], clampedT)
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
  })

  const particleSize = isLowDetail ? 0.02 : 0.025
  const opacity = isLowDetail ? 0.7 : 0.9

  const initialPositions = yearDataList.length > 0 ? yearDataList[0].positions : new Float32Array()
  const initialColors = yearDataList.length > 0 ? yearDataList[0].colors : new Float32Array()

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={initialPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={initialColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        map={particleTexture}
        alphaTest={0.01}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
