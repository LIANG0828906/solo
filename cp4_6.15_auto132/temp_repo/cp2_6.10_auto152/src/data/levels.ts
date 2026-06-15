import { EnemyType, MAP_WIDTH, MAP_HEIGHT, Position } from '../store/gameStore'

export interface WaveEnemy {
  type: EnemyType
  delay: number
  spawnEdge: 'top' | 'bottom' | 'left' | 'right'
}

export interface Wave {
  enemies: WaveEnemy[]
}

export interface Level {
  id: number
  name: string
  waves: Wave[]
}

const getRandomEdgeSpawn = (edge: 'top' | 'bottom' | 'left' | 'right'): Position => {
  const margin = 30
  switch (edge) {
    case 'top':
      return { x: margin + Math.random() * (MAP_WIDTH - margin * 2), y: -20 }
    case 'bottom':
      return { x: margin + Math.random() * (MAP_WIDTH - margin * 2), y: MAP_HEIGHT + 20 }
    case 'left':
      return { x: -20, y: margin + Math.random() * (MAP_HEIGHT - margin * 2) }
    case 'right':
      return { x: MAP_WIDTH + 20, y: margin + Math.random() * (MAP_HEIGHT - margin * 2) }
  }
}

const getRandomEdge = (): 'top' | 'bottom' | 'left' | 'right' => {
  const edges: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right']
  return edges[Math.floor(Math.random() * edges.length)]
}

const generateWave = (enemyCount: number, cavalryRatio: number = 0.3): Wave => {
  const enemies: WaveEnemy[] = []
  for (let i = 0; i < enemyCount; i++) {
    const isCavalry = Math.random() < cavalryRatio
    enemies.push({
      type: isCavalry ? 'cavalry' : 'bandit',
      delay: i * (800 + Math.random() * 400),
      spawnEdge: getRandomEdge()
    })
  }
  return { enemies }
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '烽燧戍卒：西域边镇防御',
    waves: [
      generateWave(4, 0.2),
      generateWave(6, 0.3),
      generateWave(8, 0.35),
      generateWave(10, 0.4),
      generateWave(12, 0.5)
    ]
  }
]

export const getWave = (levelId: number, waveIndex: number): Wave | null => {
  const level = LEVELS.find(l => l.id === levelId)
  if (!level || waveIndex < 0 || waveIndex >= level.waves.length) return null
  return level.waves[waveIndex]
}

export { getRandomEdgeSpawn }
