import { create } from 'zustand'

export interface Particle {
  id: number
  x: number
  y: number
  z: number
  color: string
  size: number
  opacity: number
  life: number
  maxLife: number
  velocity: { x: number; y: number; z: number }
}

export interface HistoryPoint {
  timestamp: number
  focus: number
  emotion: number
  transition: number
}

export interface TrajectoryPoint {
  timestamp: number
  position: { x: number; y: number; z: number }
  focus: number
  emotion: number
  transition: number
  label: string
}

export type ThemeMode = 'focus' | 'diverge' | 'default'

interface AppState {
  particles: Particle[]
  history: HistoryPoint[]
  trajectory: TrajectoryPoint[]
  mode: ThemeMode
  fps: number
  showTrajectory: boolean
  pulseWaves: PulseWave[]
  eventMarkers: EventMarker[]

  updateParticles: (delta: number, focus: number, emotion: number, transition: number, mode: ThemeMode) => void
  addHistoryPoint: (point: HistoryPoint) => void
  addTrajectoryPoint: (point: TrajectoryPoint) => void
  setMode: (mode: ThemeMode) => void
  setFps: (fps: number) => void
  toggleTrajectory: () => void
  addPulseWave: (wave: Omit<PulseWave, 'id'>) => void
  updatePulseWaves: (_delta: number) => void
  addEventMarker: (marker: Omit<EventMarker, 'id'>) => void
  updateEventMarkers: (_delta: number) => void
  initParticles: (count: number) => void
}

export interface PulseWave {
  id: number
  timestamp: number
  duration: number
  color: string
  direction: { x: number; y: number; z: number }
}

export interface EventMarker {
  id: number
  timestamp: number
  duration: number
  type: 'focus' | 'emotion' | 'transition'
  value: number
}

let particleIdCounter = 0
let pulseWaveIdCounter = 0
let eventMarkerIdCounter = 0

const PARTICLE_COUNT = 15000

const createParticle = (): Particle => {
  const angle = Math.random() * Math.PI * 2
  const radius = Math.random() * 3
  const y = (Math.random() - 0.5) * 4
  
  return {
    id: particleIdCounter++,
    x: Math.cos(angle) * radius,
    y,
    z: Math.sin(angle) * radius,
    color: '#ffffff',
    size: 0.1 + Math.random() * 0.4,
    opacity: 0.3 + Math.random() * 0.4,
    life: 1 + Math.random() * 4,
    maxLife: 1 + Math.random() * 4,
    velocity: {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02,
    },
  }
}

const hueToRgb = (h: number, s: number, l: number): string => {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const createInitialParticles = (): Particle[] => {
  const particles: Particle[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle())
  }
  return particles
}

export const useAppStore = create<AppState>((set, get) => ({
  particles: createInitialParticles(),
  history: [],
  trajectory: [],
  mode: 'default',
  fps: 60,
  showTrajectory: true,
  pulseWaves: [],
  eventMarkers: [],

  initParticles: (count: number) => {
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      particles.push(createParticle())
    }
    set({ particles })
  },

  updateParticles: (delta: number, focus: number, emotion: number, transition: number, mode: ThemeMode) => {
    const { particles } = get()
    
    const baseSpeed = 0.01 + transition * 0.04
    const speedMultiplier = mode === 'focus' ? 0.5 : mode === 'diverge' ? 1.5 : 1
    const speed = baseSpeed * speedMultiplier

    const yCenter = 0
    const ySpread = mode === 'focus' ? 0.5 : mode === 'diverge' ? 2.5 : 1.5
    const focusFactor = 1 - focus

    let baseHue = 0.6 - emotion * 0.5
    if (mode === 'focus') {
      baseHue = 0.4 + Math.random() * 0.2
    } else if (mode === 'diverge') {
      baseHue = 0.0 + Math.random() * 0.2
    }

    const updatedParticles = particles.map((p) => {
      let newLife = p.life - delta
      let particle = { ...p }

      if (newLife <= 0) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 3
        const y = (Math.random() - 0.5) * 4
        particle = {
          ...createParticle(),
          id: p.id,
          x: Math.cos(angle) * radius,
          y,
          z: Math.sin(angle) * radius,
          life: 1 + Math.random() * 4,
          maxLife: 1 + Math.random() * 4,
        }
        newLife = particle.life
      }

      const brownianX = (Math.random() - 0.5) * speed
      const brownianY = (Math.random() - 0.5) * speed * (1 + focusFactor * 0.5)
      const brownianZ = (Math.random() - 0.5) * speed

      let newX = particle.x + brownianX + particle.velocity.x * delta * 60
      let newY = particle.y + brownianY + particle.velocity.y * delta * 60
      let newZ = particle.z + brownianZ + particle.velocity.z * delta * 60

      const distFromCenter = Math.sqrt(newX * newX + newZ * newZ)
      if (distFromCenter > 5) {
        const scale = 5 / distFromCenter
        newX *= scale
        newZ *= scale
      }

      const targetY = yCenter + (Math.random() - 0.5) * ySpread * focusFactor
      newY = particle.y + (targetY - particle.y) * 0.02 * delta * 60
      newY = Math.max(-3, Math.min(3, newY))

      const lifeRatio = newLife / particle.maxLife
      let opacity = particle.opacity
      if (lifeRatio < 0.2) {
        opacity = (lifeRatio / 0.2) * particle.opacity
      } else if (lifeRatio > 0.8) {
        opacity = ((1 - lifeRatio) / 0.2) * particle.opacity
      }

      const hueVariation = (Math.random() - 0.5) * 0.1
      const hue = (baseHue + hueVariation + 1) % 1

      const sizeJitter = (Math.random() - 0.5) * 0.05
      const opacityJitter = (Math.random() - 0.5) * 0.1

      return {
        ...particle,
        x: newX,
        y: newY,
        z: newZ,
        life: newLife,
        color: hueToRgb(hue, 0.8, 0.6),
        opacity: Math.max(0.1, Math.min(0.9, opacity + opacityJitter)),
        size: Math.max(0.1, Math.min(0.5, particle.size + sizeJitter)),
      }
    })

    set({ particles: updatedParticles })
  },

  addHistoryPoint: (point: HistoryPoint) => {
    const { history } = get()
    const maxHistory = 3600
    const newHistory = [...history, point].slice(-maxHistory)
    set({ history: newHistory })
  },

  addTrajectoryPoint: (point: TrajectoryPoint) => {
    const { trajectory } = get()
    const maxPoints = 50
    const newTrajectory = [...trajectory, point].slice(-maxPoints)
    set({ trajectory: newTrajectory })
  },

  setMode: (mode: ThemeMode) => {
    set({ mode })
  },

  setFps: (fps: number) => {
    set({ fps })
  },

  toggleTrajectory: () => {
    set((state) => ({ showTrajectory: !state.showTrajectory }))
  },

  addPulseWave: (wave: Omit<PulseWave, 'id'>) => {
    const { pulseWaves } = get()
    const newWave: PulseWave = {
      ...wave,
      id: pulseWaveIdCounter++,
    }
    set({ pulseWaves: [...pulseWaves, newWave] })
  },

  updatePulseWaves: (_delta: number) => {
    const { pulseWaves } = get()
    const now = performance.now()
    const updated = pulseWaves
      .map((w) => ({ ...w }))
      .filter((w) => now - w.timestamp < w.duration * 1000)
    set({ pulseWaves: updated })
  },

  addEventMarker: (marker: Omit<EventMarker, 'id'>) => {
    const { eventMarkers } = get()
    const newMarker: EventMarker = {
      ...marker,
      id: eventMarkerIdCounter++,
    }
    set({ eventMarkers: [...eventMarkers, newMarker] })
  },

  updateEventMarkers: (_delta: number) => {
    const { eventMarkers } = get()
    const now = performance.now()
    const updated = eventMarkers
      .map((m) => ({ ...m }))
      .filter((m) => now - m.timestamp < m.duration * 1000)
    set({ eventMarkers: updated })
  },
}))
