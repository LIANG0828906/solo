import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '..', 'data', 'workflow.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    project TEXT NOT NULL,
    hours REAL NOT NULL CHECK(hours >= 0.5 AND hours <= 24),
    note TEXT DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leaves (
    id TEXT PRIMARY KEY,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('年假', '病假', '事假')),
    reason TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT '待审批' CHECK(status IN ('待审批', '已通过', '已拒绝')),
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
  CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
`)

export interface Record {
  id: string
  date: string
  project: string
  hours: number
  note: string
  createdAt: string
}

export interface Leave {
  id: string
  startDate: string
  endDate: string
  type: '年假' | '病假' | '事假'
  reason: string
  status: '待审批' | '已通过' | '已拒绝'
  createdAt: string
}

export function getRecords(days: number = 30): Record[] {
  const stmt = db.prepare(`
    SELECT * FROM records
    WHERE date >= date('now', '-' || ? || ' days')
    ORDER BY date DESC
  `)
  return stmt.all(days) as Record[]
}

export function createRecord(data: Omit<Record, 'id' | 'createdAt'>): Record {
  const id = uuidv4()
  const stmt = db.prepare(`
    INSERT INTO records (id, date, project, hours, note)
    VALUES (?, ?, ?, ?, ?)
  `)
  stmt.run(id, data.date, data.project, data.hours, data.note)
  return { id, ...data, createdAt: new Date().toISOString() }
}

export function updateRecord(id: string, data: Partial<Omit<Record, 'id' | 'createdAt'>>): Record | null {
  const fields: string[] = []
  const values: unknown[] = []
  if (data.project !== undefined) { fields.push('project = ?'); values.push(data.project) }
  if (data.hours !== undefined) { fields.push('hours = ?'); values.push(data.hours) }
  if (data.note !== undefined) { fields.push('note = ?'); values.push(data.note) }
  if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date) }
  if (fields.length === 0) return null
  values.push(id)
  db.prepare(`UPDATE records SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  const row = db.prepare('SELECT * FROM records WHERE id = ?').get(id) as Record | undefined
  return row ?? null
}

export function deleteRecord(id: string): boolean {
  const result = db.prepare('DELETE FROM records WHERE id = ?').run(id)
  return result.changes > 0
}

export function getLeaves(status?: string): Leave[] {
  if (status) {
    const stmt = db.prepare('SELECT * FROM leaves WHERE status = ? ORDER BY createdAt DESC')
    return stmt.all(status) as Leave[]
  }
  const stmt = db.prepare('SELECT * FROM leaves ORDER BY createdAt DESC')
  return stmt.all() as Leave[]
}

export function createLeave(data: Omit<Leave, 'id' | 'createdAt' | 'status'>): Leave {
  const id = uuidv4()
  const stmt = db.prepare(`
    INSERT INTO leaves (id, startDate, endDate, type, reason, status)
    VALUES (?, ?, ?, ?, ?, '待审批')
  `)
  stmt.run(id, data.startDate, data.endDate, data.type, data.reason)
  return { id, ...data, status: '待审批', createdAt: new Date().toISOString() }
}

export function updateLeaveStatus(id: string, status: '已通过' | '已拒绝'): Leave | null {
  db.prepare('UPDATE leaves SET status = ? WHERE id = ?').run(status, id)
  const row = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id) as Leave | undefined
  return row ?? null
}

export interface DailyHours {
  date: string
  hours: number
}

export interface Summary {
  totalHours: number
  avgDailyHours: number
  attendanceDays: number
  leaveDays: number
  dailyHours: DailyHours[]
  periodLabel: string
}

export function getSummary(period: 'week' | 'month' = 'week'): Summary {
  const now = new Date()
  let startDate: Date
  let periodLabel: string

  if (period === 'week') {
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate = new Date(now)
    startDate.setDate(now.getDate() - diff)
    startDate.setHours(0, 0, 0, 0)
    const weekNum = Math.ceil((startDate.getDate()) / 7)
    periodLabel = `${startDate.getFullYear()}年${startDate.getMonth() + 1}月第${weekNum}周`
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    periodLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`
  }

  const startStr = startDate.toISOString().split('T')[0]
  const endStr = now.toISOString().split('T')[0]

  const records = db.prepare(`
    SELECT date, SUM(hours) as hours FROM records
    WHERE date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date
  `).all(startStr, endStr) as DailyHours[]

  const totalHours = records.reduce((sum, r) => sum + r.hours, 0)
  const attendanceDays = records.length

  const leaves = db.prepare(`
    SELECT * FROM leaves
    WHERE status = '已通过'
    AND startDate <= ? AND endDate >= ?
  `).all(endStr, startStr) as Leave[]

  let leaveDays = 0
  for (const leave of leaves) {
    const ls = new Date(Math.max(new Date(leave.startDate).getTime(), startDate.getTime()))
    const le = new Date(Math.min(new Date(leave.endDate).getTime(), now.getTime()))
    leaveDays += Math.ceil((le.getTime() - ls.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const avgDailyHours = daysDiff > 0 ? Math.round((totalHours / daysDiff) * 100) / 100 : 0

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    avgDailyHours,
    attendanceDays,
    leaveDays,
    dailyHours: records,
    periodLabel,
  }
}

export default db
