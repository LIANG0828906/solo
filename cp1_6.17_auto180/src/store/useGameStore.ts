import { create } from 'zustand'

export interface Point {
  x: number
  y: number
}

export interface Mirror {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export interface Target {
  id: string
  x: number
  y: number
  radius: number
  activated: boolean
  activatedAt: number
}

export interface LightSegment {
  start: Point
  end: Point
  intensity: number
  hitTargetId: string | null
}

export interface Level {
  id: number
  name: string
  mirrors: Mirror[]
  targets: Target[]
}

interface GameState {
  lightAngle: number
  lightIntensity: number
  currentLevelId: number
  levels: Level[]
  mirrors: Mirror[]
  targets: Target[]
  lightPath: LightSegment[]
  isVictory: boolean
  transitionProgress: number
  sourcePosition: Point

  setLightAngle: (angle: number) => void
  setLightIntensity: (intensity: number) => void
  setCurrentLevel: (levelId: number) => void
  resetLevel: () => void
  setLightPath: (path: LightSegment[]) => void
  setTargets: (targets: Target[]) => void
  setVictory: (victory: boolean) => void
  setTransitionProgress: (progress: number) => void
  dispatchPhysicsUpdate: () => void
}

const LEVELS: Level[] = [
  {
    id: 1,
    name: '第一关：初识光路',
    mirrors: [
      { id: 'm1', x: 300, y: 400, width: 120, height: 8, rotation: -45 },
      { id: 'm2', x: 500, y: 200, width: 120, height: 8, rotation: 45 },
    ],
    targets: [
      { id: 't1', x: 700, y: 200, radius: 8, activated: false, activatedAt: 0 },
    ],
  },
  {
    id: 2,
    name: '第二关：三镜回旋',
    mirrors: [
      { id: 'm1', x: 250, y: 450, width: 100, height: 8, rotation: -30 },
      { id: 'm2', x: 450, y: 250, width: 100, height: 8, rotation: 60 },
      { id: 'm3', x: 650, y: 400, width: 100, height: 8, rotation: -60 },
    ],
    targets: [
      { id: 't1', x: 800, y: 300, radius: 8, activated: false, activatedAt: 0 },
      { id: 't2', x: 700, y: 150, radius: 8, activated: false, activatedAt: 0 },
    ],
  },
  {
    id: 3,
    name: '第三关：光影迷局',
    mirrors: [
      { id: 'm1', x: 200, y: 350, width: 90, height: 8, rotation: -45 },
      { id: 'm2', x: 380, y: 180, width: 90, height: 8, rotation: 30 },
      { id: 'm3', x: 560, y: 380, width: 90, height: 8, rotation: -30 },
      { id: 'm4', x: 720, y: 200, width: 90, height: 8, rotation: 60 },
      { id: 'm5', x: 450, y: 500, width: 90, height: 8, rotation: 45 },
    ],
    targets: [
      { id: 't1', x: 850, y: 120, radius: 8, activated: false, activatedAt: 0 },
      { id: 't2', x: 600, y: 100, radius: 8, activated: false, activatedAt: 0 },
      { id: 't3', x: 300, y: 550, radius: 8, activated: false, activatedAt: 0 },
    ],
  },
]

export const useGameStore = create<GameState>((set, get) => {
  const initialLevel = LEVELS[0]
  return {
    lightAngle: 45,
    lightIntensity: 100,
    currentLevelId: 1,
    levels: LEVELS,
    mirrors: JSON.parse(JSON.stringify(initialLevel.mirrors)),
    targets: JSON.parse(JSON.stringify(initialLevel.targets)),
    lightPath: [],
    isVictory: false,
    transitionProgress: 1,
    sourcePosition: { x: 40, y: 600 - 40 },

    setLightAngle: (angle) => {
      set({ lightAngle: angle, isVictory: false })
      get().dispatchPhysicsUpdate()
    },

    setLightIntensity: (intensity) => {
      set({ lightIntensity: intensity, isVictory: false })
      get().dispatchPhysicsUpdate()
    },

    setCurrentLevel: (levelId) => {
      const level = LEVELS.find((l) => l.id === levelId)
      if (!level) return
      set({
        currentLevelId: levelId,
        mirrors: JSON.parse(JSON.stringify(level.mirrors)),
        targets: JSON.parse(JSON.stringify(level.targets)),
        lightPath: [],
        isVictory: false,
        transitionProgress: 0,
      })

      let start = performance.now()
      const animate = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / 300, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        set({ transitionProgress: eased })
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          get().dispatchPhysicsUpdate()
        }
      }
      requestAnimationFrame(animate)
    },

    resetLevel: () => {
      const level = LEVELS.find((l) => l.id === get().currentLevelId)
      if (!level) return
      set({
        lightAngle: 45,
        lightIntensity: 100,
        mirrors: JSON.parse(JSON.stringify(level.mirrors)),
        targets: JSON.parse(JSON.stringify(level.targets)),
        lightPath: [],
        isVictory: false,
      })
      get().dispatchPhysicsUpdate()
    },

    setLightPath: (path) => set({ lightPath: path }),

    setTargets: (targets) => set({ targets }),

    setVictory: (victory) => set({ isVictory: victory }),

    setTransitionProgress: (progress) => set({ transitionProgress: progress }),

    dispatchPhysicsUpdate: () => {
      import('../game/PhysicsEngine').then(({ PhysicsEngine }) => {
        const engine = new PhysicsEngine(get())
        const { path, updatedTargets, victory } = engine.compute()
        set({
          lightPath: path,
          targets: updatedTargets,
          isVictory: victory,
        })
      })
    },
  }
})
