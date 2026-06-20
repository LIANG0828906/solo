export interface Photo {
  id: string
  fileName: string
  dataUrl: string
  thumbnailUrl: string
  dominantColor: string
  latitude: number
  longitude: number
  takenAt: Date
  cameraModel: string
  isManual: boolean
  name?: string
  description?: string
}

export interface FilterState {
  startTime: Date | null
  endTime: Date | null
  startDate: string
  endDate: string
  keyword: string
}

export interface PendingPhoto {
  id: string
  fileName: string
  dataUrl: string
  thumbnailUrl: string
  dominantColor: string
  takenAt: Date
  cameraModel: string
}
