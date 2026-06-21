import { Book, User, Loan } from '../../shared/types.js'
import { v4 as uuidv4 } from 'uuid'

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: '李明',
    avatar: 'https://i.pravatar.cc/150?img=1',
    reputation: 4.8,
    ratingCount: 15,
    ratings: [5, 5, 4, 5, 5]
  },
  {
    id: 'user-2',
    name: '王芳',
    avatar: 'https://i.pravatar.cc/150?img=2',
    reputation: 4.5,
    ratingCount: 12,
    ratings: [4, 5, 4, 5]
  },
  {
    id: 'user-3',
    name: '张伟',
    avatar: 'https://i.pravatar.cc/150?img=3',
    reputation: 2.8,
    ratingCount: 8,
    ratings: [3, 2, 3, 3]
  }
]

export const mockBooks: Book[] = [
  {
    id: 'book-1',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    isbn: '978-7-5442-5399-4',
    description: '魔幻现实主义文学代表作，讲述布恩迪亚家族七代人的传奇故事...',
    coverImage: 'https://picsum.photos/seed/book1/400/600',
    status: 'available',
    ownerId: 'user-1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'book-2',
    title: '活着',
    author: '余华',
    isbn: '978-7-5063-3043-5',
    description: '讲述了农村人福贵悲惨的人生遭遇...',
    coverImage: 'https://picsum.photos/seed/book2/400/600',
    status: 'available',
    ownerId: 'user-2',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'book-3',
    title: '三体',
    author: '刘慈欣',
    isbn: '978-7-5366-9293-0',
    description: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划...',
    coverImage: 'https://picsum.photos/seed/book3/400/600',
    status: 'borrowed',
    ownerId: 'user-3',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'book-4',
    title: '围城',
    author: '钱钟书',
    isbn: '978-7-02-002608-5',
    description: '从印度洋上驶向中国的一艘法国邮船上，发生了一连串的故事...',
    coverImage: 'https://picsum.photos/seed/book4/400/600',
    status: 'available',
    ownerId: 'user-1',
    createdAt: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 'book-5',
    title: '红楼梦',
    author: '曹雪芹',
    isbn: '978-7-02-000220-5',
    description: '以贾宝玉、林黛玉、薛宝钗的爱情婚姻悲剧为主线...',
    coverImage: 'https://picsum.photos/seed/book5/400/600',
    status: 'pending',
    ownerId: 'user-2',
    createdAt: new Date(Date.now() - 345600000).toISOString()
  },
  {
    id: 'book-6',
    title: '平凡的世界',
    author: '路遥',
    isbn: '978-7-5302-1200-4',
    description: '这是一部全景式地表现中国当代城乡社会生活的长篇小说...',
    coverImage: 'https://picsum.photos/seed/book6/400/600',
    status: 'available',
    ownerId: 'user-3',
    createdAt: new Date(Date.now() - 432000000).toISOString()
  },
  {
    id: 'book-7',
    title: '小王子',
    author: '安托万·德·圣-埃克苏佩里',
    isbn: '978-7-02-004249-9',
    description: '一个来自B-612号小行星的小王子，他离开自己的星球...',
    coverImage: 'https://picsum.photos/seed/book7/400/600',
    status: 'available',
    ownerId: 'user-1',
    createdAt: new Date(Date.now() - 518400000).toISOString()
  },
  {
    id: 'book-8',
    title: '追风筝的人',
    author: '卡勒德·胡赛尼',
    isbn: '978-7-208-06164-1',
    description: '12岁的阿富汗富家少爷阿米尔与仆人哈桑情同手足...',
    coverImage: 'https://picsum.photos/seed/book8/400/600',
    status: 'borrowed',
    ownerId: 'user-2',
    createdAt: new Date(Date.now() - 604800000).toISOString()
  }
]

export const mockLoans: Loan[] = [
  {
    id: 'loan-1',
    bookId: 'book-3',
    borrowerId: 'user-1',
    lenderId: 'user-3',
    status: 'active',
    borrowDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'loan-2',
    bookId: 'book-8',
    borrowerId: 'user-1',
    lenderId: 'user-2',
    status: 'overdue',
    borrowDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'loan-3',
    bookId: 'book-1',
    borrowerId: 'user-2',
    lenderId: 'user-1',
    status: 'returned',
    borrowDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    returnDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lenderRating: 5
  },
  {
    id: 'loan-4',
    bookId: 'book-4',
    borrowerId: 'user-3',
    lenderId: 'user-1',
    status: 'returned',
    borrowDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
    returnDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lenderRating: 4,
    borrowerRating: 5
  },
  {
    id: 'loan-5',
    bookId: 'book-5',
    borrowerId: 'user-1',
    lenderId: 'user-2',
    status: 'pending',
    borrowDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  }
]

let books: Book[] = [...mockBooks]
const users: User[] = [...mockUsers]
let loans: Loan[] = [...mockLoans]

export const getBooks = (): Book[] => books
export const getBookById = (id: string): Book | undefined => books.find(b => b.id === id)
export const addBook = (book: Omit<Book, 'id' | 'createdAt'>): Book => {
  const newBook: Book = {
    ...book,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  }
  books = [newBook, ...books]
  return newBook
}
export const updateBook = (id: string, updates: Partial<Book>): Book | undefined => {
  const index = books.findIndex(b => b.id === id)
  if (index !== -1) {
    books[index] = { ...books[index], ...updates }
    return books[index]
  }
  return undefined
}

export const getUsers = (): User[] => users
export const getUserById = (id: string): User | undefined => users.find(u => u.id === id)
export const updateUser = (id: string, updates: Partial<User>): User | undefined => {
  const index = users.findIndex(u => u.id === id)
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    return users[index]
  }
  return undefined
}
export const rateUser = (userId: string, rating: number): User | undefined => {
  const user = getUserById(userId)
  if (user) {
    const newRatings = [...user.ratings, rating]
    const newReputation = newRatings.reduce((a, b) => a + b, 0) / newRatings.length
    return updateUser(userId, {
      ratings: newRatings,
      reputation: parseFloat(newReputation.toFixed(1)),
      ratingCount: user.ratingCount + 1
    })
  }
  return undefined
}

export const getLoans = (): Loan[] => loans
export const getLoansByUserId = (userId: string): Loan[] =>
  loans.filter(l => l.borrowerId === userId || l.lenderId === userId)
export const addLoan = (loan: Omit<Loan, 'id' | 'borrowDate' | 'dueDate' | 'status'>): Loan => {
  const newLoan: Loan = {
    ...loan,
    id: uuidv4(),
    status: 'pending',
    borrowDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  }
  loans = [newLoan, ...loans]
  return newLoan
}
export const updateLoan = (id: string, updates: Partial<Loan>): Loan | undefined => {
  const index = loans.findIndex(l => l.id === id)
  if (index !== -1) {
    loans[index] = { ...loans[index], ...updates }
    return loans[index]
  }
  return undefined
}
