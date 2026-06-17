import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

interface Station {
  id: string
  name: string
  row: number
  col: number
  status: 'available' | 'reserved' | 'occupied'
  reservedBy?: string
  startTime?: string
  endTime?: string
}

interface Message {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: string
  type: 'chat' | 'system'
}

interface User {
  id: string
  name: string
}

const users: User[] = [
  { id: 'u1', name: '张三' },
  { id: 'u2', name: '李四' },
  { id: 'u3', name: '王五' },
  { id: 'u4', name: '赵六' },
  { id: 'u5', name: '陈七' },
]

const stationNames: string[] = [
  'A-01', 'A-02', 'A-03', 'A-04',
  'A-05', 'A-06', 'A-07', 'A-08',
  'A-09', 'A-10', 'A-11', 'A-12',
  'B-01', 'B-02', 'B-03', 'B-04',
  'B-05', 'B-06', 'B-07', 'B-08',
  'B-09', 'B-10', 'B-11', 'B-12',
]

let stations: Station[] = stationNames.map((name, index) => ({
  id: `s${(index + 1).toString().padStart(2, '0')}`,
  name,
  row: Math.floor(index / 4),
  col: index % 4,
  status: 'available' as const,
}))

const defaultReservations: { stationIndex: number; status: 'reserved' | 'occupied'; userId: string; startTime: string; endTime: string }[] = [
  { stationIndex: 1, status: 'reserved', userId: 'u1', startTime: '09:00', endTime: '12:00' },
  { stationIndex: 5, status: 'occupied', userId: 'u2', startTime: '08:00', endTime: '18:00' },
  { stationIndex: 9, status: 'reserved', userId: 'u3', startTime: '14:00', endTime: '17:00' },
  { stationIndex: 14, status: 'occupied', userId: 'u4', startTime: '09:00', endTime: '18:00' },
  { stationIndex: 20, status: 'reserved', userId: 'u5', startTime: '10:00', endTime: '15:00' },
]

defaultReservations.forEach(({ stationIndex, status, userId, startTime, endTime }) => {
  stations[stationIndex] = { ...stations[stationIndex], status, reservedBy: userId, startTime, endTime }
})

let messages: Message[] = [
  { id: uuidv4(), userId: 'system', userName: '系统', content: '欢迎使用工位管理系统', timestamp: new Date().toISOString(), type: 'system' },
  { id: uuidv4(), userId: 'u1', userName: '张三', content: '大家好！', timestamp: new Date().toISOString(), type: 'chat' },
  { id: uuidv4(), userId: 'u2', userName: '李四', content: '有人要换工位吗？', timestamp: new Date().toISOString(), type: 'chat' },
]

function resetStations() {
  stations = stationNames.map((name, index) => ({
    id: `s${(index + 1).toString().padStart(2, '0')}`,
    name,
    row: Math.floor(index / 4),
    col: index % 4,
    status: 'available' as const,
  }))
  defaultReservations.forEach(({ stationIndex, status, userId, startTime, endTime }) => {
    stations[stationIndex] = { ...stations[stationIndex], status, reservedBy: userId, startTime, endTime }
  })
}

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/api/stations', (req: Request, res: Response) => {
  const date = req.query.date as string | undefined
  if (!date) {
    res.status(400).json({ success: false, error: 'date query parameter is required' })
    return
  }
  resetStations()
  res.json({ success: true, data: stations })
})

app.post('/api/stations/:id/reserve', (req: Request, res: Response) => {
  const { id } = req.params
  const { userId, date, startTime, endTime } = req.body
  if (!userId || !date || !startTime || !endTime) {
    res.status(400).json({ success: false, error: 'userId, date, startTime, endTime are required' })
    return
  }
  const station = stations.find(s => s.id === id)
  if (!station) {
    res.status(404).json({ success: false, error: 'Station not found' })
    return
  }
  if (station.status !== 'available') {
    res.status(409).json({ success: false, error: 'Station is not available' })
    return
  }
  station.status = 'reserved'
  station.reservedBy = userId
  station.startTime = startTime
  station.endTime = endTime
  const user = users.find(u => u.id === userId)
  messages.push({
    id: uuidv4(),
    userId: 'system',
    userName: '系统',
    content: `${user?.name ?? userId} 预订了工位 ${station.name}`,
    timestamp: new Date().toISOString(),
    type: 'system',
  })
  res.json({ success: true, data: station })
})

app.post('/api/stations/:id/release', (req: Request, res: Response) => {
  const { id } = req.params
  const { userId, date } = req.body
  if (!userId || !date) {
    res.status(400).json({ success: false, error: 'userId and date are required' })
    return
  }
  const station = stations.find(s => s.id === id)
  if (!station) {
    res.status(404).json({ success: false, error: 'Station not found' })
    return
  }
  if (station.reservedBy !== userId) {
    res.status(403).json({ success: false, error: 'You did not reserve this station' })
    return
  }
  station.status = 'available'
  delete station.reservedBy
  delete station.startTime
  delete station.endTime
  const user = users.find(u => u.id === userId)
  messages.push({
    id: uuidv4(),
    userId: 'system',
    userName: '系统',
    content: `${user?.name ?? userId} 释放了工位 ${station.name}`,
    timestamp: new Date().toISOString(),
    type: 'system',
  })
  res.json({ success: true, data: station })
})

app.get('/api/messages', (_req: Request, res: Response) => {
  res.json({ success: true, data: messages })
})

app.post('/api/messages', (req: Request, res: Response) => {
  const { userId, content } = req.body
  if (!userId || !content) {
    res.status(400).json({ success: false, error: 'userId and content are required' })
    return
  }
  const user = users.find(u => u.id === userId)
  const message: Message = {
    id: uuidv4(),
    userId,
    userName: user?.name ?? userId,
    content,
    timestamp: new Date().toISOString(),
    type: 'chat',
  }
  messages.push(message)
  res.json({ success: true, data: message })
})

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
