import type { AxialCoord, DeployAnimation } from './types'
import {
  Tower,
  Monster,
  Wave,
  Particle,
  TowerType,
  ArmorType,
  HEX_SIZE,
  PATH_COORDS,
  TOWER_CONFIG,
  LogEntry,
} from './types'

let idCounter = 0
export const genId = (prefix: string): string => `${prefix}_${++idCounter}_${Date.now().toString(36)}`

export const axialToPixel = (q: number, r: number): { x: number; y: number } => {
  const x = HEX_SIZE * (3 / 2) * q
  const y = HEX_SIZE * (Math.sqrt(3) / 2) * q + HEX_SIZE * Math.sqrt(3) * r
  return { x, y }
}

export const hexCorners = (cx: number, cy: number, size: number): string => {
  const corners: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    corners.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return corners.join(' ')
}

export const dist = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x1 - x2
  const dy = y1 - y2
  return Math.sqrt(dx * dx + dy * dy)
}

export const isOnPath = (q: number, r: number): boolean => {
  return PATH_COORDS.some(p => p.q === q && p.r === r)
}

export const getPathPosition = (pathIndex: number, progress: number): { x: number; y: number } => {
  const clampedIndex = Math.min(pathIndex, PATH_COORDS.length - 1)
  const current = PATH_COORDS[clampedIndex]
  const next = PATH_COORDS[Math.min(clampedIndex + 1, PATH_COORDS.length - 1)]
  const curPx = axialToPixel(current.q, current.r)
  const nextPx = axialToPixel(next.q, next.r)
  const t = Math.max(0, Math.min(1, progress))
  return {
    x: curPx.x + (nextPx.x - curPx.x) * t,
    y: curPx.y + (nextPx.y - curPx.y) * t,
  }
}

export const createWave = (tower: Tower): Wave => {
  const cfg = TOWER_CONFIG[tower.type]
  return {
    id: genId('w'),
    centerX: tower.x,
    centerY: tower.y,
    radius: 2,
    maxRadius: 300,
    speed: 180,
    frequency: cfg.frequency,
    color: cfg.color,
    opacity: 0.9,
    damage: 10 + cfg.frequency * 0.01,
    reflections: 0,
    sourceTowerId: tower.id,
    hitMonsters: new Set(),
  }
}

export const calculateDamage = (
  wave: Wave,
  monster: Monster,
): number => {
  const freq = wave.frequency
  let modifier = 1.0
  if (freq === TOWER_CONFIG[TowerType.LOW].frequency) {
    modifier = monster.armor === ArmorType.HEAVY ? 1.2 : 0.7
  } else if (freq === TOWER_CONFIG[TowerType.HIGH].frequency) {
    modifier = monster.armor === ArmorType.LIGHT ? 1.3 : 0.8
  }
  const reflectMod = Math.pow(0.85, wave.reflections)
  return wave.damage * modifier * reflectMod
}

export const reflectWave = (
  wave: Wave,
  shield: Tower,
): Wave | null => {
  if (wave.reflections >= 3) return null
  if (Math.random() > shield.reflectionRate) return null
  const dx = wave.centerX - shield.x
  const dy = wave.centerY - shield.y
  const distance = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = dx / distance
  const ny = dy / distance
  const pushDist = wave.radius + 8
  return {
    id: genId('w'),
    centerX: shield.x + nx * pushDist,
    centerY: shield.y + ny * pushDist,
    radius: wave.radius,
    maxRadius: wave.maxRadius * 0.8,
    speed: wave.speed * 0.9,
    frequency: wave.frequency,
    color: '#ab47bc',
    opacity: Math.max(0.1, wave.opacity - 0.15),
    damage: wave.damage * 0.85,
    reflections: wave.reflections + 1,
    sourceTowerId: wave.sourceTowerId,
    hitMonsters: new Set(),
  }
}

export const createDeathParticles = (x: number, y: number, color: string): Particle[] => {
  const particles: Particle[] = []
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.3
    const speed = 40 + Math.random() * 60
    particles.push({
      id: genId('p'),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3,
      maxLife: 0.3,
      color,
      size: 3 + Math.random() * 2,
    })
  }
  return particles
}

export interface TickResult {
  waves: Wave[]
  monsters: Monster[]
  particles: Particle[]
  logs: LogEntry[]
  towersToFire: Tower[]
  damageDealt: number
  damagePotential: number
  killedMonsters: number
  reflectEvents: { wave: Wave; shield: Tower }[]
}

export const tickPhysics = (
  towers: Tower[],
  monsters: Monster[],
  waves: Wave[],
  particles: Particle[],
  dt: number,
  gameTime: number,
  fireInterval: number,
): TickResult => {
  const result: TickResult = {
    waves: [],
    monsters: monsters.map(m => ({ ...m, hitMonsters: undefined } as unknown as Monster)),
    particles: [],
    logs: [],
    towersToFire: [],
    damageDealt: 0,
    damagePotential: 0,
    killedMonsters: 0,
    reflectEvents: [],
  }

  const activeWaves = waves.map(w => ({
    ...w,
    hitMonsters: new Set(w.hitMonsters),
  }))

  for (const tower of towers) {
    if (tower.type === TowerType.SHIELD) continue
    if (gameTime - tower.lastFireTime >= fireInterval) {
      result.towersToFire.push(tower)
    }
  }

  for (let i = 0; i < activeWaves.length; i++) {
    const wave = activeWaves[i]
    wave.radius += wave.speed * dt

    for (const tower of towers) {
      if (tower.type !== TowerType.SHIELD) continue
      if (wave.reflections >= 3) continue
      if (wave.hitMonsters.has(`shield_${tower.id}`)) continue
      const d = dist(wave.centerX, wave.centerY, tower.x, tower.y)
      if (d <= wave.radius + HEX_SIZE * 0.5 && d >= wave.radius - HEX_SIZE * 0.5) {
        wave.hitMonsters.add(`shield_${tower.id}`)
        result.reflectEvents.push({ wave, shield: tower })
        result.logs.push({
          timestamp: gameTime,
          type: 'reflect',
          message: `声波被护盾反射 (${wave.reflections + 1}/3)`,
        })
      }
    }

    for (const monster of result.monsters) {
      if (monster.hp <= 0) continue
      if (monster.spawnDelay > 0) continue
      if (wave.hitMonsters.has(monster.id)) continue
      const d = dist(wave.centerX, wave.centerY, monster.x, monster.y)
      if (d <= wave.radius + 10 && d >= wave.radius - 10) {
        const dmg = calculateDamage(wave, monster)
        monster.hp -= dmg
        monster.isHit = true
        monster.hitTimer = 0.1
        wave.hitMonsters.add(monster.id)
        result.damageDealt += dmg
        result.damagePotential += wave.damage
        result.logs.push({
          timestamp: gameTime,
          type: 'hit',
          message: `${monster.armor === ArmorType.HEAVY ? '重甲' : '轻甲'}怪受到 ${dmg.toFixed(1)} 伤害 (HP ${Math.max(0, monster.hp).toFixed(0)}/${monster.maxHp})`,
        })
        if (monster.hp <= 0) {
          result.killedMonsters += 1
          const parts = createDeathParticles(monster.x, monster.y, '#ff1744')
          result.particles.push(...parts)
          result.logs.push({
            timestamp: gameTime,
            type: 'kill',
            message: `消灭${monster.armor === ArmorType.HEAVY ? '重甲' : '轻甲'}怪 +${monster.armor === ArmorType.HEAVY ? 15 : 12}分`,
          })
        }
      }
    }

    if (wave.radius < wave.maxRadius && wave.opacity > 0.05) {
      result.waves.push(wave)
    }
  }

  for (const monster of result.monsters) {
    if (monster.spawnDelay > 0) {
      monster.spawnDelay -= dt
      continue
    }
    if (monster.hp <= 0) continue
    if (monster.isHit) {
      monster.hitTimer -= dt
      if (monster.hitTimer <= 0) {
        monster.isHit = false
      }
    }
    monster.pathProgress += dt * 2
    while (monster.pathProgress >= 1 && monster.pathIndex < PATH_COORDS.length - 1) {
      monster.pathProgress -= 1
      monster.pathIndex += 1
    }
    const pos = getPathPosition(monster.pathIndex, monster.pathProgress)
    monster.x = pos.x
    monster.y = pos.y
  }

  const existingParticles = particles.map(p => ({
    ...p,
    x: p.x + p.vx * dt,
    y: p.y + p.vy * dt,
    life: p.life - dt,
  })).filter(p => p.life > 0)

  let combined = [...existingParticles, ...result.particles]
  if (combined.length > 200) {
    combined = combined.slice(-200)
  }
  result.particles = combined

  if (result.waves.length > 50) {
    result.waves = mergeWaves(result.waves)
  }

  return result
}

export const mergeWaves = (waves: Wave[]): Wave[] => {
  const merged: Wave[] = []
  const used = new Set<number>()
  for (let i = 0; i < waves.length; i++) {
    if (used.has(i)) continue
    const base = waves[i]
    let mergedWave = { ...base, hitMonsters: new Set(base.hitMonsters) }
    for (let j = i + 1; j < waves.length; j++) {
      if (used.has(j)) continue
      const other = waves[j]
      if (Math.abs(base.frequency - other.frequency) < 50) {
        const d = dist(base.centerX, base.centerY, other.centerX, other.centerY)
        if (d < 20) {
          used.add(j)
          mergedWave.radius = Math.max(mergedWave.radius, other.radius)
          mergedWave.maxRadius = Math.max(mergedWave.maxRadius, other.maxRadius)
          mergedWave.opacity = Math.max(mergedWave.opacity, other.opacity)
          for (const id of other.hitMonsters) mergedWave.hitMonsters.add(id)
        }
      }
    }
    merged.push(mergedWave)
  }
  return merged
}

export const getGridBounds = (cols: number, rows: number): { minX: number; maxX: number; minY: number; maxY: number } => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let q = 0; q < cols; q++) {
    for (let r = 0; r < rows; r++) {
      const { x, y } = axialToPixel(q, r)
      if (x - HEX_SIZE < minX) minX = x - HEX_SIZE
      if (x + HEX_SIZE > maxX) maxX = x + HEX_SIZE
      if (y - HEX_SIZE < minY) minY = y - HEX_SIZE
      if (y + HEX_SIZE > maxY) maxY = y + HEX_SIZE
    }
  }
  return { minX, maxX, minY, maxY }
}

export const spawnMonster = (waveNumber: number, spawnIndex: number): Monster => {
  const armor = Math.random() < 0.4 ? ArmorType.HEAVY : ArmorType.LIGHT
  const baseHp = armor === ArmorType.HEAVY ? 80 : 50
  const hpScale = 1 + (waveNumber - 1) * 0.2
  const startPos = getPathPosition(0, 0)
  return {
    id: genId('m'),
    armor,
    hp: baseHp * hpScale,
    maxHp: baseHp * hpScale,
    x: startPos.x - 60,
    y: startPos.y,
    pathIndex: 0,
    pathProgress: 0,
    isHit: false,
    hitTimer: 0,
    spawnDelay: spawnIndex * 0.4,
  }
}

export type { AxialCoord, DeployAnimation }
