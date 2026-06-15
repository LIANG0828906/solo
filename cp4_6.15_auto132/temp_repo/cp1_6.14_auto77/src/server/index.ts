import express, { Request, Response } from 'express'
import cors from 'cors'
import { Low } from 'lowdb/core'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import type { Wedding, Todo, TimelineItem, Guest, Activity, Invitation, InvitationTheme } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface DataSchema {
  wedding: Wedding | null
  todos: Todo[]
  timeline: TimelineItem[]
  guests: Guest[]
  activities: Activity[]
  invitation: Invitation | null
}

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function createDefaultData(): DataSchema {
  const now = new Date().toISOString()
  const weddingDate = addDays(new Date(), 30).toISOString()

  const wedding: Wedding = {
    id: uuidv4(),
    brideName: '林小雅',
    groomName: '陈子豪',
    weddingDate,
    venue: '上海外滩源壹号·金色大厅',
    createdAt: now,
    invitationTheme: 'classic',
    invitationMessage: '诚挚邀请您见证我们人生中最幸福的时刻，与我们共同分享这份喜悦与感动。'
  }

  const todos: Todo[] = [
    { id: uuidv4(), title: '确定场地', completed: true, createdAt: now, completedAt: now, assigneeName: '陈子豪' },
    { id: uuidv4(), title: '发送请柬', completed: false, createdAt: now, assigneeName: '林小雅' },
    { id: uuidv4(), title: '采购物品', completed: false, createdAt: now, assigneeName: '林小雅' },
    { id: uuidv4(), title: '选婚纱礼服', completed: false, createdAt: now, assigneeName: '林小雅' },
    { id: uuidv4(), title: '预订婚车', completed: false, createdAt: now, assigneeName: '陈子豪' },
    { id: uuidv4(), title: '试妆', completed: false, createdAt: now, assigneeName: '林小雅' },
    { id: uuidv4(), title: '确定伴郎伴娘名单', completed: false, createdAt: now, assigneeName: '陈子豪' },
    { id: uuidv4(), title: '预订蜜月旅行', completed: false, createdAt: now, assigneeName: '陈子豪' },
    { id: uuidv4(), title: '购买婚戒', completed: false, createdAt: now, assigneeName: '陈子豪' },
    { id: uuidv4(), title: '彩排走场', completed: false, createdAt: now, assigneeName: '林小雅' }
  ]

  const timeline: TimelineItem[] = [
    { id: uuidv4(), title: '新娘入场', time: '10:00', duration: 15, personInCharge: '婚礼策划师', notes: '音乐响起，新娘由父亲陪同入场', icon: '👰', color: '#ec4899', order: 1 },
    { id: uuidv4(), title: '誓言交换', time: '10:30', duration: 15, personInCharge: '主持人', notes: '新人面对面，宣读爱的誓言', icon: '💍', color: '#8b5cf6', order: 2 },
    { id: uuidv4(), title: '戴戒指', time: '10:45', duration: 10, personInCharge: '伴郎伴娘', notes: '交换戒指，象征永恒的爱', icon: '💎', color: '#3b82f6', order: 3 },
    { id: uuidv4(), title: '证婚人致辞', time: '11:00', duration: 15, personInCharge: '证婚人', notes: '邀请长辈上台致辞', icon: '📜', color: '#06b6d4', order: 4 },
    { id: uuidv4(), title: '交换戒指', time: '11:10', duration: 10, personInCharge: '主持人', notes: '新人再次展示戒指', icon: '💫', color: '#10b981', order: 5 },
    { id: uuidv4(), title: '拥吻', time: '11:15', duration: 5, personInCharge: '新人', notes: '全场倒数，浪漫拥吻', icon: '💋', color: '#ef4444', order: 6 },
    { id: uuidv4(), title: '敬茶', time: '11:30', duration: 20, personInCharge: '双方父母', notes: '向双方父母敬茶，改口', icon: '🍵', color: '#f59e0b', order: 7 },
    { id: uuidv4(), title: '抛捧花', time: '11:45', duration: 10, personInCharge: '未婚女宾', notes: '新娘抛出捧花', icon: '💐', color: '#f43f5e', order: 8 },
    { id: uuidv4(), title: '切蛋糕', time: '12:00', duration: 10, personInCharge: '新人', notes: '新人共切婚礼蛋糕', icon: '🎂', color: '#d946ef', order: 9 }
  ]

  const guests: Guest[] = [
    { id: uuidv4(), name: '张三', phone: '13800138001', companions: 2, rsvp: 'pending', addedBy: 'system', addedByName: '系统', createdAt: now },
    { id: uuidv4(), name: '李四', phone: '13800138002', companions: 1, rsvp: 'confirmed', tableNumber: 1, seatNumber: 5, addedBy: 'system', addedByName: '系统', createdAt: now },
    { id: uuidv4(), name: '王五', phone: '13800138003', companions: 3, rsvp: 'confirmed', tableNumber: 2, seatNumber: 3, addedBy: 'system', addedByName: '系统', createdAt: now },
    { id: uuidv4(), name: '赵六', phone: '13800138004', companions: 0, rsvp: 'declined', addedBy: 'system', addedByName: '系统', createdAt: now },
    { id: uuidv4(), name: '孙七', phone: '13800138005', companions: 2, rsvp: 'confirmed', tableNumber: 1, seatNumber: 2, addedBy: 'system', addedByName: '系统', createdAt: now },
    { id: uuidv4(), name: '周八', phone: '13800138006', companions: 1, rsvp: 'pending', addedBy: 'system', addedByName: '系统', createdAt: now },
    { id: uuidv4(), name: '吴九', phone: '13800138007', companions: 4, rsvp: 'confirmed', tableNumber: 3, seatNumber: 1, addedBy: 'system', addedByName: '系统', createdAt: now },
    { id: uuidv4(), name: '郑十', phone: '13800138008', companions: 2, rsvp: 'pending', addedBy: 'system', addedByName: '系统', createdAt: now },
    { id: uuidv4(), name: '钱十一', phone: '13800138009', companions: 1, rsvp: 'declined', addedBy: 'system', addedByName: '系统', createdAt: now },
    { id: uuidv4(), name: '冯十二', phone: '13800138010', companions: 2, rsvp: 'confirmed', tableNumber: 2, seatNumber: 6, addedBy: 'system', addedByName: '系统', createdAt: now }
  ]

  const activities: Activity[] = [
    { id: uuidv4(), userId: 'user-1', userName: '林小雅', userRole: 'bride', action: '创建婚礼', detail: '创建了婚礼项目 "林小雅 & 陈子豪的婚礼"', timestamp: now, color: '#ec4899' },
    { id: uuidv4(), userId: 'user-2', userName: '陈子豪', userRole: 'groom', action: '完成任务', detail: '完成了待办事项 "确定场地"', timestamp: new Date(Date.now() - 3600000).toISOString(), color: '#3b82f6' },
    { id: uuidv4(), userId: 'user-1', userName: '林小雅', userRole: 'bride', action: '添加宾客', detail: '添加了10位宾客到宾客名单', timestamp: new Date(Date.now() - 7200000).toISOString(), color: '#10b981' },
    { id: uuidv4(), userId: 'user-1', userName: '林小雅', userRole: 'bride', action: '规划时间线', detail: '创建了9个婚礼流程环节', timestamp: new Date(Date.now() - 10800000).toISOString(), color: '#8b5cf6' },
    { id: uuidv4(), userId: 'user-2', userName: '陈子豪', userRole: 'groom', action: '添加待办', detail: '添加了10条婚礼筹备待办事项', timestamp: new Date(Date.now() - 14400000).toISOString(), color: '#f59e0b' },
    { id: uuidv4(), userId: 'user-1', userName: '林小雅', userRole: 'bride', action: '确认主题', detail: '选择了请柬主题 "classic 经典风"', timestamp: new Date(Date.now() - 18000000).toISOString(), color: '#ef4444' },
    { id: uuidv4(), userId: 'user-2', userName: '陈子豪', userRole: 'groom', action: '更新信息', detail: '更新了婚礼场地为 "上海外滩源壹号·金色大厅"', timestamp: new Date(Date.now() - 21600000).toISOString(), color: '#06b6d4' }
  ]

  const invitation: Invitation = {
    id: uuidv4(),
    weddingId: wedding.id,
    theme: 'classic',
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    weddingDate: wedding.weddingDate,
    venue: wedding.venue,
    message: wedding.invitationMessage,
    shareUrl: `https://wedding.example.com/invite/${wedding.id}`
  }

  return {
    wedding,
    todos,
    timeline,
    guests,
    activities,
    invitation
  }
}

const dbPath = path.join(__dirname, '../../data/db.json')
const defaultData = createDefaultData()
const adapter = new JSONFile<DataSchema>(dbPath)
const db = new Low(adapter, defaultData)

async function initDb(): Promise<void> {
  const dataDir = path.dirname(dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  await db.read()
  if (!db.data) {
    db.data = createDefaultData()
  }
  await db.write()
}

await initDb()

app.get('/api/wedding', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    if (!db.data!.wedding) {
      db.data!.wedding = createDefaultData().wedding
      await db.write()
    }
    res.json(db.data!.wedding)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.post('/api/wedding', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const now = new Date().toISOString()
    const wedding: Wedding = {
      id: uuidv4(),
      brideName: req.body.brideName || '',
      groomName: req.body.groomName || '',
      weddingDate: req.body.weddingDate || addDays(new Date(), 30).toISOString(),
      venue: req.body.venue || '',
      createdAt: now,
      invitationTheme: (req.body.invitationTheme as InvitationTheme) || 'classic',
      invitationMessage: req.body.invitationMessage || ''
    }
    db.data!.wedding = wedding
    await db.write()
    res.json(wedding)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.put('/api/wedding', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    if (!db.data!.wedding) {
      db.data!.wedding = createDefaultData().wedding
    }
    db.data!.wedding = {
      ...db.data!.wedding,
      ...req.body,
      id: db.data!.wedding.id,
      createdAt: db.data!.wedding.createdAt
    }
    await db.write()
    res.json(db.data!.wedding)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.get('/api/todos', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    res.json(db.data!.todos)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.post('/api/todos', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const todo: Todo = {
      id: uuidv4(),
      title: req.body.title || '',
      completed: false,
      createdAt: new Date().toISOString(),
      assigneeName: req.body.assigneeName
    }
    db.data!.todos.push(todo)
    await db.write()
    res.json(todo)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.put('/api/todos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const idx = db.data!.todos.findIndex(t => t.id === req.params.id)
    if (idx === -1) {
      res.status(404).json({ error: '待办不存在' })
      return
    }
    const wasCompleted = db.data!.todos[idx].completed
    const isCompleted = req.body.completed
    db.data!.todos[idx] = {
      ...db.data!.todos[idx],
      ...req.body,
      id: db.data!.todos[idx].id,
      completedAt: !wasCompleted && isCompleted ? new Date().toISOString() : (wasCompleted && !isCompleted ? undefined : db.data!.todos[idx].completedAt)
    }
    await db.write()
    res.json(db.data!.todos[idx])
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.delete('/api/todos/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const len = db.data!.todos.length
    db.data!.todos = db.data!.todos.filter(t => t.id !== req.params.id)
    if (db.data!.todos.length === len) {
      res.status(404).json({ error: '待办不存在' })
      return
    }
    await db.write()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.get('/api/timeline', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const sorted = [...db.data!.timeline].sort((a, b) => a.order - b.order)
    res.json(sorted)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.post('/api/timeline', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const maxOrder = db.data!.timeline.reduce((max, item) => Math.max(max, item.order), 0)
    const item: TimelineItem = {
      id: uuidv4(),
      title: req.body.title || '',
      time: req.body.time || '',
      duration: req.body.duration || 10,
      personInCharge: req.body.personInCharge || '',
      notes: req.body.notes || '',
      icon: req.body.icon || '📌',
      color: req.body.color || '#6b7280',
      order: req.body.order ?? (maxOrder + 1)
    }
    db.data!.timeline.push(item)
    await db.write()
    res.json(item)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.put('/api/timeline/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const idx = db.data!.timeline.findIndex(t => t.id === req.params.id)
    if (idx === -1) {
      res.status(404).json({ error: '环节不存在' })
      return
    }
    db.data!.timeline[idx] = {
      ...db.data!.timeline[idx],
      ...req.body,
      id: db.data!.timeline[idx].id
    }
    await db.write()
    res.json(db.data!.timeline[idx])
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.delete('/api/timeline/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const len = db.data!.timeline.length
    db.data!.timeline = db.data!.timeline.filter(t => t.id !== req.params.id)
    if (db.data!.timeline.length === len) {
      res.status(404).json({ error: '环节不存在' })
      return
    }
    await db.write()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.put('/api/timeline/reorder', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const items: Array<{ id: string; order: number }> = req.body.items || []
    for (const update of items) {
      const idx = db.data!.timeline.findIndex(t => t.id === update.id)
      if (idx !== -1) {
        db.data!.timeline[idx].order = update.order
      }
    }
    await db.write()
    const sorted = [...db.data!.timeline].sort((a, b) => a.order - b.order)
    res.json(sorted)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.get('/api/guests', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    res.json(db.data!.guests)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.post('/api/guests', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const guest: Guest = {
      id: uuidv4(),
      name: req.body.name || '',
      phone: req.body.phone || '',
      companions: req.body.companions || 0,
      rsvp: req.body.rsvp || 'pending',
      tableNumber: req.body.tableNumber,
      seatNumber: req.body.seatNumber,
      addedBy: req.body.addedBy || 'system',
      addedByName: req.body.addedByName || '系统',
      createdAt: new Date().toISOString()
    }
    db.data!.guests.push(guest)
    await db.write()
    res.json(guest)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.put('/api/guests/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const idx = db.data!.guests.findIndex(g => g.id === req.params.id)
    if (idx === -1) {
      res.status(404).json({ error: '宾客不存在' })
      return
    }
    db.data!.guests[idx] = {
      ...db.data!.guests[idx],
      ...req.body,
      id: db.data!.guests[idx].id,
      createdAt: db.data!.guests[idx].createdAt
    }
    await db.write()
    res.json(db.data!.guests[idx])
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.delete('/api/guests/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const len = db.data!.guests.length
    db.data!.guests = db.data!.guests.filter(g => g.id !== req.params.id)
    if (db.data!.guests.length === len) {
      res.status(404).json({ error: '宾客不存在' })
      return
    }
    await db.write()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.get('/api/activities', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const sorted = [...db.data!.activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    res.json(sorted)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.post('/api/activities', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const activity: Activity = {
      id: uuidv4(),
      userId: req.body.userId || 'unknown',
      userName: req.body.userName || '未知用户',
      userRole: req.body.userRole || 'guest',
      action: req.body.action || '',
      detail: req.body.detail || '',
      timestamp: new Date().toISOString(),
      color: req.body.color || '#6b7280'
    }
    db.data!.activities.push(activity)
    await db.write()
    res.json(activity)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.get('/api/invitation', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    if (!db.data!.invitation && db.data!.wedding) {
      db.data!.invitation = {
        id: uuidv4(),
        weddingId: db.data!.wedding.id,
        theme: db.data!.wedding.invitationTheme,
        brideName: db.data!.wedding.brideName,
        groomName: db.data!.wedding.groomName,
        weddingDate: db.data!.wedding.weddingDate,
        venue: db.data!.wedding.venue,
        message: db.data!.wedding.invitationMessage,
        shareUrl: `https://wedding.example.com/invite/${db.data!.wedding.id}`
      }
      await db.write()
    }
    res.json(db.data!.invitation)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.put('/api/invitation', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    if (!db.data!.invitation) {
      if (db.data!.wedding) {
        db.data!.invitation = {
          id: uuidv4(),
          weddingId: db.data!.wedding.id,
          theme: db.data!.wedding.invitationTheme,
          brideName: db.data!.wedding.brideName,
          groomName: db.data!.wedding.groomName,
          weddingDate: db.data!.wedding.weddingDate,
          venue: db.data!.wedding.venue,
          message: db.data!.wedding.invitationMessage,
          shareUrl: `https://wedding.example.com/invite/${db.data!.wedding.id}`
        }
      } else {
        res.status(404).json({ error: '请柬不存在，请先生成' })
        return
      }
    }
    db.data!.invitation = {
      ...db.data!.invitation,
      ...req.body,
      id: db.data!.invitation.id,
      weddingId: db.data!.invitation.weddingId
    }
    await db.write()
    res.json(db.data!.invitation)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.post('/api/invitation/generate', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    if (!db.data!.wedding) {
      res.status(404).json({ error: '婚礼信息不存在，请先创建婚礼' })
      return
    }
    const invitation: Invitation = {
      id: uuidv4(),
      weddingId: db.data!.wedding.id,
      theme: db.data!.wedding.invitationTheme,
      brideName: db.data!.wedding.brideName,
      groomName: db.data!.wedding.groomName,
      weddingDate: db.data!.wedding.weddingDate,
      venue: db.data!.wedding.venue,
      message: db.data!.wedding.invitationMessage,
      shareUrl: `https://wedding.example.com/invite/${db.data!.wedding.id}`
    }
    db.data!.invitation = invitation
    await db.write()
    res.json(invitation)
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.listen(PORT, () => {
  console.log(`婚礼策划服务器已启动: http://localhost:${PORT}`)
  console.log(`数据库路径: ${dbPath}`)
})
