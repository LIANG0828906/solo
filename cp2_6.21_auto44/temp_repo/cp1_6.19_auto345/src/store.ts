import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface BorrowRecord {
  id: string
  borrowerName: string
  borrowerEmail: string
  borrowDate: string
  avatar: string
}

export interface Book {
  id: string
  title: string
  author: string
  coverUrl: string
  description: string
  color: string
  status: 'available' | 'borrowed'
  donor: string
  borrowHistory: BorrowRecord[]
  dueDate?: string
  isNew?: boolean
}

const COLORS = ['#B71C1C', '#E65100', '#F9A825', '#2E7D32', '#1565C0']

const getRandomColor = (): string => {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

const generateAvatar = (name: string): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  const color = colors[name.charCodeAt(0) % colors.length]
  const initial = name.charAt(0).toUpperCase()
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' fill='white' font-size='18' font-family='Arial'%3E${initial}%3C/text%3E%3C/svg%3E`
}

const initialBooks: Book[] = [
  {
    id: uuidv4(),
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    coverUrl: 'https://picsum.photos/seed/book1/300/450',
    description: '《百年孤独》是魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰。',
    color: COLORS[0],
    status: 'available',
    donor: '小明',
    borrowHistory: [
      { id: uuidv4(), borrowerName: '小红', borrowerEmail: 'xiaohong@example.com', borrowDate: '2024-01-15', avatar: generateAvatar('小红') },
      { id: uuidv4(), borrowerName: '小华', borrowerEmail: 'xiaohua@example.com', borrowDate: '2024-02-20', avatar: generateAvatar('小华') },
    ]
  },
  {
    id: uuidv4(),
    title: '活着',
    author: '余华',
    coverUrl: 'https://picsum.photos/seed/book2/300/450',
    description: '《活着》讲述了农村人福贵悲惨的人生遭遇。福贵本是个阔少爷，可他嗜赌如命，终于赌光了家业，一贫如洗。',
    color: COLORS[1],
    status: 'available',
    donor: '书香门第',
    borrowHistory: [
      { id: uuidv4(), borrowerName: '阿强', borrowerEmail: 'aqiang@example.com', borrowDate: '2024-03-10', avatar: generateAvatar('阿强') },
    ]
  },
  {
    id: uuidv4(),
    title: '三体',
    author: '刘慈欣',
    coverUrl: 'https://picsum.photos/seed/book3/300/450',
    description: '《三体》是刘慈欣创作的系列长篇科幻小说，由《三体》《三体Ⅱ·黑暗森林》《三体Ⅲ·死神永生》组成。',
    color: COLORS[2],
    status: 'borrowed',
    donor: '科幻迷',
    borrowHistory: [
      { id: uuidv4(), borrowerName: '小李', borrowerEmail: 'xiaoli@example.com', borrowDate: '2024-04-05', avatar: generateAvatar('小李') },
      { id: uuidv4(), borrowerName: '大刘', borrowerEmail: 'daliu@example.com', borrowDate: '2024-05-12', avatar: generateAvatar('大刘') },
      { id: uuidv4(), borrowerName: '阿花', borrowerEmail: 'ahua@example.com', borrowDate: '2024-06-18', avatar: generateAvatar('阿花') },
    ],
    dueDate: '2024-07-02'
  },
  {
    id: uuidv4(),
    title: '小王子',
    author: '圣埃克苏佩里',
    coverUrl: 'https://picsum.photos/seed/book4/300/450',
    description: '《小王子》是法国作家安托万·德·圣-埃克苏佩里于1942年写成的著名儿童文学短篇小说。',
    color: COLORS[3],
    status: 'available',
    donor: '爱读书',
    borrowHistory: []
  },
  {
    id: uuidv4(),
    title: '围城',
    author: '钱钟书',
    coverUrl: 'https://picsum.photos/seed/book5/300/450',
    description: '《围城》是钱钟书所著的长篇小说，是中国现代文学史上一部风格独特的讽刺小说。被誉为"新儒林外史"。',
    color: COLORS[4],
    status: 'available',
    donor: '文青',
    borrowHistory: [
      { id: uuidv4(), borrowerName: '张三', borrowerEmail: 'zhangsan@example.com', borrowDate: '2024-02-01', avatar: generateAvatar('张三') },
    ]
  },
  {
    id: uuidv4(),
    title: '平凡的世界',
    author: '路遥',
    coverUrl: 'https://picsum.photos/seed/book6/300/450',
    description: '《平凡的世界》是中国作家路遥创作的一部百万字的小说。这是一部全景式地表现中国当代城乡社会生活的长篇小说。',
    color: COLORS[0],
    status: 'borrowed',
    donor: '追梦人',
    borrowHistory: [
      { id: uuidv4(), borrowerName: '李四', borrowerEmail: 'lisi@example.com', borrowDate: '2024-05-20', avatar: generateAvatar('李四') },
    ],
    dueDate: '2024-06-20'
  },
  {
    id: uuidv4(),
    title: '红楼梦',
    author: '曹雪芹',
    coverUrl: 'https://picsum.photos/seed/book7/300/450',
    description: '《红楼梦》是中国古代四大名著之首，以贾宝玉、林黛玉、薛宝钗的爱情婚姻悲剧为主线，展现了封建社会的全景图。',
    color: COLORS[1],
    status: 'available',
    donor: '国学爱好者',
    borrowHistory: [
      { id: uuidv4(), borrowerName: '王五', borrowerEmail: 'wangwu@example.com', borrowDate: '2024-01-08', avatar: generateAvatar('王五') },
      { id: uuidv4(), borrowerName: '赵六', borrowerEmail: 'zhaoliu@example.com', borrowDate: '2024-03-15', avatar: generateAvatar('赵六') },
      { id: uuidv4(), borrowerName: '钱七', borrowerEmail: 'qianqi@example.com', borrowDate: '2024-05-01', avatar: generateAvatar('钱七') },
      { id: uuidv4(), borrowerName: '孙八', borrowerEmail: 'sunba@example.com', borrowDate: '2024-06-10', avatar: generateAvatar('孙八') },
    ]
  },
  {
    id: uuidv4(),
    title: '解忧杂货店',
    author: '东野圭吾',
    coverUrl: 'https://picsum.photos/seed/book8/300/450',
    description: '《解忧杂货店》是日本作家东野圭吾写作的长篇小说。该书讲述了在僻静街道旁的一家杂货店，只要写下烦恼投进店前门卷帘门的投信口，第二天就会在店后的牛奶箱里得到回答。',
    color: COLORS[2],
    status: 'available',
    donor: '暖心人',
    borrowHistory: [
      { id: uuidv4(), borrowerName: '小美', borrowerEmail: 'xiaomei@example.com', borrowDate: '2024-04-22', avatar: generateAvatar('小美') },
    ]
  },
]

interface BookStore {
  books: Book[]
  hoveredBookId: string | null
  selectedBookId: string | null
  showDonateForm: boolean
  addBook: (book: Omit<Book, 'id' | 'status' | 'borrowHistory' | 'color' | 'isNew'> & { color?: string }) => void
  borrowBook: (bookId: string, borrowerName: string, borrowerEmail: string) => void
  setHoveredBook: (bookId: string | null) => void
  setSelectedBook: (bookId: string | null) => void
  toggleDonateForm: () => void
  clearNewFlag: (bookId: string) => void
}

export const useBookStore = create<BookStore>((set) => ({
  books: initialBooks,
  hoveredBookId: null,
  selectedBookId: null,
  showDonateForm: false,

  addBook: (bookData) => set((state) => {
    const newBook: Book = {
      id: uuidv4(),
      status: 'available',
      borrowHistory: [],
      color: bookData.color || getRandomColor(),
      isNew: true,
      ...bookData,
    }
    return { books: [...state.books, newBook], showDonateForm: false }
  }),

  borrowBook: (bookId, borrowerName, borrowerEmail) => set((state) => {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const newRecord: BorrowRecord = {
      id: uuidv4(),
      borrowerName,
      borrowerEmail,
      borrowDate: new Date().toISOString().split('T')[0],
      avatar: generateAvatar(borrowerName),
    }

    return {
      books: state.books.map((book) =>
        book.id === bookId
          ? {
              ...book,
              status: 'borrowed' as const,
              dueDate: dueDateStr,
              borrowHistory: [newRecord, ...book.borrowHistory],
            }
          : book
      ),
      selectedBookId: null,
    }
  }),

  setHoveredBook: (bookId) => set({ hoveredBookId: bookId }),

  setSelectedBook: (bookId) => set({ selectedBookId: bookId }),

  toggleDonateForm: () => set((state) => ({ showDonateForm: !state.showDonateForm })),

  clearNewFlag: (bookId) => set((state) => ({
    books: state.books.map((book) =>
      book.id === bookId ? { ...book, isNew: false } : book
    ),
  })),
}))
