// 调用关系：被 db/lowdb.ts, routes/points.ts, routes/exchange.ts 引用
// 定义所有共享的数据类型接口

export interface User {
  id: string
  name: string
  totalPoints: number
  avatar?: string
}

// 调用关系：被 db/lowdb.ts, routes/products.ts, routes/exchange.ts 引用
// 定义数据库模型和 API 返回数据结构

export interface Product {
  id: string
  name: string
  points: number
  stock: number
  image?: string
  description?: string
  iconType?: 'bottle' | 'bag' | 'box' | 'plant' | 'umbrella' | 'cup'
  iconColor?: string
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
