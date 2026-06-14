import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import type { DatabaseSchema, Book, Reader, LibraryConfig } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.resolve(__dirname, '../../data')
const dbFile = path.join(dataDir, 'db.json')

const defaultBooks: Book[] = [
  {
    id: uuidv4(),
    title: 'JavaScript高级程序设计',
    author: 'Nicholas C. Zakas',
    isbn: '9787115545687',
    category: '计算机',
    description: '本书是JavaScript超级畅销书的最新版，从变量、数据类型、函数、对象、操作符、面向对象、DOM、BOM、事件、动画、Canvas、SVG、WebGL、Web Workers、服务端JavaScript、JSON、正则表达式、错误等',
    coverImage: '',
    totalCopies: 5,
    availableCopies: 5,
    location: 'A区-3架-3层',
    publishedYear: 2020,
    publisher: '人民邮电出版社',
    pages: 960,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '深入理解计算机系统',
    author: 'Randal E. Bryant',
    isbn: '9787111544937',
    category: '计算机',
    description: '本书从程序员的视角详细阐述计算机系统的本质概念，涵盖计算机系统的基础概念，帮助读者理解程序是如何在计算机系统上运行的。',
    coverImage: '',
    totalCopies: 3,
    availableCopies: 3,
    location: 'A区-2架-1层',
    publishedYear: 2016,
    publisher: '机械工业出版社',
    pages: 735,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    isbn: '9787544253994',
    category: '文学',
    description: '《百年孤独》是魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰。',
    coverImage: '',
    totalCopies: 8,
    availableCopies: 8,
    location: 'B区-1架-2层',
    publishedYear: 2011,
    publisher: '南海出版公司',
    pages: 360,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '三体',
    author: '刘慈欣',
    isbn: '9787536692930',
    category: '科幻',
    description: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划“红岸工程”取得了突破性进展。',
    coverImage: '',
    totalCopies: 10,
    availableCopies: 10,
    location: 'B区-3架-1层',
    publishedYear: 2008,
    publisher: '重庆出版社',
    pages: 302,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    isbn: '9787508647357',
    category: '历史',
    description: '从十万年前有生命迹象开始到21世纪资本、科技交织的人类发展史。',
    coverImage: '',
    totalCopies: 6,
    availableCopies: 6,
    location: 'C区-1架-3层',
    publishedYear: 2014,
    publisher: '中信出版社',
    pages: 440,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const getDefaultAdmin = async (): Promise<Reader> => {
  const hashedPassword = bcrypt.hashSync('admin123', 10)
  return {
    id: uuidv4(),
    name: '管理员',
    email: 'admin@library.com',
    password: hashedPassword,
    phone: '13800138000',
    avatar: '',
    address: '图书馆管理员办公室',
    role: 'admin',
    status: 'active',
    borrowedCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

const defaultConfig: LibraryConfig = {
  maxBooksPerReader: 5,
  loanPeriodDays: 14,
  overdueFinePerDay: 0.5,
  maxRenewCount: 2,
  libraryName: '社区图书馆',
  libraryAddress: 'XX市XX区XX路100号',
  libraryPhone: '010-12345678',
  openingHours: '周一至周日 08:00-20:00',
}

const getDefaultData = async (): Promise<DatabaseSchema> => {
  const admin = await getDefaultAdmin()
  return {
    books: defaultBooks,
    readers: [admin],
    loans: [],
    notifications: [],
    config: defaultConfig,
  }
}

let db: Low<DatabaseSchema>

export const initDatabase = async (): Promise<Low<DatabaseSchema>> => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const adapter = new JSONFile<DatabaseSchema>(dbFile)
  db = new Low(adapter)

  await db.read()

  if (!db.data) {
    const defaultData = await getDefaultData()
    db.data = defaultData
    await db.write()
    console.log('Database initialized with default data')
  } else {
    console.log('Database loaded from file')
  }

  return db
}

export const getDatabase = (): Low<DatabaseSchema> => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.')
  }
  return db
}

export default db
