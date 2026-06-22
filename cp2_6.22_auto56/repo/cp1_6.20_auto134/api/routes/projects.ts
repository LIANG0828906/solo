import { Router, type Request, type Response } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_FILE = path.resolve(__dirname, '../../data/projects.json')

interface Note {
  id: string
  pitch: number
  startTick: number
  duration: number
  trackId: string
}

interface Track {
  id: string
  name: string
  color: string
  clef: string
  keySignature: string
  volume: number
  pan: number
  notes: Note[]
  muted: boolean
  solo: boolean
}

interface Project {
  id: string
  name: string
  bpm: number
  tracks: Track[]
  createdAt: string
  updatedAt: string
}

function readProjects(): Project[] {
  try {
    const dir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf-8')
      return []
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(data) as Project[]
  } catch {
    return []
  }
}

function writeProjects(projects: Project[]): void {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2), 'utf-8')
}

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const projects = readProjects()
  res.json(projects)
})

router.post('/', (req: Request, res: Response) => {
  const projects = readProjects()
  const { name } = req.body as { name: string }
  const now = new Date().toISOString()
  const defaultTracks: Track[] = [
    {
      id: uuidv4(),
      name: 'Piano',
      color: '#ff6b6b',
      clef: 'treble',
      keySignature: 'C',
      volume: 80,
      pan: 0,
      notes: [],
      muted: false,
      solo: false,
    },
  ]
  const project: Project = {
    id: uuidv4(),
    name: name || 'Untitled Project',
    bpm: 120,
    tracks: defaultTracks,
    createdAt: now,
    updatedAt: now,
  }
  projects.push(project)
  writeProjects(projects)
  res.status(201).json(project)
})

router.put('/:id', (req: Request, res: Response) => {
  const projects = readProjects()
  const { id } = req.params
  const idx = projects.findIndex((p) => p.id === id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Project not found' })
    return
  }
  const updated = req.body as Project
  updated.updatedAt = new Date().toISOString()
  projects[idx] = updated
  writeProjects(projects)
  res.json(projects[idx])
})

router.delete('/:id', (req: Request, res: Response) => {
  const projects = readProjects()
  const { id } = req.params
  const idx = projects.findIndex((p) => p.id === id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Project not found' })
    return
  }
  projects.splice(idx, 1)
  writeProjects(projects)
  res.json({ success: true })
})

export default router
