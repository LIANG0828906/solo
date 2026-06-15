import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import type { BoardsData } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbFile = path.join(__dirname, '..', 'data', 'db.json')

const defaultData: BoardsData = {
  boards: [],
}

const adapter = new JSONFile<BoardsData>(dbFile)
export const db = new Low<BoardsData>(adapter, defaultData)

export async function initDb() {
  await db.read()
  if (!db.data) {
    db.data = defaultData
    await db.write()
  }
  if (!db.data.boards) {
    db.data.boards = []
    await db.write()
  }
}
