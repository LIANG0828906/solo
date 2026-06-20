import { create } from 'zustand'

export type DefenseType = 'palisade' | 'arrowTower' | 'trench'
export type EnemyType = 'cavalry' | 'bandit'
export type GamePhase = 'preparing' | 'fighting' | 'victory' | 'defeat'

export interface Position {
  x: number
  y: number
}

export interface Defense {
  id: string
  type: DefenseType
  position: Position
  health: number
  maxHealth: number
}

export interface Enemy {
  id: string
  type: EnemyType
  position: Position
  targetPosition: Position
  health: number
  maxHealth: number
  speed: number
  damage: number
}

export interface DefenseConfig {
  type: DefenseType
  name: string
  cost: number
  health: number
  damage: number
  range: number
  attackSpeed: number
  icon: string
}

export interface EnemyConfig {
  type: EnemyType
  name: string
  health: number
  speed: number
  damage: number
  reward: number
}

export const DEFENSE_CONFIGS: Record<DefenseType, DefenseConfig> = {
  palisade: {
    type: 'palisade',
    name: '拒马',
    cost: 30,
    health: 100,
    damage: 20,
    range: 20,
    attackSpeed: 1000,
    icon: '🛡️'
  },
  arrowTower: {
    type: 'arrowTower',
    name: '箭塔',
    cost: 80,
    health: 80,
    damage: 40,
    range: 150,
    attackSpeed: 1500,
    icon: '🏹'
  },
  trench: {
    type: 'trench',
    name: '壕沟',
    cost: 20,
    health: 150,
    damage: 10,
    range: 25,
    attackSpeed: 800,
    icon: '🕳️'
  }
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  cavalry: {
    type: 'cavalry',
    name: '骑兵',
    health: 60,
    speed: 1.2,
    damage: 20,
    reward: 25
  },
  bandit: {
    type: 'bandit',
    name: '马贼',
    health: 40,
    speed: 1.8,
    damage: 15,
    reward: 15
  }
}

export const MAP_WIDTH = 800
export const MAP_HEIGHT = 600
export const FORTRESS_POSITION: Position = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 }
export const FORTRESS_RADIUS = 40

interface GameState {
  phase: GamePhase
  resources: number
  fortressHealth: number
  maxFortressHealth: number
  currentWave: number
  totalWaves: number
  defenses: Defense[]
  enemies: Enemy[]
  selectedDefense: DefenseType | null
  removeMode: boolean
  lastAttackTime: Record<string, number>
  
  setSelectedDefense: (type: DefenseType | null) => void
  setRemoveMode: (mode: boolean) => void
  placeDefense: (type: DefenseType, position: Position) => boolean
  removeDefense: (id: string) => void
  spawnEnemy: (type: EnemyType, position: Position) => void
  updateEnemies: (deltaTime: number) => void
  updateDefenseAttacks: (currentTime: number) => void
  startWave: () => void
  nextWave: () => void
  resetGame: () => void
  damageFortress: (damage: number) => void
  addResources: (amount: number) => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const getDistance = (p1: Position, p2: Position): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'preparing',
  resources: 200,
  fortressHealth: 100,
  maxFortressHealth: 100,
  currentWave: 0,
  totalWaves: 5,
  defenses: [],
  enemies: [],
  selectedDefense: null,
  removeMode: false,
  lastAttackTime: {},

  setSelectedDefense: (type) => set({ selectedDefense: type, removeMode: false }),
  
  setRemoveMode: (mode) => set({ removeMode: mode, selectedDefense: null }),

  placeDefense: (type, position) => {
    const state = get()
    const config = DEFENSE_CONFIGS[type]
    
    if (state.resources < config.cost) return false
    
    const distToFortress = getDistance(position, FORTRESS_POSITION)
    if (distToFortress < FORTRESS_RADIUS + 20) return false
    
    for (const defense of state.defenses) {
      const dist = getDistance(position, defense.position)
      if (dist < 35) return false
    }
    
    const newDefense: Defense = {
      id: generateId(),
      type,
      position,
      health: config.health,
      maxHealth: config.health
    }
    
    set({
      defenses: [...state.defenses, newDefense],
      resources: state.resources - config.cost
    })
    
    return true
  },

  removeDefense: (id) => {
    const state = get()
    const defense = state.defenses.find(d => d.id === id)
    if (defense) {
      const config = DEFENSE_CONFIGS[defense.type]
      set({
        defenses: state.defenses.filter(d => d.id !== id),
        resources: state.resources + Math.floor(config.cost * 0.5)
      })
    }
  },

  spawnEnemy: (type, position) => {
    const config = ENEMY_CONFIGS[type]
    const newEnemy: Enemy = {
      id: generateId(),
      type,
      position: { ...position },
      targetPosition: { ...FORTRESS_POSITION },
      health: config.health,
      maxHealth: config.health,
      speed: config.speed,
      damage: config.damage
    }
    
    set(state => ({
      enemies: [...state.enemies, newEnemy]
    }))
  },

  updateEnemies: (deltaTime) => {
    const state = get()
    const updatedEnemies: Enemy[] = []
    let totalDamage = 0
    
    for (const enemy of state.enemies) {
      if (enemy.health <= 0) continue
      
      const dx = enemy.targetPosition.x - enemy.position.x
      const dy = enemy.targetPosition.y - enemy.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < FORTRESS_RADIUS) {
        totalDamage += enemy.damage
        continue
      }
      
      const moveDistance = enemy.speed * deltaTime * 0.06
      const ratio = Math.min(moveDistance / distance, 1)
      
      let blocked = false
      for (const defense of state.defenses) {
        const config = DEFENSE_CONFIGS[defense.type]
        const distToDefense = getDistance(enemy.position, defense.position)
        if (distToDefense < config.range && defense.health > 0) {
          blocked = true
          break
        }
      }
      
      if (!blocked) {
        updatedEnemies.push({
          ...enemy,
          position: {
            x: enemy.position.x + dx * ratio,
            y: enemy.position.y + dy * ratio
          }
        })
      } else {
        updatedEnemies.push(enemy)
      }
    }
    
    if (totalDamage > 0) {
      get().damageFortress(totalDamage)
    }
    
    set({ enemies: updatedEnemies })
  },

  updateDefenseAttacks: (currentTime) => {
    const state = get()
    const updatedDefenses = [...state.defenses]
    const updatedEnemies = [...state.enemies]
    const newLastAttackTime = { ...state.lastAttackTime }
    let resourcesGained = 0
    
    for (let i = 0; i < updatedDefenses.length; i++) {
      const defense = updatedDefenses[i]
      const config = DEFENSE_CONFIGS[defense.type]
      
      if (defense.health <= 0) continue
      
      const lastAttack = newLastAttackTime[defense.id] || 0
      if (currentTime - lastAttack < config.attackSpeed) continue
      
      let nearestEnemy: Enemy | null = null
      let nearestDist = Infinity
      
      for (const enemy of updatedEnemies) {
        if (enemy.health <= 0) continue
        const dist = getDistance(defense.position, enemy.position)
        if (dist < config.range && dist < nearestDist) {
          nearestDist = dist
          nearestEnemy = enemy
        }
      }
      
      if (nearestEnemy) {
        nearestEnemy.health -= config.damage
        newLastAttackTime[defense.id] = currentTime
        
        if (nearestEnemy.health <= 0) {
          const enemyConfig = ENEMY_CONFIGS[nearestEnemy.type]
          resourcesGained += enemyConfig.reward
        }
        
        if (nearestDist < 30) {
          defense.health -= 5
        }
      }
    }
    
    const aliveDefenses = updatedDefenses.filter(d => d.health > 0)
    const aliveEnemies = updatedEnemies.filter(e => e.health > 0)
    
    if (resourcesGained > 0) {
      get().addResources(resourcesGained)
    }
    
    set({
      defenses: aliveDefenses,
      enemies: aliveEnemies,
      lastAttackTime: newLastAttackTime
    })
  },

  startWave: () => set({ phase: 'fighting' }),

  nextWave: () => {
    const state = get()
    if (state.currentWave >= state.totalWaves) {
      set({ phase: 'victory' })
    } else {
      set({ 
        currentWave: state.currentWave + 1,
        phase: 'preparing'
      })
    }
  },

  resetGame: () => set({
    phase: 'preparing',
    resources: 200,
    fortressHealth: 100,
    maxFortressHealth: 100,
    currentWave: 0,
    defenses: [],
    enemies: [],
    selectedDefense: null,
    removeMode: false,
    lastAttackTime: {}
  }),

  damageFortress: (damage) => {
    const state = get()
    const newHealth = state.fortressHealth - damage
    if (newHealth <= 0) {
      set({ fortressHealth: 0, phase: 'defeat' })
    } else {
      set({ fortressHealth: newHealth })
    }
  },

  addResources: (amount) => {
    set(state => ({ resources: state.resources + amount }))
  }
}))

export { getDistance }
