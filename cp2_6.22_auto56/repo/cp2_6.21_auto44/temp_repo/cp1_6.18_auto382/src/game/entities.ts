import { v4 as uuidv4 } from 'uuid'
import type { MapData } from './map'
import { circleCollidesWithMap } from './map'

export type MonsterType = 'lurker' | 'wanderer' | 'mimic'

export interface Monster {
  id: string
  type: MonsterType
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  marked: boolean
  markTimer: number
  state: 'idle' | 'chasing' | 'stunned' | 'pouncing'
  stateTimer: number
  targetX: number
  targetY: number
  hitBySonar: boolean
  hitBoostTimer: number
}

export interface Dart {
  id: string
  x: number
  y: number
  targetId: string
  speed: number
}

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export function createMonster(type: MonsterType, x: number, y: number): Monster {
  const baseSpeed = type === 'lurker' ? 0.5 : type === 'wanderer' ? 0.3 : 0
  return {
    id: uuidv4(),
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    speed: baseSpeed,
    marked: false,
    markTimer: 0,
    state: type === 'wanderer' ? 'idle' : 'idle',
    stateTimer: 0,
    targetX: x,
    targetY: y,
    hitBySonar: false,
    hitBoostTimer: 0,
  }
}

export function createDart(x: number, y: number, targetId: string): Dart {
  return {
    id: uuidv4(),
    x,
    y,
    targetId,
    speed: 6,
  }
}

export function createParticle(x: number, y: number, color: string): Particle {
  const angle = Math.random() * Math.PI * 2
  const speed = 1 + Math.random() * 3
  return {
    id: uuidv4(),
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 30,
    maxLife: 30,
    color,
    size: 2 + Math.random() * 3,
  }
}

export function updateMonster(
  monster: Monster,
  playerX: number,
  playerY: number,
  mapData: MapData,
  dt: number
): void {
  if (monster.markTimer > 0) {
    monster.markTimer -= dt
    if (monster.markTimer <= 0) {
      monster.marked = false
    }
  }

  if (monster.hitBoostTimer > 0) {
    monster.hitBoostTimer -= dt
  }

  let currentSpeed = monster.speed
  if (monster.hitBoostTimer > 0 && monster.type !== 'mimic') {
    currentSpeed *= 2
  }

  const dx = playerX - monster.x
  const dy = playerY - monster.y
  const distToPlayer = Math.sqrt(dx * dx + dy * dy)

  switch (monster.type) {
    case 'lurker': {
      if (monster.hitBySonar || distToPlayer < 200) {
        monster.vx = (dx / distToPlayer) * currentSpeed
        monster.vy = (dy / distToPlayer) * currentSpeed
      } else {
        monster.vx = 0
        monster.vy = 0
      }
      break
    }
    case 'wanderer': {
      monster.stateTimer -= dt
      if (monster.hitBySonar) {
        monster.state = 'chasing'
        monster.vx = (dx / distToPlayer) * 0.8
        monster.vy = (dy / distToPlayer) * 0.8
      } else if (monster.state === 'chasing') {
        monster.vx = (dx / distToPlayer) * 0.8
        monster.vy = (dy / distToPlayer) * 0.8
      } else {
        if (monster.stateTimer <= 0) {
          monster.targetX = 50 + Math.random() * (mapData.width - 100)
          monster.targetY = 50 + Math.random() * (mapData.height - 100)
          monster.stateTimer = 120 + Math.random() * 120
        }
        const tx = monster.targetX - monster.x
        const ty = monster.targetY - monster.y
        const td = Math.sqrt(tx * tx + ty * ty)
        if (td > 5) {
          monster.vx = (tx / td) * currentSpeed
          monster.vy = (ty / td) * currentSpeed
        } else {
          monster.vx = 0
          monster.vy = 0
        }
      }
      break
    }
    case 'mimic': {
      if (monster.state === 'stunned') {
        monster.stateTimer -= dt
        monster.vx = 0
        monster.vy = 0
        if (monster.stateTimer <= 0) {
          monster.state = 'idle'
        }
      } else if (monster.state === 'pouncing') {
        monster.stateTimer -= dt
        if (monster.stateTimer <= 0) {
          monster.state = 'stunned'
          monster.stateTimer = 60
        }
      } else if (distToPlayer < 80) {
        monster.state = 'pouncing'
        monster.stateTimer = 120
        monster.vx = (dx / distToPlayer) * 1.2
        monster.vy = (dy / distToPlayer) * 1.2
      } else {
        monster.vx = 0
        monster.vy = 0
      }
      break
    }
  }

  const newX = monster.x + monster.vx
  const newY = monster.y + monster.vy
  const monsterRadius = monster.type === 'lurker' ? 10 : monster.type === 'wanderer' ? 12 : 12

  if (!circleCollidesWithMap(newX, monster.y, monsterRadius, mapData) &&
      newX > monsterRadius && newX < mapData.width - monsterRadius) {
    monster.x = newX
  }
  if (!circleCollidesWithMap(monster.x, newY, monsterRadius, mapData) &&
      newY > monsterRadius && newY < mapData.height - monsterRadius) {
    monster.y = newY
  }
}

export function updateDart(
  dart: Dart,
  monsters: Monster[]
): { hit: boolean; hitMonsterId: string | null; hitX: number; hitY: number } {
  const target = monsters.find(m => m.id === dart.targetId)
  if (!target) {
    return { hit: false, hitMonsterId: null, hitX: dart.x, hitY: dart.y }
  }

  const dx = target.x - dart.x
  const dy = target.y - dart.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < 15) {
    return { hit: true, hitMonsterId: target.id, hitX: target.x, hitY: target.y }
  }

  dart.x += (dx / dist) * dart.speed
  dart.y += (dy / dist) * dart.speed

  return { hit: false, hitMonsterId: null, hitX: dart.x, hitY: dart.y }
}

export function updateParticle(particle: Particle): boolean {
  particle.x += particle.vx
  particle.y += particle.vy
  particle.vx *= 0.95
  particle.vy *= 0.95
  particle.life -= 1
  return particle.life > 0
}

export function findNearestMarkedMonster(
  x: number,
  y: number,
  monsters: Monster[]
): Monster | null {
  const marked = monsters.filter(m => m.marked)
  if (marked.length === 0) return null

  let nearest: Monster | null = null
  let minDist = Infinity
  for (const m of marked) {
    const dx = m.x - x
    const dy = m.y - y
    const d = dx * dx + dy * dy
    if (d < minDist) {
      minDist = d
      nearest = m
    }
  }
  return nearest
}
