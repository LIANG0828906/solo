export interface LostItem {
  id: string
  title: string
  location: string
  description: string
  image: string
  createdAt: number
  isClaimed: boolean
}

export interface MatchResult {
  item: LostItem
  score: number
  isHighMatch: boolean
}
