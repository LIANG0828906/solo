import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type ShapeType = 'circle' | 'rect' | 'star'

export interface Keyframe {
  id: string
  frame: number
  x: number
  y: number
  size: number
  opacity: number
  rotation: number
  color: string
}

export interface Scene {
  id: string
  name: string
  shapeType: ShapeType
  keyframes: Keyframe[]
}

interface TimelineState {
  scenes: Scene[]
  currentFrame: number
  totalFrames: number
  isPlaying: boolean
  isLooping: boolean
  selectedSceneId: string | null
  selectedKeyframeId: string | null
  fps: number

  addScene: (shapeType: ShapeType) => void
  removeScene: (sceneId: string) => void
  reorderScenes: (fromIndex: number, toIndex: number) => void
  selectScene: (sceneId: string | null) => void

  addKeyframe: (sceneId: string, frame: number) => void
  removeKeyframe: (sceneId: string, keyframeId: string) => void
  updateKeyframe: (sceneId: string, keyframeId: string, updates: Partial<Keyframe>) => void
  selectKeyframe: (keyframeId: string | null) => void

  setCurrentFrame: (frame: number) => void
  togglePlay: () => void
  toggleLoop: () => void
  goToStart: () => void
  nextFrame: () => void
  setTotalFrames: (frames: number) => void
}

const defaultColor = '#e94560'

const createDefaultKeyframe = (frame: number = 0): Keyframe => ({
  id: uuidv4(),
  frame,
  x: 200,
  y: 150,
  size: 60,
  opacity: 1,
  rotation: 0,
  color: defaultColor,
})

export const useTimelineStore = create<TimelineState>((set, get) => ({
  scenes: [
    {
      id: uuidv4(),
      name: '场景 1',
      shapeType: 'circle',
      keyframes: [
        { ...createDefaultKeyframe(0), x: 100, y: 200, size: 50 },
        { ...createDefaultKeyframe(60), x: 500, y: 200, size: 80, rotation: 180 },
      ],
    },
    {
      id: uuidv4(),
      name: '场景 2',
      shapeType: 'rect',
      keyframes: [
        { ...createDefaultKeyframe(0), x: 200, y: 100, size: 60, color: '#4ecdc4' },
        { ...createDefaultKeyframe(80), x: 600, y: 350, size: 100, rotation: 360, color: '#45b7d1' },
      ],
    },
  ],
  currentFrame: 0,
  totalFrames: 120,
  isPlaying: false,
  isLooping: false,
  selectedSceneId: null,
  selectedKeyframeId: null,
  fps: 24,

  addScene: (shapeType) =>
    set((state) => {
      const newScene: Scene = {
        id: uuidv4(),
        name: `场景 ${state.scenes.length + 1}`,
        shapeType,
        keyframes: [createDefaultKeyframe(0)],
      }
      return { scenes: [...state.scenes, newScene] }
    }),

  removeScene: (sceneId) =>
    set((state) => ({
      scenes: state.scenes.filter((s) => s.id !== sceneId),
      selectedSceneId: state.selectedSceneId === sceneId ? null : state.selectedSceneId,
    })),

  reorderScenes: (fromIndex, toIndex) =>
    set((state) => {
      const newScenes = [...state.scenes]
      const [removed] = newScenes.splice(fromIndex, 1)
      newScenes.splice(toIndex, 0, removed)
      return { scenes: newScenes }
    }),

  selectScene: (sceneId) => set({ selectedSceneId: sceneId }),

  addKeyframe: (sceneId, frame) =>
    set((state) => {
      const scene = state.scenes.find((s) => s.id === sceneId)
      if (!scene || scene.keyframes.length >= 5) return state

      const interpolated = interpolateKeyframe(scene.keyframes, frame)
      const { frame: _frame, ...restInterpolated } = interpolated
      const newKeyframe: Keyframe = {
        id: uuidv4(),
        ...restInterpolated,
        frame,
      }

      const newKeyframes = [...scene.keyframes, newKeyframe].sort((a, b) => a.frame - b.frame)

      return {
        scenes: state.scenes.map((s) =>
          s.id === sceneId ? { ...s, keyframes: newKeyframes } : s
        ),
      }
    }),

  removeKeyframe: (sceneId, keyframeId) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, keyframes: s.keyframes.filter((k) => k.id !== keyframeId) }
          : s
      ),
      selectedKeyframeId: state.selectedKeyframeId === keyframeId ? null : state.selectedKeyframeId,
    })),

  updateKeyframe: (sceneId, keyframeId, updates) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? {
              ...s,
              keyframes: s.keyframes
                .map((k) => (k.id === keyframeId ? { ...k, ...updates } : k))
                .sort((a, b) => a.frame - b.frame),
            }
          : s
      ),
    })),

  selectKeyframe: (keyframeId) => set({ selectedKeyframeId: keyframeId }),

  setCurrentFrame: (frame) => set({ currentFrame: Math.max(0, Math.min(frame, get().totalFrames)) }),

  togglePlay: () =>
    set((state) => {
      if (!state.isPlaying && state.currentFrame >= state.totalFrames) {
        return { isPlaying: true, currentFrame: 0 }
      }
      return { isPlaying: !state.isPlaying }
    }),

  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),

  goToStart: () => set({ currentFrame: 0 }),

  nextFrame: () => {
    const { currentFrame, totalFrames, isLooping } = get()
    if (currentFrame >= totalFrames) {
      if (isLooping) {
        set({ currentFrame: 0 })
      } else {
        set({ isPlaying: false })
      }
      return
    }
    set({ currentFrame: currentFrame + 1 })
  },

  setTotalFrames: (frames) => set({ totalFrames: Math.max(10, frames) }),
}))

export function interpolateKeyframe(
  keyframes: Keyframe[],
  frame: number
): Omit<Keyframe, 'id'> {
  if (keyframes.length === 0) {
    return { frame, x: 0, y: 0, size: 0, opacity: 0, rotation: 0, color: '#ffffff' }
  }

  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame)

  if (frame <= sorted[0].frame) {
    const { id, ...rest } = sorted[0]
    return { ...rest, frame }
  }
  if (frame >= sorted[sorted.length - 1].frame) {
    const { id, ...rest } = sorted[sorted.length - 1]
    return { ...rest, frame }
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const prev = sorted[i]
    const next = sorted[i + 1]
    if (frame >= prev.frame && frame <= next.frame) {
      const t = (frame - prev.frame) / (next.frame - prev.frame)
      return {
        frame,
        x: lerp(prev.x, next.x, t),
        y: lerp(prev.y, next.y, t),
        size: lerp(prev.size, next.size, t),
        opacity: lerp(prev.opacity, next.opacity, t),
        rotation: lerp(prev.rotation, next.rotation, t),
        color: lerpColor(prev.color, next.color, t),
      }
    }
  }

  const { id, ...rest } = sorted[0]
  return { ...rest, frame }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  if (!c1 || !c2) return color1

  const r = Math.round(lerp(c1.r, c2.r, t))
  const g = Math.round(lerp(c1.g, c2.g, t))
  const b = Math.round(lerp(c1.b, c2.b, t))
  return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}
