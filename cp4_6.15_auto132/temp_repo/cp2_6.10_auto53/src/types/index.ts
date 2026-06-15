export interface Cargo {
  name: string
  declared: number
  actual: number
  hasError: boolean
}

export interface Caravan {
  id: string
  ownerName: string
  origin: string
  cargoCount: number
  passengerCount: number
  horseCount: number
  cargo: Cargo[]
  status: 'approaching' | 'waiting' | 'verified' | 'leaving' | 'left'
  position: number
  markedErrors: string[]
}

export interface Horse {
  id: string
  name: string
  status: 'idle' | 'in_use'
  matchTime: number | null
  messenger?: string
  direction?: 'left' | 'right'
  exitTime?: number
}

export interface Traveler {
  id: string
  name: string
  type: 'scholar' | 'soldier' | 'messenger' | 'merchant'
  roomNumber: number | null
  checkInTime: number
}

export interface LogEntry {
  id: string
  time: string
  type: string
  message: string
  level: 'info' | 'warn' | 'error'
}

export interface BeaconState {
  level: 0 | 1 | 2 | 3
  startTime: number | null
  reason: string
}

export interface HourlyStats {
  hour: number
  count: number
}
