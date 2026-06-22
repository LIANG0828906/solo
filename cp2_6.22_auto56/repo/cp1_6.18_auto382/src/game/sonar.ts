import { v4 as uuidv4 } from 'uuid'
import type { MapData } from './map'
import { circleCollidesWithMap } from './map'
import type { Monster } from './entities'

export interface SonarWave {
  id: string
  x: number
  y: number
  radius: number
  maxRadius: number
  speed: number
  color: string
  reflected: boolean
  reflectDir?: { x: number; y: number }
  reflectTimer: number
}

export interface MarkPoint {
  id: string
  x: number
  y: number
  timer: number
}

export function createSonarWave(
  x: number,
  y: number,
  power: number
): SonarWave {
  return {
    id: uuidv4(),
    x,
    y,
    radius: 5,
    maxRadius: 150 + power * 200,
    speed: 3 + power * 2,
    color: '#00FFAA',
    reflected: false,
    reflectTimer: 0,
  }
}

export function createMarkPoint(x: number, y: number): MarkPoint {
  return {
    id: uuidv4(),
    x,
    y,
    timer: 180,
  }
}

export interface SonarUpdateResult {
  waveAlive: boolean
  hitMonsters: string[]
  newMarks: { x: number; y: number }[]
}

export function updateSonarWave(
  wave: SonarWave,
  mapData: MapData,
  monsters: Monster[]
): SonarUpdateResult {
  const hitMonsters: string[] = []
  const newMarks: { x: number; y: number }[] = []

  if (wave.reflectTimer > 0) {
    wave.reflectTimer -= 1
  }

  wave.radius += wave.speed

  for (const monster of monsters) {
    if (monster.marked) continue

    const dx = monster.x - wave.x
    const dy = monster.y - wave.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const monsterRadius = monster.type === 'lurker' ? 10 : 12

    if (Math.abs(dist - wave.radius) < monsterRadius + wave.speed) {
      hitMonsters.push(monster.id)
      newMarks.push({ x: monster.x, y: monster.y })
    }
  }

  const hitObstacle = checkWaveHitObstacle(wave, mapData)
  if (hitObstacle && !wave.reflected) {
    wave.reflected = true
    wave.reflectTimer = 5
  }

  const waveAlive = wave.radius < wave.maxRadius

  return { waveAlive, hitMonsters, newMarks }
}

function checkWaveHitObstacle(wave: SonarWave, mapData: MapData): boolean {
  const sampleCount = 16
  for (let i = 0; i < sampleCount; i++) {
    const angle = (i / sampleCount) * Math.PI * 2
    const px = wave.x + Math.cos(angle) * wave.radius
    const py = wave.y + Math.sin(angle) * wave.radius
    if (circleCollidesWithMap(px, py, 2, mapData)) {
      return true
    }
  }
  return false
}

export function updateMarkPoint(mark: MarkPoint): boolean {
  mark.timer -= 1
  return mark.timer > 0
}
