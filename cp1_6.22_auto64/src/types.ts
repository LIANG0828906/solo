export interface Spot {
  id: string
  name: string
  description: string
  duration: number
  recommendedTime: string
  openTime: string
  ticketPrice: string
  rating: number
  images: [string, string, string]
  tags: string[]
  category: 'attraction' | 'restaurant' | 'shopping'
}

export interface DayPlan {
  day: number
  spots: Spot[]
}

export type Theme =
  | 'sunset'
  | 'ocean'
  | 'forest'
  | 'lavender'
  | 'rose'
  | 'golden'
  | 'midnight'
  | 'emerald'

export interface TravelPlan {
  id: string
  destination: string
  days: number
  itinerary: DayPlan[]
  createdAt: string
  theme?: Theme
}

export interface Comment {
  id: string
  userId: string
  userName: string
  avatar: string
  content: string
  createdAt: string
}

export interface CommunityPost {
  id: string
  userId: string
  userName: string
  avatar: string
  plan: TravelPlan
  likes: number
  comments: Comment[]
  liked: boolean
}

export type Action =
  | { type: 'SET_DESTINATION'; payload: string }
  | { type: 'SET_DAYS'; payload: number }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'ADD_SPOT'; payload: { day: number; spot: Spot } }
  | { type: 'REMOVE_SPOT'; payload: { day: number; spotId: string } }
  | { type: 'MOVE_SPOT'; payload: { fromDay: number; toDay: number; spotId: string } }
  | { type: 'REORDER_SPOTS'; payload: { day: number; spots: Spot[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_PLAN' }
