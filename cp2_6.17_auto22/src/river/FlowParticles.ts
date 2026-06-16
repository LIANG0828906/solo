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
}

export interface FlowParticlesSystem {
  particles: FlowParticle[]
  points: THREE.Points
  geometry: THREE.BufferGeometry
  material: THREE.PointsMaterial
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

const LOW_FLOW_COLOR = new THREE.Color(0x87ceeb)
const HIGH_FLOW_COLOR = new THREE.Color(0x00008b)
const HIGHLIGHT_COLOR = new THREE.Color(0xffffff)

function lerpColor(out: THREE.Color, a: THREE.Color, b: THREE.Color, t: number) {
  out.r = a.r + (b.r - a.r) * t
  out.g = a.g + (b.g - a.g) * t
  out.b = a.b + (b.b - a.b) * t
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
        baseColor: LOW_FLOW_COLOR.clone(),
        currentColor: LOW_FLOW_COLOR.clone(),
        highlightTarget: LOW_FLOW_COLOR.clone(),
        isHighlighted: false
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
  depthWrite: false
})

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false

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
    geometry,
    material,

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

      for (const particle of allParticles) {
        particle.t += particle.tPerSec * deltaSec
        if (particle.t >= 1) {
          particle.t = Math.random() * 0.1
        }

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
        lerpColor(particle.baseColor, LOW_FLOW_COLOR, HIGH_FLOW_COLOR, clamped)

        if (particle.index === highlightedParticleIndex) {
          particle.currentColor.lerp(HIGHLIGHT_COLOR, 0.2)
          sizes[particle.index] = 6
        } else {
          particle.currentColor.lerp(particle.baseColor, 0.15)
          sizes[particle.index] = particle.baseSize
        }

        colors[idx] = particle.currentColor.r
        colors[idx + 1] = particle.currentColor.g
        colors[idx + 2] = particle.currentColor.b
      }

      geometry.attributes.position.needsUpdate = true
      geometry.attributes.color.needsUpdate = true
      ;(geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true
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
