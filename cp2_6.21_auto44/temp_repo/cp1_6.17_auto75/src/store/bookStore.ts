import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Book, Borrower, BorrowRecord } from '../types'

const SPINE_COLORS = [
  '#C0392B', '#E74C3C', '#922B21', '#A93226',
  '#27AE60', '#1E8449', '#196F3D', '#145A32',
  '#2980B9', '#1F618D', '#1A5276', '#154360',
  '#8E44AD', '#6C3483', '#5B2C6F', '#4A235A',
  '#F39C12', '#D68910', '#B9770E', '#9C640C',
  '#16A085', '#117A65', '#0E6251', '#0B5345',
  '#34495E', '#2C3E50', '#283747', '#1C2833',
  '#E67E22', '#D35400', '#BA4A00', '#A04000',
]

function randomSpineColor(): string {
  return SPINE_COLORS[Math.floor(Math.random() * SPINE_COLORS.length)]
}

function randomSpineWidth(): number {
  return Math.floor(Math.random() * 21) + 20
}

const MOCK_BORROWERS: Borrower[] = [
  { name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan' },
  { name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi' },
  { name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu' },
  { name: '赵六', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu' },
]

function createMockBooks(): Book[] {
  const bookData = [
    { title: '百年孤独', author: '加西亚·马尔克斯' },
    { title: '三体', author: '刘慈欣' },
    { title: '活着', author: '余华' },
    { title: '红楼梦', author: '曹雪芹' },
    { title: '平凡的世界', author: '路遥' },
    { title: '围城', author: '钱钟书' },
    { title: '白夜行', author: '东野圭吾' },
    { title: '追风筝的人', author: '卡勒德·胡赛尼' },
    { title: '小王子', author: '圣埃克苏佩里' },
    { title: '解忧杂货店', author: '东野圭吾' },
    { title: '挪威的森林', author: '村上春树' },
    { title: '不能承受的生命之轻', author: '米兰·昆德拉' },
    { title: '老人与海', author: '海明威' },
    { title: '傲慢与偏见', author: '简·奥斯汀' },
    { title: '简爱', author: '夏洛蒂·勃朗特' },
    { title: '呼啸山庄', author: '艾米莉·勃朗特' },
    { title: '月亮与六便士', author: '毛姆' },
    { title: '瓦尔登湖', author: '梭罗' },
    { title: '人类简史', author: '尤瓦尔·赫拉利' },
    { title: '明朝那些事儿', author: '当年明月' },
  ]

  return bookData.map((data, index) => {
    const isBorrowed = Math.random() > 0.6
    const borrower = MOCK_BORROWERS[Math.floor(Math.random() * MOCK_BORROWERS.length)]
    const history: BorrowRecord[] = []
    const now = Date.now()
    for (let i = 0; i < Math.floor(Math.random() * 4); i++) {
      const b = MOCK_BORROWERS[Math.floor(Math.random() * MOCK_BORROWERS.length)]
      history.push({
        id: uuidv4(),
        type: i % 2 === 0 ? 'borrow' : 'return',
        borrowerName: b.name,
        borrowerAvatar: b.avatar,
        timestamp: new Date(now - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
    if (isBorrowed) {
      history.unshift({
        id: uuidv4(),
        type: 'borrow',
        borrowerName: borrower.name,
        borrowerAvatar: borrower.avatar,
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
    return {
      id: uuidv4(),
      title: data.title,
      author: data.author,
      isbn: `978${Math.floor(Math.random() * 10000000000)}`,
      spineColor: randomSpineColor(),
      spineWidth: randomSpineWidth(),
      position: index,
      status: isBorrowed ? 'borrowed' as const : 'available' as const,
      currentBorrower: isBorrowed ? borrower : null,
      borrowHistory: history,
      createdAt: new Date(now - index * 24 * 60 * 60 * 1000).toISOString(),
    }
  })
}

interface BookStore {
  books: Book[]
  selectedBook: Book | null
  searchQuery: string
  loading: boolean
  fetchBooks: () => Promise<void>
  addBook: (book: Partial<Book>) => Promise<void>
  toggleBorrow: (bookId: string, borrower?: Borrower) => Promise<void>
  reorderBooks: (fromIndex: number, toIndex: number) => void
  setSelectedBook: (book: Book | null) => void
  setSearchQuery: (query: string) => void
  getFilteredBooks: () => Book[]
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: createMockBooks(),
  selectedBook: null,
  searchQuery: '',
  loading: false,

  fetchBooks: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/books')
      if (res.ok) {
        const data = await res.json()
        set({ books: data, loading: false })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  addBook: async (bookData) => {
    const newBook: Book = {
      id: uuidv4(),
      title: bookData.title || '未命名书籍',
      author: bookData.author || '未知作者',
      isbn: bookData.isbn,
      spineColor: bookData.spineColor || randomSpineColor(),
      spineWidth: bookData.spineWidth || randomSpineWidth(),
      position: get().books.length,
      status: 'available',
      currentBorrower: null,
      borrowHistory: [],
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ books: [...state.books, newBook] }))
    try {
      await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      })
    } catch {
      // ignore
    }
  },

  toggleBorrow: async (bookId: string, borrower?: Borrower) => {
    const book = get().books.find((b) => b.id === bookId)
    if (!book) return

    const defaultBorrower = borrower || MOCK_BORROWERS[0]
    const newRecord: BorrowRecord = {
      id: uuidv4(),
      type: book.status === 'available' ? 'borrow' : 'return',
      borrowerName: book.status === 'available' ? defaultBorrower.name : (book.currentBorrower?.name || ''),
      borrowerAvatar: book.status === 'available' ? defaultBorrower.avatar : (book.currentBorrower?.avatar || ''),
      timestamp: new Date().toISOString(),
    }

    set((state) => ({
      books: state.books.map((b) => {
        if (b.id !== bookId) return b
        const isBorrowing = b.status === 'available'
        return {
          ...b,
          status: isBorrowing ? 'borrowed' : 'available',
          currentBorrower: isBorrowing ? defaultBorrower : null,
          borrowHistory: [newRecord, ...b.borrowHistory],
        }
      }),
      selectedBook: state.selectedBook?.id === bookId
        ? {
            ...state.selectedBook,
            status: state.selectedBook.status === 'available' ? 'borrowed' : 'available',
            currentBorrower: state.selectedBook.status === 'available' ? defaultBorrower : null,
            borrowHistory: [newRecord, ...state.selectedBook.borrowHistory],
          }
        : state.selectedBook,
    }))

    try {
      const endpoint = book.status === 'available' ? 'borrow' : 'return'
      await fetch(`/api/books/${bookId}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrower: defaultBorrower }),
      })
    } catch {
      // ignore
    }
  },

  reorderBooks: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const result = Array.from(state.books)
      const [removed] = result.splice(fromIndex, 1)
      result.splice(toIndex, 0, removed)
      return {
        books: result.map((b, i) => ({ ...b, position: i })),
      }
    })
  },

  setSelectedBook: (book) => set({ selectedBook: book }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  getFilteredBooks: () => {
    const { books, searchQuery } = get()
    if (!searchQuery.trim()) return books
    const q = searchQuery.toLowerCase()
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.includes(q))
    )
  },
}))
