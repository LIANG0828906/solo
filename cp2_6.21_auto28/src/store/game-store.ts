import { create } from 'zustand'
import { Enemy, generateWaveEnemies } from '../game-logic/enemy'
import { Tower, TowerType, AttackEffect, createTower, upgradeTower, getUpgradeCost } from '../game-logic/tower'
import { INITIAL_LIVES, ENEMY_DAMAGE } from '../utils/path-data'

export interface WaveStatsData {
  enemiesKilled: number
  goldEarned: number
  startLives: number
  startWave: number
  endWave: number
}

interface GameState {
  lives: number
  gold: number
  wave: number
  isPaused: boolean
  gameOver: boolean
  showWaveStats: boolean
  waveStats: WaveStatsData | null
  enemies: Enemy[]
  towers: Tower[]
  effects: AttackEffect[]
  selectedTowerType: TowerType | null
  selectedTowerId: string | null
  goldBounceKey: number
  waveKills: number
  waveGold: number
  waveStartLives: number

  startGame: () => void
  spawnWave: () => void
  addGold: (amount: number) => void
  takeDamage: (amount: number) => void
  setEnemies: (enemies: Enemy[]) => void
  setTowers: (towers: Tower[]) => void
  setEffects: (effects: AttackEffect[]) => void
  addEffect: (effect: AttackEffect) => void
  placeTower: (type: TowerType, col: number, row: number) => boolean
  upgradeTowerById: (towerId: string) => boolean
  selectTowerType: (type: TowerType | null) => void
  selectTower: (towerId: string | null) => void
  togglePause: () => void
  closeWaveStats: () => void
  setWaveStats: (stats: WaveStatsData | null) => void
  triggerGoldBounce: () => void
  resetGame: () => void
  addWaveKill: (count: number, gold: number) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  lives: INITIAL_LIVES,
  gold: 50,
  wave: 0,
  isPaused: false,
  gameOver: false,
  showWaveStats: false,
  waveStats: null,
  enemies: [],
  towers: [],
  effects: [],
  selectedTowerType: null,
  selectedTowerId: null,
  goldBounceKey: 0,
  waveKills: 0,
  waveGold: 0,
  waveStartLives: INITIAL_LIVES,

  startGame: () => {
    const enemies = generateWaveEnemies(1)
    set({
      wave: 1,
      isPaused: false,
      enemies,
      waveKills: 0,
      waveGold: 0,
      waveStartLives: INITIAL_LIVES,
    })
  },

  spawnWave: () => {
    const state = get()
    if (state.gameOver) return
    const nextWave = state.wave + 1
    const enemies = generateWaveEnemies(nextWave)

    if (nextWave % 10 === 1 && nextWave > 1) {
      const stats: WaveStatsData = {
        enemiesKilled: state.waveKills,
        goldEarned: state.waveGold,
        startLives: state.waveStartLives,
        startWave: nextWave - 10,
        endWave: state.wave,
      }
      set({
        wave: nextWave,
        enemies: [...state.enemies, ...enemies],
        isPaused: true,
        showWaveStats: true,
        waveStats: stats,
        waveKills: 0,
        waveGold: 0,
        waveStartLives: state.lives,
      })
    } else {
      set({
        wave: nextWave,
        enemies: [...state.enemies, ...enemies],
      })
    }
  },

  addGold: (amount: number) => {
    set((state) => ({ gold: state.gold + amount }))
    get().triggerGoldBounce()
  },

  addWaveKill: (count: number, gold: number) => {
    set((state) => ({
      waveKills: state.waveKills + count,
      waveGold: state.waveGold + gold,
    }))
  },

  takeDamage: (amount: number) => {
    set((state) => {
      const newLives = Math.max(0, state.lives - amount)
      return {
        lives: newLives,
        gameOver: newLives <= 0,
        isPaused: newLives <= 0,
      }
    })
  },

  setEnemies: (enemies: Enemy[]) => {
    set({ enemies })
  },

  setTowers: (towers: Tower[]) => {
    set({ towers })
  },

  setEffects: (effects: AttackEffect[]) => {
    set({ effects })
  },

  addEffect: (effect: AttackEffect) => {
    set((state) => ({ effects: [...state.effects, effect] }))
  },

  placeTower: (type: TowerType, col: number, row: number) => {
    const state = get()
    const tower = createTower(type, col, row)
    if (state.gold < tower.cost) return false
    const existingTower = state.towers.find((t) => t.col === col && t.row === row)
    if (existingTower) return false

    set((s) => ({
      towers: [...s.towers, tower],
      gold: s.gold - tower.cost,
      selectedTowerType: null,
    }))
    return true
  },

  upgradeTowerById: (towerId: string) => {
    const state = get()
    const tower = state.towers.find((t) => t.id === towerId)
    if (!tower || tower.level >= 3) return false
    const cost = getUpgradeCost(tower)
    if (state.gold < cost) return false

    const upgraded = upgradeTower(tower)
    set((s) => ({
      towers: s.towers.map((t) => (t.id === towerId ? upgraded : t)),
      gold: s.gold - cost,
    }))
    return true
  },

  selectTowerType: (type: TowerType | null) => {
    set({ selectedTowerType: type, selectedTowerId: null })
  },

  selectTower: (towerId: string | null) => {
    set({ selectedTowerId: towerId, selectedTowerType: null })
  },

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }))
  },

  closeWaveStats: () => {
    const state = get()
    set({
      showWaveStats: false,
      isPaused: false,
      waveKills: 0,
      waveGold: 0,
      waveStartLives: state.lives,
    })
  },

  setWaveStats: (stats: WaveStatsData | null) => {
    set({ waveStats: stats })
  },

  triggerGoldBounce: () => {
    set((state) => ({ goldBounceKey: state.goldBounceKey + 1 }))
  },

  resetGame: () => {
    set({
      lives: INITIAL_LIVES,
      gold: 50,
      wave: 0,
      isPaused: false,
      gameOver: false,
      showWaveStats: false,
      waveStats: null,
      enemies: [],
      towers: [],
      effects: [],
      selectedTowerType: null,
      selectedTowerId: null,
      goldBounceKey: 0,
      waveKills: 0,
      waveGold: 0,
      waveStartLives: INITIAL_LIVES,
    })
    setTimeout(() => {
      get().startGame()
    }, 100)
  },
}))

export { ENEMY_DAMAGE }
