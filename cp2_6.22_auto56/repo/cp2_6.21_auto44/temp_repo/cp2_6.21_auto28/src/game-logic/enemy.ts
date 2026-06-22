import { TILE_SIZE, getPathPixelPoints, ENEMIES_PER_WAVE_MIN, ENEMIES_PER_WAVE_MAX } from '../utils/path-data'

export type EnemyType = 'normal' | 'fast' | 'heavy'

export interface Enemy {
  id: string
  type: EnemyType
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  pathIndex: number
  progress: number
  slowUntil: number
  goldReward: number
}

export interface WaveConfig {
  waveNumber: number
  enemyCount: number
}

const ENEMY_CONFIG: Record<EnemyType, { hp: number; speed: number; gold: number; color: string; shape: string }> = {
  normal: { hp: 10, speed: 1.5, gold: 1, color: '#e53935', shape: 'circle' },
  fast: { hp: 8, speed: 2.5, gold: 2, color: '#ffeb3b', shape: 'triangle' },
  heavy: { hp: 30, speed: 0.8, gold: 3, color: '#6a1b9a', shape: 'square' },
}

export function getEnemyConfig(type: EnemyType) {
  return ENEMY_CONFIG[type]
}

let enemyIdCounter = 0
function generateEnemyId(): string {
  enemyIdCounter += 1
  return `enemy_${enemyIdCounter}_${Date.now()}`
}

function getRandomEnemyType(waveNumber: number): EnemyType {
  const rand = Math.random()
  if (waveNumber < 3) {
    return rand < 0.7 ? 'normal' : 'fast'
  }
  if (waveNumber < 6) {
    if (rand < 0.5) return 'normal'
    if (rand < 0.8) return 'fast'
    return 'heavy'
  }
  if (rand < 0.35) return 'normal'
  if (rand < 0.7) return 'fast'
  return 'heavy'
}

export function generateWaveEnemies(waveNumber: number): Enemy[] {
  const count =
    Math.floor(Math.random() * (ENEMIES_PER_WAVE_MAX - ENEMIES_PER_WAVE_MIN + 1)) + ENEMIES_PER_WAVE_MIN
  const enemies: Enemy[] = []
  const pixelPath = getPathPixelPoints()
  const startX = pixelPath[0].x
  const startY = pixelPath[0].y

  for (let i = 0; i < count; i++) {
    const type = getRandomEnemyType(waveNumber)
    const config = ENEMY_CONFIG[type]
    const hpMultiplier = 1 + (waveNumber - 1) * 0.15
    enemies.push({
      id: generateEnemyId(),
      type,
      x: startX - i * 30,
      y: startY,
      hp: Math.round(config.hp * hpMultiplier),
      maxHp: Math.round(config.hp * hpMultiplier),
      speed: config.speed * TILE_SIZE,
      baseSpeed: config.speed * TILE_SIZE,
      pathIndex: 0,
      progress: 0,
      slowUntil: 0,
      goldReward: config.gold,
    })
  }
  return enemies
}

export function updateEnemies(enemies: Enemy[], deltaTime: number, now: number): {
  updated: Enemy[]
  reachedEnd: Enemy[]
} {
  const pixelPath = getPathPixelPoints()
  const reachedEnd: Enemy[] = []
  const updated: Enemy[] = []

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue

    const currentSpeed = now < enemy.slowUntil ? enemy.baseSpeed * 0.5 : enemy.baseSpeed

    let remainingDistance = currentSpeed * deltaTime
    let { x, y, pathIndex } = enemy

    while (remainingDistance > 0 && pathIndex < pixelPath.length - 1) {
      const target = pixelPath[pathIndex + 1]
      const dx = target.x - x
      const dy = target.y - y
      const distToNext = Math.sqrt(dx * dx + dy * dy)

      if (distToNext <= remainingDistance) {
        x = target.x
        y = target.y
        pathIndex += 1
        remainingDistance -= distToNext
      } else {
        const ratio = remainingDistance / distToNext
        x += dx * ratio
        y += dy * ratio
        remainingDistance = 0
      }
    }

    if (pathIndex >= pixelPath.length - 1) {
      reachedEnd.push(enemy)
    } else {
      updated.push({ ...enemy, x, y, pathIndex, speed: currentSpeed })
    }
  }

  return { updated, reachedEnd }
}

export function applyDamage(enemy: Enemy, damage: number): Enemy {
  return { ...enemy, hp: Math.max(0, enemy.hp - damage) }
}

export function applySlow(enemy: Enemy, duration: number, now: number): Enemy {
  return { ...enemy, slowUntil: Math.max(enemy.slowUntil, now + duration) }
}

export function getEnemiesInRange(
  enemies: Enemy[],
  centerX: number,
  centerY: number,
  rangePixels: number
): Enemy[] {
  return enemies.filter((e) => {
    if (e.hp <= 0) return false
    const dx = e.x - centerX
    const dy = e.y - centerY
    return dx * dx + dy * dy <= rangePixels * rangePixels
  })
}
