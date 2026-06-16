import { create } from 'zustand'

export interface OrbitalObject {
  id: string
  x: number
  y: number
  radius: number
  color: string
  type: 'derelict' | 'active'
  orbitA: number
  orbitB: number
  orbitCenterX: number
  orbitCenterY: number
  angle: number
  angularSpeed: number
  vx: number
  vy: number
  isDestroyed: boolean
}

export interface Debris {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  opacity: number
  age: number
  rotation: number
  rotationSpeed: number
  isCleaning: boolean
  cleanStartTime: number
}

export interface Projectile {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  active: boolean
}

export interface CollisionEvent {
  id: string
  x: number
  y: number
  time: number
  debrisCount: number
  isCascade: boolean
}

export interface SimulationParams {
  objectCount: number
  speedMultiplier: number
  collisionRadius: number
  gravityStrength: number
}

export interface DebrisHistoryPoint {
  time: number
  count: number
}

export interface SimulationState {
  objects: OrbitalObject[]
  debris: Debris[]
  projectile: Projectile | null
  collisions: CollisionEvent[]
  params: SimulationParams
  totalCollisions: number
  destroyedCount: number
  cleanupCooldown: number
  cleanupRect: { x: number; y: number; w: number; h: number } | null
  isLaunched: boolean
  debrisHistory: DebrisHistoryPoint[]
  warningMessage: string | null
  warningStartTime: number
  edgeFlash: boolean
  edgeFlashStartTime: number
  elapsedTime: number
  canvasWidth: number
  canvasHeight: number
  historyTimer: number
}

let nextId = 0
export function generateId(): string {
  return `obj_${nextId++}_${Date.now()}`
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function createOrbitalObject(index: number, canvasWidth: number, canvasHeight: number): OrbitalObject {
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2
  const orbitA = randomBetween(80, Math.min(canvasWidth, canvasHeight) * 0.35)
  const orbitB = randomBetween(60, Math.min(canvasWidth, canvasHeight) * 0.28)
  const offsetX = randomBetween(-50, 50)
  const offsetY = randomBetween(-50, 50)
  const angle = randomBetween(0, Math.PI * 2)
  const angularSpeed = randomBetween(0.3, 0.8)
  const radius = randomBetween(2, 6)
  const type = Math.random() > 0.4 ? 'derelict' : 'active'
  const color = type === 'derelict' ? '#888888' : '#3498DB'

  const x = centerX + offsetX + orbitA * Math.cos(angle)
  const y = centerY + offsetY + orbitB * Math.sin(angle)
  const vx = -orbitA * angularSpeed * Math.sin(angle)
  const vy = orbitB * angularSpeed * Math.cos(angle)

  return {
    id: generateId(),
    x,
    y,
    radius,
    color,
    type,
    orbitA,
    orbitB,
    orbitCenterX: centerX + offsetX,
    orbitCenterY: centerY + offsetY,
    angle,
    angularSpeed,
    vx,
    vy,
    isDestroyed: false,
  }
}

export interface SimulationActions {
  initializeObjects: () => void
  launchProjectile: () => void
  updatePositions: (dt: number) => void
  handleCollision: (objectId: string, isCascade: boolean) => void
  startCleanup: () => void
  setCleanupRect: (rect: { x: number; y: number; w: number; h: number } | null) => void
  resetSimulation: () => void
  updateParams: (params: Partial<SimulationParams>) => void
  setCanvasSize: (width: number, height: number) => void
  setEdgeFlash: (flash: boolean) => void
  setWarning: (message: string | null) => void
  tickCooldown: (dt: number) => void
  recordDebrisHistory: () => void
  removeDebris: (ids: string[]) => void
  addDebris: (newDebris: Debris[]) => void
  updateDebris: (updatedDebris: Debris[]) => void
}

export const useStore = create<SimulationState & SimulationActions>((set, get) => ({
  objects: [],
  debris: [],
  projectile: null,
  collisions: [],
  params: {
    objectCount: 4,
    speedMultiplier: 1.0,
    collisionRadius: 15,
    gravityStrength: 1.0,
  },
  totalCollisions: 0,
  destroyedCount: 0,
  cleanupCooldown: 0,
  cleanupRect: null,
  isLaunched: false,
  debrisHistory: [],
  warningMessage: null,
  warningStartTime: 0,
  edgeFlash: false,
  edgeFlashStartTime: 0,
  elapsedTime: 0,
  canvasWidth: 800,
  canvasHeight: 600,
  historyTimer: 0,

  initializeObjects: () => {
    const { params, canvasWidth, canvasHeight } = get()
    const objects: OrbitalObject[] = []
    for (let i = 0; i < params.objectCount; i++) {
      objects.push(createOrbitalObject(i, canvasWidth, canvasHeight))
    }
    set({ objects, isLaunched: false, projectile: null })
  },

  launchProjectile: () => {
    const { canvasWidth, canvasHeight, isLaunched } = get()
    if (isLaunched) return

    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2
    const side = Math.floor(Math.random() * 4)
    let startX: number, startY: number
    switch (side) {
      case 0: startX = 0; startY = randomBetween(0, canvasHeight); break
      case 1: startX = canvasWidth; startY = randomBetween(0, canvasHeight); break
      case 2: startX = randomBetween(0, canvasWidth); startY = 0; break
      default: startX = randomBetween(0, canvasWidth); startY = canvasHeight; break
    }
    const dx = centerX - startX + randomBetween(-100, 100)
    const dy = centerY - startY + randomBetween(-100, 100)
    const dist = Math.sqrt(dx * dx + dy * dy)
    const speed = 350
    const vx = (dx / dist) * speed
    const vy = (dy / dist) * speed

    set({
      projectile: {
        id: generateId(),
        x: startX,
        y: startY,
        vx,
        vy,
        radius: 1,
        active: true,
      },
      isLaunched: true,
    })
  },

  updatePositions: (dt: number) => {
    const state = get()
    const { params, canvasWidth, canvasHeight } = state

    const updatedObjects = state.objects.map(obj => {
      if (obj.isDestroyed) return obj
      const newAngle = obj.angle + obj.angularSpeed * params.speedMultiplier * dt
      const x = obj.orbitCenterX + obj.orbitA * Math.cos(newAngle)
      const y = obj.orbitCenterY + obj.orbitB * Math.sin(newAngle)
      const vx = -obj.orbitA * obj.angularSpeed * params.speedMultiplier * Math.sin(newAngle)
      const vy = obj.orbitB * obj.angularSpeed * params.speedMultiplier * Math.cos(newAngle)
      return { ...obj, angle: newAngle, x, y, vx, vy }
    })

    let projectile = state.projectile
    if (projectile && projectile.active) {
      projectile = {
        ...projectile,
        x: projectile.x + projectile.vx * dt,
        y: projectile.y + projectile.vy * dt,
      }
      if (projectile.x < -50 || projectile.x > canvasWidth + 50 ||
          projectile.y < -50 || projectile.y > canvasHeight + 50) {
        projectile = { ...projectile, active: false }
      }
    }

    set({
      objects: updatedObjects,
      projectile,
      elapsedTime: state.elapsedTime + dt,
    })
  },

  handleCollision: (objectId: string, isCascade: boolean) => {
    const state = get()
    const obj = state.objects.find(o => o.id === objectId)
    if (!obj || obj.isDestroyed) return

    const count = Math.floor(randomBetween(20, 40))
    const newDebris: Debris[] = []
    for (let i = 0; i < count; i++) {
      const angle = randomBetween(0, Math.PI * 2)
      const speedMult = randomBetween(0.5, 1.5)
      const baseSpeed = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy)
      const speed = baseSpeed * speedMult * state.params.speedMultiplier
      const t = randomBetween(0, 1)
      const r = Math.floor(255 * (1 - t * 0.5))
      const g = Math.floor(68 * (1 - t * 0.6))
      const b = Math.floor(68 * (1 - t * 0.6))
      const color = `rgb(${r},${g},${b})`

      newDebris.push({
        id: generateId(),
        x: obj.x + randomBetween(-3, 3),
        y: obj.y + randomBetween(-3, 3),
        vx: Math.cos(angle) * speed + obj.vx * 0.3,
        vy: Math.sin(angle) * speed + obj.vy * 0.3,
        radius: randomBetween(0.5, 2),
        color,
        opacity: 1,
        age: 0,
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: randomBetween(-3, 3),
        isCleaning: false,
        cleanStartTime: 0,
      })
    }

    const updatedObjects = state.objects.map(o =>
      o.id === objectId ? { ...o, isDestroyed: true } : o
    )

    const collisionEvent: CollisionEvent = {
      id: generateId(),
      x: obj.x,
      y: obj.y,
      time: state.elapsedTime,
      debrisCount: count,
      isCascade,
    }

    const newWarning = isCascade
      ? `级联碰撞触发！新增${count}碎片`
      : null

    set({
      objects: updatedObjects,
      debris: [...state.debris, ...newDebris],
      collisions: [...state.collisions, collisionEvent],
      totalCollisions: state.totalCollisions + 1,
      destroyedCount: state.destroyedCount + 1,
      warningMessage: newWarning ? newWarning : state.warningMessage,
      warningStartTime: newWarning ? Date.now() : state.warningStartTime,
      edgeFlash: true,
      edgeFlashStartTime: Date.now(),
    })
  },

  startCleanup: () => {
    const { cleanupRect, cleanupCooldown, debris } = get()
    if (cleanupCooldown > 0 || !cleanupRect) return

    const now = Date.now()
    const updatedDebris = debris.map(d => {
      if (
        d.x >= cleanupRect.x && d.x <= cleanupRect.x + cleanupRect.w &&
        d.y >= cleanupRect.y && d.y <= cleanupRect.y + cleanupRect.h
      ) {
        return { ...d, isCleaning: true, cleanStartTime: now }
      }
      return d
    })

    set({
      debris: updatedDebris,
      cleanupCooldown: 30,
      cleanupRect: null,
    })
  },

  setCleanupRect: (rect) => set({ cleanupRect: rect }),

  resetSimulation: () => {
    nextId = 0
    set({
      debris: [],
      projectile: null,
      collisions: [],
      totalCollisions: 0,
      destroyedCount: 0,
      cleanupCooldown: 0,
      cleanupRect: null,
      isLaunched: false,
      debrisHistory: [],
      warningMessage: null,
      edgeFlash: false,
      elapsedTime: 0,
      historyTimer: 0,
    })
    get().initializeObjects()
  },

  updateParams: (params) => {
    const currentParams = get().params
    const newParams = { ...currentParams, ...params }
    set({ params: newParams })
    if (params.objectCount !== undefined && params.objectCount !== currentParams.objectCount) {
      get().resetSimulation()
    }
  },

  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  setEdgeFlash: (flash) => set({ edgeFlash: flash }),

  setWarning: (message) => {
    set({
      warningMessage: message,
      warningStartTime: message ? Date.now() : 0,
    })
  },

  tickCooldown: (dt) => {
    const { cleanupCooldown } = get()
    if (cleanupCooldown > 0) {
      set({ cleanupCooldown: Math.max(0, cleanupCooldown - dt) })
    }
  },

  recordDebrisHistory: () => {
    const { debris, elapsedTime, debrisHistory } = get()
    set({
      debrisHistory: [...debrisHistory, { time: elapsedTime, count: debris.length }],
      historyTimer: 0,
    })
  },

  removeDebris: (ids) => {
    const idSet = new Set(ids)
    set({ debris: get().debris.filter(d => !idSet.has(d.id)) })
  },

  addDebris: (newDebris) => {
    set({ debris: [...get().debris, ...newDebris] })
  },

  updateDebris: (updatedDebris) => {
    set({ debris: updatedDebris })
  },
}))
