export type SensorType = 'temperature' | 'humidity' | 'wind' | 'light' | 'pm25'

export type SensorStatus = 'online' | 'warning' | 'offline'

export interface SensorData {
  id: string
  name: string
  type: SensorType
  value: number
  unit: string
  status: SensorStatus
  x: number
  y: number
  lastUpdate: string
  isVirtual?: boolean
  virtualRange?: [number, number]
}

export interface HistoryDataPoint {
  timestamp: string
  value: number
}

export interface SensorHistory {
  sensorId: string
  data: HistoryDataPoint[]
}

export interface MapPoint {
  x: number
  y: number
}

export interface RoutePoint extends MapPoint {
  index?: number
}

export interface Route {
  id: string
  type: 'shortest' | 'coolest' | 'comfortable'
  name: string
  color: string
  points: RoutePoint[]
  duration: number
  comfortIndex: number
}

export interface MapState {
  zoom: number
  offsetX: number
  offsetY: number
  selectedPoint: MapPoint | null
  showPopup: boolean
  popupData: any
}

export interface RealtimeDataItem {
  id: string
  sensorName: string
  sensorType: SensorType
  value: number
  unit: string
  change: number
  timestamp: string
}
