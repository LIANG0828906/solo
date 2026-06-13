import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import path from 'path'
import planetsData from './planets.json' assert { type: 'json' }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

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
}

interface Config {
  id: string
  [key: string]: unknown
}

interface DatabaseData {
  configs: Config[]
}

const file = path.join(__dirname, 'db.json')
const adapter = new JSONFile<DatabaseData>(file)
const db = new Low(adapter, { configs: [] })

await db.read()

app.get('/api/planets', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: planetsData as Planet[],
  })
})

app.get('/api/planets/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const planet = (planetsData as Planet[]).find((p) => p.id === id)

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
  const configData = req.body
  const id = uuidv4()

  const newConfig: Config = {
    id,
    ...configData,
  }

  db.data.configs.push(newConfig)
  await db.write()

  res.json({
    success: true,
    data: { id },
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export default app
