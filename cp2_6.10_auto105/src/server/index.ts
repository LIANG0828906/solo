import express, { type Request, type Response } from 'express'
import cors from 'cors'
import type { Caravan, Station, TripLog, Route, CargoType, Camel } from '@/types'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const initialStations: Station[] = [
  {
    id: 'changan',
    name: '长安',
    x: 100,
    y: 500,
    distanceFromPrev: 0,
    inventory: { silk: 100, tea: 80, porcelain: 60, spice: 20, gem: 10 },
    supplies: { water: 500, forage: 300, horseshoes: 50 }
  },
  {
    id: 'lanzhou',
    name: '兰州',
    x: 200,
    y: 480,
    distanceFromPrev: 150,
    inventory: { silk: 80, tea: 100, porcelain: 50, spice: 30, gem: 5 },
    supplies: { water: 400, forage: 250, horseshoes: 40 }
  },
  {
    id: 'wuwei',
    name: '武威',
    x: 300,
    y: 450,
    distanceFromPrev: 180,
    inventory: { silk: 60, tea: 70, porcelain: 80, spice: 40, gem: 8 },
    supplies: { water: 350, forage: 280, horseshoes: 35 }
  },
  {
    id: 'zhangye',
    name: '张掖',
    x: 400,
    y: 420,
    distanceFromPrev: 160,
    inventory: { silk: 70, tea: 60, porcelain: 70, spice: 50, gem: 12 },
    supplies: { water: 380, forage: 260, horseshoes: 45 }
  },
  {
    id: 'jiuquan',
    name: '酒泉',
    x: 500,
    y: 400,
    distanceFromPrev: 140,
    inventory: { silk: 50, tea: 50, porcelain: 40, spice: 60, gem: 15 },
    supplies: { water: 300, forage: 200, horseshoes: 30 }
  },
  {
    id: 'dunhuang',
    name: '敦煌',
    x: 600,
    y: 380,
    distanceFromPrev: 200,
    inventory: { silk: 40, tea: 40, porcelain: 30, spice: 70, gem: 20 },
    supplies: { water: 250, forage: 180, horseshoes: 25 }
  },
  {
    id: 'hami',
    name: '哈密',
    x: 700,
    y: 350,
    distanceFromPrev: 220,
    inventory: { silk: 30, tea: 35, porcelain: 25, spice: 80, gem: 18 },
    supplies: { water: 200, forage: 150, horseshoes: 20 }
  },
  {
    id: 'tulufan',
    name: '吐鲁番',
    x: 800,
    y: 320,
    distanceFromPrev: 180,
    inventory: { silk: 25, tea: 30, porcelain: 20, spice: 90, gem: 25 },
    supplies: { water: 180, forage: 120, horseshoes: 18 }
  },
  {
    id: 'yanqi',
    name: '焉耆',
    x: 900,
    y: 280,
    distanceFromPrev: 160,
    inventory: { silk: 20, tea: 25, porcelain: 15, spice: 100, gem: 30 },
    supplies: { water: 220, forage: 160, horseshoes: 22 }
  },
  {
    id: 'qiuci',
    name: '龟兹',
    x: 1000,
    y: 250,
    distanceFromPrev: 170,
    inventory: { silk: 15, tea: 20, porcelain: 10, spice: 110, gem: 35 },
    supplies: { water: 280, forage: 200, horseshoes: 28 }
  },
  {
    id: 'shule',
    name: '疏勒',
    x: 1100,
    y: 220,
    distanceFromPrev: 190,
    inventory: { silk: 10, tea: 15, porcelain: 8, spice: 120, gem: 40 },
    supplies: { water: 320, forage: 240, horseshoes: 32 }
  },
  {
    id: 'samarkand',
    name: '撒马尔罕',
    x: 1200,
    y: 200,
    distanceFromPrev: 250,
    inventory: { silk: 5, tea: 10, porcelain: 5, spice: 150, gem: 50 },
    supplies: { water: 400, forage: 300, horseshoes: 40 }
  }
]

const createSampleCaravan = (id: string, name: string, origin: string, camels: Camel[]): Caravan => ({
  id,
  name,
  camels,
  origin,
  currentStation: origin,
  isMoving: false,
  currentPathIndex: 0
})

const initialCaravans: Caravan[] = [
  createSampleCaravan(
    'caravan-1',
    '东方丝路商队',
    'changan',
    [
      { id: 'camel-1', type: 'bactrian', cargo: [{ type: 'silk', weight: 80 }, { type: 'tea', weight: 40 }], maxLoad: 150 },
      { id: 'camel-2', type: 'bactrian', cargo: [{ type: 'porcelain', weight: 60 }], maxLoad: 150 },
      { id: 'camel-3', type: 'dromedary', cargo: [{ type: 'silk', weight: 50 }, { type: 'spice', weight: 30 }], maxLoad: 120 }
    ]
  ),
  createSampleCaravan(
    'caravan-2',
    '西域宝石商队',
    'samarkand',
    [
      { id: 'camel-4', type: 'dromedary', cargo: [{ type: 'gem', weight: 20 }, { type: 'spice', weight: 60 }], maxLoad: 120 },
      { id: 'camel-5', type: 'bactrian', cargo: [{ type: 'spice', weight: 100 }], maxLoad: 150 }
    ]
  ),
  createSampleCaravan(
    'caravan-3',
    '敦煌茶商',
    'dunhuang',
    [
      { id: 'camel-6', type: 'bactrian', cargo: [{ type: 'tea', weight: 120 }], maxLoad: 150 },
      { id: 'camel-7', type: 'bactrian', cargo: [{ type: 'tea', weight: 80 }, { type: 'porcelain', weight: 40 }], maxLoad: 150 }
    ]
  )
]

const initialTripLogs: TripLog[] = [
  {
    id: 'log-1',
    caravanId: 'caravan-1',
    caravanName: '东方丝路商队',
    origin: 'changan',
    destination: 'lanzhou',
    departTime: Date.now() - 86400000 * 3,
    arriveTime: Date.now() - 86400000 * 2,
    duration: 86400000,
    totalWeight: 360,
    suppliesConsumed: { water: 50, forage: 30, horseshoes: 2 },
    remainingCargo: { silk: 110, tea: 100, porcelain: 80, spice: 50, gem: 5 }
  },
  {
    id: 'log-2',
    caravanId: 'caravan-2',
    caravanName: '西域宝石商队',
    origin: 'samarkand',
    destination: 'shule',
    departTime: Date.now() - 86400000 * 5,
    arriveTime: Date.now() - 86400000 * 4,
    duration: 90000000,
    totalWeight: 180,
    suppliesConsumed: { water: 40, forage: 25, horseshoes: 3 },
    remainingCargo: { silk: 10, tea: 20, porcelain: 15, spice: 180, gem: 60 }
  }
]

let caravans: Caravan[] = [...initialCaravans]
let stations: Station[] = [...initialStations]
let tripLogs: TripLog[] = [...initialTripLogs]

const generateId = (): string => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

app.get('/api/caravans', (_req: Request, res: Response<Caravan[]>): void => {
  res.json(caravans)
})

app.post('/api/caravans', (req: Request<unknown, unknown, Omit<Caravan, 'id'>>, res: Response<Caravan>): void => {
  const newCaravan: Caravan = {
    ...req.body,
    id: generateId()
  }
  caravans.push(newCaravan)
  res.status(201).json(newCaravan)
})

app.put('/api/caravans/:id', (req: Request<{ id: string }, unknown, Partial<Caravan>>, res: Response<Caravan | { error: string }>): void => {
  const index = caravans.findIndex(c => c.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ error: 'Caravan not found' })
    return
  }
  caravans[index] = { ...caravans[index], ...req.body }
  res.json(caravans[index])
})

app.delete('/api/caravans/:id', (req: Request<{ id: string }>, res: Response<{ success: boolean } | { error: string }>): void => {
  const index = caravans.findIndex(c => c.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ error: 'Caravan not found' })
    return
  }
  caravans.splice(index, 1)
  res.json({ success: true })
})

app.get('/api/stations', (_req: Request, res: Response<Station[]>): void => {
  res.json(stations)
})

app.put('/api/stations/:id', (req: Request<{ id: string }, unknown, Partial<Station>>, res: Response<Station | { error: string }>): void => {
  const index = stations.findIndex(s => s.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ error: 'Station not found' })
    return
  }
  stations[index] = { ...stations[index], ...req.body }
  res.json(stations[index])
})

app.get('/api/history', (_req: Request, res: Response<TripLog[]>): void => {
  res.json(tripLogs)
})

app.post('/api/history', (req: Request<unknown, unknown, Omit<TripLog, 'id'>>, res: Response<TripLog>): void => {
  const newLog: TripLog = {
    ...req.body,
    id: generateId()
  }
  tripLogs.push(newLog)
  res.status(201).json(newLog)
})

app.get('/api/routes', (req: Request<unknown, unknown, unknown, { origin: string; destination: string }>, res: Response<Route | { error: string }>): void => {
  const { origin, destination } = req.query

  if (!origin || !destination) {
    res.status(400).json({ error: 'Origin and destination are required' })
    return
  }

  const originIndex = stations.findIndex(s => s.id === origin)
  const destIndex = stations.findIndex(s => s.id === destination)

  if (originIndex === -1 || destIndex === -1) {
    res.status(404).json({ error: 'Origin or destination not found' })
    return
  }

  const start = Math.min(originIndex, destIndex)
  const end = Math.max(originIndex, destIndex)

  const routeStations = stations.slice(start, end + 1).map(s => s.id)
  const orderedStations = originIndex > destIndex ? [...routeStations].reverse() : routeStations

  let totalDistance = 0
  for (let i = start + 1; i <= end; i++) {
    totalDistance += stations[i].distanceFromPrev
  }

  res.json({
    stations: orderedStations,
    totalDistance
  })
})

app.listen(PORT, (): void => {
  console.log(`Server is running on port ${PORT}`)
})
