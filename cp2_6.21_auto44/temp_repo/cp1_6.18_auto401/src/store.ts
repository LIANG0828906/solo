import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import * as THREE from 'three'

export const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#A3E4D7'
]

export interface Particle {
  id: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  color: string
  radius: number
  mass: number
  opacity: number
  scalePhase: number
  glow: boolean
}

interface ParticleStore {
  particles: Particle[]
  panelCollapsed: boolean
  selectedParticleId: string | null
  addParticles: (particles: Particle[]) => void
  mergeParticles: (id1: string, id2: string) => void
  clearParticles: () => void
  setPanelCollapsed: (collapsed: boolean) => void
  togglePanel: () => void
  setSelectedParticle: (id: string | null) => void
  updateParticles: (updater: (particles: Particle[]) => Particle[]) => void
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 255, b: 255 }
}

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export const createParticle = (
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  color: string,
  radius: number,
  mass: number
): Particle => ({
  id: uuidv4(),
  position: position.clone(),
  velocity: velocity.clone(),
  color,
  radius,
  mass,
  opacity: 0.9,
  scalePhase: Math.random() * Math.PI * 2,
  glow: false
})

export const useParticleStore = create<ParticleStore>((set, get) => ({
  particles: [],
  panelCollapsed: false,
  selectedParticleId: null,

  addParticles: (newParticles: Particle[]) => {
    set(state => ({
      particles: [...state.particles, ...newParticles]
    }))
  },

  mergeParticles: (id1: string, id2: string) => {
    set(state => {
      const p1 = state.particles.find(p => p.id === id1)
      const p2 = state.particles.find(p => p.id === id2)
      if (!p1 || !p2) return state

      const newMass = p1.mass + p2.mass
      const rgb1 = hexToRgb(p1.color)
      const rgb2 = hexToRgb(p2.color)
      const w1 = p1.mass / newMass
      const w2 = p2.mass / newMass
      const newColor = rgbToHex(
        rgb1.r * w1 + rgb2.r * w2,
        rgb1.g * w1 + rgb2.g * w2,
        rgb1.b * w1 + rgb2.b * w2
      )
      const newRadius = Math.cbrt(newMass) * 0.15
      const newPosition = new THREE.Vector3()
        .addScaledVector(p1.position, w1)
        .addScaledVector(p2.position, w2)
      const newVelocity = new THREE.Vector3()
        .addScaledVector(p1.velocity, w1)
        .addScaledVector(p2.velocity, w2)

      const mergedParticle: Particle = {
        id: uuidv4(),
        position: newPosition,
        velocity: newVelocity,
        color: newColor,
        radius: Math.max(0.08, Math.min(newRadius, 1.5)),
        mass: newMass,
        opacity: 0.95,
        scalePhase: Math.random() * Math.PI * 2,
        glow: true
      }

      return {
        particles: [
          ...state.particles.filter(p => p.id !== id1 && p.id !== id2),
          mergedParticle
        ]
      }
    })
  },

  clearParticles: () => {
    set({ particles: [], selectedParticleId: null })
  },

  setPanelCollapsed: (collapsed: boolean) => {
    set({ panelCollapsed: collapsed })
  },

  togglePanel: () => {
    set(state => ({ panelCollapsed: !state.panelCollapsed }))
  },

  setSelectedParticle: (id: string | null) => {
    set(state => ({
      selectedParticleId: id,
      particles: state.particles.map(p => ({
        ...p,
        glow: id === p.id
      }))
    }))
  },

  updateParticles: (updater: (particles: Particle[]) => Particle[]) => {
    set(state => ({
      particles: updater(state.particles)
    }))
  }
}))
