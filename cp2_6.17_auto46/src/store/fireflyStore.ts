import { create } from 'zustand'
import * as THREE from 'three'

const FIREFLY_COUNT = 120
const SPACE_RADIUS = 15

export interface Firefly {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  trail: THREE.Vector3[]
  fatigue: number
  baseSpeed: number
  phase: number
  blinkPeriod: number
  size: number
  pulseBoostTimer: number
  pulseTarget: THREE.Vector3 | null
}

export interface Pulse {
  id: number
  center: THREE.Vector3
  radius: number
  opacity: number
  life: number
}

interface FireflyState {
  fireflies: Firefly[]
  pulses: Pulse[]
  trailsVisible: boolean
  fps: number
  fpsFrameCount: number
  fpsLastTime: number
  setFps: (fps: number) => void
  incrementFpsFrame: () => void
  initFireflies: () => void
  updateFirefliesBatch: (updater: (fireflies: Firefly[]) => void) => void
  resetFatigue: () => void
  toggleTrails: () => void
  addPulse: (center: THREE.Vector3) => void
  updatePulses: (dt: number) => void
  removePulse: (id: number) => void
  pulseIdCounter: number
}

function randomInSphere(radius: number): THREE.Vector3 {
  const u = Math.random()
  const v = Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  const r = radius * Math.cbrt(Math.random())
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  )
}

function randomUnitVector(): THREE.Vector3 {
  const v = new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  )
  return v.normalize()
}

function createFirefly(id: number): Firefly {
  return {
    id,
    position: randomInSphere(SPACE_RADIUS),
    velocity: randomUnitVector(),
    trail: [],
    fatigue: 0,
    baseSpeed: 20,
    phase: Math.random() * Math.PI * 2,
    blinkPeriod: 1 + Math.random() * 2,
    size: 6 + Math.random() * 6,
    pulseBoostTimer: 0,
    pulseTarget: null
  }
}

export const useFireflyStore = create<FireflyState>((set, get) => ({
  fireflies: [],
  pulses: [],
  trailsVisible: true,
  pulseIdCounter: 0,
  fps: 60,
  fpsFrameCount: 0,
  fpsLastTime: performance.now(),

  setFps: (fps: number) => set({ fps }),
  incrementFpsFrame: () => {
    const count = get().fpsFrameCount + 1
    if (count >= 15) {
      const now = performance.now()
      const elapsed = (now - get().fpsLastTime) / 1000
      const currentFps = Math.round(count / elapsed)
      set({ fps: currentFps, fpsFrameCount: 0, fpsLastTime: now })
    } else {
      set({ fpsFrameCount: count })
    }
  },

  initFireflies: () => {
    const fireflies: Firefly[] = []
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      fireflies.push(createFirefly(i))
    }
    set({ fireflies })
  },

  updateFirefliesBatch: (updater) => {
    const fireflies = get().fireflies
    updater(fireflies)
    set({ fireflies: [...fireflies] })
  },

  resetFatigue: () => {
    set((state) => ({
      fireflies: state.fireflies.map((f) => ({
        ...f,
        fatigue: 0,
        trail: [],
        pulseBoostTimer: 0,
        pulseTarget: null
      }))
    }))
  },

  toggleTrails: () => {
    set((state) => ({ trailsVisible: !state.trailsVisible }))
  },

  addPulse: (center: THREE.Vector3) => {
    const id = get().pulseIdCounter
    const pulse: Pulse = {
      id,
      center: center.clone(),
      radius: 2,
      opacity: 0.6,
      life: 1.75
    }
    set((state) => ({
      pulses: [...state.pulses, pulse],
      pulseIdCounter: id + 1
    }))

    const fireflies = get().fireflies
    for (const f of fireflies) {
      const dist = f.position.distanceTo(center)
      if (dist <= 16) {
        f.fatigue = 0
        f.pulseBoostTimer = 3
        f.pulseTarget = center.clone()
      }
    }
    set({ fireflies: [...fireflies] })
  },

  updatePulses: (dt: number) => {
    const pulses = get().pulses
    const updated: Pulse[] = []
    for (const p of pulses) {
      const newLife = p.life - dt
      if (newLife > 0) {
        const t = 1 - newLife / 1.75
        updated.push({
          ...p,
          life: newLife,
          radius: 2 + t * 14,
          opacity: 0.6 * (1 - t)
        })
      }
    }
    set({ pulses: updated })
  },

  removePulse: (id: number) => {
    set((state) => ({
      pulses: state.pulses.filter((p) => p.id !== id)
    }))
  }
}))
