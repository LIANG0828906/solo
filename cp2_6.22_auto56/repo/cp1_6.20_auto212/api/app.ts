import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { mockActivities } from '../src/data/mockData.js'
import { mockEquipment } from '../src/data/mockData.js'
import { mockRegistrations } from '../src/data/mockData.js'
import { mockWeatherForecasts } from '../src/data/mockData.js'

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

let activities = [...mockActivities]
let equipment = [...mockEquipment]
let registrations = [...mockRegistrations]
const weatherForecasts = { ...mockWeatherForecasts }

app.get('/api/activities', (_req: Request, res: Response) => {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const result = sorted.map((activity) => ({
    ...activity,
    registrationCount: registrations.filter(
      (r) => r.activityId === activity.id
    ).length,
  }))
  res.json(result)
})

app.get('/api/activities/:id', (req: Request, res: Response) => {
  const activity = activities.find((a) => a.id === req.params.id)
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' })
    return
  }
  res.json(activity)
})

app.post('/api/activities', (req: Request, res: Response) => {
  const newActivity = {
    id: uuidv4(),
    name: req.body.name,
    date: req.body.date,
    difficulty: req.body.difficulty,
    description: req.body.description,
    routeImages: req.body.routeImages || [],
    maxMembers: req.body.maxMembers,
    location: req.body.location || '待定',
  }
  activities.unshift(newActivity)
  res.status(201).json(newActivity)
})

app.get('/api/equipment', (_req: Request, res: Response) => {
  res.json(equipment)
})

app.get('/api/equipment/:activityId', (req: Request, res: Response) => {
  const activityRegs = registrations.filter(
    (r) => r.activityId === req.params.activityId
  )
  const allocatedIds = new Set<string>()
  activityRegs.forEach((r) => r.equipmentIds.forEach((id) => allocatedIds.add(id)))
  const result = equipment.map((e) => ({
    ...e,
    activityAllocated: activityRegs.filter((r) =>
      r.equipmentIds.includes(e.id)
    ).length,
  }))
  res.json(result)
})

app.get('/api/registrations/:activityId', (req: Request, res: Response) => {
  const regs = registrations.filter(
    (r) => r.activityId === req.params.activityId
  )
  res.json(regs)
})

app.post('/api/registrations', (req: Request, res: Response) => {
  const { activityId, memberName, phone, equipmentIds } = req.body
  const activity = activities.find((a) => a.id === activityId)
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' })
    return
  }
  const currentCount = registrations.filter(
    (r) => r.activityId === activityId
  ).length
  if (currentCount >= activity.maxMembers) {
    res.status(400).json({ error: 'Activity is full' })
    return
  }

  const newReg = {
    id: uuidv4(),
    activityId,
    memberName,
    phone,
    equipmentIds: equipmentIds || [],
    createdAt: new Date().toISOString(),
  }
  registrations.push(newReg)

  equipmentIds.forEach((eid: string) => {
    const item = equipment.find((e) => e.id === eid)
    if (item) {
      item.allocated = Math.min(item.allocated + 1, item.totalStock)
    }
  })

  res.status(201).json(newReg)
})

app.get('/api/weather/:activityId', (req: Request, res: Response) => {
  const forecasts = weatherForecasts[req.params.activityId]
  if (!forecasts) {
    const base = new Date()
    const mockForecast = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(base)
      d.setDate(d.getDate() + i)
      return {
        date: d.toISOString().split('T')[0],
        icon: (['sunny', 'cloudy', 'rainy'] as const)[i % 3],
        tempHigh: 25 - i * 2,
        tempLow: 15 - i * 2,
        precipitation: [10, 30, 50][i % 3],
      }
    })
    res.json(mockForecast)
    return
  }
  res.json(forecasts)
})

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'ok' })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  res.status(500).json({ success: false, error: 'Server internal error' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
