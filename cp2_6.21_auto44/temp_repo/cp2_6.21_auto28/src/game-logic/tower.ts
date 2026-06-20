import { TILE_SIZE } from '../utils/path-data'
import { Enemy, EnemyType, getEnemiesInRange, getEnemyConfig, applyDamage, applySlow } from './enemy'

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

export type EffectKind = 'attack' | 'death' | 'gold'

export interface AttackEffect {
  id: string
  kind: 'attack'
  type: TowerType
  x: number
  y: number
  targetX: number
  targetY: number
  createdAt: number
  duration: number
}

export interface DeathEffectParticle {
  angle: number
  speed: number
  size: number
  vx: number
  vy: number
  color: string
}

export interface DeathEffect {
  id: string
  kind: 'death'
  type: EnemyType
  x: number
  y: number
  createdAt: number
  duration: number
  particles: DeathEffectParticle[]
}

export interface GoldEffect {
  id: string
  kind: 'gold'
  x: number
  y: number
  amount: number
  createdAt: number
  duration: number
}

export type GameEffect = AttackEffect | DeathEffect | GoldEffect

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

export function createDeathEffect(enemy: Enemy, now: number): DeathEffect {
  const config = getEnemyConfig(enemy.type)
  const particles: DeathEffectParticle[] = []

  if (enemy.type === 'normal') {
    particles.push({
      angle: 0,
      speed: 0,
      size: 14,
      vx: 0,
      vy: 0,
      color: config.color,
    })
  } else if (enemy.type === 'fast') {
    const particleCount = 8
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const speed = 40 + Math.random() * 30
      particles.push({
        angle,
        speed,
        size: 3 + Math.random() * 3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: config.color,
      })
    }
  } else {
    const particleCount = 6
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3
      const speed = 25 + Math.random() * 25
      particles.push({
        angle,
        speed,
        size: 5 + Math.random() * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: config.color,
      })
    }
  }

  return {
    id: generateEffectId(),
    kind: 'death',
    type: enemy.type,
    x: enemy.x,
    y: enemy.y,
    createdAt: now,
    duration: enemy.type === 'normal' ? 300 : 500,
    particles,
  }
}

export function createGoldEffect(x: number, y: number, amount: number, now: number): GoldEffect {
  return {
    id: generateEffectId(),
    kind: 'gold',
    x,
    y,
    amount,
    createdAt: now,
    duration: 800,
  }
}

export function processTowerAttacks(
  towers: Tower[],
  enemies: Enemy[],
  now: number
): {
  updatedTowers: Tower[]
  updatedEnemies: Enemy[]
  newEffects: GameEffect[]
  goldEarned: number
  killedEnemies: Enemy[]
} {
  const updatedTowers: Tower[] = []
  let currentEnemies = [...enemies]
  const newEffects: GameEffect[] = []
  let goldEarned = 0
  const killedEnemies: Enemy[] = []

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
    const attackDuration = tower.type === 'arrow' ? 150 : 200
    newEffects.push({
      id: generateEffectId(),
      kind: 'attack',
      type: tower.type,
      x: tower.x,
      y: tower.y,
      targetX: target.x,
      targetY: target.y,
      createdAt: now,
      duration: attackDuration,
    })

    const enemyMap = new Map(currentEnemies.map((e) => [e.id, { ...e }]))

    if (tower.type === 'cannon' && config.splashRadius) {
      const splashTargets = getEnemiesInRange(
        currentEnemies,
        target.x,
        target.y,
        config.splashRadius
      )
      for (const e of splashTargets) {
        const damaged = applyDamage(enemyMap.get(e.id)!, tower.damage)
        enemyMap.set(e.id, damaged)
        if (damaged.hp <= 0) {
          goldEarned += e.goldReward
          killedEnemies.push({ ...damaged })
          newEffects.push(createDeathEffect({ ...damaged }, now))
          newEffects.push(createGoldEffect(e.x, e.y, e.goldReward, now))
        }
      }
    } else if (tower.type === 'magic' && config.slowDuration) {
      const targetEnemy = enemyMap.get(target.id)!
      const damaged = applyDamage(targetEnemy, tower.damage)
      const slowed = applySlow(damaged, config.slowDuration, now)
      enemyMap.set(target.id, slowed)
      if (slowed.hp <= 0) {
        goldEarned += target.goldReward
        killedEnemies.push({ ...slowed })
        newEffects.push(createDeathEffect({ ...slowed }, now))
        newEffects.push(createGoldEffect(target.x, target.y, target.goldReward, now))
      }
    } else {
      const targetEnemy = enemyMap.get(target.id)!
      const damaged = applyDamage(targetEnemy, tower.damage)
      enemyMap.set(target.id, damaged)
      if (damaged.hp <= 0) {
        goldEarned += target.goldReward
        killedEnemies.push({ ...damaged })
        newEffects.push(createDeathEffect({ ...damaged }, now))
        newEffects.push(createGoldEffect(target.x, target.y, target.goldReward, now))
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
    killedEnemies,
  }
}

export function cleanupEffects(effects: GameEffect[], now: number): GameEffect[] {
  return effects.filter((e) => now - e.createdAt < e.duration)
}
