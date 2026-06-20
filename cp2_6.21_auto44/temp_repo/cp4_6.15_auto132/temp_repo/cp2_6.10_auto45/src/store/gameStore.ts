import { create } from 'zustand'

export type FeatherColor = 'red' | 'blue' | 'green'
export type PowerLevel = 'light' | 'medium' | 'heavy'
export type SeatLevel = '门客' | '上客' | '贵宾' | '主宾'
export type HitResult = 'inner' | 'ear' | 'miss' | null

export interface ArrowState {
  id: string
  featherColor: FeatherColor
  isFlying: boolean
  isLaunched: boolean
  startX: number
  startY: number
  endX: number
  endY: number
  angle: number
  power: PowerLevel
  hitResult: HitResult
}

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export interface GameState {
  currentRound: number
  arrowsRemaining: number
  totalScores: number
  seatLevel: SeatLevel
  seatProgress: number
  animating: boolean
  currentArrow: ArrowState | null
  aimingAngle: number
  aimingPower: PowerLevel
  pitcherHovered: boolean
  hitZones: {
    inner: { x: number; y: number; width: number; height: number }
    leftEar: { x: number; y: number; width: number; height: number }
    rightEar: { x: number; y: number; width: number; height: number }
  }
  particles: Particle[]
  fallingFeathers: Array<{ id: string; x: number; y: number; color: string; rotation: number }>
  message: string | null
  showSilkRibbon: boolean

  setAimingAngle: (angle: number) => void
  setAimingPower: (power: PowerLevel) => void
  setPitcherHovered: (hovered: boolean) => void
  launchArrow: (arrowId: string, featherColor: FeatherColor, startX: number, startY: number) => void
  updateArrowTrajectory: (endX: number, endY: number, hitResult: HitResult) => void
  completeArrowAnimation: () => void
  updateScore: (points: number) => void
  advanceSeat: () => void
  addParticles: (particles: Particle[]) => void
  removeParticle: (id: string) => void
  addFallingFeather: (feather: { id: string; x: number; y: number; color: string; rotation: number }) => void
  removeFallingFeather: (id: string) => void
  showMessage: (message: string) => void
  hideMessage: () => void
  triggerSilkRibbon: () => void
  resetGame: () => void
}

const initialHitZones = {
  inner: { x: 0, y: 0, width: 40, height: 40 },
  leftEar: { x: 0, y: 0, width: 25, height: 25 },
  rightEar: { x: 0, y: 0, width: 25, height: 25 },
}

export const useGameStore = create<GameState>((set, get) => ({
  currentRound: 1,
  arrowsRemaining: 5,
  totalScores: 0,
  seatLevel: '门客',
  seatProgress: 0,
  animating: false,
  currentArrow: null,
  aimingAngle: 35,
  aimingPower: 'medium',
  pitcherHovered: false,
  hitZones: initialHitZones,
  particles: [],
  fallingFeathers: [],
  message: null,
  showSilkRibbon: false,

  setAimingAngle: (angle) => set({ aimingAngle: angle }),
  setAimingPower: (power) => set({ aimingPower: power }),
  setPitcherHovered: (hovered) => set({ pitcherHovered: hovered }),

  launchArrow: (arrowId, featherColor, startX, startY) => {
    const { aimingAngle, aimingPower } = get()
    set({
      animating: true,
      currentArrow: {
        id: arrowId,
        featherColor,
        isFlying: true,
        isLaunched: true,
        startX,
        startY,
        endX: startX,
        endY: startY,
        angle: aimingAngle,
        power: aimingPower,
        hitResult: null,
      },
    })
  },

  updateArrowTrajectory: (endX, endY, hitResult) => {
    set((state) => ({
      currentArrow: state.currentArrow
        ? { ...state.currentArrow, endX, endY, hitResult }
        : null,
    }))
  },

  completeArrowAnimation: () => {
    set((state) => ({
      arrowsRemaining: state.arrowsRemaining - 1,
      currentArrow: null,
      animating: false,
    }))
  },

  updateScore: (points) => {
    set((state) => {
      const newScores = Math.max(0, state.totalScores + points)
      const newProgress = state.seatProgress + Math.abs(points)
      const shouldAdvance = newProgress >= 5 && points > 0

      return {
        totalScores: newScores,
        seatProgress: shouldAdvance ? newProgress - 5 : newProgress,
      }
    })
  },

  advanceSeat: () => {
    const seatOrder: SeatLevel[] = ['门客', '上客', '贵宾', '主宾']
    set((state) => {
      const currentIndex = seatOrder.indexOf(state.seatLevel)
      if (currentIndex < seatOrder.length - 1) {
        return {
          seatLevel: seatOrder[currentIndex + 1],
          showSilkRibbon: true,
        }
      }
      return state
    })

    setTimeout(() => {
      set({ showSilkRibbon: false })
    }, 2000)
  },

  addParticles: (newParticles) => {
    set((state) => ({
      particles: [...state.particles, ...newParticles],
    }))
  },

  removeParticle: (id) => {
    set((state) => ({
      particles: state.particles.filter((p) => p.id !== id),
    }))
  },

  addFallingFeather: (feather) => {
    set((state) => ({
      fallingFeathers: [...state.fallingFeathers, feather],
    }))
  },

  removeFallingFeather: (id) => {
    set((state) => ({
      fallingFeathers: state.fallingFeathers.filter((f) => f.id !== id),
    }))
  },

  showMessage: (message) => set({ message }),
  hideMessage: () => set({ message: null }),

  triggerSilkRibbon: () => {
    set({ showSilkRibbon: true })
    setTimeout(() => set({ showSilkRibbon: false }), 2000)
  },

  resetGame: () => {
    set({
      currentRound: 1,
      arrowsRemaining: 5,
      totalScores: 0,
      seatLevel: '门客',
      seatProgress: 0,
      animating: false,
      currentArrow: null,
      particles: [],
      fallingFeathers: [],
      message: null,
    })
  },
}))
