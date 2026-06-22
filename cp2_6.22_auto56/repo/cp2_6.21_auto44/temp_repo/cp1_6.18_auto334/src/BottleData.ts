import { v4 as uuidv4 } from 'uuid'

export interface Reply {
  id: string
  content: string
  createdAt: number
}

export interface Bottle {
  id: string
  content: string
  createdAt: number
  expiresAt: number
  x: number
  y: number
  rotation: number
  color: string
  replies: Reply[]
  isMine: boolean
}

const BOTTLE_COLORS = [
  'rgba(135, 206, 250, 0.55)',
  'rgba(173, 216, 230, 0.55)',
  'rgba(176, 224, 230, 0.55)',
  'rgba(175, 238, 238, 0.55)',
  'rgba(224, 255, 255, 0.55)',
  'rgba(240, 248, 255, 0.55)',
]

const STORAGE_KEY = 'inspiration_drift_bottles_v1'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function randomBottleColor(): string {
  return BOTTLE_COLORS[Math.floor(Math.random() * BOTTLE_COLORS.length)]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isReply(v: unknown): Reply | null {
  if (!isRecord(v)) return null
  const id = typeof v.id === 'string' ? v.id : ''
  const content = typeof v.content === 'string' ? v.content : ''
  const createdAt = typeof v.createdAt === 'number' ? v.createdAt : Date.now()
  if (!id || !content) return null
  return { id, content, createdAt }
}

export function validateBottle(json: unknown): Bottle | null {
  if (!isRecord(json)) return null
  const id = typeof json.id === 'string' && json.id.length > 0 ? json.id : null
  const content = typeof json.content === 'string' && json.content.trim().length > 0
    ? json.content.trim()
    : null
  const createdAt = typeof json.createdAt === 'number' && json.createdAt > 0 ? json.createdAt : null
  const expiresAt = typeof json.expiresAt === 'number' && json.expiresAt > 0 ? json.expiresAt : null
  const x = typeof json.x === 'number' && json.x >= 0 && json.x <= 100 ? json.x : null
  const y = typeof json.y === 'number' && json.y >= 0 && json.y <= 100 ? json.y : null
  const rotation = typeof json.rotation === 'number' ? json.rotation : 0
  const color = typeof json.color === 'string' ? json.color : randomBottleColor()
  const isMine = json.isMine === true
  const replies = Array.isArray(json.replies)
    ? (json.replies.map(isReply).filter(Boolean) as Reply[])
    : []
  if (!id || !content || !createdAt || !expiresAt || x === null || y === null) {
    return null
  }
  return { id, content, createdAt, expiresAt, x, y, rotation, color, replies, isMine }
}

export function createBottle(content: string, x: number, y: number): Bottle {
  const now = Date.now()
  return {
    id: uuidv4(),
    content: content.trim(),
    createdAt: now,
    expiresAt: now + WEEK_MS,
    x: Math.max(5, Math.min(95, x)),
    y: Math.max(15, Math.min(90, y)),
    rotation: (Math.random() - 0.5) * 60,
    color: randomBottleColor(),
    replies: [],
    isMine: true,
  }
}

export function addReply(bottle: Bottle, content: string): Bottle {
  const reply: Reply = {
    id: uuidv4(),
    content: content.trim(),
    createdAt: Date.now(),
  }
  return {
    ...bottle,
    replies: [...bottle.replies, reply],
    color: 'rgba(255, 215, 0, 0.45)',
  }
}

export function isExpired(bottle: Bottle): boolean {
  return Date.now() >= bottle.expiresAt
}

export function loadBottles(): Bottle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const result: Bottle[] = []
    for (const item of parsed) {
      const bottle = validateBottle(item)
      if (bottle && !isExpired(bottle)) {
        result.push(bottle)
      }
    }
    return result
  } catch {
    return []
  }
}

export function saveBottles(bottles: Bottle[]): void {
  try {
    const active = bottles.filter((b) => !isExpired(b))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(active))
  } catch {
    /* ignore */
  }
}

export function generateSeedBottles(count = 12): Bottle[] {
  const sampleContents = [
    '今天看到夕阳很美，突然觉得一切都会好起来的。',
    '坚持读书100天，终于读完了《百年孤独》。',
    '希望有一天能去冰岛看极光。',
    '世界这么大，我想去看看。',
    '灵感就像一阵风，来的时候一定要抓住它。',
    '每天进步一点点，一年后会很不一样。',
    '不要因为走得太远，而忘记为什么出发。',
    '生活不止眼前的苟且，还有诗和远方。',
    '你若盛开，蝴蝶自来。',
    '愿你被这个世界温柔以待。',
    '有时候，放慢脚步也是一种前进。',
    '勇敢不是不害怕，而是害怕了仍然往前走。',
  ]
  const now = Date.now()
  const result: Bottle[] = []
  for (let i = 0; i < count; i++) {
    const content = sampleContents[i % sampleContents.length]
    result.push({
      id: uuidv4(),
      content,
      createdAt: now - Math.random() * 2 * 24 * 60 * 60 * 1000,
      expiresAt: now + (WEEK_MS - Math.random() * 3 * 24 * 60 * 60 * 1000),
      x: 8 + Math.random() * 84,
      y: 20 + Math.random() * 68,
      rotation: (Math.random() - 0.5) * 50,
      color: randomBottleColor(),
      replies: [],
      isMine: false,
    })
  }
  return result
}
