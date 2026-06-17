import { create } from 'zustand'
import * as THREE from 'three'

const PARTICLE_COUNT = 3000
const GALAXY_RADIUS = 80

interface Particle {
  basePosition: THREE.Vector3
  currentPosition: THREE.Vector3
  velocity: THREE.Vector3
  baseColor: THREE.Color
  targetColor: THREE.Color
  currentColor: THREE.Color
  size: number
  distance: number
  angle: number
  speed: number
}

interface GalaxyState {
  particles: Particle[]
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  rotationAngle: number
  rotationSpeed: number
  pulseScale: number
  targetPulseScale: number
  cameraPosition: THREE.Vector3
  cameraTarget: THREE.Vector3
  isResettingView: boolean
  initParticles: () => void
  updateParticles: (lowFreq: number, midFreq: number, highFreq: number, delta: number) => void
  updateGeometryAttributes: (geometry: THREE.BufferGeometry) => void
  resetView: () => void
}

const lerp = (start: number, end: number, t: number): number => start + (end - start) * t

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 1, g: 1, b: 1 }
}

export const useGalaxyStore = create<GalaxyState>((set, get) => ({
  particles: [],
  positions: new Float32Array(PARTICLE_COUNT * 3),
  colors: new Float32Array(PARTICLE_COUNT * 3),
  sizes: new Float32Array(PARTICLE_COUNT),
  rotationAngle: 0,
  rotationSpeed: 0.002,
  pulseScale: 1,
  targetPulseScale: 1,
  cameraPosition: new THREE.Vector3(0, 40, 150),
  cameraTarget: new THREE.Vector3(0, 0, 0),
  isResettingView: false,

  initParticles: () => {
    const particles: Particle[] = []
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)

    const a = 1
    const b = 0.15
    const centerColor = hexToRgb('#ff6b6b')
    const outerColor = hexToRgb('#4a9eff')

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = i / PARTICLE_COUNT
      const theta = t * Math.PI * 8 + Math.random() * 0.5
      const r = a * Math.exp(b * theta) * (GALAXY_RADIUS / (a * Math.exp(b * Math.PI * 8)))
      const distance = r * (0.7 + Math.random() * 0.6)

      const x = distance * Math.cos(theta) + (Math.random() - 0.5) * 4
      const y = (Math.random() - 0.5) * 6
      const z = distance * Math.sin(theta) + (Math.random() - 0.5) * 4

      const basePosition = new THREE.Vector3(x, y, z)
      const currentPosition = basePosition.clone()

      const colorT = Math.min(1, distance / GALAXY_RADIUS)
      const rCol = lerp(centerColor.r, outerColor.r, colorT)
      const gCol = lerp(centerColor.g, outerColor.g, colorT)
      const bCol = lerp(centerColor.b, outerColor.b, colorT)

      const baseColor = new THREE.Color(rCol, gCol, bCol)
      const targetColor = baseColor.clone()
      const currentColor = baseColor.clone()

      const size = 2 + Math.random() * 4

      particles.push({
        basePosition,
        currentPosition,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.02
        ),
        baseColor,
        targetColor,
        currentColor,
        size,
        distance,
        angle: theta,
        speed: 0.001 + Math.random() * 0.002
      })

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      colors[i * 3] = rCol
      colors[i * 3 + 1] = gCol
      colors[i * 3 + 2] = bCol

      sizes[i] = size
    }

    set({ particles, positions, colors, sizes })
  },

  updateParticles: (lowFreq: number, midFreq: number, highFreq: number, delta: number) => {
    const state = get()
    const { particles, positions, colors, sizes } = state

    let rotationSpeed = 0.002 + (lowFreq * 0.002 + midFreq * 0.0015 + highFreq * 0.0005)
    rotationSpeed = Math.max(0.001, Math.min(0.006, rotationSpeed))

    const rotationAngle = state.rotationAngle + rotationSpeed

    const targetPulseScale = 0.95 + lowFreq * 0.1
    const pulseScale = lerp(state.pulseScale, targetPulseScale, 0.1)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = particles[i]

      const colorLerpAmount = 0.02 + midFreq * 0.08
      if (midFreq > 0.3 && Math.random() < 0.02) {
        particle.targetColor.setHSL(Math.random(), 0.7, 0.5 + midFreq * 0.3)
        particle.targetColor.lerp(particle.baseColor, 0.5)
      }
      particle.currentColor.lerp(particle.targetColor, colorLerpAmount)
      particle.currentColor.lerp(particle.baseColor, 0.01)

      let speedMultiplier = 1
      if (particle.distance > 50) {
        speedMultiplier = 1 + highFreq * 0.1
      }

      particle.angle += particle.speed * speedMultiplier * 60 * delta

      const rotatedX = particle.basePosition.x * Math.cos(rotationAngle) - particle.basePosition.z * Math.sin(rotationAngle)
      const rotatedZ = particle.basePosition.x * Math.sin(rotationAngle) + particle.basePosition.z * Math.cos(rotationAngle)

      const pulseOffset = (particle.distance / GALAXY_RADIUS) * (pulseScale - 1)
      const px = rotatedX * pulseScale + rotatedX * pulseOffset + particle.velocity.x * 10 * highFreq
      const py = particle.basePosition.y + particle.velocity.y * 5 * highFreq
      const pz = rotatedZ * pulseScale + rotatedZ * pulseOffset + particle.velocity.z * 10 * highFreq

      particle.currentPosition.set(px, py, pz)

      positions[i * 3] = px
      positions[i * 3 + 1] = py
      positions[i * 3 + 2] = pz

      colors[i * 3] = particle.currentColor.r
      colors[i * 3 + 1] = particle.currentColor.g
      colors[i * 3 + 2] = particle.currentColor.b

      sizes[i] = particle.size * (1 + lowFreq * 0.3)
    }

    set({ rotationAngle, rotationSpeed, pulseScale, targetPulseScale })
  },

  updateGeometryAttributes: (geometry: THREE.BufferGeometry) => {
    const { positions, colors, sizes } = get()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    geometry.attributes.size.needsUpdate = true
  },

  resetView: () => {
    set({ isResettingView: true })
    const startPos = get().cameraPosition.clone()
    const endPos = new THREE.Vector3(0, 40, 150)
    const startTime = performance.now()
    const duration = 300

    const animate = () => {
      const elapsed = performance.now() - startTime
      const t = Math.min(1, elapsed / duration)
      const easeT = 1 - Math.pow(1 - t, 3)

      set({
        cameraPosition: new THREE.Vector3(
          lerp(startPos.x, endPos.x, easeT),
          lerp(startPos.y, endPos.y, easeT),
          lerp(startPos.z, endPos.z, easeT)
        )
      })

      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        set({ isResettingView: false })
      }
    }
    animate()
  }
}))
