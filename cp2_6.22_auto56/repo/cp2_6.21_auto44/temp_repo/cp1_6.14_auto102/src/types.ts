export interface Song {
  id: string
  title: string
  artist: string
  artistAvatar: string
  tags: string[]
  priceDigital: number
  priceCD: number
  coverImage: string
  audioFile: string
  scoreFile: string
  lyrics: string
  description: string
  purchaseCount: number
  rating: number
  createdAt: string
}
