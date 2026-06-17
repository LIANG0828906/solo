import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Message {
  id: string
  content: string
  rating: number
  avatar: string
  timestamp: number
}

export interface Book {
  id: string
  title: string
  author: string
  publishYear: number
  review: string
  status: 'available' | 'borrowed' | 'exchanged'
  ownerNote?: string
  messages: Message[]
  createdAt: number
}

interface BookStore {
  books: Book[]
  selectedBookId: string | null
  isExploreMode: boolean
  blinkingBookId: string | null
  isAddModalOpen: boolean

  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'messages'>) => void
  updateBook: (id: string, updates: Partial<Book>) => void
  deleteBook: (id: string) => void
  selectBook: (id: string | null) => void
  toggleExploreMode: () => void
  setBlinkingBook: (id: string | null) => void
  addMessage: (bookId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
  setAddModalOpen: (open: boolean) => void
}

const AVATARS = ['📚', '📖', '📕', '📗', '📘', '📙', '🪶', '☕', '🌿', '🕯️']

const sampleBooks: Book[] = [
  {
    id: '1',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    publishYear: 1967,
    review: '布恩迪亚家族七代人的传奇故事，魔幻现实主义的巅峰之作。',
    status: 'available',
    ownerNote: '书页泛黄，但保存完好，是我大学时最爱的读物。',
    messages: [
      { id: 'm1', content: '在这书摊偶遇这本，仿佛时光倒流。', rating: 5, avatar: AVATARS[0], timestamp: Date.now() - 86400000 },
      { id: 'm2', content: '书脊有磨损的痕迹，更添几分韵味。', rating: 4, avatar: AVATARS[3], timestamp: Date.now() - 43200000 }
    ],
    createdAt: Date.now() - 7 * 86400000
  },
  {
    id: '2',
    title: '瓦尔登湖',
    author: '梭罗',
    publishYear: 1854,
    review: '独居湖畔的沉思录，关于自然、简朴与自由。',
    status: 'borrowed',
    ownerNote: '扉页有前任主人的笔记，字迹清秀。',
    messages: [
      { id: 'm3', content: '夏日午后读这本书最合适不过。', rating: 5, avatar: AVATARS[7], timestamp: Date.now() - 172800000 }
    ],
    createdAt: Date.now() - 14 * 86400000
  },
  {
    id: '3',
    title: '小王子',
    author: '圣埃克苏佩里',
    publishYear: 1943,
    review: '写给所有曾经是孩子的大人的童话。',
    status: 'available',
    ownerNote: '',
    messages: [
      { id: 'm4', content: '每个年龄段读都有不同的感动。', rating: 5, avatar: AVATARS[2], timestamp: Date.now() - 259200000 },
      { id: 'm5', content: '狐狸说的那句话，我记了好多年。', rating: 5, avatar: AVATARS[5], timestamp: Date.now() - 129600000 },
      { id: 'm6', content: '插图很温暖，纸张有一种特别的香味。', rating: 4, avatar: AVATARS[8], timestamp: Date.now() - 3600000 }
    ],
    createdAt: Date.now() - 21 * 86400000
  },
  {
    id: '4',
    title: '城南旧事',
    author: '林海音',
    publishYear: 1960,
    review: '老北京胡同里的童年记忆，温润而忧伤。',
    status: 'available',
    ownerNote: '我外婆那个年代的故事，读起来格外亲切。',
    messages: [
      { id: 'm7', content: '让我想起了外婆讲的那些老故事。', rating: 5, avatar: AVATARS[1], timestamp: Date.now() - 86400000 }
    ],
    createdAt: Date.now() - 30 * 86400000
  },
  {
    id: '5',
    title: '撒哈拉的故事',
    author: '三毛',
    publishYear: 1976,
    review: '沙漠里的浪漫与坚韧，一个奇女子的生活随笔。',
    status: 'exchanged',
    ownerNote: '用一本旧诗集换来的，值了。',
    messages: [
      { id: 'm8', content: '三毛的文字，总是让人向往远方。', rating: 5, avatar: AVATARS[6], timestamp: Date.now() - 518400000 }
    ],
    createdAt: Date.now() - 45 * 86400000
  },
  {
    id: '6',
    title: '红楼梦',
    author: '曹雪芹',
    publishYear: 1791,
    review: '中国古典小说的巅峰，满纸荒唐言，一把辛酸泪。',
    status: 'available',
    ownerNote: '这套是八十年代的版本，纸张有些脆了。',
    messages: [
      { id: 'm9', content: '旧版的脂批本，难得一见！', rating: 5, avatar: AVATARS[9], timestamp: Date.now() - 604800000 }
    ],
    createdAt: Date.now() - 60 * 86400000
  }
]

export const useBookStore = create<BookStore>()(
  persist(
    (set) => ({
      books: sampleBooks,
      selectedBookId: null,
      isExploreMode: false,
      blinkingBookId: null,
      isAddModalOpen: false,

      addBook: (book) => set((state) => ({
        books: [...state.books, {
          ...book,
          id: Date.now().toString(),
          createdAt: Date.now(),
          messages: []
        }]
      })),

      updateBook: (id, updates) => set((state) => ({
        books: state.books.map(b => b.id === id ? { ...b, ...updates } : b)
      })),

      deleteBook: (id) => set((state) => ({
        books: state.books.filter(b => b.id !== id)
      })),

      selectBook: (id) => set({ selectedBookId: id }),

      toggleExploreMode: () => set((state) => ({ isExploreMode: !state.isExploreMode })),

      setBlinkingBook: (id) => set({ blinkingBookId: id }),

      addMessage: (bookId, message) => set((state) => ({
        books: state.books.map(b => b.id === bookId ? {
          ...b,
          messages: [...b.messages, {
            ...message,
            id: Date.now().toString(),
            timestamp: Date.now()
          }]
        } : b)
      })),

      setAddModalOpen: (open) => set({ isAddModalOpen: open })
    }),
    {
      name: 'xiangmo-bookstall-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)

export const getRandomAvatar = (): string => {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)]
}

export const getStatusLabel = (status: Book['status']): string => {
  const map = {
    available: '在摊',
    borrowed: '已借出',
    exchanged: '已交换'
  }
  return map[status]
}

export const getCoverColor = (year: number): string => {
  const startYear = 1800
  const endYear = 2024
  const t = Math.max(0, Math.min(1, (year - startYear) / (endYear - startYear)))
  
  const r1 = 139, g1 = 69, b1 = 19
  const r2 = 218, g2 = 165, b2 = 32
  
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  
  return `rgb(${r}, ${g}, ${b})`
}

export const AVATAR_LIST = AVATARS
