export type ChartType = 'bar' | 'line' | 'scatter'

export interface DataPoint {
  x: number
  y: number
  z?: number
  time?: number | string
  [key: string]: any
}

export interface DataSeries {
  id: string
  name: string
  data: DataPoint[]
  color?: string
  hasTimeDimension?: boolean
}

export interface Dataset {
  id: string
  name: string
  series: DataSeries[]
  fileName?: string
}

export interface ViewState {
  cameraPosition: { x: number; y: number; z: number }
  cameraTarget: { x: number; y: number; z: number }
  autoRotate: boolean
  autoRotateSpeed: number
}

export interface Snapshot {
  id: string
  name: string
  timestamp: number
  chartType: ChartType
  datasets: Dataset[]
  viewState: ViewState
  timeRange: { start: number; end: number } | null
  selectedPointIndex: { seriesId: string; pointIndex: number } | null
}
