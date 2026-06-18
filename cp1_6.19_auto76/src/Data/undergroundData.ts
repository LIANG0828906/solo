export type PipelineType = 'water' | 'drain' | 'gas' | 'power' | 'telecom'

export type PipelineStatus = 'normal' | 'repair' | 'abandoned'

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface Pipeline {
  id: string
  type: PipelineType
  name: string
  material: string
  diameter: number
  points: Point3D[]
  installedYear: number
  lastInspection: string
  status: PipelineStatus
  totalLength: number
  depthRange: { min: number; max: number }
}

export interface SoilLayer {
  name: string
  depthStart: number
  depthEnd: number
  color: string
}

export const PIPELINE_COLORS: Record<PipelineType, string> = {
  water: '#3B82F6',
  drain: '#10B981',
  gas: '#F59E0B',
  power: '#EF4444',
  telecom: '#F97316',
}

export const PIPELINE_NAMES: Record<PipelineType, string> = {
  water: '给水管',
  drain: '排水管',
  gas: '燃气管',
  power: '电力管',
  telecom: '通信管',
}

export const STATUS_NAMES: Record<PipelineStatus, string> = {
  normal: '正常',
  repair: '需要维修',
  abandoned: '已废弃',
}

export const SOIL_LAYERS: SoilLayer[] = [
  { name: '植被层', depthStart: 0, depthEnd: 0.2, color: '#228B22' },
  { name: '表土层', depthStart: 0.2, depthEnd: 1.2, color: '#D2B48C' },
  { name: '黏土层', depthStart: 1.2, depthEnd: 2.8, color: '#A0522D' },
  { name: '沙土层', depthStart: 2.8, depthEnd: 4.0, color: '#F5DEB3' },
  { name: '基岩层', depthStart: 4.0, depthEnd: 5.0, color: '#696969' },
]

export const MATERIAL_OPTIONS = ['连续铸铁', '球墨铸铁', 'PVC', '钢管']

export const STATUS_OPTIONS: PipelineStatus[] = ['normal', 'repair', 'abandoned']

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1))
}

function randomPick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]
}

function randomDate(startYear: number, endYear: number): string {
  const year = randomInt(startYear, endYear)
  const month = randomInt(1, 12)
  const day = randomInt(1, 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function generateWindingPoints(
  startX: number,
  startZ: number,
  baseDepth: number,
  depthVariation: number,
  numPoints: number,
  lengthX: number,
  lengthZ: number
): Point3D[] {
  const points: Point3D[] = []
  const stepX = lengthX / (numPoints - 1)
  const stepZ = lengthZ / (numPoints - 1)

  for (let i = 0; i < numPoints; i++) {
    const x = startX + stepX * i
    const z = startZ + stepZ * i
    const wave = Math.sin(i * 0.6) * depthVariation + Math.cos(i * 0.3) * depthVariation * 0.5
    const y = baseDepth + wave
    points.push({ x, y, z })
  }
  return points
}

function calculateTotalLength(points: Point3D[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    const dz = points[i].z - points[i - 1].z
    total += Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  return total
}

function calculateDepthRange(points: Point3D[]): { min: number; max: number } {
  const depths = points.map((p) => p.y)
  return { min: Math.min(...depths), max: Math.max(...depths) }
}

function diameterByDepth(avgDepth: number): number {
  const minDiameter = 0.08
  const maxDiameter = 0.15
  const t = Math.min((avgDepth - 0.3) / 3.5, 1)
  return minDiameter + (maxDiameter - minDiameter) * t
}

interface PipelineConfig {
  type: PipelineType
  depthRange: [number, number]
}

const PIPELINE_DEPTH_RANGES: PipelineConfig[] = [
  { type: 'water', depthRange: [0.6, 1.4] },
  { type: 'drain', depthRange: [1.0, 2.0] },
  { type: 'gas', depthRange: [0.8, 1.6] },
  { type: 'power', depthRange: [0.4, 1.0] },
  { type: 'telecom', depthRange: [0.5, 1.2] },
]

function generatePipelines(): Pipeline[] {
  const pipelines: Pipeline[] = []
  let idCounter = 1

  const layoutPositions = [
    { startX: -8, startZ: -6, lengthX: 16, lengthZ: 0 },
    { startX: -8, startZ: -3, lengthX: 16, lengthZ: 0 },
    { startX: -8, startZ: 0, lengthX: 16, lengthZ: 0 },
    { startX: -8, startZ: 3, lengthX: 16, lengthZ: 0 },
    { startX: -8, startZ: 6, lengthX: 16, lengthZ: 0 },
    { startX: -6, startZ: -8, lengthX: 0, lengthZ: 16 },
    { startX: -3, startZ: -8, lengthX: 0, lengthZ: 16 },
    { startX: 0, startZ: -8, lengthX: 0, lengthZ: 16 },
    { startX: 3, startZ: -8, lengthX: 0, lengthZ: 16 },
    { startX: 6, startZ: -8, lengthX: 0, lengthZ: 16 },
    { startX: -7, startZ: -7, lengthX: 14, lengthZ: 14 },
    { startX: -7, startZ: 7, lengthX: 14, lengthZ: -14 },
    { startX: -5, startZ: -5, lengthX: 10, lengthZ: 10 },
    { startX: -5, startZ: 5, lengthX: 10, lengthZ: -10 },
    { startX: -2, startZ: -2, lengthX: 4, lengthZ: 4 },
    { startX: -2, startZ: 2, lengthX: 4, lengthZ: -4 },
  ]

  PIPELINE_DEPTH_RANGES.forEach((config) => {
    for (let i = 0; i < 3; i++) {
      const layoutIndex = (idCounter - 1) % layoutPositions.length
      const layout = layoutPositions[layoutIndex]
      const [minDepth, maxDepth] = config.depthRange
      const baseDepth = randomBetween(minDepth, maxDepth)
      const depthVariation = randomBetween(0.05, 0.2)
      const numPoints = randomInt(8, 14)

      const points = generateWindingPoints(
        layout.startX + randomBetween(-0.5, 0.5),
        layout.startZ + randomBetween(-0.5, 0.5),
        baseDepth,
        depthVariation,
        numPoints,
        layout.lengthX,
        layout.lengthZ
      )

      const avgDepth = points.reduce((sum, p) => sum + p.y, 0) / points.length
      const diameter = diameterByDepth(avgDepth)

      const installedYear = randomInt(2005, 2023)
      const lastInspection = randomDate(installedYear, 2024)

      const statusWeights: { status: PipelineStatus; weight: number }[] = [
        { status: 'normal', weight: 6 },
        { status: 'repair', weight: 2.5 },
        { status: 'abandoned', weight: 1.5 },
      ]
      const totalWeight = statusWeights.reduce((s, w) => s + w.weight, 0)
      let r = Math.random() * totalWeight
      let status: PipelineStatus = 'normal'
      for (const sw of statusWeights) {
        r -= sw.weight
        if (r <= 0) {
          status = sw.status
          break
        }
      }

      pipelines.push({
        id: `PL-${String(idCounter).padStart(3, '0')}`,
        type: config.type,
        name: `${PIPELINE_NAMES[config.type]}${i + 1}号线`,
        material: randomPick(MATERIAL_OPTIONS),
        diameter: Number(diameter.toFixed(3)),
        points,
        installedYear,
        lastInspection,
        status,
        totalLength: Number(calculateTotalLength(points).toFixed(3)),
        depthRange: calculateDepthRange(points),
      })

      idCounter++
    }
  })

  return pipelines
}

export const PIPELINES: Pipeline[] = generatePipelines()
