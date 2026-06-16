export type BookStatus = 'available' | 'drifting' | 'returning'

export interface DriftNode {
  city: string
  date: string
}

export interface Book {
  id: string
  title: string
  author: string
  description: string
  status: BookStatus
  coverColor: string
  coverShape: 'circle' | 'triangle' | 'star' | 'diamond' | 'hexagon'
  driftHistory: DriftNode[]
}

export interface Comment {
  id: string
  content: string
  createdAt: string
}

export interface Doodle {
  id: string
  bookId: string
  imageData: string
  likes: number
  comments: Comment[]
  createdAt: string
}

export type BrushType = 'ballpoint' | 'watercolor' | 'marker'

export interface AppState {
  books: Book[]
  currentBook: Book | null
  doodles: Doodle[]
  setCurrentBook: (bookId: string) => void
  borrowBook: (bookId: string) => void
  returnBook: (bookId: string) => void
  addDoodle: (bookId: string, imageData: string) => void
  likeDoodle: (doodleId: string) => void
  addComment: (doodleId: string, content: string) => void
}
