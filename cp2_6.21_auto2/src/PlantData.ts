import type { PlantId } from './store'

export interface PlantSpecies {
  id: PlantId
  name: string
  description: string
  stem: {
    baseRadius: number
    topRadius: number
    baseColor: [number, number, number]
    topColor: [number, number, number]
    segments: number
  }
  leaves: {
    count: number
    width: number
    length: number
    thickness: number
    baseAngle: number
    baseColor: [number, number, number]
    edgeColor: [number, number, number]
    spiralOffset: number
  }
  flower: {
    hasFlower: boolean
    petalCount: number
    petalColor: [number, number, number]
    centerColor: [number, number, number]
    size: number
  }
  baseHeight: number
  thumbnailColor: string
  thumbnailEmoji: string
}

export const PLANTS: PlantSpecies[] = [
  {
    id: 'sunflower',
    name: '向日葵',
    description: '喜阳植物，金黄色花朵象征阳光与希望，茎干高大挺拔。',
    baseHeight: 2.4,
    stem: {
      baseRadius: 0.08,
      topRadius: 0.04,
      baseColor: [0.22, 0.45, 0.18],
      topColor: [0.45, 0.72, 0.32],
      segments: 10,
    },
    leaves: {
      count: 9,
      width: 0.45,
      length: 0.75,
      thickness: 0.025,
      baseAngle: 0.55,
      baseColor: [0.3, 0.58, 0.22],
      edgeColor: [0.55, 0.82, 0.38],
      spiralOffset: 0,
    },
    flower: {
      hasFlower: true,
      petalCount: 20,
      petalColor: [1.0, 0.78, 0.15],
      centerColor: [0.4, 0.22, 0.08],
      size: 0.9,
    },
    thumbnailColor: '#FFD93D',
    thumbnailEmoji: '🌻',
  },
  {
    id: 'cactus',
    name: '仙人掌',
    description: '耐旱多肉植物，肉质茎干储存水分，适应高温干燥环境。',
    baseHeight: 1.6,
    stem: {
      baseRadius: 0.22,
      topRadius: 0.16,
      baseColor: [0.25, 0.5, 0.3],
      topColor: [0.5, 0.78, 0.45],
      segments: 12,
    },
    leaves: {
      count: 14,
      width: 0.06,
      length: 0.18,
      thickness: 0.04,
      baseAngle: 1.2,
      baseColor: [0.9, 0.95, 0.98],
      edgeColor: [1.0, 1.0, 1.0],
      spiralOffset: 0,
    },
    flower: {
      hasFlower: true,
      petalCount: 10,
      petalColor: [0.95, 0.45, 0.65],
      centerColor: [1.0, 0.9, 0.2],
      size: 0.5,
    },
    thumbnailColor: '#6BCB77',
    thumbnailEmoji: '🌵',
  },
  {
    id: 'fern',
    name: '蕨类',
    description: '阴生植物，羽状复叶优美舒展，喜湿润阴凉环境。',
    baseHeight: 1.8,
    stem: {
      baseRadius: 0.05,
      topRadius: 0.025,
      baseColor: [0.2, 0.4, 0.22],
      topColor: [0.4, 0.65, 0.38],
      segments: 8,
    },
    leaves: {
      count: 12,
      width: 0.35,
      length: 0.95,
      thickness: 0.015,
      baseAngle: 0.4,
      baseColor: [0.2, 0.5, 0.25],
      edgeColor: [0.5, 0.8, 0.4],
      spiralOffset: 0.12,
    },
    flower: {
      hasFlower: false,
      petalCount: 0,
      petalColor: [0, 0, 0],
      centerColor: [0, 0, 0],
      size: 0,
    },
    thumbnailColor: '#4E9F3D',
    thumbnailEmoji: '🌿',
  },
  {
    id: 'maple',
    name: '红枫',
    description: '观叶树种，掌状叶片秋季转为艳红，喜凉爽气候。',
    baseHeight: 2.2,
    stem: {
      baseRadius: 0.1,
      topRadius: 0.035,
      baseColor: [0.35, 0.22, 0.12],
      topColor: [0.55, 0.38, 0.22],
      segments: 10,
    },
    leaves: {
      count: 10,
      width: 0.55,
      length: 0.6,
      thickness: 0.02,
      baseAngle: 0.75,
      baseColor: [0.78, 0.18, 0.18],
      edgeColor: [1.0, 0.4, 0.3],
      spiralOffset: 0,
    },
    flower: {
      hasFlower: true,
      petalCount: 6,
      petalColor: [1.0, 0.35, 0.35],
      centerColor: [1.0, 0.85, 0.2],
      size: 0.35,
    },
    thumbnailColor: '#C84B31',
    thumbnailEmoji: '🍁',
  },
  {
    id: 'succulent',
    name: '多肉植物',
    description: '肥厚叶片储存丰富水分，形态可爱圆润，易养护。',
    baseHeight: 0.9,
    stem: {
      baseRadius: 0.12,
      topRadius: 0.08,
      baseColor: [0.3, 0.55, 0.35],
      topColor: [0.55, 0.82, 0.55],
      segments: 6,
    },
    leaves: {
      count: 16,
      width: 0.28,
      length: 0.45,
      thickness: 0.14,
      baseAngle: 0.85,
      baseColor: [0.4, 0.75, 0.5],
      edgeColor: [0.8, 0.95, 0.65],
      spiralOffset: 0,
    },
    flower: {
      hasFlower: true,
      petalCount: 8,
      petalColor: [0.98, 0.65, 0.82],
      centerColor: [1.0, 0.9, 0.3],
      size: 0.28,
    },
    thumbnailColor: '#A8D8B9',
    thumbnailEmoji: '🪴',
  },
]

export const getPlantData = (id: PlantId): PlantSpecies => {
  return PLANTS.find((p) => p.id === id) ?? PLANTS[0]
}
