/**
 * 【文件职责】数据库初始化和管理模块，使用 lowdb 管理 JSON 文件数据库，提供种子数据与全局 DB 实例
 * 【被调用方】api/routes/auth.ts、api/routes/matches.ts、api/app.ts（通过 getDb() 获取实例）
 * 【数据流向】启动时读取/创建 db.json → 写入种子数据（空库时）→ 各路由通过 getDb() 读写 users/matches/history
 */

import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import type { DatabaseSchema, User, Match, MatchHistory } from '../shared/types.js'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
const dbFilePath = path.join(dataDir, 'db.json')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const defaultData: DatabaseSchema = {
  users: [],
  matches: [],
  history: [],
}

const adapter = new JSONFile<DatabaseSchema>(dbFilePath)
const db = new Low<DatabaseSchema>(adapter, defaultData)

let initialized = false

/**
 * 初始化数据库：若库为空则写入种子用户与种子赛事
 */
async function initDb(): Promise<void> {
  if (initialized) return
  await db.read()

  if (db.data.users.length === 0) {
    const seedUsers: User[] = [
      { id: uuidv4(), nickname: '篮球小将', position: '后卫', level: '进阶', password: '123456' },
      { id: uuidv4(), nickname: '内线霸主', position: '中锋', level: '高手', password: '123456' },
      { id: uuidv4(), nickname: '闪电前锋', position: '前锋', level: '新人', password: '123456' },
      { id: uuidv4(), nickname: '三分神射手', position: '后卫', level: '高手', password: '123456' },
      { id: uuidv4(), nickname: '篮板怪兽', position: '中锋', level: '进阶', password: '123456' },
      { id: uuidv4(), nickname: '速度之王', position: '前锋', level: '进阶', password: '123456' },
      { id: uuidv4(), nickname: '防守大闸', position: '前锋', level: '高手', password: '123456' },
      { id: uuidv4(), nickname: '新秀控卫', position: '后卫', level: '新人', password: '123456' },
      { id: uuidv4(), nickname: '中投靓仔', position: '前锋', level: '进阶', password: '123456' },
      { id: uuidv4(), nickname: '高塔中锋', position: '中锋', level: '新人', password: '123456' },
    ]
    db.data.users = seedUsers

    const creatorId = seedUsers[0].id
    const now = Date.now()

    const seedMatches: Match[] = [
      {
        id: uuidv4(),
        title: '周末3v3友谊赛',
        mode: '3v3',
        date: '2026-06-15',
        time: '18:00',
        location: '朝阳体育中心',
        note: '欢迎新手参加，重在参与！',
        creatorId,
        playerIds: [seedUsers[2].id],
        status: 'open',
        result: '',
        comment: '',
        createdAt: new Date(now - 86400000).toISOString(),
      },
      {
        id: uuidv4(),
        title: '5v5激烈对抗赛',
        mode: '5v5',
        date: '2026-06-20',
        time: '19:30',
        location: '海淀体育馆',
        note: '需要有一定基础的球员',
        creatorId: seedUsers[1].id,
        playerIds: [seedUsers[3].id, seedUsers[5].id, seedUsers[6].id],
        status: 'open',
        result: '',
        comment: '',
        createdAt: new Date(now - 3600000).toISOString(),
      },
    ]
    db.data.matches = seedMatches

    const seedHistory: MatchHistory[] = [
      {
        userId: creatorId,
        matchId: uuidv4(),
        role: 'creator',
        result: '胜',
        comment: '配合默契，大胜对手！',
        playedAt: new Date(now - 7 * 86400000).toISOString(),
      },
    ]
    db.data.history = seedHistory

    await db.write()
  }

  initialized = true
}

/**
 * 获取全局数据库实例（自动初始化）
 * @returns Low<DatabaseSchema> 数据库实例
 */
export async function getDb(): Promise<Low<DatabaseSchema>> {
  await initDb()
  return db
}
