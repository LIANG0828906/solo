import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { AnimationStateShape, AnimationTrack, BezierCurve, Keyframe } from '@/types'
import { animationEngine } from '@/engine/AnimationEngine'

const DEFAULT_DURATION = 2000

const DEFAULT_CURVES: Array<{ name: string; curve: BezierCurve }> = [
  { name: 'ease', curve: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 } },
  { name: 'ease-in', curve: { x1: 0.42, y1: 0, x2: 1, y2: 1 } },
  { name: 'ease-out', curve: { x1: 0, y1: 0, x2: 0.58, y2: 1 } },
  { name: 'elastic', curve: { x1: 0.68, y1: -0.55, x2: 0.27, y2: 1.55 } },
]

const GRADIENT_COLORS = ['#64FFDA', '#88E5C8', '#FFA07A', '#FF6B6B']

function createDefaultKeyframes(): Keyframe[] {
  return [
    { id: uuidv4(), time: 0, position: 0, opacity: 1 },
    { id: uuidv4(), time: 100, position: 100, opacity: 1 },
  ]
}

function createDefaultTracks(): AnimationTrack[] {
  return DEFAULT_CURVES.map((def, idx) => ({
    id: uuidv4(),
    name: def.name,
    curve: { ...def.curve },
    duration: DEFAULT_DURATION,
    keyframes: createDefaultKeyframes(),
    color: GRADIENT_COLORS[idx] || GRADIENT_COLORS[GRADIENT_COLORS.length - 1],
  }))
}

function bezierToCSS(c: BezierCurve): string {
  return `cubic-bezier(${c.x1}, ${c.y1}, ${c.x2}, ${c.y2})`
}

export const useAnimationStore = create<AnimationStateShape>((set, get) => ({
  tracks: createDefaultTracks(),
  selectedTrackId: null,
  isExportPanelOpen: false,

  selectTrack: (id) => set({ selectedTrackId: id }),

  updateBezier: (id, curve) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, curve: { ...curve } } : t)),
    }))
    animationEngine.setTracks(get().tracks)
    animationEngine.reset()
  },

  setTrackDuration: (id, duration) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, duration } : t)),
    }))
    animationEngine.setTracks(get().tracks)
  },

  addKeyframe: (trackId, time) => {
    set((state) => ({
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t
        const newKf: Keyframe = {
          id: uuidv4(),
          time: Math.max(0, Math.min(100, Math.round(time * 10) / 10)),
          position: Math.round(time),
          opacity: 1,
        }
        const updated = [...t.keyframes, newKf].sort((a, b) => a.time - b.time)
        return { ...t, keyframes: updated }
      }),
    }))
    animationEngine.setTracks(get().tracks)
    animationEngine.reset()
  },

  updateKeyframe: (trackId, kfId, patch) => {
    set((state) => ({
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t
        const updated = t.keyframes
          .map((k) => (k.id === kfId ? { ...k, ...patch } : k))
          .sort((a, b) => a.time - b.time)
        return { ...t, keyframes: updated }
      }),
    }))
    animationEngine.setTracks(get().tracks)
  },

  removeKeyframe: (trackId, kfId) => {
    set((state) => ({
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t
        const filtered = t.keyframes.filter((k) => k.id !== kfId)
        const hasStart = filtered.some((k) => k.time === 0)
        const hasEnd = filtered.some((k) => k.time === 100)
        const result = [...filtered]
        if (!hasStart) {
          result.unshift({ id: uuidv4(), time: 0, position: 0, opacity: 1 })
        }
        if (!hasEnd) {
          result.push({ id: uuidv4(), time: 100, position: 100, opacity: 1 })
        }
        return { ...t, keyframes: result.sort((a, b) => a.time - b.time) }
      }),
    }))
    animationEngine.setTracks(get().tracks)
    animationEngine.reset()
  },

  toggleExportPanel: (open) => {
    if (typeof open === 'boolean') {
      set({ isExportPanelOpen: open })
    } else {
      set((s) => ({ isExportPanelOpen: !s.isExportPanelOpen }))
    }
  },

  generateCSS: (trackId) => {
    const track = get().tracks.find((t) => t.id === trackId)
    if (!track) return ''
    const sorted = [...track.keyframes].sort((a, b) => a.time - b.time)
    const safeName = track.name.replace(/[^a-zA-Z0-9]/g, '_')
    const lines: string[] = []
    lines.push(`@keyframes motionlab_${safeName} {`)
    sorted.forEach((kf) => {
      lines.push(`  ${kf.time}% {`)
      lines.push(`    transform: translateX(${(kf.position / 100) * 200}px);`)
      lines.push(`    opacity: ${kf.opacity.toFixed(2)};`)
      lines.push(`  }`)
    })
    lines.push('}')
    lines.push('')
    lines.push('.animated-element {')
    lines.push(`  animation-name: motionlab_${safeName};`)
    lines.push(`  animation-duration: ${track.duration}ms;`)
    lines.push(`  animation-timing-function: ${bezierToCSS(track.curve)};`)
    lines.push(`  animation-iteration-count: infinite;`)
    lines.push(`  animation-direction: alternate;`)
    lines.push('}')
    return lines.join('\n')
  },
}))

animationEngine.setTracks(useAnimationStore.getState().tracks)
