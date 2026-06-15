export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'throwing'
  | 'trimming'
  | 'bisque'
  | 'glaze'
  | 'polishing'
  | 'completed'

export type VesselType = 'cup' | 'bowl' | 'plate' | 'vase' | 'teapot' | 'decor'

export type ClayType = 'white_porcelain' | 'coarse_pottery' | 'red_clay' | 'stoneware'

export interface StatusHistoryItem {
  status: OrderStatus
  timestamp: string
}

export interface Order {
  id: string
  customerName: string
  customerPhone: string
  vesselType: VesselType
  caliber: number
  height: number
  baseDiameter: number
  referenceImages: string[]
  clayType: ClayType
  notes: string
  status: OrderStatus
  statusHistory: StatusHistoryItem[]
  createdAt: string
}

export type GlazeBase = 'transparent' | 'opaque' | 'crystalline' | 'metallic'

export type RawMaterial =
  | 'feldspar'
  | 'quartz'
  | 'kaolin'
  | 'limestone'
  | 'iron_oxide'
  | 'cobalt_oxide'

export interface GlazeIngredient {
  material: RawMaterial
  percentage: number
}

export interface GlazeFormula {
  id: string
  name: string
  baseType: GlazeBase
  ingredients: GlazeIngredient[]
  targetTempMin: number
  targetTempMax: number
  heatingCurve: string
  holdingTime: number
}

export interface KilnPosition {
  row: number
  col: number
  clayType: ClayType | null
  orderId: string | null
}

export interface TemperatureRecord {
  timestamp: string
  temperature: number
  remainingMinutes: number
}

export type KilnStatus = 'preparing' | 'firing' | 'cooling' | 'completed'

export interface KilnFiring {
  id: string
  batchNumber: string
  glazeIds: string[]
  positions: KilnPosition[]
  startTime: string
  targetTemperature: number
  heatingRate: number
  holdingDuration: number
  temperatureRecords: TemperatureRecord[]
  status: KilnStatus
  report?: {
    tempDeviation: string
    colorEffect: string
  }
}

export type ShelfArea = 'A' | 'B' | 'C'

export type QualityRating = 1 | 2 | 3 | 4 | 5

export interface GreenwareStock {
  id: string
  clayType: ClayType
  vesselType: VesselType
  quantity: number
  shelfArea: ShelfArea
}

export interface RawMaterialStock {
  id: string
  material: RawMaterial
  currentStock: number
  minThreshold: number
}

export interface FinishedProduct {
  id: string
  orderId: string | null
  glazeId: string | null
  firingBatchId: string | null
  caliber: number
  height: number
  weight: number
  qualityRating: QualityRating
  photoUrl: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface MaterialWarning {
  id: string
  material: RawMaterial
  materialName: string
  currentStock: number
  minThreshold: number
}
