import { create } from 'zustand'
import * as THREE from 'three'
import { LockStatus, PIECE_CONFIGS, TOLERANCES } from '../utils/constants'

interface PieceState {
  id: number
  position: THREE.Vector3
  rotation: THREE.Euler
  isInSlot: boolean
  isDragging: boolean
  isDetached: boolean
}

interface LockStore {
  pieces: PieceState[]
  lockStatus: LockStatus
  activePieceId: number | null
  glowActive: boolean
  particles: {
    id: number
    position: THREE.Vector3
    velocity: THREE.Vector3
    life: number
    maxLife: number
    size: number
  }[]
  particleIdCounter: number

  setPiecePosition: (id: number, position: THREE.Vector3) => void
  setPieceRotation: (id: number, rotation: THREE.Euler) => void
  setPieceDragging: (id: number, isDragging: boolean) => void
  setPieceDetached: (id: number, isDetached: boolean) => void
  setPieceInSlot: (id: number, isInSlot: boolean) => void
  setActivePiece: (id: number | null) => void
  addPiece: (config: typeof PIECE_CONFIGS[0]) => void
  removePiece: (id: number) => void
  validateAssembly: () => boolean
  setGlowActive: (active: boolean) => void
  addParticles: (position: THREE.Vector3, count: number) => void
  updateParticles: (delta: number) => void
  snapPieceToSlot: (id: number) => void
  checkWithinSlot: (id: number) => boolean
  calculateLockStatus: () => void
}

export const useLockStore = create<LockStore>((set, get) => ({
  pieces: [],
  lockStatus: LockStatus.ASSEMBLED,
  activePieceId: null,
  glowActive: false,
  particles: [],
  particleIdCounter: 0,

  setPiecePosition: (id, position) => set(state => ({
    pieces: state.pieces.map(p =>
      p.id === id ? { ...p, position: position.clone() } : p
    )
  })),

  setPieceRotation: (id, rotation) => set(state => ({
    pieces: state.pieces.map(p =>
      p.id === id ? { ...p, rotation: rotation.clone() } : p
    )
  })),

  setPieceDragging: (id, isDragging) => set(state => ({
    pieces: state.pieces.map(p =>
      p.id === id ? { ...p, isDragging } : p
    ),
    activePieceId: isDragging ? id : null
  })),

  setPieceDetached: (id, isDetached) => set(state => ({
    pieces: state.pieces.map(p =>
      p.id === id ? { ...p, isDetached } : p
    )
  })),

  setPieceInSlot: (id, isInSlot) => set(state => ({
    pieces: state.pieces.map(p =>
      p.id === id ? { ...p, isInSlot } : p
    )
  })),

  setActivePiece: (id) => set({ activePieceId: id }),

  addPiece: (config) => set(state => ({
    pieces: [...state.pieces, {
      id: config.id,
      position: config.position.clone(),
      rotation: config.rotation.clone(),
      isInSlot: true,
      isDragging: false,
      isDetached: false
    }]
  })),

  removePiece: (id) => set(state => ({
    pieces: state.pieces.filter(p => p.id !== id)
  })),

  checkWithinSlot: (id) => {
    const state = get()
    const piece = state.pieces.find(p => p.id === id)
    const config = PIECE_CONFIGS[id]
    if (!piece || !config) return false

    const dist = piece.position.distanceTo(config.originalSlotPosition)
    if (dist > TOLERANCES.SLOT_ENTRY_DISTANCE) return false

    const currentQuat = new THREE.Quaternion().setFromEuler(piece.rotation)
    const targetQuat = new THREE.Quaternion().setFromEuler(config.originalSlotRotation)
    const angleDiff = currentQuat.angleTo(targetQuat)

    return angleDiff <= TOLERANCES.SLOT_ENTRY_ANGLE
  },

  snapPieceToSlot: (id) => {
    const config = PIECE_CONFIGS[id]
    if (!config) return

    set(state => ({
      pieces: state.pieces.map(p =>
        p.id === id
          ? {
              ...p,
              position: config.originalSlotPosition.clone(),
              rotation: config.originalSlotRotation.clone(),
              isInSlot: true,
              isDetached: false
            }
          : p
      )
    }))

    get().calculateLockStatus()
  },

  validateAssembly: () => {
    const state = get()
    if (state.pieces.length !== 6) return false

    const allInPlace = state.pieces.every(piece => {
      const config = PIECE_CONFIGS[piece.id]
      if (!config) return false

      const dist = piece.position.distanceTo(config.originalSlotPosition)
      if (dist > TOLERANCES.VALIDATE_DISTANCE) return false

      const currentQuat = new THREE.Quaternion().setFromEuler(piece.rotation)
      const targetQuat = new THREE.Quaternion().setFromEuler(config.originalSlotRotation)
      const angleDiff = currentQuat.angleTo(targetQuat)

      return angleDiff <= TOLERANCES.VALIDATE_ANGLE
    })

    if (allInPlace) {
      set({ glowActive: true, lockStatus: LockStatus.ASSEMBLED })
      setTimeout(() => set({ glowActive: false }), 3000)
    }

    return allInPlace
  },

  setGlowActive: (active) => set({ glowActive: active }),

  addParticles: (position, count) => set(state => {
    const newParticles = Array.from({ length: count }, () => ({
      id: state.particleIdCounter + Math.random(),
      position: position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 15,
        (Math.random() - 0.5) * 10
      ),
      life: 1.5,
      maxLife: 1.5,
      size: 2 + Math.random() * 2
    }))

    return {
      particles: [...state.particles.slice(-100 + count), ...newParticles],
      particleIdCounter: state.particleIdCounter + count
    }
  }),

  updateParticles: (delta) => set(state => ({
    particles: state.particles
      .map(p => ({
        ...p,
        position: p.position.clone().add(p.velocity.clone().multiplyScalar(delta)),
        velocity: p.velocity.clone().add(new THREE.Vector3(0, -20, 0).multiplyScalar(delta)),
        life: p.life - delta
      }))
      .filter(p => p.life > 0)
  })),

  calculateLockStatus: () => {
    const state = get()
    const allInSlot = state.pieces.every(p => p.isInSlot)
    const allDetached = state.pieces.every(p => p.isDetached)

    if (allInSlot && state.validateAssembly()) {
      set({ lockStatus: LockStatus.ASSEMBLED })
    } else if (allDetached) {
      set({ lockStatus: LockStatus.DISASSEMBLED })
    } else {
      set({ lockStatus: LockStatus.IN_PROGRESS })
    }
  }
}))
