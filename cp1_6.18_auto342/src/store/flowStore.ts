import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import * as THREE from 'three'

export interface Particle {
  id: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  color: THREE.Color
  size: number
  opacity: number
  history: THREE.Vector3[]
  isClickParticle: boolean
  clickOpacity: number
  clickColor: THREE.Color
  clickStartTime: number
}

export type GravityDirection = 'up' | 'down' | 'none'
export type WindDirection = 'left' | 'right' | 'random' | 'none'
export type SpecialEffect = 'none' | 'smoke' | 'spark'

interface FlowState {
  particles: Particle[]
  gravity: GravityDirection
  wind: WindDirection
  windVector: THREE.Vector3
  gravityVector: THREE.Vector3
  clickPosition: THREE.Vector3 | null
  lastUpdateTime: number
  specialEffect: SpecialEffect
  effectStartTime: number
  targetWindVector: THREE.Vector3
  windTransitionStartTime: number

  addParticle: (particle: Omit<Particle, 'id' | 'history' | 'isClickParticle' | 'clickOpacity' | 'clickColor' | 'clickStartTime'> & Partial<Pick<Particle, 'isClickParticle' | 'clickColor' | 'history'>>) => void
  addParticles: (particles: Particle[]) => void
  addClickParticles: (position: THREE.Vector3, count: number) => void
  setGravity: (direction: GravityDirection) => void
  setWind: (direction: WindDirection) => void
  setClickPosition: (position: THREE.Vector3 | null) => void
  updateParticles: (updater: (particles: Particle[]) => Particle[]) => void
  triggerEffect: (effect: SpecialEffect) => void
  clearEffect: () => void
  initializeParticles: (count: number) => void
}

const BOUNDARY = 15

const getGravityVector = (direction: GravityDirection): THREE.Vector3 => {
  switch (direction) {
    case 'down':
      return new THREE.Vector3(0, -0.05, 0)
    case 'up':
      return new THREE.Vector3(0, 0.05, 0)
    case 'none':
    default:
      return new THREE.Vector3(0, 0, 0)
  }
}

const getWindVector = (direction: WindDirection): THREE.Vector3 => {
  switch (direction) {
    case 'left':
      return new THREE.Vector3(-0.08, 0, 0)
    case 'right':
      return new THREE.Vector3(0.08, 0, 0)
    case 'random': {
      const angle = Math.random() * Math.PI * 2
      const strength = 0.06
      return new THREE.Vector3(
        Math.cos(angle) * strength,
        (Math.random() - 0.5) * strength * 0.5,
        Math.sin(angle) * strength
      )
    }
    case 'none':
    default:
      return new THREE.Vector3(0, 0, 0)
  }
}

const createRandomParticle = (isClickParticle = false, clickPosition?: THREE.Vector3): Particle => {
  let position: THREE.Vector3
  let velocity: THREE.Vector3

  if (isClickParticle && clickPosition) {
    position = clickPosition.clone()
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = 0.5 * Math.cbrt(Math.random())
    const dir = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    ).normalize()
    const speed = 2 + Math.random() * 2
    velocity = dir.multiplyScalar(speed)
  } else {
    position = new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 20
    )
    velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    )
  }

  const speed = velocity.length()
  const color = getColorFromSpeed(speed)

  return {
    id: uuidv4(),
    position,
    velocity,
    color,
    size: 3 + Math.random() * 5,
    opacity: 0.6 + Math.random() * 0.3,
    history: [],
    isClickParticle,
    clickOpacity: isClickParticle ? 1 : 0,
    clickColor: isClickParticle ? new THREE.Color('#FFD700') : new THREE.Color(0x000000),
    clickStartTime: isClickParticle ? performance.now() : 0,
  }
}

export const getColorFromSpeed = (speed: number): THREE.Color => {
  const blue = new THREE.Color('#00BFFF')
  const purple = new THREE.Color('#8A2BE2')
  const pink = new THREE.Color('#FF69B4')

  const t = Math.min(speed / 5, 1)

  if (t < 0.5) {
    const localT = t * 2
    return blue.clone().lerp(purple, localT)
  } else {
    const localT = (t - 0.5) * 2
    return purple.clone().lerp(pink, localT)
  }
}

export const useFlowStore = create<FlowState>((set, get) => ({
  particles: [],
  gravity: 'down',
  wind: 'random',
  gravityVector: getGravityVector('down'),
  windVector: getWindVector('random'),
  targetWindVector: getWindVector('random'),
  windTransitionStartTime: 0,
  clickPosition: null,
  lastUpdateTime: performance.now(),
  specialEffect: 'none',
  effectStartTime: 0,

  initializeParticles: (count: number) => {
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      particles.push(createRandomParticle())
    }
    set({ particles })
  },

  addParticle: (particleData) => {
    const newParticle: Particle = {
      ...particleData,
      id: uuidv4(),
      history: particleData.history || [],
      isClickParticle: particleData.isClickParticle || false,
      clickOpacity: particleData.isClickParticle ? 1 : 0,
      clickColor: particleData.clickColor || new THREE.Color(0x000000),
      clickStartTime: particleData.isClickParticle ? performance.now() : 0,
    } as Particle
    set((state) => ({ particles: [...state.particles, newParticle] }))
  },

  addParticles: (newParticles) => {
    set((state) => ({ particles: [...state.particles, ...newParticles] }))
  },

  addClickParticles: (position: THREE.Vector3, count: number) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      newParticles.push(createRandomParticle(true, position))
    }
    set((state) => ({ particles: [...state.particles, ...newParticles] }))
  },

  setGravity: (direction: GravityDirection) => {
    set({
      gravity: direction,
      gravityVector: getGravityVector(direction),
    })
  },

  setWind: (direction: WindDirection) => {
    const state = get()
    set({
      wind: direction,
      targetWindVector: getWindVector(direction),
      windTransitionStartTime: performance.now(),
      windVector: state.windVector.clone(),
    })
  },

  setClickPosition: (position: THREE.Vector3 | null) => {
    set({ clickPosition: position })
  },

  updateParticles: (updater) => {
    set((state) => ({ particles: updater(state.particles) }))
  },

  triggerEffect: (effect: SpecialEffect) => {
    set({
      specialEffect: effect,
      effectStartTime: performance.now(),
    })
  },

  clearEffect: () => {
    set({ specialEffect: 'none' })
  },
}))

export { BOUNDARY }
