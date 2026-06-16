import { create } from 'zustand'
import type { Line, VortexState, PulseEvent, createLines, swapAdjacentColors } from './weaver'
import { createLines as createLinesFn, swapAdjacentColors as swapAdjacentColorsFn, VORTEX_RADIUS, RECOVERY_DURATION, PULSE_DURATION, PULSE_AMPLITUDE } from './weaver'
import type { ThemeName } from './theme'
import { generateSnapshot, downloadSnapshot } from './theme'

interface MagicLoomState {
  lines: Line[]
  paused: boolean
  theme: ThemeName
  vortex: VortexState
  pulses: PulseEvent[]
  reducedQuality: boolean
  initLines: () => void
  togglePause: () => void
  setPaused: (p: boolean) => void
  reset: () => void
  toggleTheme: () => void
  setVortexActive: (active: boolean, x?: number, y?: number) => void
  setVortexPosition: (x: number, y: number) => void
  triggerPulse: (timestamp: number) => void
  updateLinesState: (updater: (lines: Line[]) => Line[]) => void
  setPulses: (pulses: PulseEvent[]) => void
  setVortexState: (vortex: VortexState) => void
  setReducedQuality: (reduced: boolean) => void
  saveSnapshot: (canvas: HTMLCanvasElement) => void
}

const initialVortex: VortexState = {
  active: false,
  x: 0,
  y: 0,
  radius: VORTEX_RADIUS,
  recoveryStart: null,
  recoveryDuration: RECOVERY_DURATION,
}

export const useMagicLoomStore = create<MagicLoomState>((set, get) => ({
  lines: createLinesFn('default'),
  paused: false,
  theme: 'default',
  vortex: { ...initialVortex },
  pulses: [],
  reducedQuality: false,

  initLines: () => {
    const { theme } = get()
    set({ lines: createLinesFn(theme) })
  },

  togglePause: () => set((state) => ({ paused: !state.paused })),

  setPaused: (p) => set({ paused: p }),

  reset: () => {
    const { theme } = get()
    set({
      lines: createLinesFn(theme),
      vortex: { ...initialVortex },
      pulses: [],
      paused: false,
    })
  },

  toggleTheme: () => {
    const newTheme: ThemeName = get().theme === 'default' ? 'deepSea' : 'default'
    set({
      theme: newTheme,
      lines: createLinesFn(newTheme),
    })
  },

  setVortexActive: (active, x, y) => {
    const { vortex } = get()
    const now = performance.now()

    if (active) {
      set({
        vortex: {
          ...vortex,
          active: true,
          x: x ?? vortex.x,
          y: y ?? vortex.y,
          recoveryStart: null,
        },
      })
    } else {
      set({
        vortex: {
          ...vortex,
          active: false,
          recoveryStart: now,
        },
      })
    }
  },

  setVortexPosition: (x, y) => {
    const { vortex } = get()
    if (vortex.active) {
      set({
        vortex: {
          ...vortex,
          x,
          y,
        },
      })
    }
  },

  triggerPulse: (timestamp) => {
    const { pulses, lines } = get()
    const newPulse: PulseEvent = {
      startTime: timestamp,
      duration: PULSE_DURATION,
      amplitude: PULSE_AMPLITUDE,
    }
    const swapped = swapAdjacentColorsFn(lines)
    set({
      pulses: [...pulses, newPulse],
      lines: swapped,
    })
  },

  updateLinesState: (updater) => {
    set((state) => ({ lines: updater(state.lines) }))
  },

  setPulses: (pulses) => set({ pulses }),

  setVortexState: (vortex) => set({ vortex }),

  setReducedQuality: (reduced) => set({ reducedQuality: reduced }),

  saveSnapshot: (canvas) => {
    const dataUrl = generateSnapshot(canvas)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadSnapshot(dataUrl, `magic-loom-${timestamp}.png`)
  },
}))
