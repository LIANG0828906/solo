import { create } from 'zustand'
import type { DeployAnimation } from '@/game/types'
import {
  GameState,
  Tower,
  Monster,
  Wave,
  TowerType,
  ArmorType,
  TOWER_CONFIG,
  GRID_COLS,
  GRID_ROWS,
  PATH_COORDS,
} from '@/game/types'
import {
  genId,
  axialToPixel,
  isOnPath,
  createWave,
  reflectWave,
  tickPhysics,
  spawnMonster,
} from '@/game/physics'

const FIRE_INTERVAL = 2.0
const WAVE_INTERVAL = 5.0
const TOTAL_WAVES = 10

const initialState: GameState = {
  towers: [],
  monsters: [],
  waves: [],
  particles: [],
  deployAnimations: [],
  score: 0,
  displayScore: 0,
  waveNumber: 0,
  totalWaves: TOTAL_WAVES,
  waveStatus: 'idle',
  waveCountdown: WAVE_INTERVAL,
  monstersToSpawn: 0,
  monstersSpawnTimer: 0,
  monstersRemaining: 0,
  waveDamageDealt: 0,
  waveDamagePotential: 0,
  selectedTowerType: TowerType.MID,
  shieldReflectionRate: 0.7,
  logs: [],
  gameTime: 0,
  isRunning: true,
}

export const useGameStore = create<GameState & {
  setSelectedTowerType: (type: TowerType) => void
  setShieldReflectionRate: (rate: number) => void
  deployTower: (q: number, r: number) => boolean
  startWave: () => void
  tick: (dt: number) => void
  reset: () => void
  addLog: (type: 'fire' | 'hit' | 'reflect' | 'kill' | 'wave', message: string) => void
}>((set, get) => ({
  ...initialState,

  setSelectedTowerType: (type) => set({ selectedTowerType: type }),

  setShieldReflectionRate: (rate) => set({ shieldReflectionRate: rate }),

  addLog: (type, message) => {
    const { gameTime, logs } = get()
    const newLogs = [...logs, { timestamp: gameTime, type, message }]
    set({ logs: newLogs.slice(-50) })
  },

  deployTower: (q, r) => {
    const { towers, selectedTowerType, shieldReflectionRate, gameTime } = get()
    if (q < 0 || q >= GRID_COLS || r < 0 || r >= GRID_ROWS) return false
    if (isOnPath(q, r)) return false
    if (towers.some(t => t.q === q && t.r === r)) return false

    const { x, y } = axialToPixel(q, r)
    const cfg = TOWER_CONFIG[selectedTowerType]
    const tower: Tower = {
      id: genId('t'),
      type: selectedTowerType,
      q,
      r,
      x,
      y,
      frequency: cfg.frequency,
      color: cfg.color,
      lastFireTime: gameTime,
      reflectionRate: selectedTowerType === TowerType.SHIELD ? shieldReflectionRate : 0,
    }

    const anim: DeployAnimation = {
      id: genId('da'),
      x,
      y,
      color: cfg.color,
      startTime: gameTime,
    }

    set(state => ({
      towers: [...state.towers, tower],
      deployAnimations: [...state.deployAnimations, anim],
    }))
    return true
  },

  startWave: () => {
    const { waveStatus, waveNumber, totalWaves } = get()
    if (waveStatus !== 'idle' && waveStatus !== 'complete') return
    if (waveNumber >= totalWaves) return

    const nextWave = waveNumber + 1
    const monsterCount = 10 + Math.floor(Math.random() * 6)
    set({
      waveNumber: nextWave,
      waveStatus: 'countdown',
      waveCountdown: 3,
      monstersToSpawn: monsterCount,
      monstersSpawnTimer: 0,
      monstersRemaining: monsterCount,
      waveDamageDealt: 0,
      waveDamagePotential: 0,
    })
    get().addLog('wave', `第 ${nextWave} 波开始，${monsterCount} 个怪物来袭！`)
  },

  tick: (dt) => {
    const state = get()
    if (!state.isRunning) return

    const newGameTime = state.gameTime + dt
    let newState: Partial<GameState> = { gameTime: newGameTime }

    newState.deployAnimations = state.deployAnimations.filter(
      a => newGameTime - a.startTime < 0.2
    )

    let monsters = state.monsters
    let waves = state.waves
    let particles = state.particles
    let towers = state.towers
    let logs = state.logs
    let waveNumber = state.waveNumber
    let waveStatus = state.waveStatus
    let waveCountdown = state.waveCountdown
    let monstersToSpawn = state.monstersToSpawn
    let monstersSpawnTimer = state.monstersSpawnTimer
    let monstersRemaining = state.monstersRemaining
    let waveDamageDealt = state.waveDamageDealt
    let waveDamagePotential = state.waveDamagePotential
    let score = state.score
    let displayScore = state.displayScore

    if (waveStatus === 'countdown') {
      waveCountdown -= dt
      if (waveCountdown <= 0) {
        waveStatus = 'spawning'
        monstersSpawnTimer = 0
        waveCountdown = 0
      }
    }

    if (waveStatus === 'spawning') {
      monstersSpawnTimer += dt
      while (monstersSpawnTimer >= 0.4 && monstersToSpawn > 0) {
        monstersSpawnTimer -= 0.4
        const spawnIdx = (get().monstersToSpawn + 10) - monstersToSpawn
        const m = spawnMonster(waveNumber, spawnIdx)
        m.x = m.x - 60 + PATH_COORDS.length * 0
        monsters = [...monsters, m]
        monstersToSpawn -= 1
      }
      if (monstersToSpawn <= 0) {
        waveStatus = 'active'
      }
    }

    const tickResult = tickPhysics(
      towers,
      monsters,
      waves,
      particles,
      dt,
      newGameTime,
      FIRE_INTERVAL,
    )

    waves = tickResult.waves
    monsters = tickResult.monsters
    particles = tickResult.particles
    waveDamageDealt += tickResult.damageDealt
    waveDamagePotential += tickResult.damagePotential
    if (tickResult.logs.length > 0) {
      logs = [...logs, ...tickResult.logs].slice(-50)
    }

    if (tickResult.towersToFire.length > 0) {
      const newWaves: Wave[] = []
      const updatedTowers = towers.map(t => {
        if (tickResult.towersToFire.find(tt => tt.id === t.id)) {
          newWaves.push(createWave(t))
          const logMsg = `[${TOWER_CONFIG[t.type].label}] 发射声波`
          logs = [...logs, { timestamp: newGameTime, type: 'fire' as const, message: logMsg }].slice(-50)
          return { ...t, lastFireTime: newGameTime }
        }
        return t
      })
      towers = updatedTowers
      waves = [...waves, ...newWaves]
    }

    if (tickResult.reflectEvents.length > 0) {
      const reflectedWaves: Wave[] = []
      for (const ev of tickResult.reflectEvents) {
        const rw = reflectWave(ev.wave, ev.shield)
        if (rw) reflectedWaves.push(rw)
      }
      waves = [...waves, ...reflectedWaves]
    }

    const killedCount = tickResult.killedMonsters
    if (killedCount > 0) {
      const killedMonsters = tickResult.monsters.filter(m => m.hp <= 0)
      let addScore = 0
      for (const m of killedMonsters) {
        addScore += m.armor === ArmorType.HEAVY ? 15 : 12
      }
      score += addScore
      monstersRemaining -= killedCount
    }

    monsters = monsters.filter(m => m.hp > 0)

    if (waveStatus === 'active' && monstersToSpawn <= 0 && monsters.length === 0) {
      waveStatus = 'complete'
      waveCountdown = WAVE_INTERVAL
      logs = [...logs, {
        timestamp: newGameTime,
        type: 'wave' as const,
        message: `第 ${waveNumber} 波完成！效率: ${waveDamagePotential > 0 ? ((waveDamageDealt / waveDamagePotential) * 100).toFixed(1) : '0.0'}%`,
      }].slice(-50)
    }

    if (waveStatus === 'complete') {
      waveCountdown -= dt
      if (waveCountdown <= 0 && waveNumber < get().totalWaves) {
        get().startWave()
        return
      }
    }

    const scoreDiff = score - displayScore
    if (Math.abs(scoreDiff) > 0.5) {
      displayScore = displayScore + scoreDiff * Math.min(1, dt * 8)
    } else {
      displayScore = score
    }

    Object.assign(newState, {
      towers,
      monsters,
      waves,
      particles,
      waveNumber,
      waveStatus,
      waveCountdown,
      monstersToSpawn,
      monstersSpawnTimer,
      monstersRemaining,
      waveDamageDealt,
      waveDamagePotential,
      score,
      displayScore,
      logs,
    })

    set(newState)
  },

  reset: () => set({ ...initialState }),
}))
