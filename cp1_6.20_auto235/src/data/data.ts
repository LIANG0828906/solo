export type RuneType = 'fire' | 'water' | 'earth' | 'wind' | 'thunder' | 'shadow'

interface Point {
  x: number
  y: number
}

interface RuneTemplate {
  type: RuneType
  name: string
  color: string
  points: Point[]
}

const generateTrianglePoints = (): Point[] => {
  const points: Point[] = []
  const vertices = [
    { x: 0, y: 1 },
    { x: -0.866, y: -0.5 },
    { x: 0.866, y: -0.5 }
  ]
  for (let i = 0; i < 64; i++) {
    const t = i / 64
    const edgeIndex = Math.floor(t * 3)
    const edgeT = (t * 3) - edgeIndex
    const v1 = vertices[edgeIndex]
    const v2 = vertices[(edgeIndex + 1) % 3]
    points.push({
      x: v1.x + (v2.x - v1.x) * edgeT,
      y: v1.y + (v2.y - v1.y) * edgeT
    })
  }
  return points
}

const generateWavePoints = (): Point[] => {
  const points: Point[] = []
  for (let i = 0; i < 64; i++) {
    const t = (i / 64) * Math.PI * 4
    points.push({
      x: (i / 32) - 1,
      y: Math.sin(t) * 0.8
    })
  }
  return points
}

const generateDiamondPoints = (): Point[] => {
  const points: Point[] = []
  const vertices = [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: 0 }
  ]
  for (let i = 0; i < 64; i++) {
    const t = i / 64
    const edgeIndex = Math.floor(t * 4)
    const edgeT = (t * 4) - edgeIndex
    const v1 = vertices[edgeIndex]
    const v2 = vertices[(edgeIndex + 1) % 4]
    points.push({
      x: v1.x + (v2.x - v1.x) * edgeT,
      y: v1.y + (v2.y - v1.y) * edgeT
    })
  }
  return points
}

const generateSectorPoints = (): Point[] => {
  const points: Point[] = []
  const startAngle = -Math.PI / 3
  const endAngle = Math.PI / 3
  const radius = 0.9
  for (let i = 0; i < 32; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / 31)
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    })
  }
  for (let i = 0; i < 32; i++) {
    const t = i / 31
    points.push({
      x: Math.cos(endAngle) * radius * (1 - t),
      y: Math.sin(endAngle) * radius * (1 - t)
    })
  }
  return points
}

const generateZigzagPoints = (): Point[] => {
  const points: Point[] = []
  const segments = [
    { x: -0.8, y: 0.8 },
    { x: 0.5, y: 0.8 },
    { x: -0.5, y: -0.2 },
    { x: 0.8, y: -0.2 },
    { x: -0.3, y: -0.8 },
    { x: 0.8, y: -0.8 }
  ]
  const pointsPerSegment = Math.floor(64 / (segments.length - 1))
  const remainder = 64 % (segments.length - 1)
  for (let i = 0; i < segments.length - 1; i++) {
    const count = pointsPerSegment + (i < remainder ? 1 : 0)
    for (let j = 0; j < count; j++) {
      const t = j / count
      points.push({
        x: segments[i].x + (segments[i + 1].x - segments[i].x) * t,
        y: segments[i].y + (segments[i + 1].y - segments[i].y) * t
      })
    }
  }
  return points
}

const generateSpiralPoints = (): Point[] => {
  const points: Point[] = []
  const turns = 3
  for (let i = 0; i < 64; i++) {
    const t = i / 64
    const angle = t * Math.PI * 2 * turns
    const radius = 0.1 + t * 0.8
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    })
  }
  return points
}

export const runeTemplates: RuneTemplate[] = [
  {
    type: 'fire',
    name: '火焰',
    color: '#ff4444',
    points: generateTrianglePoints()
  },
  {
    type: 'water',
    name: '水流',
    color: '#4488ff',
    points: generateWavePoints()
  },
  {
    type: 'earth',
    name: '大地',
    color: '#8B4513',
    points: generateDiamondPoints()
  },
  {
    type: 'wind',
    name: '风羽',
    color: '#44ff88',
    points: generateSectorPoints()
  },
  {
    type: 'thunder',
    name: '雷电',
    color: '#ffdd44',
    points: generateZigzagPoints()
  },
  {
    type: 'shadow',
    name: '暗影',
    color: '#9944ff',
    points: generateSpiralPoints()
  }
]

export interface CreatureStats {
  maxHp: number
  attack: number
  moveSpeed: number
  attackSpeed: number
}

type PixelMatrix = string[][]

interface CreatureConfig {
  name: string
  stats: CreatureStats
  pixelData: PixelMatrix
}

const _ = 'transparent'
const F = '#ff4444'
const W = '#4488ff'
const E = '#8B4513'
const N = '#44ff88'
const T = '#ffdd44'
const S = '#9944ff'
const B = '#ffffff'
const D = '#333333'

export const creatureConfigs: Record<RuneType, CreatureConfig> = {
  fire: {
    name: '火焰精灵',
    stats: { maxHp: 80, attack: 35, moveSpeed: 3.0, attackSpeed: 1.5 },
    pixelData: [
      [_, _, _, F, F, _, _, _],
      [_, _, F, F, F, F, _, _],
      [_, F, B, F, F, B, F, _],
      [_, F, F, D, D, F, F, _],
      [F, F, F, F, F, F, F, F],
      [F, F, F, F, F, F, F, F],
      [_, F, _, F, F, _, F, _],
      [_, _, F, _, _, F, _, _]
    ]
  },
  water: {
    name: '水元素',
    stats: { maxHp: 100, attack: 25, moveSpeed: 2.5, attackSpeed: 1.2 },
    pixelData: [
      [_, _, _, W, W, _, _, _],
      [_, _, W, W, W, W, _, _],
      [_, W, W, W, W, W, W, _],
      [W, W, B, W, W, B, W, W],
      [W, W, W, D, D, W, W, W],
      [_, W, W, W, W, W, W, _],
      [_, _, W, W, W, W, _, _],
      [_, _, _, W, W, _, _, _]
    ]
  },
  earth: {
    name: '岩石傀儡',
    stats: { maxHp: 150, attack: 20, moveSpeed: 1.5, attackSpeed: 0.8 },
    pixelData: [
      [_, E, E, E, E, E, E, _],
      [E, E, E, E, E, E, E, E],
      [E, B, E, E, E, E, B, E],
      [E, E, E, D, D, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [_, E, E, _, _, E, E, _],
      [_, E, _, _, _, _, E, _]
    ]
  },
  wind: {
    name: '风之舞者',
    stats: { maxHp: 70, attack: 28, moveSpeed: 4.0, attackSpeed: 2.0 },
    pixelData: [
      [_, N, _, _, _, _, N, _],
      [N, _, N, N, N, N, _, N],
      [_, N, B, N, N, B, N, _],
      [_, N, N, D, D, N, N, _],
      [_, N, N, N, N, N, N, _],
      [N, _, N, N, N, N, _, N],
      [_, N, _, N, N, _, N, _],
      [_, _, N, _, _, N, _, _]
    ]
  },
  thunder: {
    name: '雷霆之子',
    stats: { maxHp: 90, attack: 40, moveSpeed: 3.5, attackSpeed: 1.8 },
    pixelData: [
      [_, T, _, _, _, _, _, _],
      [T, T, T, _, _, _, _, _],
      [_, T, T, T, T, _, _, _],
      [_, _, B, T, T, B, _, _],
      [_, _, T, D, D, T, T, _],
      [_, _, _, T, T, T, T, _],
      [_, _, _, _, _, T, T, T],
      [_, _, _, _, _, _, T, _]
    ]
  },
  shadow: {
    name: '暗影刺客',
    stats: { maxHp: 65, attack: 45, moveSpeed: 3.8, attackSpeed: 2.2 },
    pixelData: [
      [_, _, S, _, _, S, _, _],
      [_, S, S, S, S, S, S, _],
      [S, S, D, S, S, D, S, S],
      [S, S, S, B, B, S, S, S],
      [_, S, S, S, S, S, S, _],
      [_, _, S, S, S, S, _, _],
      [_, S, _, S, S, _, S, _],
      [S, _, _, _, _, _, _, S]
    ]
  }
}

export const aiMoveDecision = (
  enemyDistance: number,
  myHp: number,
  maxHp: number
): 'advance' | 'retreat' | 'hold' => {
  const hpRatio = myHp / maxHp
  const attackRange = 2
  const desiredDistance = 1.5

  if (hpRatio < 0.2) {
    return enemyDistance < attackRange * 1.5 ? 'retreat' : 'hold'
  }

  if (hpRatio < 0.5) {
    if (enemyDistance < desiredDistance * 0.8) {
      return 'retreat'
    }
    if (enemyDistance > attackRange * 1.2) {
      return 'advance'
    }
    return 'hold'
  }

  if (enemyDistance > attackRange) {
    return 'advance'
  }
  if (enemyDistance < desiredDistance * 0.5) {
    return 'retreat'
  }
  return 'hold'
}

export const aiAttackDecision = (
  enemyDistance: number,
  attackRange: number,
  cooldown: number
): boolean => {
  return enemyDistance <= attackRange && cooldown <= 0
}

export const chooseRandomRune = (): RuneType => {
  const types: RuneType[] = ['fire', 'water', 'earth', 'wind', 'thunder', 'shadow']
  return types[Math.floor(Math.random() * types.length)]
}

const typeAdvantages: Record<RuneType, RuneType> = {
  fire: 'wind',
  wind: 'earth',
  earth: 'thunder',
  thunder: 'water',
  water: 'fire',
  shadow: 'shadow'
}

export const getTypeMultiplier = (attacker: RuneType, defender: RuneType): number => {
  if (typeAdvantages[attacker] === defender) {
    return 1.5
  }
  if (typeAdvantages[defender] === attacker) {
    return 0.5
  }
  return 1.0
}
