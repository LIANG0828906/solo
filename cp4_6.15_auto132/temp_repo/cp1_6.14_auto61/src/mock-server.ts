import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { JSONFile } from 'lowdb/node'
import { Low } from 'lowdb'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface SetScore {
  home: number
  away: number
  winner: string | null
}

interface ScoreState {
  homeTeam: string
  awayTeam: string
  currentSet: number
  homeScore: number
  awayScore: number
  sets: SetScore[]
  isFinished: boolean
  winner: string | null
  startTime: string
  setsWonHome: number
  setsWonAway: number
}

interface BarrageItem {
  id: string
  text: string
  color: string
  timestamp: number
}

interface DbSchema {
  score: ScoreState
  barrages: BarrageItem[]
}

const defaultScore: ScoreState = {
  homeTeam: '主队',
  awayTeam: '客队',
  currentSet: 1,
  homeScore: 0,
  awayScore: 0,
  sets: [],
  isFinished: false,
  winner: null,
  startTime: new Date().toISOString(),
  setsWonHome: 0,
  setsWonAway: 0,
}

const defaultData: DbSchema = {
  score: { ...defaultScore },
  barrages: [],
}

const dbPath = join(__dirname, '..', 'db.json')

try {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf-8')
  }
} catch (err) {
  console.error('Failed to initialize db file:', err)
  try {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf-8')
  } catch (writeErr) {
    console.error('Failed to create db file on fallback:', writeErr)
  }
}

const adapter = new JSONFile<DbSchema>(dbPath)
const db = new Low<DbSchema>(adapter, defaultData)

const app = express()
app.use(cors())
app.use(express.json())

async function initDb() {
  try {
    await db.read()
    if (!db.data || !db.data.score) {
      db.data = JSON.parse(JSON.stringify(defaultData))
      await db.write()
    }
  } catch (err) {
    console.error('Failed to read db, resetting to defaults:', err)
    db.data = JSON.parse(JSON.stringify(defaultData))
    try {
      await db.write()
    } catch (writeErr) {
      console.error('Failed to write default data:', writeErr)
    }
  }
}

await initDb()

app.get('/api/score', (_req, res) => {
  try {
    res.json(db.data.score)
  } catch (err) {
    res.status(500).json({ error: 'Failed to read score' })
  }
})

app.post('/api/score', async (req, res) => {
  try {
    const update = req.body
    db.data.score = { ...db.data.score, ...update }
    await db.write()
    res.json(db.data.score)
  } catch (err) {
    console.error('Failed to update score:', err)
    res.status(500).json({ error: 'Failed to update score' })
  }
})

app.get('/api/barrages', (_req, res) => {
  try {
    res.json(db.data.barrages)
  } catch (err) {
    res.status(500).json({ error: 'Failed to read barrages' })
  }
})

app.post('/api/barrages', async (req, res) => {
  try {
    const { text } = req.body
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Invalid barrage text' })
      return
    }
    const barrage: BarrageItem = {
      id: uuidv4(),
      text: text.trim().slice(0, 50),
      color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 65%)`,
      timestamp: Date.now(),
    }
    db.data.barrages.push(barrage)
    if (db.data.barrages.length > 100) {
      db.data.barrages = db.data.barrages.slice(-100)
    }
    await db.write()
    res.json(barrage)
  } catch (err) {
    console.error('Failed to add barrage:', err)
    res.status(500).json({ error: 'Failed to add barrage' })
  }
})

app.post('/api/reset', async (_req, res) => {
  try {
    db.data.score = { ...defaultScore, startTime: new Date().toISOString() }
    db.data.barrages = []
    await db.write()
    res.json(db.data.score)
  } catch (err) {
    console.error('Failed to reset:', err)
    res.status(500).json({ error: 'Failed to reset' })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`)
})
