export type SignalColor = 'red' | 'yellow' | 'green'

export interface CrossroadSignal {
  id: string
  gridX: number
  gridY: number
  redDuration: number
  yellowDuration: number
  greenDuration: number
  currentColor: SignalColor
  remainingTime: number
}

export interface Point {
  x: number
  y: number
}

export interface Vehicle {
  id: string
  x: number
  y: number
  angle: number
  speed: number
  maxSpeed: number
  color: 'red' | 'yellow' | 'blue'
  width: number
  height: number
  path: Point[]
  pathIndex: number
  waitingTime: number
  isWaiting: boolean
  trail: { x: number; y: number; alpha: number; color: string }[]
  active: boolean
  targetCrossroadId: string | null
}

export interface Pedestrian {
  id: string
  x: number
  y: number
  speed: number
  radius: number
  path: Point[]
  pathIndex: number
  crossingTime: number
  isCrossing: boolean
  trail: { x: number; y: number; alpha: number }[]
  active: boolean
}

export interface SimulationStats {
  avgVehicleWaitTime: number
  avgPedestrianCrossTime: number
  efficiencyScore: number
  vehicleCount: number
  pedestrianCount: number
  fps: number
}

export interface PresetModule {
  id: string
  name: string
  description: string
  signalConfig: {
    redDuration: number
    yellowDuration: number
    greenDuration: number
  }
}

export const PRESET_MODULES: PresetModule[] = [
  {
    id: 'balanced',
    name: '均衡模式',
    description: '红30秒/黄3秒/绿30秒，车流与人流平衡分配',
    signalConfig: { redDuration: 30, yellowDuration: 3, greenDuration: 30 },
  },
  {
    id: 'pedestrian',
    name: '行人优先',
    description: '红20秒/黄3秒/绿40秒，延长行人过街时间',
    signalConfig: { redDuration: 20, yellowDuration: 3, greenDuration: 40 },
  },
  {
    id: 'traffic',
    name: '车流优先',
    description: '红45秒/黄3秒/绿15秒，缩短车辆等待时间',
    signalConfig: { redDuration: 45, yellowDuration: 3, greenDuration: 15 },
  },
]

export const GRID_SIZE = 10
export const BLOCK_SIZE = 50
export const ROAD_WIDTH = 20
export const CROSSROAD_SIZE = 40
export const CANVAS_PADDING = 60

export const getTotalMapSize = () => {
  return GRID_SIZE * BLOCK_SIZE + (GRID_SIZE + 1) * ROAD_WIDTH
}

export const getCrossroadCenter = (gridX: number, gridY: number): Point => {
  const x = CANVAS_PADDING + ROAD_WIDTH + gridX * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2
  const y = CANVAS_PADDING + ROAD_WIDTH + gridY * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2
  return { x, y }
}
