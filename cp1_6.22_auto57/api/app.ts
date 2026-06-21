import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'

interface Intersection {
  id: number
  x: number
  z: number
  signalState: 'red' | 'green'
  signalTimer: number
}

interface Segment {
  id: number
  type: 'main' | 'branch'
  start: number
  end: number
  lanes: number
  speedLimit: number
}

interface SignalCycle {
  red: number
  green: number
}

interface Vehicle {
  id: number
  position: { x: number; z: number }
  speed: number
  direction: number
  segmentId: number
}

interface Obstacle {
  id: number
  position: { x: number; z: number }
}

interface RoadNetwork {
  intersections: Intersection[]
  segments: Segment[]
  signalCycle: SignalCycle
}

function createDefaultIntersections(): Intersection[] {
  const intersections: Intersection[] = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const id = row * 3 + col
      intersections.push({
        id,
        x: (col - 1) * 60,
        z: (row - 1) * 60,
        signalState: id % 2 === 0 ? 'red' : 'green',
        signalTimer: 0,
      })
    }
  }
  return intersections
}

function createDefaultSegments(): Segment[] {
  const mainSegments: Segment[] = [
    { id: 0, type: 'main', start: 0, end: 1, lanes: 4, speedLimit: 60 },
    { id: 1, type: 'main', start: 6, end: 7, lanes: 4, speedLimit: 60 },
    { id: 2, type: 'main', start: 0, end: 3, lanes: 4, speedLimit: 60 },
    { id: 3, type: 'main', start: 2, end: 5, lanes: 4, speedLimit: 60 },
  ]

  const branchSegments: Segment[] = [
    { id: 4, type: 'branch', start: 1, end: 2, lanes: 2, speedLimit: 40 },
    { id: 5, type: 'branch', start: 3, end: 4, lanes: 2, speedLimit: 40 },
    { id: 6, type: 'branch', start: 4, end: 5, lanes: 2, speedLimit: 40 },
    { id: 7, type: 'branch', start: 7, end: 8, lanes: 2, speedLimit: 40 },
    { id: 8, type: 'branch', start: 3, end: 6, lanes: 2, speedLimit: 40 },
    { id: 9, type: 'branch', start: 1, end: 4, lanes: 2, speedLimit: 40 },
    { id: 10, type: 'branch', start: 4, end: 7, lanes: 2, speedLimit: 40 },
    { id: 11, type: 'branch', start: 5, end: 8, lanes: 2, speedLimit: 40 },
  ]

  return [...mainSegments, ...branchSegments]
}

const defaultIntersections = createDefaultIntersections()
const defaultSegments = createDefaultSegments()

let roadNetwork: RoadNetwork = {
  intersections: defaultIntersections,
  segments: defaultSegments,
  signalCycle: { red: 15, green: 20 },
}

let vehicles: Vehicle[] = []
let obstacles: Obstacle[] = []
let nextObstacleId = 1
let running = false

const app: express.Application = express()

app.use(cors())
app.use(express.json())

app.get('/api/road-network', (req: Request, res: Response) => {
  res.json(roadNetwork)
})

app.put('/api/road-network', (req: Request, res: Response) => {
  const { intersections, segments, signalCycle } = req.body
  if (intersections !== undefined) roadNetwork.intersections = intersections
  if (segments !== undefined) roadNetwork.segments = segments
  if (signalCycle !== undefined) roadNetwork.signalCycle = signalCycle
  res.json(roadNetwork)
})

app.get('/api/vehicles', (req: Request, res: Response) => {
  res.json(vehicles)
})

app.get('/api/obstacles', (req: Request, res: Response) => {
  res.json(obstacles)
})

app.post('/api/obstacles', (req: Request, res: Response) => {
  const { position } = req.body
  const obstacle: Obstacle = {
    id: nextObstacleId++,
    position,
  }
  obstacles.push(obstacle)
  res.json(obstacle)
})

app.delete('/api/obstacles/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)
  obstacles = obstacles.filter((o) => o.id !== id)
  res.json({ success: true })
})

app.get('/api/analytics', (req: Request, res: Response) => {
  const totalVehicles = vehicles.length
  const avgSpeed =
    totalVehicles > 0
      ? vehicles.reduce((sum, v) => sum + v.speed, 0) / totalVehicles
      : 0
  const congestionIndex =
    totalVehicles > 0 ? Math.min(1, totalVehicles / 50) : 0
  res.json({ totalVehicles, avgSpeed, congestionIndex })
})

app.post('/api/simulation/start', (req: Request, res: Response) => {
  running = true
  res.json({ running: true })
})

app.post('/api/simulation/stop', (req: Request, res: Response) => {
  running = false
  res.json({ running: false })
})

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'ok' })
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
