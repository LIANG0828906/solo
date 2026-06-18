export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Fragment {
  id: string
  name: string
  rarity: Rarity
  groupId: string
  groupName: string
  imageId: number
}

export interface Artwork {
  id: string
  name: string
  description: string
  rarity: Rarity
  groupId: string
  imageUrl: string
  createdAt: number
}

export interface Listing {
  id: string
  sellerId: string
  sellerName: string
  itemId: string
  itemType: 'fragment' | 'artwork'
  itemName: string
  rarity: Rarity
  price: number
  listedAt: number
  quantity: number
}

export interface PlayerState {
  playerId: string
  playerName: string
  balance: number
  fragments: Fragment[]
  artworks: Artwork[]
  lastQuizDate: string
}

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

export type ActivityType = 'puzzle' | 'quiz'

export interface PuzzleDifficulty {
  size: number
  name: string
  description: string
}
