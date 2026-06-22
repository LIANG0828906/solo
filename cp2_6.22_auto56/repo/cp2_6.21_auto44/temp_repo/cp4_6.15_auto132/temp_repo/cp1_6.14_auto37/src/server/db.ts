import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface User {
  id: string
  username: string
  password: string
  createdAt: string
}

export interface Capsule {
  id: string
  userId: string
  type: 'text' | 'image'
  content: string
  imageUrl?: string
  openDate: string
  createdAt: string
  isOpened: boolean
  openedAt?: string
  isDrifted: boolean
  driftedAt?: string
  drifts: string[]
}

export interface Drift {
  id: string
  capsuleId: string
  fromUserId: string
  toUserId: string
  createdAt: string
  reply?: string
  replyAt?: string
  replyVisibleAt?: string
}

export interface DailyStat {
  date: string
  openedCount: number
  driftedCount: number
}

export interface Database {
  users: User[]
  capsules: Capsule[]
  drifts: Drift[]
  dailyStats: DailyStat[]
}

const defaultData: Database = {
  users: [],
  capsules: [],
  drifts: [],
  dailyStats: [],
}

const dbPath = path.join(__dirname, '..', '..', 'data', 'db.json')

const adapter = new JSONFile<Database>(dbPath)
export const db = new Low<Database>(adapter, defaultData)

export async function initDb() {
  await db.read()
  if (!db.data) {
    db.data = defaultData
  }
  if (!db.data.users) db.data.users = []
  if (!db.data.capsules) db.data.capsules = []
  if (!db.data.drifts) db.data.drifts = []
  if (!db.data.dailyStats) db.data.dailyStats = []
  await db.write()
}

export function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
