import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import type { DatabaseSchema, Book, Reader, Loan, Notification } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', '..', 'data')
const dbFile = path.join(dataDir, 'db.json')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const defaultData: DatabaseSchema = {
  books: [
    {
      id: uuidv4(),
      title: '百年孤独',
      author: '加西亚·马尔克斯',
      category: '文学',
      isbn: '978-7-5442-5399-4',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20book%20cover%20of%20One%20Hundred%20Years%20of%20Solitude%20literary%20novel&image_size=portrait_4_3',
      description: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。',
      totalQuantity: 5,
      availableQuantity: 3,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: uuidv4(),
      title: '活着',
      author: '余华',
      category: '文学',
      isbn: '978-7-5063-3043-5',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20literary%20book%20cover%20of%20To%20Live%20novel%20Yu%20Hua&image_size=portrait_4_3',
      description: '讲述了农村人福贵悲惨的人生遭遇，展现了生命的韧性。',
      totalQuantity: 4,
      availableQuantity: 2,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
    {
      id: uuidv4(),
      title: '人类简史',
      author: '尤瓦尔·赫拉利',
      category: '历史',
      isbn: '978-7-5086-5989-8',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20of%20Sapiens%20A%20Brief%20History%20of%20Humankind&image_size=portrait_4_3',
      description: '从认知革命到科学革命，讲述智人如何登上食物链顶端。',
      totalQuantity: 3,
      availableQuantity: 3,
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z',
    },
    {
      id: uuidv4(),
      title: '代码整洁之道',
      author: 'Robert C. Martin',
      category: '科技',
      isbn: '978-7-115-21748-2',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20code%20programming%20book%20cover%20technology&image_size=portrait_4_3',
      description: '软件工程领域的经典著作，教你如何编写整洁、可维护的代码。',
      totalQuantity: 6,
      availableQuantity: 4,
      createdAt: '2024-01-04T00:00:00.000Z',
      updatedAt: '2024-01-04T00:00:00.000Z',
    },
    {
      id: uuidv4(),
      title: '小王子',
      author: '安托万·德·圣-埃克苏佩里',
      category: '文学',
      isbn: '978-7-02-004249-5',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=the%20little%20prince%20book%20cover%20fairy%20tale&image_size=portrait_4_3',
      description: '一部充满诗意和哲理的童话，献给所有曾经是孩子的大人。',
      totalQuantity: 8,
      availableQuantity: 6,
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z',
    },
    {
      id: uuidv4(),
      title: '三体',
      author: '刘慈欣',
      category: '科幻',
      isbn: '978-7-5366-9293-0',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=The%20Three%20Body%20Problem%20sci-fi%20book%20cover%20universe&image_size=portrait_4_3',
      description: '中国科幻文学的里程碑，讲述人类与三体文明的首次接触。',
      totalQuantity: 5,
      availableQuantity: 2,
      createdAt: '2024-01-06T00:00:00.000Z',
      updatedAt: '2024-01-06T00:00:00.000Z',
    },
    {
      id: uuidv4(),
      title: '红楼梦',
      author: '曹雪芹',
      category: '文学',
      isbn: '978-7-02-000220-1',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Dream%20of%20the%20Red%20Chamber%20chinese%20classic%20novel%20book%20cover&image_size=portrait_4_3',
      description: '中国古典四大名著之首，以贾宝玉与林黛玉的爱情悲剧为主线，展现封建大家族的兴衰。',
      totalQuantity: 4,
      availableQuantity: 3,
      createdAt: '2024-01-07T00:00:00.000Z',
      updatedAt: '2024-01-07T00:00:00.000Z',
    },
    {
      id: uuidv4(),
      title: '时间简史',
      author: '斯蒂芬·霍金',
      category: '科技',
      isbn: '978-7-5357-1%C9-5',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=A%20Brief%20History%20of%20Time%20Stephen%20Hawking%20book%20cover%20cosmos&image_size=portrait_4_3',
      description: '从大爆炸到黑洞，霍金以通俗语言讲述宇宙的起源与命运。',
      totalQuantity: 3,
      availableQuantity: 3,
      createdAt: '2024-01-08T00:00:00.000Z',
      updatedAt: '2024-01-08T00:00:00.000Z',
    },
  ],
  readers: [
    {
      id: uuidv4(),
      name: '系统管理员',
      email: 'admin@library.com',
      passwordHash: '',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  loans: [],
  notifications: [],
  config: {
    maxBorrowCount: 5,
    loanDays: 14,
    lateFeePerDay: 0.5,
  },
}

const adapter = new JSONFile<DatabaseSchema>(dbFile)
export const db = new Low(adapter, defaultData)

export async function initDb(): Promise<void> {
  await db.read()
  if (db.data === null) {
    db.data = defaultData
  }
  const admin = db.data.readers.find((r) => r.email === 'admin@library.com')
  if (admin && !admin.passwordHash) {
    admin.passwordHash = await bcrypt.hash('admin123', 10)
  }
  await db.write()
}

export async function getAllBooks(): Promise<Book[]> {
  return db.data.books
}

export async function getBookById(id: string): Promise<Book | undefined> {
  return db.data.books.find((b) => b.id === id)
}

export async function createBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<Book> {
  const now = new Date().toISOString()
  const newBook: Book = { ...book, id: uuidv4(), createdAt: now, updatedAt: now }
  db.data.books.push(newBook)
  await db.write()
  return newBook
}

export async function updateBook(id: string, updates: Partial<Omit<Book, 'id' | 'createdAt'>>): Promise<Book | null> {
  const idx = db.data.books.findIndex((b) => b.id === id)
  if (idx === -1) return null
  db.data.books[idx] = { ...db.data.books[idx], ...updates, updatedAt: new Date().toISOString() }
  await db.write()
  return db.data.books[idx]
}

export async function deleteBook(id: string): Promise<boolean> {
  const idx = db.data.books.findIndex((b) => b.id === id)
  if (idx === -1) return false
  db.data.books.splice(idx, 1)
  await db.write()
  return true
}

export async function getAllReaders(): Promise<Reader[]> {
  return db.data.readers
}

export async function getReaderById(id: string): Promise<Reader | undefined> {
  return db.data.readers.find((r) => r.id === id)
}

export async function createReader(reader: Omit<Reader, 'id' | 'createdAt'>): Promise<Reader> {
  const newReader: Reader = { ...reader, id: uuidv4(), createdAt: new Date().toISOString() }
  db.data.readers.push(newReader)
  await db.write()
  return newReader
}

export async function findReaderByEmail(email: string): Promise<Reader | undefined> {
  return db.data.readers.find((r) => r.email === email)
}

export async function createLoan(loan: Omit<Loan, 'id'>): Promise<Loan> {
  const newLoan: Loan = { ...loan, id: uuidv4() }
  db.data.loans.push(newLoan)
  await db.write()
  return newLoan
}

export async function returnLoan(loanId: string, returnDate: string, lateFee: number): Promise<Loan | null> {
  const loan = db.data.loans.find((l) => l.id === loanId)
  if (!loan) return null
  loan.returnDate = returnDate
  loan.lateFee = lateFee
  loan.status = 'returned'
  await db.write()
  return loan
}

export async function getReaderLoans(readerId: string): Promise<Loan[]> {
  return db.data.loans.filter((l) => l.readerId === readerId && l.status !== 'returned')
}

export async function getReaderHistory(readerId: string): Promise<Loan[]> {
  return db.data.loans.filter((l) => l.readerId === readerId)
}

export async function getAllLoans(): Promise<Loan[]> {
  return db.data.loans
}

export async function updateLoanFee(loanId: string, fee: number): Promise<Loan | null> {
  const loan = db.data.loans.find((l) => l.id === loanId)
  if (!loan) return null
  loan.lateFee = fee
  await db.write()
  return loan
}

export async function createNotification(notification: Omit<Notification, 'id'>): Promise<Notification> {
  const newNotification: Notification = { ...notification, id: uuidv4() }
  db.data.notifications.push(newNotification)
  await db.write()
  return newNotification
}

export async function getNotifications(since?: string): Promise<Notification[]> {
  if (since) {
    return db.data.notifications.filter((n) => n.sentAt >= since)
  }
  return db.data.notifications
}

export async function markNotificationRead(id: string): Promise<Notification | null> {
  const notification = db.data.notifications.find((n) => n.id === id)
  if (!notification) return null
  notification.isRead = true
  await db.write()
  return notification
}

export async function getConfig() {
  return db.data.config
}
