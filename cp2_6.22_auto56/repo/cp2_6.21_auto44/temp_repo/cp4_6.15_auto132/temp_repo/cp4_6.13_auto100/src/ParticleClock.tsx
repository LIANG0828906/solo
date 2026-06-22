import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, themeColors, type Theme, type Speed } from './store'
import { generateTimePoints, easeInOutCubic } from './morphParticles'

const DIGIT_WIDTH = 50
const DIGIT_HEIGHT = 90
const DIGIT_SPACING = 12
const MORPH_DURATION = 1.8
const COLOR_TRANSITION_DURATION = 1.2
const DENSITY_TRANSITION_DURATION = 0.6
const MAX_PARTICLES = 800

interface ParticleData {
  baseX: number
  baseY: number
  phaseX: number
  phaseY: number
  frequencyX: number
  frequencyY: number
  amplitudeX: number
  amplitudeY: number
  gravityPhase: number
  gravitySpeed: number
  gravityAmp: number
  colorOffset: number
  sizeBase: number
  sizePhase: number
}

const vertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  
  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 0.6);
    
    gl_FragColor = vec4(vColor, alpha * 0.95);
  }
`

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      }
    : { r: 1, g: 1, b: 1 }
}

function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t
  }
}

function getSpeedMultiplier(speed: Speed): number {
  switch (speed) {
    case 'slow':
      return 0.5
    case 'medium':
      return 1.0
    case 'fast':
      return 2.0
  }
}

function getColorForIndex(
  theme: Theme,
  index: number,
  total: number,
  offset: number
): { r: number; g: number; b: number } {
  const colors = themeColors[theme]
  const rgb1 = hexToRgb(colors.primary)
  const rgb2 = hexToRgb(colors.secondary)
  const rgb3 = hexToRgb(colors.accent)

  const t = ((index / total) + offset) % 1

  if (t < 0.5) {
    return lerpColor(rgb1, rgb2, t * 2)
  } else {
    return lerpColor(rgb2, rgb3, (t - 0.5) * 2)
  }
}

function generateParticleData(
  count: number,
  basePoints: { x: number; y: number }[]
): ParticleData[] {
  const particles: ParticleData[] = []

  for (let i = 0; i < count; i++) {
    const pointIndex = i % basePoints.length
    const basePoint = basePoints[pointIndex]

    particles.push({
      baseX: basePoint.x + (Math.random() - 0.5) * 2,
      baseY: basePoint.y + (Math.random() - 0.5) * 2,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      frequencyX: 0.2 + Math.random() * 0.6,
      frequencyY: 0.2 + Math.random() * 0.6,
      amplitudeX: 2 + Math.random() * 4,
      amplitudeY: 2 + Math.random() * 4,
      gravityPhase: Math.random() * Math.PI * 2,
      gravitySpeed: 0.6 + Math.random() * 0.6,
      gravityAmp: 1 + Math.random() * 2,
      colorOffset: Math.random() * 0.15,
      sizeBase: 2.5 + Math.random() * 1.5,
      sizePhase: Math.random() * Math.PI * 2
    })
  }

  return particles
}

export default function ParticleClock() {
  const pointsRef = useRef<THREE.Points>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const theme = useStore((state) => state.theme)
  const targetTime = useStore((state) => state.targetTime)
  const density = useStore((state) => state.density)
  const speed = useStore((state) => state.speed)
  const morphTrigger = useStore((state) => state.morphTrigger)
  const isRealTime = useStore((state) => state.isRealTime)
  const setSeconds = useStore((state) => state.setSeconds)

  const [particleData, setParticleData] = useState<ParticleData[]>([])
  const [initialized, setInitialized] = useState(false)

  const morphStateRef = useRef<{
    active: boolean
    startTime: number
    fromPositions: Float32Array
    toBasePoints: { x: number; y: number }[]
  }>({ active: false, startTime: 0, fromPositions: new Float32Array(), toBasePoints: [] })

  const colorTransitionRef = useRef<{
    active: boolean
    startTime: number
    fromTheme: Theme
  }>({ active: false, startTime: 0, fromTheme: 'aurora' })

  const densityTransitionRef = useRef<{
    active: boolean
    startTime: number
    fromCount: number
    toCount: number
  }>({ active: false, startTime: 0, fromCount: 0, toCount: 0 })

  const prevDensityRef = useRef(density)
  const prevThemeRef = useRef(theme)
  const prevTimeRef = useRef(
    `${targetTime.hours}:${targetTime.minutes}:${targetTime.seconds}`
  )

  const positions = useMemo(() => new Float32Array(MAX_PARTICLES * 3), [])
  const colors = useMemo(() => new Float32Array(MAX_PARTICLES * 3), [])
  const sizes = useMemo(() => new Float32Array(MAX_PARTICLES), [])

  const currentBasePoints = useMemo(() => {
    const particlesPerDigit = Math.floor(density / 6)
    return generateTimePoints(
      targetTime.hours,
      targetTime.minutes,
      targetTime.seconds,
      particlesPerDigit,
      DIGIT_WIDTH,
      DIGIT_HEIGHT,
      DIGIT_SPACING
    )
  }, [targetTime.hours, targetTime.minutes, targetTime.seconds, density])

  useEffect(() => {
    if (!initialized && currentBasePoints.length > 0) {
      const newParticles = generateParticleData(density, currentBasePoints)
      setParticleData(newParticles)
      setInitialized(true)
    }
  }, [initialized, density, currentBasePoints])

  useEffect(() => {
    if (!initialized || particleData.length === 0) return

    const timeKey = `${targetTime.hours}:${targetTime.minutes}:${targetTime.seconds}`
    if (timeKey !== prevTimeRef.current) {
      prevTimeRef.current = timeKey

      const currentPos = new Float32Array(particleData.length * 3)
      for (let i = 0; i < particleData.length && i * 3 < positions.length; i++) {
        currentPos[i * 3] = positions[i * 3]
        currentPos[i * 3 + 1] = positions[i * 3 + 1]
        currentPos[i * 3 + 2] = 0
      }

      morphStateRef.current = {
        active: true,
        startTime: performance.now(),
        fromPositions: currentPos,
        toBasePoints: currentBasePoints
      }
    }
  }, [targetTime, initialized, particleData, currentBasePoints, positions])

  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      colorTransitionRef.current = {
        active: true,
        startTime: performance.now(),
        fromTheme: prevThemeRef.current
      }
      prevThemeRef.current = theme
    }
  }, [theme])

  useEffect(() => {
    if (prevDensityRef.current !== density && initialized && particleData.length > 0) {
      densityTransitionRef.current = {
        active: true,
        startTime: performance.now(),
        fromCount: prevDensityRef.current,
        toCount: density
      }
      prevDensityRef.current = density
    }
  }, [density, initialized, particleData.length])

  useEffect(() => {
    if (!isRealTime) return

    const interval = setInterval(() => {
      const now = new Date()
      setSeconds(now.getSeconds())
    }, 1000)

    return () => clearInterval(interval)
  }, [isRealTime, setSeconds])

  useEffect(() => {
    if (densityTransitionRef.current.active) return

    if (
      initialized &&
      particleData.length > 0 &&
      particleData.length !== density
    ) {
      const newParticles = generateParticleData(density, currentBasePoints)
      setParticleData(newParticles)
    }
  }, [density, currentBasePoints, initialized, particleData.length])

  const getMorphedPosition = useCallback(
    (
      index: number,
      progress: number,
      fromPos: Float32Array,
      toPoints: { x: number; y: number }[],
      scatterAmount: number = 120
    ): { x: number; y: number } => {
      const idx = index * 3
      const fromX = fromPos[idx] || 0
      const fromY = fromPos[idx + 1] || 0

      const targetIndex = index % toPoints.length
      const toX = toPoints[targetIndex]?.x || 0
      const toY = toPoints[targetIndex]?.y || 0

      const angle = (index * 137.5 * Math.PI) / 180

      if (progress < 0.5) {
        const t = progress * 2
        const scatterT = easeInOutCubic(t)
        const dist = scatterAmount * scatterT

        return {
          x: fromX + Math.cos(angle) * dist,
          y: fromY + Math.sin(angle) * dist * 0.8
        }
      } else {
        const t = (progress - 0.5) * 2
        const gatherT = 1 - Math.pow(1 - t, 3)
        const dist = scatterAmount * (1 - gatherT)

        return {
          x: toX + Math.cos(angle) * dist,
          y: toY + Math.sin(angle) * dist * 0.8
        }
      }
    },
    []
  )

  useFrame(() => {
    if (!geometryRef.current || particleData.length === 0) return

    const now = performance.now()
    const speedMult = getSpeedMultiplier(speed)
    const time = now * 0.001 * speedMult

    const posArray = positions
    const colArray = colors
    const sizeArray = sizes

    let morphProgress = 0
    let morphActive = false

    if (morphStateRef.current.active) {
      morphProgress = (now - morphStateRef.current.startTime) / (MORPH_DURATION * 1000)
      if (morphProgress >= 1) {
        morphStateRef.current.active = false
        morphProgress = 1
      }
      morphActive = morphStateRef.current.active || morphProgress < 1
    }

    let colorProgress = 1
    if (colorTransitionRef.current.active) {
      colorProgress = (now - colorTransitionRef.current.startTime) / (COLOR_TRANSITION_DURATION * 1000)
      if (colorProgress >= 1) {
        colorTransitionRef.current.active = false
        colorProgress = 1
      }
    }

    let displayCount = particleData.length
    let densityProgress = 1
    let densityFrom = density
    let densityTo = density

    if (densityTransitionRef.current.active) {
      densityProgress = (now - densityTransitionRef.current.startTime) / (DENSITY_TRANSITION_DURATION * 1000)
      if (densityProgress >= 1) {
        densityTransitionRef.current.active = false
        densityProgress = 1
      }
      densityFrom = densityTransitionRef.current.fromCount
      densityTo = densityTransitionRef.current.toCount
      displayCount = Math.round(densityFrom + (densityTo - densityFrom) * densityProgress)
    }

    const effectiveCount = Math.min(displayCount, MAX_PARTICLES)

    for (let i = 0; i < effectiveCount; i++) {
      const idx = i * 3
      const particle = particleData[i % particleData.length]

      let px: number, py: number

      if (morphActive && morphStateRef.current.fromPositions.length > 0) {
        const morphed = getMorphedPosition(
          i,
          Math.min(morphProgress, 1),
          morphStateRef.current.fromPositions,
          morphStateRef.current.toBasePoints
        )
        px = morphed.x
        py = morphed.y
      } else {
        px = particle.baseX
        py = particle.baseY
      }

      const brownianX = Math.sin(time * particle.frequencyX + particle.phaseX) * particle.amplitudeX
      const brownianY = Math.cos(time * particle.frequencyY + particle.phaseY) * particle.amplitudeY
      const gravityY = Math.sin(time * particle.gravitySpeed + particle.gravityPhase) * particle.gravityAmp

      let finalX = px + brownianX
      let finalY = py + brownianY + gravityY

      if (densityTransitionRef.current.active) {
        if (densityTo > densityFrom && i >= densityFrom) {
          const flyProgress = (i - densityFrom) / Math.max(1, densityTo - densityFrom)
          if (flyProgress > densityProgress) {
            const edgeAngle = (i * 17) % (Math.PI * 2)
            const ratio = densityProgress / Math.max(flyProgress, 0.01)
            const edgeDist = 500 * (1 - ratio)
            finalX += Math.cos(edgeAngle) * edgeDist
            finalY += Math.sin(edgeAngle) * edgeDist * 0.6
          }
        } else if (densityTo < densityFrom && i >= densityTo) {
          const fadeProgress = (i - densityTo) / Math.max(1, densityFrom - densityTo)
          if (fadeProgress < densityProgress) {
            const edgeAngle = (i * 19) % (Math.PI * 2)
            const ratio = (densityProgress - fadeProgress) / Math.max(1 - fadeProgress, 0.01)
            const edgeDist = 500 * ratio
            finalX += Math.cos(edgeAngle) * edgeDist
            finalY += Math.sin(edgeAngle) * edgeDist * 0.6
          }
        }
      }

      posArray[idx] = finalX
      posArray[idx + 1] = finalY
      posArray[idx + 2] = 0

      let colorRgb: { r: number; g: number; b: number }

      if (colorTransitionRef.current.active && colorProgress < 1) {
        const fromColor = getColorForIndex(
          colorTransitionRef.current.fromTheme,
          i,
          particleData.length,
          particle.colorOffset
        )
        const toColor = getColorForIndex(theme, i, particleData.length, particle.colorOffset)
        colorRgb = lerpColor(fromColor, toColor, colorProgress)
      } else {
        colorRgb = getColorForIndex(theme, i, particleData.length, particle.colorOffset)
      }

      colArray[idx] = colorRgb.r
      colArray[idx + 1] = colorRgb.g
      colArray[idx + 2] = colorRgb.b

      const pulseSize = particle.sizeBase + Math.sin(time * 1.5 + particle.sizePhase) * 0.4
      sizeArray[i] = pulseSize
    }

    for (let i = effectiveCount; i < MAX_PARTICLES; i++) {
      posArray[i * 3] = 0
      posArray[i * 3 + 1] = -500
      posArray[i * 3 + 2] = 0
      sizeArray[i] = 0
    }

    const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute
    const colAttr = geometryRef.current.attributes.aColor as THREE.BufferAttribute
    const sizeAttr = geometryRef.current.attributes.aSize as THREE.BufferAttribute

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
  })

  const uniforms = useMemo(
    () => ({
      pointTexture: { value: null }
    }),
    []
  )

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_PARTICLES}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={MAX_PARTICLES}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={MAX_PARTICLES}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
