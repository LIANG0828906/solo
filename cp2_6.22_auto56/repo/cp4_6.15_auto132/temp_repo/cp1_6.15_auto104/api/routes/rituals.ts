import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

interface Ritual {
  id: string
  name: string
  type: 'morning' | 'evening'
  isPreset: boolean
}

interface CheckIn {
  id: string
  userId: string
  ritualId: string
  ritualName: string
  ritualType: 'morning' | 'evening'
  date: string
  time: string
  createdAt: string
}

interface User {
  id: string
  createdAt: string
}

const users = new Map<string, User>()
const rituals = new Map<string, Ritual>()
const checkins = new Map<string, CheckIn>()

function initPresets() {
  const morningPresets = ['冥想5分钟', '喝一杯温水', '晨间日记', '感恩练习']
  const eveningPresets = ['冥想5分钟', '写感恩日记', '回顾今日', '读书15分钟']

  for (const name of morningPresets) {
    const id = uuidv4()
    rituals.set(id, { id, name, type: 'morning', isPreset: true })
  }
  for (const name of eveningPresets) {
    const id = uuidv4()
    rituals.set(id, { id, name, type: 'evening', isPreset: true })
  }
}

initPresets()

const router = Router()

router.post('/users', (req: Request, res: Response): void => {
  const id = uuidv4()
  const user: User = { id, createdAt: new Date().toISOString() }
  users.set(id, user)
  res.status(201).json({ success: true, data: user })
})

router.get('/users/:userId', (req: Request, res: Response): void => {
  const user = users.get(req.params.userId)
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' })
    return
  }
  res.json({ success: true, data: user })
})

router.get('/rituals/:type', (req: Request, res: Response): void => {
  const type = req.params.type as 'morning' | 'evening'
  if (type !== 'morning' && type !== 'evening') {
    res.status(400).json({ success: false, error: 'Invalid type, must be morning or evening' })
    return
  }
  const result = [...rituals.values()].filter(r => r.type === type)
  res.json({ success: true, data: result })
})

router.post('/rituals', (req: Request, res: Response): void => {
  const { name, type } = req.body as { name?: string; type?: string }
  if (!name || !type) {
    res.status(400).json({ success: false, error: 'name and type are required' })
    return
  }
  if (type !== 'morning' && type !== 'evening') {
    res.status(400).json({ success: false, error: 'type must be morning or evening' })
    return
  }
  const id = uuidv4()
  const ritual: Ritual = { id, name, type, isPreset: false }
  rituals.set(id, ritual)
  res.status(201).json({ success: true, data: ritual })
})

router.post('/checkins', (req: Request, res: Response): void => {
  const { userId, ritualId, ritualName, ritualType } = req.body as {
    userId?: string
    ritualId?: string
    ritualName?: string
    ritualType?: string
  }
  if (!userId || !ritualId || !ritualName || !ritualType) {
    res.status(400).json({ success: false, error: 'userId, ritualId, ritualName, ritualType are required' })
    return
  }
  if (ritualType !== 'morning' && ritualType !== 'evening') {
    res.status(400).json({ success: false, error: 'ritualType must be morning or evening' })
    return
  }
  const now = new Date()
  const id = uuidv4()
  const checkin: CheckIn = {
    id,
    userId,
    ritualId,
    ritualName,
    ritualType,
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 8),
    createdAt: now.toISOString(),
  }
  checkins.set(id, checkin)
  res.status(201).json({ success: true, data: checkin })
})

router.get('/checkins/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params
  const { month, page, limit } = req.query as { month?: string; page?: string; limit?: string }

  let userCheckins = [...checkins.values()]
    .filter(c => c.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (month) {
    userCheckins = userCheckins.filter(c => c.date.startsWith(month))
  }

  const pageNum = Math.max(1, parseInt(page || '1', 10))
  const limitNum = Math.max(1, parseInt(limit || '50', 10))
  const total = userCheckins.length
  const start = (pageNum - 1) * limitNum
  const data = userCheckins.slice(start, start + limitNum)

  res.json({
    success: true,
    data,
    pagination: { page: pageNum, limit: limitNum, total },
  })
})

router.get('/checkins/:userId/streak', (req: Request, res: Response): void => {
  const { userId } = req.params
  const userCheckins = [...checkins.values()].filter(c => c.userId === userId)

  const datesWithCheckins = new Set(userCheckins.map(c => c.date))
  if (datesWithCheckins.size === 0) {
    res.json({ success: true, data: { currentStreak: 0, longestStreak: 0 } })
    return
  }

  const sortedDates = [...datesWithCheckins].sort()

  let longestStreak = 1
  let streak = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1])
    const curr = new Date(sortedDates[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      streak++
      longestStreak = Math.max(longestStreak, streak)
    } else {
      streak = 1
    }
  }
  longestStreak = Math.max(longestStreak, streak)

  let currentStreak = 0
  const today = new Date().toISOString().slice(0, 10)
  const checkDate = new Date(today)
  if (!datesWithCheckins.has(today)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }
  const checkStr = checkDate.toISOString().slice(0, 10)
  if (!datesWithCheckins.has(checkStr)) {
    res.json({ success: true, data: { currentStreak: 0, longestStreak } })
    return
  }
  currentStreak = 1
  let d = new Date(checkDate)
  while (true) {
    d.setDate(d.getDate() - 1)
    const ds = d.toISOString().slice(0, 10)
    if (datesWithCheckins.has(ds)) {
      currentStreak++
    } else {
      break
    }
  }

  res.json({ success: true, data: { currentStreak, longestStreak } })
})

router.get('/checkins/:userId/calendar/:year/:month', (req: Request, res: Response): void => {
  const { userId, year, month } = req.params
  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    res.status(400).json({ success: false, error: 'Invalid year or month' })
    return
  }

  const prefix = `${yearNum}-${String(monthNum).padStart(2, '0')}`
  const userCheckins = [...checkins.values()].filter(
    c => c.userId === userId && c.date.startsWith(prefix),
  )

  const counts = new Map<string, number>()
  for (const c of userCheckins) {
    counts.set(c.date, (counts.get(c.date) || 0) + 1)
  }

  const data = [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  res.json({ success: true, data })
})

router.delete('/checkins/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  if (!checkins.has(id)) {
    res.status(404).json({ success: false, error: 'Check-in not found' })
    return
  }
  checkins.delete(id)
  res.json({ success: true, data: null })
})

export default router
