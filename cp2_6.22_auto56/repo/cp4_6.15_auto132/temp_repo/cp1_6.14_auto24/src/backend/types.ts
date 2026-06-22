export interface User {
  id: string
  username: string
  password: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  publishYear: number
  description: string
  coverUrl: string
  dropPointId: string
  ownerId: string
  status: 'available' | 'borrowed'
  currentBorrowerId: string | null
  borrowCount: number
  totalRating: number
  ratingCount: number
}

export interface DropPoint {
  id: string
  name: string
  lat: number
  lng: number
  address: string
}

export interface DriftLog {
  id: string
  bookId: string
  userId: string
  username: string
  content: string
  rating: number
  createdAt: string
}

export interface ChatMessage {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  createdAt: string
  read: boolean
}

export interface DB {
  users: User[]
  books: Book[]
  dropPoints: DropPoint[]
  driftLogs: DriftLog[]
  chatMessages: ChatMessage[]
}

declare module 'express-session' {
  interface SessionData {
    userId: string
  }
}
