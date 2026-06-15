export type PetType = 'cat' | 'dog' | 'rabbit' | 'other'

export interface Pet {
  id: string
  userId?: string | null
  name: string
  type: PetType
  avatar: string
  intro: string
  hunger: number
  happiness: number
  health: number
  adopted: boolean
  adoptedAt?: string | null
  lost: boolean
  lostAt?: string | null
  lastActionAt: string
  createdAt: string
}

export interface Notice {
  id: string
  petId: string
  petName: string
  petType: PetType
  petThumbnail: string
  lostAt: string
  contact: string
  lastSnapshot: {
    hunger: number
    happiness: number
    health: number
  }
  createdAt: string
}

export interface User {
  id: string
  nickname: string
  createdAt: string
}

export type ActionType = 'feed' | 'play' | 'sleep'
export type PetAnimation = 'idle' | 'walk' | 'jump' | 'happy' | 'sleeping' | 'sick' | 'lost'
export type PetMood = 'happy' | 'normal' | 'hungry' | 'sad' | 'sick'
