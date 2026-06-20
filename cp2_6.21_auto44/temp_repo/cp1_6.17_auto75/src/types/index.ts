export interface Borrower {
  name: string
  avatar: string
}

export interface BorrowRecord {
  id: string
  type: 'borrow' | 'return'
  borrowerName: string
  borrowerAvatar: string
  timestamp: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  spineColor: string
  spineWidth: number
  position: number
  status: 'available' | 'borrowed'
  currentBorrower?: Borrower | null
  borrowHistory: BorrowRecord[]
  createdAt: string
}

export interface BookStats {
  total: number
  available: number
  borrowed: number
  monthlyData: { month: string; count: number }[]
}
