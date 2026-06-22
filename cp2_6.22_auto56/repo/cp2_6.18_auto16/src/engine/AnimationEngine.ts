import type { AnimationTrack, BezierCurve, Keyframe, TrackProgress } from '@/types'

type ProgressListener = (progresses: TrackProgress[], fps: number) => void

const PAUSE_AT_END_MS = 500
const MAX_FPS_SAMPLES = 20

function cubicBezier(curve: BezierCurve, t: number): number {
  const { x1, y1, x2, y2 } = curve
  if (t <= 0) return 0
  if (t >= 1) return 1

  let low = 0
  let high = 1
  let mid = 0
  let midX = 0

  for (let i = 0; i < 14; i++) {
    mid = (low + high) / 2
    const mt = 1 - mid
    midX = 3 * mt * mt * mid * x1 + 3 * mt * mid * mid * x2 + mid * mid * mid
    if (midX < t) low = mid
    else high = mid
  }

  const mt = 1 - mid
  const y = 3 * mt * mt * mid * y1 + 3 * mt * mid * mid * y2 + mid * mid * mid
  return y
}

function interpolateKeyframes(keyframes: Keyframe[], easedProgress: number): { position: number; opacity: number } {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time)
  const time = easedProgress * 100

  if (time <= sorted[0].time) {
    return { position: sorted[0].position, opacity: sorted[0].opacity }
  }
  if (time >= sorted[sorted.length - 1].time) {
    return { position: sorted[sorted.length - 1].position, opacity: sorted[sorted.length - 1].opacity }
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i]
    const next = sorted[i + 1]
    if (time >= curr.time && time <= next.time) {
      const span = next.time - curr.time
      const ratio = span === 0 ? 0 : (time - curr.time) / span
      return {
        position: curr.position + (next.position - curr.position) * ratio,
        opacity: curr.opacity + (next.opacity - curr.opacity) * ratio,
      }
    }
  }
  return { position: sorted[0].position, opacity: sorted[0].opacity }
}

export class AnimationEngine {
  private rafId: number | null = null
  private startTime: number = 0
  private lastFrameTime: number = 0
  private paused: boolean = false
  private pageHidden: boolean = false
  private listeners: Set<ProgressListener> = new Set()
  private tracks: AnimationTrack[] = []
  private fpsSamples: number[] = []
  private lastFpsUpdate: number = 0
  private currentFps: number = 60
  private resetFlag: boolean = false
  private visibilityHandler: (() => void) | null = null

  setTracks(tracks: AnimationTrack[]) {
    this.tracks = tracks
  }

  reset() {
    this.resetFlag = true
  }

  subscribe(listener: ProgressListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(progresses: TrackProgress[]) {
    if (this.listeners.size === 0) return
    this.listeners.forEach((l) => l(progresses, this.currentFps))
  }

  private tick = (now: number) => {
    if (this.paused || this.pageHidden) {
      this.rafId = requestAnimationFrame(this.tick)
      return
    }

    if (this.resetFlag || this.startTime === 0) {
      this.startTime = now
      this.resetFlag = false
    }

    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime
      if (delta > 0) {
        const instantFps = 1000 / delta
        this.fpsSamples.push(instantFps)
        if (this.fpsSamples.length > MAX_FPS_SAMPLES) {
          this.fpsSamples.shift()
        }
      }
    }
    this.lastFrameTime = now

    if (now - this.lastFpsUpdate >= 100 && this.fpsSamples.length > 0) {
      const sum = this.fpsSamples.reduce((a, b) => a + b, 0)
      this.currentFps = Math.round(sum / this.fpsSamples.length)
      this.lastFpsUpdate = now
    }

    const progresses: TrackProgress[] = this.tracks.map((track) => {
      const totalCycle = track.duration + PAUSE_AT_END_MS
      const elapsed = (now - this.startTime) % (totalCycle * 2)
      const forwardElapsed = elapsed < totalCycle ? elapsed : elapsed - totalCycle
      let rawProgress: number
      let direction: 1 | -1 = 1

      if (elapsed < totalCycle) {
        rawProgress = Math.min(1, forwardElapsed / track.duration)
        direction = 1
      } else {
        rawProgress = Math.min(1, forwardElapsed / track.duration)
        direction = -1
      }

      if (forwardElapsed > track.duration) {
        rawProgress = 1
      }

      const eased = cubicBezier(track.curve, rawProgress)
      const displayProgress = direction === 1 ? eased : 1 - eased
      const interpolated = interpolateKeyframes(track.keyframes, displayProgress)

      return {
        trackId: track.id,
        progress: direction === 1 ? rawProgress : 1 - rawProgress,
        easedProgress: displayProgress,
        x: interpolated.position,
        opacity: interpolated.opacity,
      }
    })

    this.emit(progresses)
    this.rafId = requestAnimationFrame(this.tick)
  }

  start() {
    if (this.rafId !== null) return
    this.startTime = 0
    this.lastFrameTime = 0
    this.lastFpsUpdate = 0
    this.fpsSamples = []
    this.currentFps = 60
    this.rafId = requestAnimationFrame(this.tick)

    this.visibilityHandler = () => {
      this.pageHidden = document.hidden
      if (!document.hidden) {
        this.resetFlag = true
        this.startTime = 0
      }
    }
    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }
  }
}

export const animationEngine = new AnimationEngine()
