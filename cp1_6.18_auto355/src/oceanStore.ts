import { create } from 'zustand'

const TRANSITION_DURATION = 0.5
const MONTHS_PER_SECOND = 1.0

interface OceanState {
  currentTime: number
  playSpeed: number
  isPlaying: boolean
  targetTime: number | null
  transitionStartTime: number | null
  transitionFromTime: number | null
  selectedParticleId: string | null
  setCurrentTime: (t: number) => void
  setPlaying: (p: boolean) => void
  setPlaySpeed: (s: number) => void
  jumpToMonth: (month: number) => void
  selectParticle: (id: string | null) => void
  tick: (deltaSeconds: number) => void
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export const useOceanStore = create<OceanState>((set, get) => ({
  currentTime: 0,
  playSpeed: 1,
  isPlaying: false,
  targetTime: null,
  transitionStartTime: null,
  transitionFromTime: null,
  selectedParticleId: null,

  setCurrentTime: (t: number) =>
    set({
      currentTime: Math.max(0, Math.min(23, t)),
      targetTime: null,
      transitionStartTime: null,
      transitionFromTime: null,
    }),

  setPlaying: (p: boolean) => set({ isPlaying: p }),

  setPlaySpeed: (s: number) => set({ playSpeed: s }),

  jumpToMonth: (month: number) => {
    const target = Math.max(0, Math.min(23, month - 1))
    const { currentTime } = get()
    set({
      targetTime: target,
      transitionStartTime: 0,
      transitionFromTime: currentTime,
      isPlaying: false,
    })
  },

  selectParticle: (id: string | null) => set({ selectedParticleId: id }),

  tick: (deltaSeconds: number) => {
    const state = get()

    if (state.targetTime !== null && state.transitionStartTime !== null && state.transitionFromTime !== null) {
      const newElapsed = state.transitionStartTime + deltaSeconds
      const progress = Math.min(1, newElapsed / TRANSITION_DURATION)
      const easedProgress = easeInOutQuad(progress)
      const newTime = state.transitionFromTime + (state.targetTime - state.transitionFromTime) * easedProgress

      if (progress >= 1) {
        set({
          currentTime: state.targetTime,
          targetTime: null,
          transitionStartTime: null,
          transitionFromTime: null,
        })
      } else {
        set({
          currentTime: newTime,
          transitionStartTime: newElapsed,
        })
      }
      return
    }

    if (state.isPlaying) {
      const delta = deltaSeconds * MONTHS_PER_SECOND * state.playSpeed
      let newTime = state.currentTime + delta
      if (newTime >= 23) {
        newTime = 23
        set({ currentTime: 23, isPlaying: false })
      } else {
        set({ currentTime: newTime })
      }
    }
  },
}))
