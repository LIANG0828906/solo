export type RoastLevel = 'light' | 'medium' | 'dark'

export interface FlavorProfile {
  acidity: number
  bitterness: number
  sweetness: number
  body: number
  cleanliness: number
  aftertaste: number
}

export interface CoffeeBean {
  id: number
  name: string
  origin: string
  processing: string
  flavorNotes: string[]
  altitude: string
  variety: string
  stockRoasted: number
  roastLevels: RoastLevel[]
  flavorProfile: FlavorProfile
  imageColor: string
  price: number
}

export interface ControlPoint {
  time: number
  temperature: number
}

export interface Recipe {
  id: number
  name: string
  beanOrigin: string
  beanBatchId: number
  greenBeanWeight: number
  roastedBeanWeight: number
  yieldRate: number
  chargeTemp: number
  firstCrackTime: number
  dropTemp: number
  controlPoints: ControlPoint[]
  createdAt: string
}

export interface GreenBeanBatch {
  id: number
  batchNo: string
  origin: string
  processing: string
  variety: string
  initialWeight: number
  remainingWeight: number
  receiveDate: string
  threshold: number
}

export interface CartItem {
  coffeeId: number
  coffeeName: string
  roastLevel: RoastLevel
  quantity: number
  price: number
}

export interface Order {
  id: number
  items: CartItem[]
  total: number
  customerName: string
  status: 'pending' | 'roasting' | 'shipped' | 'completed'
  createdAt: string
}

export type SortField = 'origin' | 'processing' | 'receiveDate'
export type SortOrder = 'asc' | 'desc'
