import * as THREE from 'three'
import type { RiverPath, interpolateOnPath } from './PathLoader'

export interface FlowParticle {
  index: number
  pathId: string
  t: number
  speedWorldUnitsPerSec: number
  tPerSec: number
  baseSize: number
  opacity: number
  baseColor: THREE.Color
  currentColor: THREE.Color
  highlightTarget: THREE.Color
  isHighlighted: boolean
  phaseOffset: number
  sparklePhase: number
}

export interface FlowParticlesSystem {
  particles: FlowParticle[]
  points: THREE.Points
  trailPoints: THREE.Points
  geometry: THREE.BufferGeometry
  material: THREE.PointsMaterial
  trailGeometry: THREE.BufferGeometry
  trailMaterial: THREE.PointsMaterial
  update: (
    deltaSec: number,
    paths: RiverPath[],
    pathFlowMap: Record<string, number>,
    totalParticles: number,
    interpolate: typeof interpolateOnPath,
    highlightedParticleIndex: number | null
  ) => void
  getParticlePathCounts: () => Record<string, number>
  getTotalParticleCount: () => number
  getAverageSpeedByPath: () => Record<string, number>
  getPathMinMaxFlow: () => { min: number; max: number }
}

const COLOR_STOPS: Array<{ pos: number; color: THREE.Color }> = [
  { pos: 0.0, color: new THREE.Color(0xb0e0e6) },
  { pos: 0.25, color: new THREE.Color(0x40e0d0) },
  { pos: 0.55, color: new THREE.Color(0x1e90ff) },
  { pos: 0.85, color: new THREE.Color(0x00008b) }
]
const HIGHLIGHT_COLOR = new THREE.Color(0xffffff)
const WHITE_TINT = new THREE.Color(0xffffff)

const TRAIL_SEGMENTS = 3
const TRAIL_T_OFFSETS = [0.006, 0.014, 0.024]
const TRAIL_SIZE_FACTORS = [0.75, 0.55, 0.38]
const TRAIL_BRIGHTNESS_FACTORS = [0.7, 0.45, 0.25]
const BASE_SPEED_REFERENCE = 15
const SIZE_MIN_MULTIPLIER = 0.55
const SIZE_MAX_MULTIPLIER = 1.55

function multiStopLerp(out: THREE.Color, t: number) {
  const stops = COLOR_STOPS
  if (t <= stops[0].pos) {
    out.copy(stops[0].color)
    return
  }
  if (t >= stops[stops.length - 1].pos) {
    out.copy(stops[stops.length - 1].color)
    return
  }
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (t >= a.pos && t <= b.pos) {
      const span = b.pos - a.pos
      const local = span > 0 ? (t - a.pos) / span : 0
      out.r = a.color.r + (b.color.r - a.color.r) * local
      out.g = a.color.g + (b.color.g - a.color.g) * local
      out.b = a.color.b + (b.color.b - a.color.b) * local
      return
    }
  }
  out.copy(stops[stops.length - 1].color)
}

export function createFlowParticles(paths: RiverPath[]): FlowParticlesSystem {
  const allParticles: FlowParticle[] = []
  let globalIndex = 0
  const particleCounts: Record<string, number> = {}

  for (const path of paths) {
    const count = 50 + Math.floor(Math.random() * 31)
    particleCounts[path.id] = count
    for (let i = 0; i < count; i++) {
      const speedWorld = 10 + Math.random() * 10
      const tPerSec = speedWorld / Math.max(path.arcLength, 1)
      allParticles.push({
        index: globalIndex++,
        pathId: path.id,
        t: Math.random() * 0.3,
        speedWorldUnitsPerSec: speedWorld,
        tPerSec,
        baseSize: 2 + Math.random() * 2,
        opacity: 0.6 + Math.random() * 0.3,
        baseColor: COLOR_STOPS[0].color.clone(),
        currentColor: COLOR_STOPS[0].color.clone(),
        highlightTarget: COLOR_STOPS[0].color.clone(),
        isHighlighted: false,
        phaseOffset: Math.random() * Math.PI * 2,
        sparklePhase: Math.random() * 100
      })
    }
  }

  const totalCount = allParticles.length
  const positions = new Float32Array(totalCount * 3)
  const colors = new Float32Array(totalCount * 3)
  const sizes = new Float32Array(totalCount)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false

  const trailTotal = totalCount * TRAIL_SEGMENTS
  const trailPositions = new Float32Array(trailTotal * 3)
  const trailColors = new Float32Array(trailTotal * 3)
  const trailSizes = new Float32Array(trailTotal)

  const trailGeometry = new THREE.BufferGeometry()
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
  trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3))
  trailGeometry.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1))

  const trailMaterial = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  const trailPoints = new THREE.Points(trailGeometry, trailMaterial)
  trailPoints.frustumCulled = false

  function modOne(v: number): number {
    const r = v % 1
    return r < 0 ? r + 1 : r
  }

  function updatePositions(paths: RiverPath[]) {
    const pathMap: Record<string, RiverPath> = {}
    for (const p of paths) pathMap[p.id] = p
    for (const particle of allParticles) {
      const path = pathMap[particle.pathId]
      if (!path) continue
      const pos = path.curve.getPoint(particle.t)
      const i3 = particle.index * 3
      positions[i3] = pos.x
      positions[i3 + 1] = pos.y
      positions[i3 + 2] = pos.z
    }
    geometry.attributes.position.needsUpdate = true
  }

  updatePositions(paths)

  return {
    particles: allParticles,
    points,
    trailPoints,
    geometry,
    material,
    trailGeometry,
    trailMaterial,

    update(
      deltaSec,
      paths,
      pathFlowMap,
      totalParticles,
      interpolate,
      highlightedParticleIndex
    ) {
      const pathMap: Record<string, RiverPath> = {}
      for (const p of paths) pathMap[p.id] = p

      const tmpColor = new THREE.Color()
      const sparkleBaseTime = performance.now() * 0.001

      for (const particle of allParticles) {
        particle.t += particle.tPerSec * deltaSec
        if (particle.t >= 1) {
          particle.t = Math.random() * 0.1
        }
        particle.sparklePhase += deltaSec

        const path = pathMap[particle.pathId]
        if (!path) continue
        const pos = interpolate(path, particle.t)
        const idx = particle.index * 3
        positions[idx] = pos.x
        positions[idx + 1] = pos.y
        positions[idx + 2] = pos.z

        const flowCount = pathFlowMap[path.id] ?? 0
        const ratio = totalParticles > 0 ? flowCount / totalParticles : 0
        const clamped = Math.max(0, Math.min(1, ratio * 3))
        multiStopLerp(particle.baseColor, clamped)

        const sparkleWave =
          0.45 + 0.55 * Math.sin(particle.sparklePhase * 2.2 + particle.phaseOffset)
        const speedBoost =
          0.1 + 0.45 * ((particle.speedWorldUnitsPerSec - 10) / 10)
        const sparkleAmount = Math.max(0, Math.min(0.35, sparkleWave * speedBoost))

        tmpColor.copy(particle.baseColor)
        tmpColor.lerp(WHITE_TINT, sparkleAmount)

        const speedRatio = BASE_SPEED_REFERENCE / particle.speedWorldUnitsPerSec
        let sizeMul = speedRatio
        if (sizeMul < SIZE_MIN_MULTIPLIER) sizeMul = SIZE_MIN_MULTIPLIER
        if (sizeMul > SIZE_MAX_MULTIPLIER) sizeMul = SIZE_MAX_MULTIPLIER
        const dynamicSize = particle.baseSize * sizeMul

        if (particle.index === highlightedParticleIndex) {
          particle.currentColor.lerp(HIGHLIGHT_COLOR, 0.2)
          sizes[particle.index] = 6
        } else {
          particle.currentColor.lerp(tmpColor, 0.2)
          sizes[particle.index] = dynamicSize
        }

        colors[idx] = particle.currentColor.r
        colors[idx + 1] = particle.currentColor.g
        colors[idx + 2] = particle.currentColor.b

        for (let s = 0; s < TRAIL_SEGMENTS; s++) {
          const trailIdx = particle.index * TRAIL_SEGMENTS + s
          const trailT = modOne(particle.t - TRAIL_T_OFFSETS[s])
          const tPos = path.curve.getPoint(trailT)
          const ti3 = trailIdx * 3
          trailPositions[ti3] = tPos.x
          trailPositions[ti3 + 1] = tPos.y
          trailPositions[ti3 + 2] = tPos.z

          const bf = TRAIL_BRIGHTNESS_FACTORS[s]
          trailColors[ti3] = particle.currentColor.r * bf
          trailColors[ti3 + 1] = particle.currentColor.g * bf
          trailColors[ti3 + 2] = particle.currentColor.b * bf

          if (particle.index === highlightedParticleIndex) {
            trailSizes[trailIdx] = 6 * TRAIL_SIZE_FACTORS[s]
            trailColors[ti3] = HIGHLIGHT_COLOR.r * bf
            trailColors[ti3 + 1] = HIGHLIGHT_COLOR.g * bf
            trailColors[ti3 + 2] = HIGHLIGHT_COLOR.b * bf
          } else {
            trailSizes[trailIdx] = dynamicSize * TRAIL_SIZE_FACTORS[s]
          }
        }
      }

      geometry.attributes.position.needsUpdate = true
      geometry.attributes.color.needsUpdate = true
      ;(geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true
      trailGeometry.attributes.position.needsUpdate = true
      trailGeometry.attributes.color.needsUpdate = true
      ;(trailGeometry.attributes.size as THREE.BufferAttribute).needsUpdate = true
    },

    getParticlePathCounts() {
      const counts: Record<string, number> = {}
      for (const p of allParticles) {
        counts[p.pathId] = (counts[p.pathId] ?? 0) + 1
      }
      return counts
    },

    getTotalParticleCount() {
      return allParticles.length
    },

    getAverageSpeedByPath() {
      const sums: Record<string, number> = {}
      const count: Record<string, number> = {}
      for (const p of allParticles) {
        sums[p.pathId] = (sums[p.pathId] ?? 0) + p.speedWorldUnitsPerSec
        count[p.pathId] = (count[p.pathId] ?? 0) + 1
      }
      const avg: Record<string, number> = {}
      for (const id of Object.keys(sums)) {
        avg[id] = count[id] > 0 ? sums[id] / count[id] : 0
      }
      return avg
    },

    getPathMinMaxFlow() {
      let min = Infinity
      let max = -Infinity
      for (const p of Object.values(particleCounts)) {
        if (p < min) min = p
        if (p > max) max = p
      }
      return { min, max }
    }
  }
}
