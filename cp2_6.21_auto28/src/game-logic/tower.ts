import { TILE_SIZE } from '../utils/path-data'
import { Enemy, getEnemiesInRange, applyDamage, applySlow } from './enemy'

export type TowerType = 'arrow' | 'cannon' | 'magic'

export interface Tower {
  id: string
  type: TowerType
  col: number
  row: number
  x: number
  y: number
  level: number
  range: number
  damage: number
  fireRate: number
  lastFired: number
  cost: number
}

export interface AttackEffect {
  id: string
  type: TowerType
  x: number
  y: number
  targetX: number
  targetY: number
  createdAt: number
  duration: number
}

export interface TowerConfig {
  cost: number
  range: number
  damage: number
  fireRate: number
  color: string
  splashRadius?: number
  slowDuration?: number
  slowAmount?: number
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  arrow: {
    cost: 10,
    range: 3 * TILE_SIZE,
    damage: 2,
    fireRate: 0.5,
    color: '#4caf50',
  },
  cannon: {
    cost: 25,
    range: 2.5 * TILE_SIZE,
    damage: 6,
    fireRate: 1.2,
    color: '#ff9800',
    splashRadius: 1.5 * TILE_SIZE,
  },
  magic: {
    cost: 20,
    range: 3.5 * TILE_SIZE,
    damage: 1,
    fireRate: 0.8,
    color: '#2196f3',
    slowDuration: 2000,
    slowAmount: 0.5,
  },
}

let towerIdCounter = 0
function generateTowerId(): string {
  towerIdCounter += 1
  return `tower_${towerIdCounter}_${Date.now()}`
}

let effectIdCounter = 0
function generateEffectId(): string {
  effectIdCounter += 1
  return `effect_${effectIdCounter}_${Date.now()}`
}

export function createTower(type: TowerType, col: number, row: number): Tower {
  const config = TOWER_CONFIGS[type]
  const x = col * TILE_SIZE + TILE_SIZE / 2
  const y = row * TILE_SIZE + TILE_SIZE / 2
  return {
    id: generateTowerId(),
    type,
    col,
    row,
    x,
    y,
    level: 1,
    range: config.range,
    damage: config.damage,
    fireRate: config.fireRate,
    lastFired: 0,
    cost: config.cost,
  }
}

export function getUpgradeCost(tower: Tower): number {
  return Math.floor(tower.cost * 0.75 * tower.level)
}

export function upgradeTower(tower: Tower): Tower {
  if (tower.level >= 3) return tower
  const damageMultiplier = 1 + 0.25 * tower.level
  const fireRateMultiplier = 1 - 0.2 * (tower.level - 1)
  const rangeMultiplier = 1 + 0.1 * (tower.level - 1)
  const config = TOWER_CONFIGS[tower.type]
  return {
    ...tower,
    level: tower.level + 1,
    damage: Math.round(config.damage * damageMultiplier * 10) / 10,
    fireRate: Math.max(0.1, config.fireRate * fireRateMultiplier),
    range: config.range * rangeMultiplier,
  }
}

export function processTowerAttacks(
  towers: Tower[],
  enemies: Enemy[],
  now: number
): {
  updatedTowers: Tower[]
  updatedEnemies: Enemy[]
  newEffects: AttackEffect[]
  goldEarned: number
} {
  const updatedTowers: Tower[] = []
  let currentEnemies = [...enemies]
  const newEffects: AttackEffect[] = []
  let goldEarned = 0

  for (const tower of towers) {
    const fireInterval = tower.fireRate * 1000
    if (now - tower.lastFired < fireInterval) {
      updatedTowers.push(tower)
      continue
    }

    const enemiesInRange = getEnemiesInRange(currentEnemies, tower.x, tower.y, tower.range)
    if (enemiesInRange.length === 0) {
      updatedTowers.push(tower)
      continue
    }

    const target = enemiesInRange.reduce((a, b) => (a.pathIndex > b.pathIndex ? a : b))

    const config = TOWER_CONFIGS[tower.type]
    newEffects.push({
      id: generateEffectId(),
      type: tower.type,
      x: tower.x,
      y: tower.y,
      targetX: target.x,
      targetY: target.y,
      createdAt: now,
      duration: 200,
    })

    const enemyMap = new Map(currentEnemies.map((e) => [e.id, e]))

    if (tower.type === 'cannon' && config.splashRadius) {
      const splashTargets = getEnemiesInRange(
        currentEnemies,
        target.x,
        target.y,
        config.splashRadius
      )
      for (const e of splashTargets) {
        const damaged = applyDamage(e, tower.damage)
        enemyMap.set(e.id, damaged)
        if (damaged.hp <= 0) {
          goldEarned += e.goldReward
        }
      }
    } else if (tower.type === 'magic' && config.slowDuration) {
      const damaged = applyDamage(target, tower.damage)
      const slowed = applySlow(damaged, config.slowDuration, now)
      enemyMap.set(target.id, slowed)
      if (slowed.hp <= 0) {
        goldEarned += target.goldReward
      }
    } else {
      const damaged = applyDamage(target, tower.damage)
      enemyMap.set(target.id, damaged)
      if (damaged.hp <= 0) {
        goldEarned += target.goldReward
      }
    }

    currentEnemies = Array.from(enemyMap.values())
    updatedTowers.push({ ...tower, lastFired: now })
  }

  const aliveEnemies = currentEnemies.filter((e) => e.hp > 0)

  return {
    updatedTowers,
    updatedEnemies: aliveEnemies,
    newEffects,
    goldEarned,
  }
}

export function cleanupEffects(effects: AttackEffect[], now: number): AttackEffect[] {
  return effects.filter((e) => now - e.createdAt < e.duration)
}
