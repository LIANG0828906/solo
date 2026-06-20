import { create } from 'zustand'

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  trail: { x: number; y: number }[]
  hue: number
  life: number
  maxLife: number
}

export interface Star {
  x: number
  y: number
  size: number
  opacity: number
  twinklePhase: number
}

export type PhysicsMode = 'gravity' | 'vortex' | 'ejection'
export type ColorScheme = 'aurora' | 'lava' | 'ocean' | 'night' | 'rainbow'

interface ParticleState {
  particles: Particle[]
  maxParticles: number
  speed: number
  gravityStrength: number
  trailLength: number
  physicsMode: PhysicsMode
  colorScheme: ColorScheme
  isMouseDown: boolean
  isRightMouseDown: boolean
  mouseX: number
  mouseY: number
  lastMouseX: number
  lastMouseY: number
  gravityPointX: number | null
  gravityPointY: number | null
  stars: Star[]
  particleIdCounter: number
  canvasWidth: number
  canvasHeight: number

  setCanvasSize: (width: number, height: number) => void
  setMouseDown: (down: boolean, x: number, y: number) => void
  setRightMouseDown: (down: boolean, x: number, y: number) => void
  setMousePosition: (x: number, y: number) => void
  addParticle: (x: number, y: number, vx: number, vy: number) => void
  updateParticles: () => void
  setPhysicsMode: (mode: PhysicsMode) => void
  setColorScheme: (scheme: ColorScheme) => void
  setSpeed: (speed: number) => void
  setGravityStrength: (strength: number) => void
  setTrailLength: (length: number) => void
  clearParticles: () => void
  addStars: (count: number) => void
  updateStars: () => void
  setGravityPoint: (x: number | null, y: number | null) => void
  getHueForScheme: () => number
}

export const colorSchemeRanges: Record<ColorScheme, [number, number]> = {
  aurora: [180, 300],
  lava: [0, 60],
  ocean: [180, 240],
  night: [270, 330],
  rainbow: [0, 360],
}

export const physicsModeNames: Record<PhysicsMode, string> = {
  gravity: '引力吸引',
  vortex: '涡旋旋转',
  ejection: '弹射扩散',
}

export const colorSchemeNames: Record<ColorScheme, string> = {
  aurora: '极光',
  lava: '熔岩',
  ocean: '海洋',
  night: '暗夜',
  rainbow: '彩虹',
}

export const colorSchemeColors: Record<ColorScheme, string[]> = {
  aurora: ['#00FFFF', '#00BFFF', '#9370DB', '#8A2BE2'],
  lava: ['#FF4500', '#FF6347', '#FFA500', '#FFD700'],
  ocean: ['#00CED1', '#20B2AA', '#48D1CC', '#40E0D0'],
  night: ['#9932CC', '#FF69B4', '#FFB6C1', '#FFFFFF'],
  rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'],
}

export const useParticleStore = create<ParticleState>((set, get) => ({
  particles: [],
  maxParticles: 3000,
  speed: 1,
  gravityStrength: 0.5,
  trailLength: 20,
  physicsMode: 'gravity',
  colorScheme: 'aurora',
  isMouseDown: false,
  isRightMouseDown: false,
  mouseX: 0,
  mouseY: 0,
  lastMouseX: 0,
  lastMouseY: 0,
  gravityPointX: null,
  gravityPointY: null,
  stars: [],
  particleIdCounter: 0,
  canvasWidth: 800,
  canvasHeight: 600,

  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  setMouseDown: (down, x, y) =>
    set({ isMouseDown: down, mouseX: x, mouseY: y, lastMouseX: x, lastMouseY: y }),

  setRightMouseDown: (down, x, y) =>
    set({
      isRightMouseDown: down,
      gravityPointX: down ? x : null,
      gravityPointY: down ? y : null,
    }),

  setMousePosition: (x, y) =>
    set((state) => ({
      lastMouseX: state.mouseX,
      lastMouseY: state.mouseY,
      mouseX: x,
      mouseY: y,
    })),

  addParticle: (x, y, vx, vy) => {
    const state = get()
    const [minHue, maxHue] = colorSchemeRanges[state.colorScheme]
    const hue = minHue + Math.random() * (maxHue - minHue)

    const newParticle: Particle = {
      id: state.particleIdCounter,
      x,
      y,
      vx: vx * state.speed,
      vy: vy * state.speed,
      trail: [],
      hue,
      life: 0,
      maxLife: 300 + Math.random() * 300,
    }

    set((prev) => {
      const newParticles = [...prev.particles, newParticle]
      if (newParticles.length > prev.maxParticles) {
        newParticles.splice(0, newParticles.length - prev.maxParticles)
      }
      return {
        particles: newParticles,
        particleIdCounter: prev.particleIdCounter + 1,
      }
    })
  },

  updateParticles: () => {
    const state = get()
    const {
      particles,
      physicsMode,
      gravityStrength,
      trailLength,
      canvasWidth,
      canvasHeight,
      gravityPointX,
      gravityPointY,
    } = state

    const updatedParticles = particles
      .map((p) => {
        let { x, y, vx, vy } = p
        const trail = [...p.trail, { x, y }]
        if (trail.length > trailLength) {
          trail.splice(0, trail.length - trailLength)
        }

        const centerX = canvasWidth / 2
        const centerY = canvasHeight / 2

        if (physicsMode === 'gravity') {
          for (const other of particles) {
            if (other.id === p.id) continue
            const dx = other.x - x
            const dy = other.y - y
            const distSq = dx * dx + dy * dy
            const dist = Math.sqrt(distSq)
            if (dist > 5 && dist < 200) {
              const force = (gravityStrength * 0.1) / distSq
              vx += (dx / dist) * force
              vy += (dy / dist) * force
            }
            if (dist < 10) {
              const repel = 0.5 / distSq
              vx -= (dx / dist) * repel
              vy -= (dy / dist) * repel
            }
          }
          vx *= 0.99
          vy *= 0.99
        } else if (physicsMode === 'vortex') {
          const dx = centerX - x
          const dy = centerY - y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 5) {
            const tangentialX = -dy / dist
            const tangentialY = dx / dist
            vx += tangentialX * 0.15
            vy += tangentialY * 0.15
            vx += (dx / dist) * 0.02
            vy += (dy / dist) * 0.02
          }
          vx *= 0.995
          vy *= 0.995
        } else if (physicsMode === 'ejection') {
          if (x < 0 || x > canvasWidth) {
            vx *= -0.9
            x = Math.max(0, Math.min(canvasWidth, x))
          }
          if (y < 0 || y > canvasHeight) {
            vy *= -0.9
            y = Math.max(0, Math.min(canvasHeight, y))
          }
          vx *= 0.995
          vy *= 0.995
        }

        if (gravityPointX !== null && gravityPointY !== null) {
          const dx = gravityPointX - x
          const dy = gravityPointY - y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 5) {
            const force = gravityStrength * 0.5 / Math.max(dist, 10)
            vx += (dx / dist) * force
            vy += (dy / dist) * force
            const tangentialX = -dy / dist
            const tangentialY = dx / dist
            vx += tangentialX * 0.3
            vy += tangentialY * 0.3
          }
        }

        const speed = Math.sqrt(vx * vx + vy * vy)
        const maxSpeed = 15
        if (speed > maxSpeed) {
          vx = (vx / speed) * maxSpeed
          vy = (vy / speed) * maxSpeed
        }

        x += vx * state.speed
        y += vy * state.speed

        return {
          ...p,
          x,
          y,
          vx,
          vy,
          trail,
          life: p.life + 1,
        }
      })
      .filter((p) => p.life < p.maxLife)

    set({ particles: updatedParticles })
  },

  setPhysicsMode: (mode) => set({ physicsMode: mode }),

  setColorScheme: (scheme) => set({ colorScheme: scheme }),

  setSpeed: (speed) => set({ speed }),

  setGravityStrength: (strength) => set({ gravityStrength: strength }),

  setTrailLength: (length) => set({ trailLength: length }),

  clearParticles: () => set({ particles: [] }),

  addStars: (count) => {
    const { canvasWidth, canvasHeight, stars } = get()
    const newStars: Star[] = []
    for (let i = 0; i < count; i++) {
      newStars.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: 1 + Math.random(),
        opacity: 0.3 + Math.random() * 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
      })
    }
    set({ stars: [...stars, ...newStars].slice(-200) })
  },

  updateStars: () => {
    const { stars } = get()
    const updated = stars.map((s) => ({
      ...s,
      twinklePhase: s.twinklePhase + 0.02,
    }))
    set({ stars: updated })
  },

  setGravityPoint: (x, y) => set({ gravityPointX: x, gravityPointY: y }),

  getHueForScheme: () => {
    const [minHue, maxHue] = colorSchemeRanges[get().colorScheme]
    return minHue + Math.random() * (maxHue - minHue)
  },
}))
