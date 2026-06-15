import { JSONFilePreset } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'

export interface Blessing {
  id: string
  nickname: string
  content: string
  mediaType?: 'image' | 'video'
  mediaData?: string
  likes: number
  likedBy: string[]
  createdAt: string
}

export interface Activity {
  id: string
  birthdayPerson: string
  birthdayDate: string
  deadline: string
  isPublic: boolean
  creatorToken: string
  createdAt: string
  blessings: Blessing[]
}

interface DbSchema {
  activities: Activity[]
}

let db: Awaited<ReturnType<typeof JSONFilePreset<DbSchema>>>

export async function initDb() {
  const defaultData: DbSchema = { activities: [] }
  db = await JSONFilePreset<DbSchema>('data/activities.json', defaultData)
}

export function getDb() {
  return db
}

export async function getAllActivities(): Promise<Activity[]> {
  return db.data.activities
}

export async function getActivityById(id: string): Promise<Activity | undefined> {
  return db.data.activities.find((a) => a.id === id)
}

export async function createActivity(data: Omit<Activity, 'id' | 'createdAt' | 'blessings'>): Promise<Activity> {
  const activity: Activity = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    blessings: [],
    ...data,
  }
  db.data.activities.push(activity)
  await db.write()
  return activity
}

export async function addBlessing(activityId: string, blessing: Omit<Blessing, 'id' | 'likes' | 'likedBy' | 'createdAt'>): Promise<Blessing | null> {
  const activity = db.data.activities.find((a) => a.id === activityId)
  if (!activity) return null

  const newBlessing: Blessing = {
    id: uuidv4(),
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
    ...blessing,
  }
  activity.blessings.push(newBlessing)
  await db.write()
  return newBlessing
}

export async function likeBlessing(activityId: string, blessingId: string, sessionId: string): Promise<Blessing | null> {
  const activity = db.data.activities.find((a) => a.id === activityId)
  if (!activity) return null

  const blessing = activity.blessings.find((b) => b.id === blessingId)
  if (!blessing) return null

  if (blessing.likedBy.includes(sessionId)) return blessing

  if (blessing.likes >= 10) return null

  blessing.likes += 1
  blessing.likedBy.push(sessionId)
  await db.write()
  return blessing
}

export async function getLikedBlessingIds(activityId: string, sessionId: string): Promise<string[]> {
  const activity = db.data.activities.find((a) => a.id === activityId)
  if (!activity) return []
  return activity.blessings
    .filter((b) => b.likedBy.includes(sessionId))
    .map((b) => b.id)
}

export async function updateActivity(id: string, updates: Partial<Omit<Activity, 'id' | 'creatorToken' | 'createdAt' | 'blessings'>>): Promise<Activity | null> {
  const activity = db.data.activities.find((a) => a.id === id)
  if (!activity) return null

  Object.assign(activity, updates)
  await db.write()
  return activity
}
