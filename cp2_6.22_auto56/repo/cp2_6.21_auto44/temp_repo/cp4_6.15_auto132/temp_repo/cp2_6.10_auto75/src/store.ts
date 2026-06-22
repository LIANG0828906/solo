import { create } from 'zustand'
import * as THREE from 'three'

export interface Rock {
  id: number
  position: THREE.Vector3
  radius: number
  roughness: number
  isHovered: boolean
}

interface WaterfallState {
  flowRate: number
  windDirection: number
  windStrength: number
  rockRoughness: number
  maxParticles: number
  baseParticleCount: number
  rocks: Rock[]
  audioContext: AudioContext | null
  setFlowRate: (v: number) => void
  setWindDirection: (v: number) => void
  setRockRoughness: (v: number) => void
  incrementRockRoughness: (rockId: number) => void
  setRockHover: (rockId: number, hovered: boolean) => void
  initAudioContext: () => void
  playDropSound: () => void
}

const generateRocks = (): Rock[] => {
  const rocks: Rock[] = []
  const count = 5 + Math.floor(Math.random() * 4)
  for (let i = 0; i < count; i++) {
    rocks.push({
      id: i,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        -1 + Math.random() * 2,
        (Math.random() - 0.5) * 2
      ),
      radius: 0.5 + Math.random() * 1.5,
      roughness: 0.2 + Math.random() * 0.3,
      isHovered: false
    })
  }
  return rocks
}

export const useWaterfallStore = create<WaterfallState>((set, get) => ({
  flowRate: 60,
  windDirection: 90,
  windStrength: 0.5,
  rockRoughness: 40,
  maxParticles: 5000,
  baseParticleCount: 3000,
  rocks: generateRocks(),
  audioContext: null,

  setFlowRate: (v) => set({ flowRate: Math.max(0, Math.min(100, v)) }),
  setWindDirection: (v) => set({ windDirection: ((v % 360) + 360) % 360 }),
  setRockRoughness: (v) => {
    const normalized = Math.max(0, Math.min(100, v))
    set({
      rockRoughness: normalized,
      rocks: get().rocks.map(r => ({
        ...r,
        roughness: 0.1 + (normalized / 100) * 0.9
      }))
    })
  },
  incrementRockRoughness: (rockId) => set(state => ({
    rocks: state.rocks.map(r =>
      r.id === rockId
        ? { ...r, roughness: Math.min(1.0, r.roughness + 0.15) }
        : r
    )
  })),
  setRockHover: (rockId, hovered) => set(state => ({
    rocks: state.rocks.map(r =>
      r.id === rockId ? { ...r, isHovered: hovered } : r
    )
  })),

  initAudioContext: () => {
    if (!get().audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      set({ audioContext: ctx })
    }
  },

  playDropSound: () => {
    const ctx = get().audioContext
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = 200 + Math.random() * 200

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  }
}))
