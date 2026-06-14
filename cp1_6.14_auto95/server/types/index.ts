export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  description: string
  coverImage: string
  totalCopies: number
  availableCopies: number
  location: string
  publishedYear: number
  publisher: string
  pages: number
  createdAt: string
  updatedAt: string
}

export interface Reader {
  id: string
  name: string
  email: string
  password: string
  phone: string
  avatar: string
  address: string
  role: 'admin' | 'reader'
  status: 'active' | 'inactive' | 'suspended'
  borrowedCount: number
  createdAt: string
  updatedAt: string
}

export interface Loan {
  id: string
  bookId: string
  readerId: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: 'active' | 'returned' | 'overdue'
  fineAmount: number
  finePaid: boolean
  renewCount: number
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  readerId: string
  type: 'loan' | 'return' | 'overdue' | 'fine' | 'system'
  title: string
  content: string
  read: boolean
  createdAt: string
}

export interface LibraryConfig {
  maxBooksPerReader: number
  loanPeriodDays: number
  overdueFinePerDay: number
  maxRenewCount: number
  libraryName: string
  libraryAddress: string
  libraryPhone: string
  openingHours: string
}

export interface DatabaseSchema {
  books: Book[]
  readers: Reader[]
  loans: Loan[]
  notifications: Notification[]
  config: LibraryConfig
}

export interface AuthPayload {
  id: string
  email: string
  role: 'admin' | 'reader'
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}
