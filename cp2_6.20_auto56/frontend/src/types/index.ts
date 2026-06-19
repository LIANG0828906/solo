export type PetType = 'cat' | 'dog' | 'dragon'
export type PetColor = 'default' | 'pink' | 'blue'

export interface Pet {
  id: string
  name: string
  type: PetType
  color: PetColor
  hunger: number
  happiness: number
  energy: number
  position: { x: number; y: number }
  ownerId: string
  ownerName: string
  isOnline: boolean
  lastUpdate: number
}

export interface User {
  id: string
  name: string
  avatar: string
  coins: number
  pet: Pet | null
  inventory: GiftItem[]
  achievements: Achievement[]
  lastLogin: string
  consecutiveDays: number
  giftsSent: number
  maxHappiness: number
}

export interface Gift {
  id: string
  name: string
  icon: string
  price: number
  description: string
}

export interface GiftItem {
  giftId: string
  quantity: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  icon: string
  condition: string
}

export interface GardenEvent {
  id: string
  type: 'wave' | 'dance' | 'gift' | 'move'
  fromPetId: string
  toPetId?: string
  giftId?: string
  timestamp: number
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  avatar: string
  petName: string
  totalHappiness: number
  rank: number
}

export interface WSMessage {
  type: 'pet_update' | 'garden_event' | 'pet_moved' | 'gift_received' | 'user_joined' | 'user_left'
  payload: any
}
