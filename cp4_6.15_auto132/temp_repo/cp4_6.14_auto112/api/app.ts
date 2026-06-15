import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

type PlantStatus = 'healthy' | 'thirsty' | 'low_light' | 'pest'

interface Plant {
  id: string
  name: string
  variety: string
  plantedDate: string
  status: PlantStatus
  notes: string
}

interface CareEvent {
  id: string
  plantId: string
  type: 'water' | 'fertilize' | 'repot' | 'prune'
  date: string
  notes: string
}

const plants: Plant[] = [
  {
    id: '1',
    name: '小绿',
    variety: '多肉',
    plantedDate: '2026-01-15',
    status: 'healthy',
    notes: '窗台上的小可爱，每天晒太阳',
  },
  {
    id: '2',
    name: '翠翠',
    variety: '观叶',
    plantedDate: '2025-11-20',
    status: 'thirsty',
    notes: '客厅大盆绿萝，叶子很茂盛',
  },
  {
    id: '3',
    name: '花花',
    variety: '开花',
    plantedDate: '2026-03-01',
    status: 'low_light',
    notes: '阳台月季，花期快到了',
  },
  {
    id: '4',
    name: '香香',
    variety: '草本',
    plantedDate: '2026-04-10',
    status: 'pest',
    notes: '厨房窗台的薄荷，最近发现有小虫',
  },
  {
    id: '5',
    name: '胖墩',
    variety: '多肉',
    plantedDate: '2025-08-05',
    status: 'healthy',
    notes: '书桌上的熊童子，状态很好',
  },
]

const events: CareEvent[] = [
  { id: 'e1', plantId: '1', type: 'water', date: '2026-06-14', notes: '正常浇水' },
  { id: 'e2', plantId: '1', type: 'fertilize', date: '2026-06-10', notes: '施了缓释肥' },
  { id: 'e3', plantId: '1', type: 'water', date: '2026-06-07', notes: '' },
  { id: 'e4', plantId: '1', type: 'water', date: '2026-06-01', notes: '透水一次' },
  { id: 'e5', plantId: '2', type: 'water', date: '2026-06-13', notes: '叶子有点蔫' },
  { id: 'e6', plantId: '2', type: 'fertilize', date: '2026-06-05', notes: '液体肥稀释' },
  { id: 'e7', plantId: '2', type: 'water', date: '2026-05-28', notes: '' },
  { id: 'e8', plantId: '2', type: 'repot', date: '2026-05-15', notes: '换了更大的花盆' },
  { id: 'e9', plantId: '3', type: 'water', date: '2026-06-12', notes: '' },
  { id: 'e10', plantId: '3', type: 'prune', date: '2026-06-08', notes: '修剪了枯枝' },
  { id: 'e11', plantId: '3', type: 'fertilize', date: '2026-05-30', notes: '花期专用肥' },
  { id: 'e12', plantId: '4', type: 'water', date: '2026-06-11', notes: '' },
  { id: 'e13', plantId: '4', type: 'prune', date: '2026-06-09', notes: '剪掉虫害叶片' },
  { id: 'e14', plantId: '4', type: 'fertilize', date: '2026-06-02', notes: '有机肥' },
  { id: 'e15', plantId: '5', type: 'water', date: '2026-06-13', notes: '' },
  { id: 'e16', plantId: '5', type: 'water', date: '2026-06-06', notes: '' },
  { id: 'e17', plantId: '5', type: 'repot', date: '2026-05-20', notes: '换颗粒土' },
  { id: 'e18', plantId: '1', type: 'water', date: '2026-05-25', notes: '' },
  { id: 'e19', plantId: '2', type: 'water', date: '2026-05-20', notes: '多浇了一些' },
  { id: 'e20', plantId: '3', type: 'water', date: '2026-05-18', notes: '' },
]

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/api/plants', (_req: Request, res: Response) => {
  res.json(plants)
})

app.get('/api/plants/:id', (req: Request, res: Response) => {
  const plant = plants.find(p => p.id === req.params.id)
  if (!plant) {
    res.status(404).json({ error: 'Plant not found' })
    return
  }
  res.json(plant)
})

app.post('/api/plants', (req: Request, res: Response) => {
  const { name, variety, plantedDate, status, notes } = req.body
  if (!name || name.length < 1 || name.length > 20) {
    res.status(400).json({ error: 'Name must be 1-20 characters' })
    return
  }
  const plant: Plant = {
    id: uuidv4(),
    name,
    variety: variety || '观叶',
    plantedDate: plantedDate || new Date().toISOString().split('T')[0],
    status: status || 'healthy',
    notes: notes || '',
  }
  plants.push(plant)
  res.status(201).json(plant)
})

app.put('/api/plants/:id', (req: Request, res: Response) => {
  const idx = plants.findIndex(p => p.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ error: 'Plant not found' })
    return
  }
  plants[idx] = { ...plants[idx], ...req.body, id: plants[idx].id }
  res.json(plants[idx])
})

app.delete('/api/plants/:id', (req: Request, res: Response) => {
  const idx = plants.findIndex(p => p.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ error: 'Plant not found' })
    return
  }
  plants.splice(idx, 1)
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].plantId === req.params.id) {
      events.splice(i, 1)
    }
  }
  res.json({ success: true })
})

app.get('/api/plants/:id/events', (req: Request, res: Response) => {
  const plantEvents = events
    .filter(e => e.plantId === req.params.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  res.json(plantEvents)
})

app.post('/api/plants/:id/events', (req: Request, res: Response) => {
  const plant = plants.find(p => p.id === req.params.id)
  if (!plant) {
    res.status(404).json({ error: 'Plant not found' })
    return
  }
  const { type, date, notes } = req.body
  if (!type || !date) {
    res.status(400).json({ error: 'Type and date are required' })
    return
  }
  const event: CareEvent = {
    id: uuidv4(),
    plantId: req.params.id,
    type,
    date,
    notes: notes || '',
  }
  events.push(event)
  res.status(201).json(event)
})

app.delete('/api/events/:eventId', (req: Request, res: Response) => {
  const idx = events.findIndex(e => e.id === req.params.eventId)
  if (idx === -1) {
    res.status(404).json({ error: 'Event not found' })
    return
  }
  events.splice(idx, 1)
  res.json({ success: true })
})

app.get('/api/health-analysis', (_req: Request, res: Response) => {
  const statusCounts: Record<string, number> = {
    healthy: 0,
    thirsty: 0,
    low_light: 0,
    pest: 0,
  }
  plants.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
  })

  const total = plants.length || 1
  const statusDistribution = Object.entries(statusCounts).map(
    ([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / total) * 100),
    })
  )

  const score = Math.round(
    (statusCounts.healthy * 100 +
      statusCounts.thirsty * 60 +
      statusCounts.low_light * 50 +
      statusCounts.pest * 30) /
    total
  )

  let suggestion = '所有植物状态良好，继续保持！'
  if (score < 50) {
    suggestion = '植物整体状况不佳，建议优先处理虫害和缺水问题。'
  } else if (score < 75) {
    suggestion = '部分植物需要关注，请及时浇水和增加光照。'
  } else if (score < 90) {
    suggestion = '植物整体状态不错，注意个别缺水或缺光的植物。'
  }

  const today = new Date()
  const eventFrequency = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayEvents = events.filter(e => e.date === dateStr)
    eventFrequency.push({
      date: dateStr,
      count: dayEvents.length,
      events: dayEvents,
    })
  }

  res.json({
    score,
    suggestion,
    statusDistribution,
    eventFrequency,
  })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  res.status(500).json({ success: false, error: 'Server internal error' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
