import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioStore } from '../store/useAudioStore'
import type { ColorScheme } from '../store/useAudioStore'

interface ParticleData {
  velocity: THREE.Vector3
  baseColor: THREE.Color
  targetColor: THREE.Color
  colorTransition: number
  speed: number
}

const COLORS = {
  low: { start: new THREE.Color('#FF4500'), end: new THREE.Color('#FF8C00') },
  mid: { start: new THREE.Color('#1E90FF'), end: new THREE.Color('#8A2BE2') },
  high: { start: new THREE.Color('#00FA9A'), end: new THREE.Color('#00CED1') },
}

const SPHERE_RADIUS = 5
const PULSE_THRESHOLD = 0.7
const PULSE_DURATION = 0.3
const PULSE_MULTIPLIER = 3
const COLOR_TRANSITION_SPEED = 2
const MAX_PARTICLES = 2000

const vertexShader = `
  attribute float size;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    vAlpha = 1.0;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = 0.3 + alpha * 0.7;
    
    float glow = 1.0 - smoothstep(0.3, 0.5, dist);
    vec3 finalColor = vColor * (1.0 + glow * 0.5);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

export function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  const particleDataRef = useRef<ParticleData[]>([])
  const pulseTimerRef = useRef(0)
  const prevDensityRef = useRef(500)

  const { density, colorScheme, damping } = useAudioStore(
    (state) => state.particleConfig
  )
  const audioFeatures = useAudioStore((state) => state.audioFeatures)

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {},
    })
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const colors = new Float32Array(MAX_PARTICLES * 3)
    const sizes = new Float32Array(MAX_PARTICLES)

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const pos = randomPointInSphere(SPHERE_RADIUS)
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      colors[i * 3] = 1
      colors[i * 3 + 1] = 1
      colors[i * 3 + 2] = 1

      sizes[i] = 8 + Math.random() * 16
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setDrawRange(0, 500)

    return geo
  }, [])

  useEffect(() => {
    const data: ParticleData[] = []
    const positions = geometry.attributes.position.array as Float32Array

    for (let i = 0; i < MAX_PARTICLES; i++) {
      data.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        baseColor: new THREE.Color(),
        targetColor: new THREE.Color(),
        colorTransition: 1,
        speed: 0.5 + Math.random() * 0.5,
      })

      const color = getColorForIndex(i, colorScheme, audioFeatures)
      data[i].baseColor.copy(color)
      data[i].targetColor.copy(color)
    }

    particleDataRef.current = data
    prevDensityRef.current = density
    updateColorsFromData(geometry, data, density)
  }, [geometry])

  useEffect(() => {
    const data = particleDataRef.current
    if (data.length === 0) return

    if (density !== prevDensityRef.current) {
      adjustParticleCount(geometry, data, prevDensityRef.current, density)
      prevDensityRef.current = density
      geometry.setDrawRange(0, density)
    }
  }, [density, geometry])

  useEffect(() => {
    const data = particleDataRef.current
    if (data.length === 0) return

    for (let i = 0; i < density; i++) {
      const targetColor = getColorForIndex(i, colorScheme, audioFeatures)
      data[i].targetColor.copy(targetColor)
      data[i].colorTransition = 0
    }
  }, [colorScheme, density])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    if (delta > 0.1) delta = 0.1

    const positions = geometry.attributes.position.array as Float32Array
    const colors = geometry.attributes.color.array as Float32Array
    const data = particleDataRef.current
    const { lowFreq, midFreq, highFreq, overallVolume } = audioFeatures

    if (overallVolume > PULSE_THRESHOLD && pulseTimerRef.current <= 0) {
      pulseTimerRef.current = PULSE_DURATION
    }
    if (pulseTimerRef.current > 0) {
      pulseTimerRef.current -= delta
    }

    const pulseMultiplier = pulseTimerRef.current > 0 ? PULSE_MULTIPLIER : 1
    const volumeForce = overallVolume * 0.5 * pulseMultiplier

    const tempPos = new THREE.Vector3()
    const tempForce = new THREE.Vector3()

    for (let i = 0; i < density; i++) {
      const idx = i * 3
      const particle = data[i]
      if (!particle) continue

      tempPos.set(positions[idx], positions[idx + 1], positions[idx + 2])

      tempForce.set(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      )

      const distFromCenter = tempPos.length()
      if (distFromCenter > 0.01) {
        const dirX = tempPos.x / distFromCenter
        const dirY = tempPos.y / distFromCenter
        const dirZ = tempPos.z / distFromCenter

        const freqFactor = getFrequencyFactor(i, lowFreq, midFreq, highFreq)
        const forceMag = volumeForce * 0.02 * (0.5 + freqFactor) * particle.speed

        tempForce.x += dirX * forceMag
        tempForce.y += dirY * forceMag
        tempForce.z += dirZ * forceMag
      }

      particle.velocity.x += tempForce.x
      particle.velocity.y += tempForce.y
      particle.velocity.z += tempForce.z

      particle.velocity.x *= damping
      particle.velocity.y *= damping
      particle.velocity.z *= damping

      tempPos.x += particle.velocity.x
      tempPos.y += particle.velocity.y
      tempPos.z += particle.velocity.z

      const newDist = tempPos.length()
      const maxDist = SPHERE_RADIUS * 2
      if (newDist > maxDist) {
        const scale = maxDist / newDist
        tempPos.x *= scale * 0.8
        tempPos.y *= scale * 0.8
        tempPos.z *= scale * 0.8
        particle.velocity.x *= -0.3
        particle.velocity.y *= -0.3
        particle.velocity.z *= -0.3
      }

      positions[idx] = tempPos.x
      positions[idx + 1] = tempPos.y
      positions[idx + 2] = tempPos.z

      if (particle.colorTransition < 1) {
        particle.colorTransition = Math.min(
          1,
          particle.colorTransition + delta * COLOR_TRANSITION_SPEED
        )
        particle.baseColor.lerp(particle.targetColor, delta * COLOR_TRANSITION_SPEED)
      }

      const brightness = 0.7 + overallVolume * 0.3
      colors[idx] = particle.baseColor.r * brightness
      colors[idx + 1] = particle.baseColor.g * brightness
      colors[idx + 2] = particle.baseColor.b * brightness
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />
  )
}

function randomPointInSphere(radius: number): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = Math.cbrt(Math.random()) * radius

  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  )
}

function getColorForIndex(
  index: number,
  scheme: ColorScheme,
  features: { lowFreq: number; midFreq: number; highFreq: number }
): THREE.Color {
  const hash = ((index * 137.508) % 360) / 360

  switch (scheme) {
    case 'fast': {
      if (hash < 0.33) {
        return COLORS.low.start.clone().lerp(COLORS.low.end, Math.random())
      } else if (hash < 0.66) {
        return COLORS.mid.start.clone().lerp(COLORS.mid.end, Math.random())
      } else {
        return COLORS.high.start.clone().lerp(COLORS.high.end, Math.random())
      }
    }
    case 'smooth': {
      const color = new THREE.Color()
      const total = features.lowFreq + features.midFreq + features.highFreq + 0.01
      const lowWeight = features.lowFreq / total
      const midWeight = features.midFreq / total
      const highWeight = features.highFreq / total

      const lowColor = COLORS.low.start.clone().lerp(COLORS.low.end, hash)
      const midColor = COLORS.mid.start.clone().lerp(COLORS.mid.end, hash)
      const highColor = COLORS.high.start.clone().lerp(COLORS.high.end, hash)

      color.r = lowColor.r * lowWeight + midColor.r * midWeight + highColor.r * highWeight
      color.g = lowColor.g * lowWeight + midColor.g * midWeight + highColor.g * highWeight
      color.b = lowColor.b * lowWeight + midColor.b * midWeight + highColor.b * highWeight

      return color
    }
    case 'monochrome': {
      const baseColor = COLORS.high.start.clone().lerp(COLORS.high.end, 0.5)
      return baseColor.clone().multiplyScalar(0.5 + hash * 0.5)
    }
    default:
      return COLORS.mid.start.clone()
  }
}

function getFrequencyFactor(
  index: number,
  low: number,
  mid: number,
  high: number
): number {
  const hash = ((index * 137.508) % 360) / 360
  if (hash < 0.33) return low
  if (hash < 0.66) return mid
  return high
}

function updateColorsFromData(
  geometry: THREE.BufferGeometry,
  data: ParticleData[],
  count: number
): void {
  const colors = geometry.attributes.color.array as Float32Array
  for (let i = 0; i < count && i < data.length; i++) {
    colors[i * 3] = data[i].baseColor.r
    colors[i * 3 + 1] = data[i].baseColor.g
    colors[i * 3 + 2] = data[i].baseColor.b
  }
  geometry.attributes.color.needsUpdate = true
}

function adjustParticleCount(
  geometry: THREE.BufferGeometry,
  data: ParticleData[],
  oldCount: number,
  newCount: number
): void {
  const positions = geometry.attributes.position.array as Float32Array

  if (newCount > oldCount) {
    for (let i = oldCount; i < newCount; i++) {
      const pos = randomPointInSphere(SPHERE_RADIUS * 0.5)
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      if (data[i]) {
        data[i].velocity.set(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        )
      }
    }
  } else {
    const indicesWithDist: { index: number; dist: number }[] = []
    for (let i = 0; i < oldCount; i++) {
      const dist = Math.sqrt(
        positions[i * 3] ** 2 +
        positions[i * 3 + 1] ** 2 +
        positions[i * 3 + 2] ** 2
      )
      indicesWithDist.push({ index: i, dist })
    }

    indicesWithDist.sort((a, b) => b.dist - a.dist)

    const toRemove = new Set(
      indicesWithDist.slice(0, oldCount - newCount).map((item) => item.index)
    )

    let writeIdx = 0
    for (let i = 0; i < oldCount; i++) {
      if (!toRemove.has(i)) {
        if (writeIdx !== i) {
          positions[writeIdx * 3] = positions[i * 3]
          positions[writeIdx * 3 + 1] = positions[i * 3 + 1]
          positions[writeIdx * 3 + 2] = positions[i * 3 + 2]
          data[writeIdx] = data[i]
        }
        writeIdx++
      }
    }
  }

  geometry.attributes.position.needsUpdate = true
}
