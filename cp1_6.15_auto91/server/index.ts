import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

type Category = 'novel' | 'documentary' | 'technology' | 'art' | 'life'
type TransactionType = 'exchange' | 'sale'
type BookStatus = 'pending' | 'approved' | 'rejected'
type TransactionStatus = 'pending' | 'confirmed' | 'completed'

interface User {
  id: string
  email: string
  password: string
  nickname: string
  avatar: string
  isAdmin: boolean
  createdAt: Date
}

interface Book {
  id: string
  title: string
  author: string
  publishYear: number
  description: string
  coverUrl: string
  category: Category
  transactionType: TransactionType
  exchangeCategory?: Category
  price?: number
  ownerId: string
  status: BookStatus
  rejectReason?: string
  createdAt: Date
}

interface Transaction {
  id: string
  bookId: string
  buyerId: string
  sellerId: string
  type: TransactionType
  status: TransactionStatus
  price?: number
  createdAt: Date
}

interface AuthRequest extends Request {
  user?: User
}

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const users: User[] = []
const books: Book[] = []
const transactions: Transaction[] = []
const tokens: Map<string, string> = new Map()

const adminUser: User = {
  id: uuidv4(),
  email: 'admin@bookstore.com',
  password: 'admin123',
  nickname: '管理员',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  isAdmin: true,
  createdAt: new Date(),
}
users.push(adminUser)
tokens.set('admin-token', adminUser.id)

const sampleUserId1 = uuidv4()
const sampleUserId2 = uuidv4()

users.push(
  {
    id: sampleUserId1,
    email: 'alice@example.com',
    password: '123456',
    nickname: '爱丽丝',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    isAdmin: false,
    createdAt: new Date(),
  },
  {
    id: sampleUserId2,
    email: 'bob@example.com',
    password: '123456',
    nickname: '鲍勃',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    isAdmin: false,
    createdAt: new Date(),
  }
)

const sampleBooks: Book[] = [
  {
    id: uuidv4(),
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    publishYear: 1967,
    description: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。',
    coverUrl: 'https://picsum.photos/seed/book1/300/400',
    category: 'novel',
    transactionType: 'sale',
    price: 35,
    ownerId: sampleUserId1,
    status: 'approved',
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    publishYear: 2011,
    description: '从认知革命、农业革命到科学革命，讲述人类的进化历程。',
    coverUrl: 'https://picsum.photos/seed/book2/300/400',
    category: 'documentary',
    transactionType: 'exchange',
    exchangeCategory: 'technology',
    ownerId: sampleUserId2,
    status: 'approved',
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    title: '代码整洁之道',
    author: 'Robert C. Martin',
    publishYear: 2008,
    description: '讲述如何编写整洁、可维护的代码，提升代码质量的经典之作。',
    coverUrl: 'https://picsum.photos/seed/book3/300/400',
    category: 'technology',
    transactionType: 'sale',
    price: 58,
    ownerId: sampleUserId1,
    status: 'approved',
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    title: '艺术的故事',
    author: '贡布里希',
    publishYear: 1950,
    description: '从史前绘画到现代艺术，全面梳理西方艺术发展脉络。',
    coverUrl: 'https://picsum.photos/seed/book4/300/400',
    category: 'art',
    transactionType: 'sale',
    price: 88,
    ownerId: sampleUserId2,
    status: 'pending',
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    title: '小森林',
    author: '五十岚大介',
    publishYear: 2004,
    description: '讲述乡村生活的治愈系美食漫画，感受生活的美好与宁静。',
    coverUrl: 'https://picsum.photos/seed/book5/300/400',
    category: 'life',
    transactionType: 'exchange',
    exchangeCategory: 'novel',
    ownerId: sampleUserId1,
    status: 'approved',
    createdAt: new Date(),
  },
]
books.push(...sampleBooks)

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const userId = tokens.get(token)
  if (!userId) {
    res.status(401).json({ success: false, error: '无效的认证令牌' })
    return
  }

  const user = users.find((u) => u.id === userId)
  if (!user) {
    res.status(401).json({ success: false, error: '用户不存在' })
    return
  }

  req.user = user
  next()
}

function sanitizeUser(user: User) {
  const { password, ...safeUser } = user
  return safeUser
}

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, nickname, avatar } = req.body

  if (!email || !password || !nickname) {
    res.status(400).json({ success: false, error: '邮箱、密码和昵称为必填项' })
    return
  }

  if (users.find((u) => u.email === email)) {
    res.status(400).json({ success: false, error: '该邮箱已被注册' })
    return
  }

  const newUser: User = {
    id: uuidv4(),
    email,
    password,
    nickname,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
    isAdmin: false,
    createdAt: new Date(),
  }

  users.push(newUser)
  const token = uuidv4()
  tokens.set(token, newUser.id)

  res.status(201).json({
    success: true,
    data: {
      user: sanitizeUser(newUser),
      token,
    },
  })
})

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ success: false, error: '邮箱和密码为必填项' })
    return
  }

  const user = users.find((u) => u.email === email && u.password === password)
  if (!user) {
    res.status(401).json({ success: false, error: '邮箱或密码错误' })
    return
  }

  const token = uuidv4()
  tokens.set(token, user.id)

  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      token,
    },
  })
})

app.get('/api/books', (req: Request, res: Response) => {
  const { status, category, ownerId } = req.query

  let filteredBooks = [...books]

  if (status && typeof status === 'string') {
    filteredBooks = filteredBooks.filter((b) => b.status === status)
  }
  if (category && typeof category === 'string') {
    filteredBooks = filteredBooks.filter((b) => b.category === category)
  }
  if (ownerId && typeof ownerId === 'string') {
    filteredBooks = filteredBooks.filter((b) => b.ownerId === ownerId)
  }

  res.json({
    success: true,
    data: filteredBooks,
  })
})

app.get('/api/books/:id', (req: Request, res: Response) => {
  const book = books.find((b) => b.id === req.params.id)
  if (!book) {
    res.status(404).json({ success: false, error: '书籍不存在' })
    return
  }

  res.json({
    success: true,
    data: book,
  })
})

app.post('/api/books', authenticateToken, (req: AuthRequest, res: Response) => {
  const {
    title,
    author,
    publishYear,
    description,
    coverUrl,
    category,
    transactionType,
    exchangeCategory,
    price,
  } = req.body

  if (!title || !author || !publishYear || !description || !coverUrl || !category || !transactionType) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  if (!['novel', 'documentary', 'technology', 'art', 'life'].includes(category)) {
    res.status(400).json({ success: false, error: '无效的书籍分类' })
    return
  }

  if (!['exchange', 'sale'].includes(transactionType)) {
    res.status(400).json({ success: false, error: '无效的交易类型' })
    return
  }

  if (transactionType === 'sale' && !price) {
    res.status(400).json({ success: false, error: '出售类型必须填写价格' })
    return
  }

  const newBook: Book = {
    id: uuidv4(),
    title,
    author,
    publishYear: Number(publishYear),
    description,
    coverUrl,
    category,
    transactionType,
    exchangeCategory: transactionType === 'exchange' ? exchangeCategory : undefined,
    price: transactionType === 'sale' ? Number(price) : undefined,
    ownerId: req.user!.id,
    status: 'pending',
    createdAt: new Date(),
  }

  books.push(newBook)

  res.status(201).json({
    success: true,
    data: newBook,
  })
})

app.put('/api/books/:id/review', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user!.isAdmin) {
    res.status(403).json({ success: false, error: '只有管理员可以审核书籍' })
    return
  }

  const { status, rejectReason } = req.body

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, error: '无效的审核状态' })
    return
  }

  if (status === 'rejected' && !rejectReason) {
    res.status(400).json({ success: false, error: '驳回必须提供原因' })
    return
  }

  const book = books.find((b) => b.id === req.params.id)
  if (!book) {
    res.status(404).json({ success: false, error: '书籍不存在' })
    return
  }

  book.status = status as BookStatus
  book.rejectReason = status === 'rejected' ? rejectReason : undefined

  res.json({
    success: true,
    data: book,
  })
})

app.get('/api/users/:id/books', (req: Request, res: Response) => {
  const userBooks = books.filter((b) => b.ownerId === req.params.id)

  res.json({
    success: true,
    data: userBooks,
  })
})

app.post('/api/transactions', authenticateToken, (req: AuthRequest, res: Response) => {
  const { bookId, type, price } = req.body

  if (!bookId || !type) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  if (!['exchange', 'sale'].includes(type)) {
    res.status(400).json({ success: false, error: '无效的交易类型' })
    return
  }

  const book = books.find((b) => b.id === bookId)
  if (!book) {
    res.status(404).json({ success: false, error: '书籍不存在' })
    return
  }

  if (book.status !== 'approved') {
    res.status(400).json({ success: false, error: '该书籍未通过审核，无法进行交易' })
    return
  }

  if (book.ownerId === req.user!.id) {
    res.status(400).json({ success: false, error: '不能购买自己的书籍' })
    return
  }

  const newTransaction: Transaction = {
    id: uuidv4(),
    bookId,
    buyerId: req.user!.id,
    sellerId: book.ownerId,
    type: type as TransactionType,
    status: 'pending',
    price: type === 'sale' ? (price ? Number(price) : book.price) : undefined,
    createdAt: new Date(),
  }

  transactions.push(newTransaction)

  res.status(201).json({
    success: true,
    data: newTransaction,
  })
})

app.get('/api/transactions', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { status } = req.query

  let userTransactions = transactions.filter(
    (t) => t.buyerId === userId || t.sellerId === userId
  )

  if (status && typeof status === 'string') {
    userTransactions = userTransactions.filter((t) => t.status === status)
  }

  res.json({
    success: true,
    data: userTransactions,
  })
})

app.listen(PORT, () => {
  console.log(`二手书店后端服务已启动: http://localhost:${PORT}`)
})
