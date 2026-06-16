import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { Planet, Satellite, Vector2D, Asteroid, generateAsteroids, updateSatellite, checkCollision } from '../engine/physics'

type GameMode = 'single' | 'transfer'
type GamePhase = 'idle' | 'aiming' | 'launched' | 'success' | 'failed'
type OrbitType = 'circular' | 'elliptical' | 'polar'

interface Particle {
  id: string
  position: Vector2D
  velocity: Vector2D
  life: number
  maxLife: number
  color: string
  size: number
}

interface GameState {
  mode: GameMode
  phase: GamePhase
  targetOrbitType: OrbitType
  zoom: number
  planets: Planet[]
  satellite: Satellite | null
  asteroids: Asteroid[]
  particles: Particle[]
  score: number
  missionTime: number
  showSuccessMessage: boolean
  isTransitioning: boolean
  thrustActive: boolean
  thrustTimer: number
  launchPad: Vector2D
  dragStart: Vector2D | null
  dragEnd: Vector2D | null
  selectedPlanetType: string
  primaryPlanetType: string

  setMode: (mode: GameMode) => void
  setTargetOrbitType: (type: OrbitType) => void
  setZoom: (zoom: number) => void
  setSelectedPlanetType: (type: string) => void
  setPrimaryPlanetType: (type: string) => void

  startDrag: (position: Vector2D) => void
  updateDrag: (position: Vector2D) => void
  endDrag: (position: Vector2D) => void

  update: (deltaTime: number) => void
  resetSimulation: () => void
  triggerThrust: () => void
  addParticles: (position: Vector2D, count: number, color: string) => void
}

const PLANET_PRESETS = {
  terra: { color: '#4A90D9', mass: 1000, radius: 30 },
  desert: { color: '#D4A574', mass: 1200, radius: 35 },
  ice: { color: '#A8D8EA', mass: 800, radius: 28 },
  gas: { color: '#E8B86D', mass: 2500, radius: 50 },
  lava: { color: '#FF6B35', mass: 1500, radius: 32 },
}

function createInitialPlanets(mode: GameMode, planetType: keyof typeof PLANET_PRESETS = 'terra'): Planet[] {
  const preset = PLANET_PRESETS[planetType] || PLANET_PRESETS.terra
  const primary: Planet = {
    id: 'primary',
    position: { x: 0, y: 0 },
    mass: preset.mass,
    radius: preset.radius,
    color: preset.color,
    type: 'primary',
    label: '主星',
  }

  if (mode === 'transfer') {
    const secondary: Planet = {
      id: 'secondary',
      position: { x: 300, y: -100 },
      mass: preset.mass * 0.7,
      radius: preset.radius * 0.7,
      color: '#9B59B6',
      type: 'secondary',
      label: '目标',
    }
    return [primary, secondary]
  }

  return [primary]
}

function createInitialSatellite(launchPad: Vector2D): Satellite {
  return {
    id: uuidv4(),
    position: { ...launchPad },
    velocity: { x: 0, y: 0 },
    fuel: 1.0,
    trail: [],
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'single',
  phase: 'idle',
  targetOrbitType: 'circular',
  zoom: 1,
  planets: createInitialPlanets('single'),
  satellite: null,
  asteroids: [],
  particles: [],
  score: 0,
  missionTime: 0,
  showSuccessMessage: false,
  isTransitioning: false,
  thrustActive: false,
  thrustTimer: 0,
  launchPad: { x: -250, y: 180 },
  dragStart: null,
  dragEnd: null,
  selectedPlanetType: 'terra',
  primaryPlanetType: 'terra',

  setMode: (mode) => {
    set({ mode })
    get().resetSimulation()
  },

  setTargetOrbitType: (type) => set({ targetOrbitType: type }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedPlanetType: (type) => set({ selectedPlanetType: type }),
  setPrimaryPlanetType: (type) => {
    set({ primaryPlanetType: type })
    const state = get()
    const preset = PLANET_PRESETS[type as keyof typeof PLANET_PRESETS] || PLANET_PRESETS.terra
    const updatedPlanets = state.planets.map(p =>
      p.type === 'primary'
        ? { ...p, mass: preset.mass, radius: preset.radius, color: preset.color }
        : p
    )
    set({ planets: updatedPlanets })
  },

  startDrag: (position) => {
    const state = get()
    if (state.phase !== 'idle') return
    set({
      dragStart: { ...state.launchPad },
      dragEnd: position,
      phase: 'aiming',
    })
  },

  updateDrag: (position) => {
    const state = get()
    if (state.phase !== 'aiming') return
    set({ dragEnd: position })
  },

  endDrag: (position) => {
    const state = get()
    if (state.phase !== 'aiming') return

    const direction = {
      x: state.launchPad.x - position.x,
      y: state.launchPad.y - position.y,
    }
    const speed = Math.min(Math.sqrt(direction.x ** 2 + direction.y ** 2) * 0.3, 150)
    const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2)
    const velocity = magnitude > 0
      ? { x: (direction.x / magnitude) * speed, y: (direction.y / magnitude) * speed }
      : { x: 0, y: -50 }

    const satellite = createInitialSatellite(state.launchPad)
    satellite.velocity = velocity

    set({
      satellite,
      dragStart: null,
      dragEnd: null,
      phase: 'launched',
      missionTime: 0,
    })
  },

  update: (deltaTime) => {
    const state = get()
    if (state.phase !== 'launched' || !state.satellite) return

    const updatedSatellite = updateSatellite(state.satellite, state.planets, deltaTime)
    const collision = checkCollision(updatedSatellite, state.planets)

    let updatedParticles = state.particles
      .map(p => ({
        ...p,
        position: {
          x: p.position.x + p.velocity.x * deltaTime,
          y: p.position.y + p.velocity.y * deltaTime,
        },
        life: p.life - deltaTime,
      }))
      .filter(p => p.life > 0)

    let thrustTimer = state.thrustTimer
    let thrustActive = state.thrustActive

    if (thrustActive) {
      thrustTimer -= deltaTime
      if (thrustTimer <= 0) {
        thrustActive = false
        thrustTimer = 0
      } else {
        const thrustDir = { ...updatedSatellite.velocity }
        const mag = Math.sqrt(thrustDir.x ** 2 + thrustDir.y ** 2)
        if (mag > 0) {
          thrustDir.x /= mag
          thrustDir.y /= mag
        }
        for (let i = 0; i < 3; i++) {
          updatedParticles.push({
            id: uuidv4(),
            position: {
              x: updatedSatellite.position.x - thrustDir.x * 10 + (Math.random() - 0.5) * 5,
              y: updatedSatellite.position.y - thrustDir.y * 10 + (Math.random() - 0.5) * 5,
            },
            velocity: {
              x: -thrustDir.x * 50 + (Math.random() - 0.5) * 20,
              y: -thrustDir.y * 50 + (Math.random() - 0.5) * 20,
            },
            life: 0.3,
            maxLife: 0.3,
            color: '#FF6B35',
            size: 3 + Math.random() * 2,
          })
        }
      }
    }

    if (collision) {
      set({
        phase: 'failed',
        satellite: updatedSatellite,
        particles: updatedParticles,
        thrustActive,
        thrustTimer,
      })
      return
    }

    const newMissionTime = state.missionTime + deltaTime

    set({
      satellite: updatedSatellite,
      particles: updatedParticles,
      missionTime: newMissionTime,
      thrustActive,
      thrustTimer,
    })
  },

  resetSimulation: () => {
    const state = get()
    set({ isTransitioning: true })

    setTimeout(() => {
      const currentState = get()
      const planets = createInitialPlanets(currentState.mode, currentState.primaryPlanetType as keyof typeof PLANET_PRESETS)
      const asteroids = generateAsteroids(
        { x: 0, y: 0 },
        180,
        350,
        80
      )

      set({
        phase: 'idle',
        planets,
        satellite: null,
        asteroids,
        particles: [],
        missionTime: 0,
        showSuccessMessage: false,
        isTransitioning: false,
        thrustActive: false,
        thrustTimer: 0,
        dragStart: null,
        dragEnd: null,
      })
    }, 500)
  },

  triggerThrust: () => {
    const state = get()
    if (state.phase !== 'launched' || !state.satellite || state.thrustActive) return
    if (state.satellite.fuel < 0.1) return

    const thrustDeltaV = 30
    const velocity = state.satellite.velocity
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
    const direction = speed > 0
      ? { x: velocity.x / speed, y: velocity.y / speed }
      : { x: 0, y: -1 }

    const newSatellite = {
      ...state.satellite,
      velocity: {
        x: state.satellite.velocity.x + direction.x * thrustDeltaV,
        y: state.satellite.velocity.y + direction.y * thrustDeltaV,
      },
      fuel: Math.max(0, state.satellite.fuel - 0.1),
    }

    set({
      satellite: newSatellite,
      thrustActive: true,
      thrustTimer: 0.3,
    })
  },

  addParticles: (position, count, color) => {
    const state = get()
    const newParticles: Particle[] = []

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const speed = 30 + Math.random() * 50
      newParticles.push({
        id: uuidv4(),
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        life: 1.5,
        maxLife: 1.5,
        color,
        size: 3 + Math.random() * 3,
      })
    }

    set({ particles: [...state.particles, ...newParticles] })
  },
}))

export { PLANET_PRESETS }
