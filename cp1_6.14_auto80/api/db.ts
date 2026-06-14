import { JSONFilePreset } from 'lowdb/node'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface DbUser {
  id: string
  username: string
  password: string
  avatar: string
  createdAt: string
}

export interface BandMember {
  userId: string
  role: 'admin' | 'member'
  joinedAt: string
}

export interface DbBand {
  id: string
  name: string
  description: string
  coverGradient: string
  members: BandMember[]
  createdAt: string
  updatedAt: string
}

export interface TrackEffects {
  reverb: { enabled: boolean; wet: number }
  delay: { enabled: boolean; wet: number }
}

export interface DbTrack {
  id: string
  bandId: string
  name: string
  fileName: string
  duration: number
  volume: number
  pan: number
  muted: boolean
  order: number
  effects: TrackEffects
  createdAt: string
}

export interface TrackMixState {
  trackId: string
  volume: number
  pan: number
  muted: boolean
  effects: TrackEffects
}

export interface DbMixConfig {
  id: string
  bandId: string
  tracks: TrackMixState[]
  globalVolume: number
  loopMode: 'single' | 'list' | 'random'
  createdAt: string
}

interface DbData {
  users: DbUser[]
  bands: DbBand[]
  tracks: DbTrack[]
  mixConfigs: DbMixConfig[]
}

const defaultData: DbData = {
  users: [],
  bands: [],
  tracks: [],
  mixConfigs: [],
}

let dbInstance: Awaited<ReturnType<typeof JSONFilePreset<DbData>>> | null = null

export async function getDb() {
  if (dbInstance) return dbInstance
  const dbPath = path.join(__dirname, 'db.json')
  dbInstance = await JSONFilePreset<DbData>(dbPath, defaultData)
  return dbInstance
}
