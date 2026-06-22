import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  completed: boolean
  createdAt: string
}

interface Habit {
  id: string
  name: string
  icon: string
  createdAt: string
}

interface HabitCheck {
  id: string
  habitId: string
  date: string
}

interface TimerSession {
  id: string
  duration: number
  startedAt: string
  completedAt: string
  type: 'focus' | 'shortBreak' | 'longBreak'
}

interface Settings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  dailyGoal: number
}

interface Database {
  tasks: Task[]
  habits: Habit[]
  habitChecks: HabitCheck[]
  timerSessions: TimerSession[]
  settings: Settings
}

const defaultData: Database = {
  tasks: [
    {
      id: uuidv4(),
      title: '完成项目需求文档',
      priority: 'high',
      dueDate: new Date().toISOString().split('T')[0],
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: '代码审查',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: '整理工作笔记',
      priority: 'low',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      completed: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  habits: [
    { id: uuidv4(), name: '晨跑', icon: 'dumbbell', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '阅读', icon: 'book-open', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '冥想', icon: 'brain', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '喝水', icon: 'droplets', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '早睡', icon: 'moon', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: '记账', icon: 'wallet', createdAt: new Date().toISOString() },
  ],
  habitChecks: [],
  timerSessions: [],
  settings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    dailyGoal: 8,
  },
}

const dbFile = path.join(__dirname, 'db.json')
const adapter = new JSONFile<Database>(dbFile)
const db = new Low(adapter, defaultData)
await db.read()
await db.write()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.get('/api/bootstrap', async (_req: Request, res: Response) => {
  await db.read()
  const today = new Date().toISOString().split('T')[0]
  const habitIds = db.data.habits.map((h) => h.id)
  const checkedSet = new Set(
    db.data.habitChecks
      .filter((c) => c.date === today && habitIds.includes(c.habitId))
      .map((c) => c.habitId),
  )
  const habitsWithCheck = db.data.habits.map((h) => ({
    ...h,
    completedDates: db.data.habitChecks
      .filter((c) => c.habitId === h.id)
      .map((c) => c.date),
  }))
  res.json({
    tasks: db.data.tasks,
    habits: habitsWithCheck,
    timerSessions: db.data.timerSessions,
    settings: db.data.settings,
    checkedToday: Array.from(checkedSet),
  })
})

app.get('/api/tasks', async (_req: Request, res: Response) => {
  await db.read()
  res.json(db.data.tasks)
})

app.post('/api/tasks', async (req: Request, res: Response) => {
  await db.read()
  const { title, priority, dueDate } = req.body
  const task: Task = {
    id: uuidv4(),
    title,
    priority: priority || 'medium',
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString(),
  }
  db.data.tasks.unshift(task)
  await db.write()
  res.status(201).json(task)
})

app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  await db.read()
  const { id } = req.params
  const idx = db.data.tasks.findIndex((t) => t.id === id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Task not found' })
    return
  }
  db.data.tasks[idx] = { ...db.data.tasks[idx], ...req.body }
  await db.write()
  res.json(db.data.tasks[idx])
})

app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  await db.read()
  const { id } = req.params
  const before = db.data.tasks.length
  db.data.tasks = db.data.tasks.filter((t) => t.id !== id)
  if (db.data.tasks.length === before) {
    res.status(404).json({ success: false, error: 'Task not found' })
    return
  }
  await db.write()
  res.json({ success: true })
})

app.get('/api/habits', async (_req: Request, res: Response) => {
  await db.read()
  const habits = db.data.habits.map((h) => ({
    ...h,
    completedDates: db.data.habitChecks
      .filter((c) => c.habitId === h.id)
      .map((c) => c.date),
  }))
  res.json(habits)
})

app.post('/api/habits', async (req: Request, res: Response) => {
  await db.read()
  const { name, icon } = req.body
  const habit: Habit = {
    id: uuidv4(),
    name,
    icon: icon || 'star',
    createdAt: new Date().toISOString(),
  }
  db.data.habits.push(habit)
  await db.write()
  res.status(201).json({ ...habit, completedDates: [] })
})

app.put('/api/habits/:id', async (req: Request, res: Response) => {
  await db.read()
  const { id } = req.params
  const idx = db.data.habits.findIndex((h) => h.id === id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Habit not found' })
    return
  }
  db.data.habits[idx] = { ...db.data.habits[idx], ...req.body }
  await db.write()
  const completedDates = db.data.habitChecks
    .filter((c) => c.habitId === id)
    .map((c) => c.date)
  res.json({ ...db.data.habits[idx], completedDates })
})

app.delete('/api/habits/:id', async (req: Request, res: Response) => {
  await db.read()
  const { id } = req.params
  const before = db.data.habits.length
  db.data.habits = db.data.habits.filter((h) => h.id !== id)
  db.data.habitChecks = db.data.habitChecks.filter((c) => c.habitId !== id)
  if (db.data.habits.length === before) {
    res.status(404).json({ success: false, error: 'Habit not found' })
    return
  }
  await db.write()
  res.json({ success: true })
})

app.post('/api/habits/:id/check', async (req: Request, res: Response) => {
  await db.read()
  const { id } = req.params
  const { date, checked } = req.body
  const targetDate = date || new Date().toISOString().split('T')[0]
  const habit = db.data.habits.find((h) => h.id === id)
  if (!habit) {
    res.status(404).json({ success: false, error: 'Habit not found' })
    return
  }
  const existing = db.data.habitChecks.find(
    (c) => c.habitId === id && c.date === targetDate,
  )
  const shouldCheck = checked === undefined ? !existing : Boolean(checked)
  if (shouldCheck && !existing) {
    db.data.habitChecks.push({
      id: uuidv4(),
      habitId: id,
      date: targetDate,
    })
  } else if (!shouldCheck && existing) {
    db.data.habitChecks = db.data.habitChecks.filter((c) => c.id !== existing.id)
  }
  await db.write()
  const completedDates = db.data.habitChecks
    .filter((c) => c.habitId === id)
    .map((c) => c.date)
  res.json({ success: true, habit: { ...habit, completedDates } })
})

app.get('/api/timer-sessions', async (_req: Request, res: Response) => {
  await db.read()
  res.json(db.data.timerSessions)
})

app.get('/api/timer-sessions/range', async (req: Request, res: Response) => {
  await db.read()
  const { start, end } = req.query as { start?: string; end?: string }
  let sessions = db.data.timerSessions
  if (start) sessions = sessions.filter((s) => s.completedAt >= start)
  if (end) sessions = sessions.filter((s) => s.completedAt <= end)
  res.json(sessions)
})

app.post('/api/timer-sessions', async (req: Request, res: Response) => {
  await db.read()
  const { duration, startedAt, completedAt, type } = req.body
  const session: TimerSession = {
    id: uuidv4(),
    duration: Number(duration) || 0,
    startedAt: startedAt || new Date().toISOString(),
    completedAt: completedAt || new Date().toISOString(),
    type: type || 'focus',
  }
  db.data.timerSessions.push(session)
  await db.write()
  res.status(201).json(session)
})

app.get('/api/settings', async (_req: Request, res: Response) => {
  await db.read()
  res.json(db.data.settings)
})

app.put('/api/settings', async (req: Request, res: Response) => {
  await db.read()
  db.data.settings = { ...db.data.settings, ...req.body }
  await db.write()
  res.json(db.data.settings)
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`)
  })
}

export default app
