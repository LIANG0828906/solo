import { create } from 'zustand'
import type { InkDrop, InkType, Particle, PlaybackState } from './types'
import { INK_CONFIGS } from './types'

interface StoreState {
  inkDrops: InkDrop[]
  activeInkType: InkType
  playbackState: PlaybackState
  zoom: number
  history: InkDrop[][]
  historyIndex: number
  addInkDrop: (x: number, y: number) => void
  updateParticles: (deltaTime: number) => void
  setPlaybackState: (state: Partial<PlaybackState>) => void
  setActiveInkType: (type: InkType) => void
  setZoom: (zoom: number) => void
  resetCanvas: () => void
  stepForward: () => void
  stepBackward: () => void
  goToStep: (step: number) => void
  clearHistory: () => void
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function createParticles(
  x: number,
  y: number,
  type: Exclude<InkType, 'eraser'>,
  count: number = 500
): Particle[] {
  const config = INK_CONFIGS[type]
  const particles: Particle[] = []

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 0.5 + Math.random() * 1.5

    particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: Math.cos(angle) * speed * config.diffusionSpeed,
      vy: Math.sin(angle) * speed * config.diffusionSpeed,
      life: 1,
      maxLife: 0.8 + Math.random() * 1.2,
      color: config.color,
      size: 1 + Math.random() * 2,
      alpha: 0.8 + Math.random() * 0.2
    })
  }

  return particles
}

function poissonBlend(
  drop1: InkDrop,
  drop2: InkDrop
): { vx: number; vy: number } {
  const dx = drop2.x - drop1.x
  const dy = drop2.y - drop1.y
  const dist = Math.sqrt(dx * dx + dy * dy) || 1

  const type1 = drop1.type as Exclude<InkType, 'eraser'>
  const type2 = drop2.type as Exclude<InkType, 'eraser'>

  const density1 = INK_CONFIGS[type1].diffusionSpeed
  const density2 = INK_CONFIGS[type2].diffusionSpeed

  const flowStrength = (density2 - density1) * 0.3

  return {
    vx: (dx / dist) * flowStrength,
    vy: (dy / dist) * flowStrength
  }
}

export const useStore = create<StoreState>((set, get) => ({
  inkDrops: [],
  activeInkType: 'medium',
  playbackState: {
    isPlaying: false,
    currentStep: 0,
    totalSteps: 0,
    speed: 1
  },
  zoom: 1,
  history: [[]],
  historyIndex: 0,

  setActiveInkType: (type: InkType) => set({ activeInkType: type }),

  setZoom: (zoom: number) => set({ zoom: Math.max(0.5, Math.min(4, zoom)) }),

  addInkDrop: (x: number, y: number) => {
    const { activeInkType, inkDrops, history, historyIndex } = get()

    if (activeInkType === 'eraser') {
      const newDrops = inkDrops.filter(drop => {
        const dx = drop.x - x
        const dy = drop.y - y
        const dist = Math.sqrt(dx * dx + dy * dy)
        return dist > drop.currentRadius * 1.5
      })
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push([...newDrops])
      set({
        inkDrops: newDrops,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        playbackState: {
          ...get().playbackState,
          totalSteps: newHistory.length - 1,
          currentStep: newHistory.length - 1
        }
      })
      return
    }

    const initialRadius = 12 + Math.random() * 6
    const config = INK_CONFIGS[activeInkType]
    const diffusionDuration = 0.8 + (2 - config.diffusionSpeed) * 0.6

    const newDrop: InkDrop = {
      id: generateId(),
      x,
      y,
      type: activeInkType,
      time: Date.now(),
      particles: createParticles(x, y, activeInkType),
      initialRadius,
      currentRadius: initialRadius,
      maxRadius: initialRadius * config.maxRadiusMultiplier,
      diffusionProgress: 0,
      diffusionDuration,
      completed: false,
      neighbors: []
    }

    const updatedDrops = inkDrops.map(drop => {
      const dx = x - drop.x
      const dy = y - drop.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const interactThreshold = drop.currentRadius * 3

      if (dist < interactThreshold && !drop.completed) {
        const flow = poissonBlend(drop, newDrop)
        return {
          ...drop,
          neighbors: [...drop.neighbors, newDrop.id],
          particles: drop.particles.map(p => ({
            ...p,
            vx: p.vx + flow.vx * 0.1,
            vy: p.vy + flow.vy * 0.1
          }))
        }
      }
      return drop
    })

    const newDrops = [...updatedDrops, newDrop]
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...newDrops])

    set({
      inkDrops: newDrops,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      playbackState: {
        ...get().playbackState,
        totalSteps: newHistory.length - 1,
        currentStep: newHistory.length - 1
      }
    })
  },

  updateParticles: (deltaTime: number) => {
    const { inkDrops } = get()

    const updatedDrops = inkDrops.map(drop => {
      if (drop.completed) return drop

      const newProgress = drop.diffusionProgress + deltaTime / drop.diffusionDuration
      const isCompleted = newProgress >= 1

      const updatedParticles = drop.particles.map(p => {
        if (p.life <= 0) return p

        const randomForceX = (Math.random() - 0.5) * 0.3
        const randomForceY = (Math.random() - 0.5) * 0.3
        const edgeJitterX = (Math.random() - 0.5) * 2
        const edgeJitterY = (Math.random() - 0.5) * 2

        const progress = drop.diffusionProgress
        const slowdownFactor = Math.max(0.1, 1 - progress * 0.9)

        return {
          ...p,
          x: p.x + p.vx * slowdownFactor + randomForceX + edgeJitterX,
          y: p.y + p.vy * slowdownFactor + randomForceY + edgeJitterY,
          vx: p.vx * 0.98,
          vy: p.vy * 0.98,
          life: Math.max(0, p.life - deltaTime / p.maxLife),
          alpha: p.alpha * (0.3 + 0.7 * (1 - progress))
        }
      })

      const currentRadius = drop.initialRadius + 
        (drop.maxRadius - drop.initialRadius) * Math.min(1, newProgress)

      return {
        ...drop,
        particles: updatedParticles,
        diffusionProgress: Math.min(1, newProgress),
        currentRadius,
        completed: isCompleted
      }
    })

    set({ inkDrops: updatedDrops })
  },

  setPlaybackState: (state: Partial<PlaybackState>) => {
    const { playbackState } = get()
    set({ playbackState: { ...playbackState, ...state } })
  },

  resetCanvas: () => {
    set({
      inkDrops: [],
      history: [[]],
      historyIndex: 0,
      playbackState: {
        isPlaying: false,
        currentStep: 0,
        totalSteps: 0,
        speed: 1
      }
    })
  },

  stepForward: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      set({
        inkDrops: [...history[newIndex]],
        historyIndex: newIndex,
        playbackState: {
          ...get().playbackState,
          currentStep: newIndex
        }
      })
    }
  },

  stepBackward: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      set({
        inkDrops: [...history[newIndex]],
        historyIndex: newIndex,
        playbackState: {
          ...get().playbackState,
          currentStep: newIndex
        }
      })
    }
  },

  goToStep: (step: number) => {
    const { history } = get()
    const clampedStep = Math.max(0, Math.min(history.length - 1, step))
    set({
      inkDrops: [...history[clampedStep]],
      historyIndex: clampedStep,
      playbackState: {
        ...get().playbackState,
        currentStep: clampedStep
      }
    })
  },

  clearHistory: () => {
    set({
      history: [[]],
      historyIndex: 0
    })
  }
}))
