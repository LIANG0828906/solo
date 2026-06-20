export type PlantType = 'fruit' | 'flower' | 'succulent'

export type GrowthStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'flowering'

export interface EnvironmentParams {
  light: number
  water: number
  temperature: number
  nutrients: number
}

export interface HealthMetrics {
  light: number
  water: number
  temperature: number
  nutrients: number
  pests: number
}

export interface GrowthLogEntry {
  id: string
  timestamp: Date
  message: string
  type: 'info' | 'warning' | 'success' | 'danger'
}

export interface PlantData {
  id: string
  type: PlantType
  name: string
  position: { x: number; z: number }
  stage: GrowthStage
  growthProgress: number
  health: HealthMetrics
  overallHealth: number
  accumulatedParams: EnvironmentParams
  createdAt: Date
}

export interface PlantTypeConfig {
  name: string
  description: string
  optimalLight: [number, number]
  optimalWater: [number, number]
  optimalTemperature: [number, number]
  optimalNutrients: [number, number]
  baseGrowthRate: number
  color: string
}

export const PLANT_CONFIGS: Record<PlantType, PlantTypeConfig> = {
  fruit: {
    name: '果树',
    description: '多年生木本植物，需要充足光照和养分，结出甜美果实',
    optimalLight: [60, 90],
    optimalWater: [40, 70],
    optimalTemperature: [50, 80],
    optimalNutrients: [50, 80],
    baseGrowthRate: 0.3,
    color: '#4ade80'
  },
  flower: {
    name: '花卉',
    description: '美丽的观赏植物，对温度敏感，绽放绚丽花朵',
    optimalLight: [50, 80],
    optimalWater: [30, 60],
    optimalTemperature: [40, 70],
    optimalNutrients: [30, 60],
    baseGrowthRate: 0.5,
    color: '#f472b6'
  },
  succulent: {
    name: '多肉',
    description: '耐旱植物，需水量少，喜欢温暖干燥环境',
    optimalLight: [70, 95],
    optimalWater: [10, 40],
    optimalTemperature: [60, 85],
    optimalNutrients: [20, 50],
    baseGrowthRate: 0.2,
    color: '#22d3ee'
  }
}

export const GROWTH_STAGES: GrowthStage[] = ['seed', 'sprout', 'growing', 'mature', 'flowering']

export const GROWTH_STAGE_NAMES: Record<GrowthStage, string> = {
  seed: '种子期',
  sprout: '发芽期',
  growing: '生长期',
  mature: '成熟期',
  flowering: '开花/结果期'
}
