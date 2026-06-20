import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

interface Planet {
  id: string
  name: string
  nameEn: string
  diameter: number
  distance: number
  orbitalPeriod: number
  moons: number
  mass: number
  gravity: number
  color: string
  textureUrl: string
  description: string
  tilt: number
  rotationPeriod: number
  orbitalInclination: number
}

interface SaveConfigBody {
  planetIds: unknown
  day: unknown
  cameraPosition?: unknown
}

interface Config {
  id: string
  planetIds: string[]
  day: number
  cameraPosition: number[] | null
  createdAt: string
}

interface DatabaseData {
  configs: Config[]
}

const planetsPath = path.join(__dirname, 'planets.json')
let planetsData: Planet[] = []

try {
  const { default: rawPlanets } = await import(planetsPath)
  planetsData = rawPlanets as Planet[]
} catch {
  console.error('Failed to load planets.json')
}

const dbFile = path.join(__dirname, 'db.json')
const adapter = new JSONFile<DatabaseData>(dbFile)
const db = new Low(adapter, { configs: [] })

await db.read()

const VALID_PLANET_IDS = new Set(planetsData.map((p) => p.id))

function validateConfigBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] }
  }

  const b = body as SaveConfigBody

  if (!Array.isArray(b.planetIds)) {
    errors.push('planetIds must be an array')
  } else {
    if (b.planetIds.length === 0) {
      errors.push('planetIds must not be empty')
    }
    if (b.planetIds.length > 3) {
      errors.push('planetIds can contain at most 3 items')
    }
    for (const id of b.planetIds) {
      if (typeof id !== 'string') {
        errors.push(`planetIds contains non-string value: ${String(id)}`)
      } else if (!VALID_PLANET_IDS.has(id)) {
        errors.push(`Invalid planet id: ${id}`)
      }
    }
  }

  if (typeof b.day !== 'number' || isNaN(b.day)) {
    errors.push('day must be a number')
  } else if (b.day < 0 || b.day > 365) {
    errors.push('day must be between 0 and 365')
  }

  if (b.cameraPosition !== undefined) {
    if (!Array.isArray(b.cameraPosition) || b.cameraPosition.length !== 3 || b.cameraPosition.some((v: unknown) => typeof v !== 'number')) {
      errors.push('cameraPosition must be an array of 3 numbers')
    }
  }

  return { valid: errors.length === 0, errors }
}

app.get('/api/planets', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: planetsData,
  })
})

app.get('/api/planets/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const planet = planetsData.find((p) => p.id === id)

  if (!planet) {
    res.status(404).json({
      success: false,
      error: 'Planet not found',
    })
    return
  }

  res.json({
    success: true,
    data: planet,
  })
})

app.post('/api/save-config', async (req: Request, res: Response): Promise<void> => {
  const validation = validateConfigBody(req.body)
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      errors: validation.errors,
    })
    return
  }

  const body = req.body as SaveConfigBody
  const id = uuidv4()
  const newConfig: Config = {
    id,
    planetIds: body.planetIds as string[],
    day: body.day as number,
    cameraPosition: Array.isArray(body.cameraPosition) ? (body.cameraPosition as number[]) : null,
    createdAt: new Date().toISOString(),
  }

  db.data.configs.push(newConfig)
  await db.write()

  res.json({
    success: true,
    data: { id, config: newConfig },
  })
})

app.get('/api/configs/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const config = db.data.configs.find((c) => c.id === id)

  if (!config) {
    res.status(404).json({
      success: false,
      error: 'Config not found',
    })
    return
  }

  res.json({
    success: true,
    data: config,
  })
})

app.post('/api/import-config', async (req: Request, res: Response): Promise<void> => {
  const validation = validateConfigBody(req.body)
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      errors: validation.errors,
    })
    return
  }

  const body = req.body as SaveConfigBody
  const id = uuidv4()
  const imported: Config = {
    id,
    planetIds: body.planetIds as string[],
    day: body.day as number,
    cameraPosition: Array.isArray(body.cameraPosition) ? (body.cameraPosition as number[]) : null,
    createdAt: new Date().toISOString(),
  }

  db.data.configs.push(imported)
  await db.write()

  res.json({
    success: true,
    data: { id, config: imported },
  })
})

app.use(
  '/api/health',
  (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', error.message)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
