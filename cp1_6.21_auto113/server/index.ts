
import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

interface ColorStop {
  position: number
  color: string
}

type NoiseType = 'perlin' | 'simplex' | 'worley'

interface Preset {
  id: string
  name: string
  noiseType: NoiseType
  frequency: number
  octaves: number
  seed: number
  colorStops: ColorStop[]
  createdAt: number
}

const presets: Preset[] = [
  {
    id: uuidv4(),
    name: '海洋蓝调',
    noiseType: 'perlin',
    frequency: 0.03,
    octaves: 5,
    seed: 123,
    colorStops: [
      { position: 0, color: '#0F172A' },
      { position: 0.5, color: '#1E40AF' },
      { position: 1, color: '#60A5FA' }
    ],
    createdAt: Date.now()
  },
  {
    id: uuidv4(),
    name: '森林绿意',
    noiseType: 'simplex',
    frequency: 0.04,
    octaves: 4,
    seed: 456,
    colorStops: [
      { position: 0, color: '#052E16' },
      { position: 0.5, color: '#15803D' },
      { position: 1, color: '#86EFAC' }
    ],
    createdAt: Date.now()
  },
  {
    id: uuidv4(),
    name: '日落橙红',
    noiseType: 'worley',
    frequency: 0.06,
    octaves: 3,
    seed: 789,
    colorStops: [
      { position: 0, color: '#7C2D12' },
      { position: 0.5, color: '#EA580C' },
      { position: 1, color: '#FDE68A' }
    ],
    createdAt: Date.now()
  }
]

app.get('/api/presets', (_req, res) => {
  res.json({ presets })
})

app.post('/api/presets', (req, res) => {
  try {
    const { name, noiseType, frequency, octaves, seed, colorStops } = req.body

    if (!name || !noiseType || typeof frequency !== 'number' ||
        typeof octaves !== 'number' || typeof seed !== 'number' ||
        !Array.isArray(colorStops)) {
      return res.status(400).json({ success: false, error: 'Invalid preset data' })
    }

    const newPreset: Preset = {
      id: uuidv4(),
      name,
      noiseType,
      frequency,
      octaves,
      seed,
      colorStops,
      createdAt: Date.now()
    }

    presets.push(newPreset)
    res.json({ success: true, preset: newPreset })
  } catch (error) {
    console.error('Error saving preset:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Color Noise Sandbox server running on http://localhost:${PORT}`)
})
