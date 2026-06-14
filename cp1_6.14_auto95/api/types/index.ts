export interface Book {
  id: string
  title: string
  author: string
  category: string
  isbn: string
  cover: string
  description: string
  totalQuantity: number
  availableQuantity: number
  createdAt: string
  updatedAt: string
}

export interface Reader {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'reader' | 'admin'
  createdAt: string
}

export interface Loan {
  id: string
  bookId: string
  readerId: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  lateFee: number
  status: 'borrowed' | 'returned' | 'overdue'
}

export interface Notification {
  id: string
  readerId: string
  type: 'overdue' | 'return' | 'system'
  content: string
  isRead: boolean
  sentAt: string
}

export interface LibraryConfig {
  maxBorrowCount: number
  loanDays: number
  lateFeePerDay: number
}

export interface DatabaseSchema {
  books: Book[]
  readers: Reader[]
  loans: Loan[]
  notifications: Notification[]
  config: LibraryConfig
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
}

export interface JwtPayload {
  id: string
  email: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
