export enum PlotStatus {
  AVAILABLE = 'available',
  CLAIMED = 'claimed',
  HARVESTING = 'harvesting'
}

export enum OperationType {
  WATER = 'water',
  FERTILIZE = 'fertilize',
  PEST_CONTROL = 'pest_control'
}

export interface PlotCell {
  id: string
  row: number
  col: number
  status: PlotStatus
  color: string
  hasPlantMarker: boolean
  isAnimating: boolean
  animationType?: 'claim' | 'water' | 'fertilize' | 'pest' | null
}

export interface ClaimInfo {
  plotId: string
  nickname: string
  plantGoal: string
  claimDate: string
}

export interface LogEntry {
  id: string
  plotId: string
  operationType: OperationType
  note: string
  timestamp: string
}

export interface AnimationState {
  plotId: string
  type: 'water' | 'fertilize' | 'pest' | null
  show: boolean
}
