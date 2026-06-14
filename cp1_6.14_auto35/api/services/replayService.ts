import { JSONFilePreset } from 'lowdb/node'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface ReplayMeta {
  id: string
  name: string
  createdAt: string
  teamLevel: number
  teamComposition: string[]
}

interface BattleFrame {
  timestamp: number
  units: unknown[]
  actions: unknown[]
}

interface BattleLog {
  id: string
  name: string
  frames: BattleFrame[]
}

interface LowDbSchema {
  replays: ReplayMeta[]
}

const dbPath = join(__dirname, '..', 'data', 'lowdb.json')
const battleLogsDir = join(__dirname, '..', 'data', 'battle-logs')

let dbInstance: Awaited<ReturnType<typeof JSONFilePreset<LowDbSchema>>> | null = null

async function getDb() {
  if (!dbInstance) {
    dbInstance = await JSONFilePreset<LowDbSchema>(dbPath, { replays: [] })
  }
  return dbInstance
}

export async function getAllReplays(): Promise<ReplayMeta[]> {
  const db = await getDb()
  return db.data.replays
}

export async function getBattleLog(id: string): Promise<BattleLog | null> {
  const filePath = join(battleLogsDir, `${id}.json`)
  try {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content) as BattleLog
  } catch {
    return null
  }
}
