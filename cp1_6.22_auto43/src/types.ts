export interface TravelSpot {
  id: string
  day: number
  name: string
  lat: number
  lng: number
  cost: number
  category: string
  description: string
}

export interface TravelPlan {
  id: string
  city: string
  startDate: string
  days: number
  icon: string
  budget: number
  spots: TravelSpot[]
}

export interface LibrarySpot {
  id: string
  name: string
  city: string
  lat: number
  lng: number
  description: string
}
