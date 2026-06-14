import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface User {
  id: string
  email: string
  password: string
  nickname: string
  city: string
  creditScore: number
  createdAt: string
  avatar?: string
}

interface Item {
  id: string
  title: string
  description: string
  category: string
  condition: string
  images: string[]
  ownerId: string
  status: 'available' | 'exchanging' | 'exchanged'
  createdAt: string
  city: string
}

interface Exchange {
  id: string
  itemId: string
  requesterId: string
  ownerId: string
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  createdAt: string
  updatedAt: string
  requesterRating?: number
  requesterComment?: string
  ownerRating?: number
  ownerComment?: string
}

interface Notification {
  id: string
  userId: string
  type: 'new_request' | 'request_accepted' | 'request_rejected' | 'exchange_completed'
  title: string
  content: string
  relatedId: string
  read: boolean
  createdAt: string
}

interface Data {
  users: User[]
  items: Item[]
  exchanges: Exchange[]
  notifications: Notification[]
}

const dbDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const file = path.join(dbDir, 'db.json')
const adapter = new JSONFile<Data>(file)
const defaultData: Data = {
  users: [],
  items: [],
  exchanges: [],
  notifications: [],
}

const db = new Low<Data>(adapter, defaultData)

export const initDB = async () => {
  await db.read()
  if (db.data === null || db.data === undefined) {
    db.data = defaultData
  }
  if (!db.data.users) db.data.users = []
  if (!db.data.items) db.data.items = []
  if (!db.data.exchanges) db.data.exchanges = []
  if (!db.data.notifications) db.data.notifications = []
  await db.write()
}

export { db }
export type { User, Item, Exchange, Notification }
