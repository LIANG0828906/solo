export interface Bid {
  id: string
  bidder: string
  amount: number
  timestamp: number
}

export interface Auction {
  id: string
  title: string
  description: string
  startPrice: number
  currentPrice: number
  startTime: number
  duration: number
  endTime: number
  status: 'upcoming' | 'ongoing' | 'ended'
  result?: 'sold' | 'unsold'
  winner?: string
  bids: Bid[]
  creator: string
}

export type AuctionStatus = 'all' | 'ongoing' | 'upcoming' | 'ended'
