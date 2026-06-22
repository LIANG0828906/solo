import { create } from 'zustand'
import type { MapData } from './map'
import { generateMap } from './map'
import type { Monster, Dart, Particle } from './entities'
import { createMonster } from './entities'
import type { SonarWave, MarkPoint } from './sonar'

interface Player {
  x: number
  y: number
  lives: number
  invincible: boolean
  invincibleTimer: number
}

interface GameState {
  mapData: MapData
  player: Player
  monsters: Monster[]
  sonarWaves: SonarWave[]
  markPoints: MarkPoint[]
  darts: Dart[]
  particles: Particle[]
  score: number
  time: number
  gameOver: boolean
  gameStarted: boolean
  mouseX: number
  mouseY: number
  charging: boolean
  chargePower: number

  initGame: () => void
  updatePlayerPos: (x: number, y: number) => void
  decreaseLife: () => void
  setInvincible: (val: boolean, timer: number) => void
  addMonster: (monster: Monster) => void
  removeMonster: (id: string) => void
  updateMonster: (id: string, updater: (m: Monster) => void) => void
  addSonarWave: (wave: SonarWave) => void
  removeSonarWave: (id: string) => void
  updateSonarWave: (id: string, updater: (w: SonarWave) => void) => void
  addMarkPoint: (mark: MarkPoint) => void
  removeMarkPoint: (id: string) => void
  updateMarkPoint: (id: string, updater: (m: MarkPoint) => void) => void
  addDart: (dart: Dart) => void
  removeDart: (id: string) => void
  updateDart: (id: string, updater: (d: Dart) => void) => void
  addParticle: (particle: Particle) => void
  removeParticle: (id: string) => void
  updateParticle: (id: string, updater: (p: Particle) => void) => void
  incrementScore: (amount: number) => void
  incrementTime: () => void
  setGameOver: (val: boolean) => void
  setMousePos: (x: number, y: number) => void
  setCharging: (val: boolean) => void
  incrementChargePower: () => void
  resetChargePower: () => void
  updateInvincibleTimer: () => void
}

function spawnMonsters(mapData: MapData): Monster[] {
  const monsters: Monster[] = []
  const types: ('lurker' | 'wanderer' | 'mimic')[] = ['lurker', 'wanderer', 'mimic']

  for (const type of types) {
    const count = 8 + Math.floor(Math.random() * 5)
    for (let i = 0; i < count; i++) {
      let x: number, y: number
      let attempts = 0
      do {
        x = 100 + Math.random() * (mapData.width - 200)
        y = 100 + Math.random() * (mapData.height - 200)
        attempts++
      } while (
        attempts < 50 &&
        (Math.sqrt((x - mapData.width / 2) ** 2 + (y - mapData.height / 2) ** 2) < 150)
      )
      monsters.push(createMonster(type, x, y))
    }
  }

  return monsters
}

export const useGameStore = create<GameState>((set, get) => ({
  mapData: generateMap(),
  player: {
    x: 500,
    y: 400,
    lives: 3,
    invincible: false,
    invincibleTimer: 0,
  },
  monsters: [],
  sonarWaves: [],
  markPoints: [],
  darts: [],
  particles: [],
  score: 0,
  time: 0,
  gameOver: false,
  gameStarted: false,
  mouseX: 0,
  mouseY: 0,
  charging: false,
  chargePower: 0,

  initGame: () => {
    const mapData = generateMap()
    set({
      mapData,
      player: {
        x: mapData.width / 2,
        y: mapData.height / 2,
        lives: 3,
        invincible: false,
        invincibleTimer: 0,
      },
      monsters: spawnMonsters(mapData),
      sonarWaves: [],
      markPoints: [],
      darts: [],
      particles: [],
      score: 0,
      time: 0,
      gameOver: false,
      gameStarted: true,
      charging: false,
      chargePower: 0,
    })
  },

  updatePlayerPos: (x, y) =>
    set(state => {
      const mapData = state.mapData
      const newX = Math.max(15, Math.min(mapData.width - 15, x))
      const newY = Math.max(15, Math.min(mapData.height - 15, y))
      return { player: { ...state.player, x: newX, y: newY } }
    }),

  decreaseLife: () =>
    set(state => ({
      player: { ...state.player, lives: state.player.lives - 1 },
    })),

  setInvincible: (val, timer) =>
    set(state => ({
      player: { ...state.player, invincible: val, invincibleTimer: timer },
    })),

  addMonster: monster =>
    set(state => ({ monsters: [...state.monsters, monster] })),

  removeMonster: id =>
    set(state => ({ monsters: state.monsters.filter(m => m.id !== id) })),

  updateMonster: (id, updater) =>
    set(state => ({
      monsters: state.monsters.map(m => {
        if (m.id === id) {
          updater(m)
        }
        return m
      }),
    })),

  addSonarWave: wave =>
    set(state => ({ sonarWaves: [...state.sonarWaves, wave] })),

  removeSonarWave: id =>
    set(state => ({ sonarWaves: state.sonarWaves.filter(w => w.id !== id) })),

  updateSonarWave: (id, updater) =>
    set(state => ({
      sonarWaves: state.sonarWaves.map(w => {
        if (w.id === id) {
          updater(w)
        }
        return w
      }),
    })),

  addMarkPoint: mark =>
    set(state => ({ markPoints: [...state.markPoints, mark] })),

  removeMarkPoint: id =>
    set(state => ({ markPoints: state.markPoints.filter(m => m.id !== id) })),

  updateMarkPoint: (id, updater) =>
    set(state => ({
      markPoints: state.markPoints.map(m => {
        if (m.id === id) {
          updater(m)
        }
        return m
      }),
    })),

  addDart: dart =>
    set(state => ({ darts: [...state.darts, dart] })),

  removeDart: id =>
    set(state => ({ darts: state.darts.filter(d => d.id !== id) })),

  updateDart: (id, updater) =>
    set(state => ({
      darts: state.darts.map(d => {
        if (d.id === id) {
          updater(d)
        }
        return d
      }),
    })),

  addParticle: particle =>
    set(state => ({ particles: [...state.particles, particle] })),

  removeParticle: id =>
    set(state => ({ particles: state.particles.filter(p => p.id !== id) })),

  updateParticle: (id, updater) =>
    set(state => ({
      particles: state.particles.map(p => {
        if (p.id === id) {
          updater(p)
        }
        return p
      }),
    })),

  incrementScore: amount =>
    set(state => ({ score: state.score + amount })),

  incrementTime: () =>
    set(state => ({ time: state.time + 1 })),

  setGameOver: val =>
    set({ gameOver: val }),

  setMousePos: (x, y) =>
    set({ mouseX: x, mouseY: y }),

  setCharging: val =>
    set({ charging: val }),

  incrementChargePower: () =>
    set(state => ({ chargePower: Math.min(1, state.chargePower + 0.01) })),

  resetChargePower: () =>
    set({ chargePower: 0 }),

  updateInvincibleTimer: () =>
    set(state => {
      if (state.player.invincibleTimer > 0) {
        const newTimer = state.player.invincibleTimer - 1
        return {
          player: {
            ...state.player,
            invincibleTimer: newTimer,
            invincible: newTimer > 0,
          },
        }
      }
      return state
    }),
}))
