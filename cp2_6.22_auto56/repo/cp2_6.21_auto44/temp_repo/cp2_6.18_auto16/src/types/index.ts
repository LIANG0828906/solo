export interface BezierCurve {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface Keyframe {
  id: string
  time: number
  position: number
  opacity: number
}

export interface AnimationTrack {
  id: string
  name: string
  curve: BezierCurve
  duration: number
  keyframes: Keyframe[]
  color: string
}

export interface TrackProgress {
  trackId: string
  progress: number
  easedProgress: number
  x: number
  opacity: number
}

export interface AnimationStateShape {
  tracks: AnimationTrack[]
  selectedTrackId: string | null
  isExportPanelOpen: boolean
  selectTrack: (id: string | null) => void
  updateBezier: (id: string, curve: BezierCurve) => void
  setTrackDuration: (id: string, duration: number) => void
  addKeyframe: (trackId: string, time: number) => void
  updateKeyframe: (trackId: string, kfId: string, patch: Partial<Keyframe>) => void
  removeKeyframe: (trackId: string, kfId: string) => void
  toggleExportPanel: (open?: boolean) => void
  generateCSS: (trackId: string) => string
}
