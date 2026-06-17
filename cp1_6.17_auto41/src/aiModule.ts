import { EnemyEntity, BulletEntity, EnemyType } from './types'

let entityIdCounter = 10000

export function updateEnemyAI(
  enemy: EnemyEntity,
  dt: number,
  canvasWidth: number,
  level: number,
  spawnEnemyBullet: (x: number, y: number, vx: number, vy: number) => void
) {
  enemy.aiTimer += dt
  const speedMult = 1 + (level - 1) * 0.15

  switch (enemy.enemyType) {
    case 'normal':
      enemy.velocity.y = 100 * speedMult
      enemy.velocity.x = 0
      break

    case 'elite': {
      enemy.velocity.y = 80 * speedMult
      const freq = 2
      enemy.velocity.x = Math.sin(enemy.aiTimer * freq) * 80 * 2
      break
    }

    case 'boss': {
      if (enemy.position.y < 100) {
        enemy.velocity.y = 30 * speedMult
        enemy.velocity.x = 0
      } else {
        enemy.velocity.y = 0
        const margin = 80
        if (enemy.aiPhase === 0) {
          enemy.velocity.x = 120 * speedMult
          if (enemy.position.x > canvasWidth - margin) {
            enemy.aiPhase = 1
          }
        } else {
          enemy.velocity.x = -120 * speedMult
          if (enemy.position.x < margin) {
            enemy.aiPhase = 0
          }
        }
      }

      enemy.shootTimer -= dt
      const shootInterval = 3 / (1 + (level - 1) * 0.2)
      if (enemy.shootTimer <= 0) {
        enemy.shootTimer = shootInterval
        const bulletCount = 6
        for (let i = 0; i < bulletCount; i++) {
          const angle = (i / bulletCount) * Math.PI * 2
          const speed = 150
          spawnEnemyBullet(
            enemy.position.x,
            enemy.position.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          )
        }
      }
      break
    }
  }
}

export function createEnemy(
  type: EnemyType,
  x: number,
  canvasWidth: number,
  idCounter: { current: number }
): EnemyEntity {
  let width: number, height: number, hp: number

  switch (type) {
    case 'normal':
      width = 30; height = 30; hp = 1
      break
    case 'elite':
      width = 36; height = 36; hp = 3
      break
    case 'boss':
      width = 48; height = 48; hp = 20
      break
  }

  return {
    id: idCounter.current++,
    type: 'enemy',
    enemyType: type,
    position: { x, y: -height },
    velocity: { x: 0, y: 0 },
    width,
    height,
    rotation: Math.PI,
    active: true,
    hp,
    maxHp: hp,
    hitFlashTimer: 0,
    shootTimer: type === 'boss' ? 2 : 0,
    aiPhase: 0,
    aiTimer: 0,
    baseX: x
  }
}

export function selectEnemyType(score: number, time: number): EnemyType {
  const rand = Math.random()
  const eliteChance = Math.min(0.3, 0.1 + score / 5000)
  if (rand < eliteChance) return 'elite'
  return 'normal'
}

export function getSpawnInterval(score: number, level: number): number {
  const base = Math.max(1 / 3, 1 - score / 5000)
  const levelMult = Math.max(0.4, 1 - (level - 1) * 0.15)
  return base * levelMult
}

export function getBossInterval(): number {
  return 30
}

export function createEnemyBullet(
  x: number,
  y: number,
  vx: number,
  vy: number,
  idCounter: { current: number }
): BulletEntity {
  return {
    id: idCounter.current++,
    type: 'enemyBullet',
    position: { x, y },
    velocity: { x: vx, y: vy },
    width: 8,
    height: 8,
    rotation: 0,
    active: true,
    damage: 1,
    color: '#FF66FF',
    radius: 4
  }
}
