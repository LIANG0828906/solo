export interface User {
  id: string
  name: string
  totalPoints: number
  avatar?: string
}

export interface Product {
  id: string
  name: string
  points: number
  stock: number
  image?: string
  description?: string
  iconType?: string
}

export interface PointRecord {
  id: string
  date: string
  points: number
  description: string
}

export interface ExchangeRecord {
  id: string
  productId: string
  productName: string
  quantity: number
  points: number
  date: string
}

export interface WeekPoints {
  dates: string[]
  points: number[]
}

export interface MonthPoints {
  dates: string[]
  points: number[]
}

export interface ExchangeRequest {
  productId: string
  quantity: number
}

export interface ExchangeResponse {
  success: boolean
  message?: string
  data?: {
    record: ExchangeRecord
    remainingPoints: number
    remainingStock: number
  }
}

export interface PointsDataResponse {
  success: boolean
  message?: string
  data?: {
    user: User
    weekPoints: WeekPoints
    monthPoints: MonthPoints
    history: ExchangeRecord[]
  }
}

export interface ProductsResponse {
  success: boolean
  message?: string
  data?: Product[]
}
