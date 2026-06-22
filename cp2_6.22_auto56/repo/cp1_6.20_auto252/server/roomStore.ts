import Datastore from 'nedb-promises'

export interface RoomUser {
  userId: string
  nickname: string
  color: string
  initial: string
  focusing: boolean
}

export interface Room {
  _id: string
  name: string
  users: RoomUser[]
  studySeconds: Record<string, number>
  createdAt: string
}

const db = Datastore.create({ inMemoryOnly: true })

const PRESET_ROOMS: Omit<Room, '_id'>[] = [
  { name: '自习室A', users: [], studySeconds: {}, createdAt: new Date().toISOString() },
  { name: '自习室B', users: [], studySeconds: {}, createdAt: new Date().toISOString() },
  { name: '深夜学习室', users: [], studySeconds: {}, createdAt: new Date().toISOString() },
]

const SOFT_COLORS = [
  '#f8bbd0', '#f48fb1', '#ce93d8', '#b39ddb',
  '#9fa8da', '#90caf9', '#81d4fa', '#80deea',
  '#80cbc4', '#a5d6a7', '#c5e1a5', '#fff59d',
]

function pickColor(): string {
  return SOFT_COLORS[Math.floor(Math.random() * SOFT_COLORS.length)]
}

export async function initStore(): Promise<void> {
  for (const room of PRESET_ROOMS) {
    await db.insert(room)
  }
}

export async function getAllRooms(): Promise<Room[]> {
  return db.find<Room>({})
}

export async function getRoomById(id: string): Promise<Room | null> {
  return db.findOne<Room>({ _id: id })
}

export async function joinRoom(roomId: string, userId: string, nickname: string): Promise<RoomUser | null> {
  const room = await db.findOne<Room>({ _id: roomId })
  if (!room) return null

  const existing = room.users.find(u => u.userId === userId)
  if (existing) {
    existing.focusing = false
    await db.update({ _id: roomId }, { $set: { users: room.users } })
    return existing
  }

  const user: RoomUser = {
    userId,
    nickname,
    color: pickColor(),
    initial: nickname.charAt(0).toUpperCase(),
    focusing: false,
  }

  await db.update({ _id: roomId }, { $push: { users: user } })
  return user
}

export async function leaveRoom(roomId: string, userId: string): Promise<boolean> {
  const room = await db.findOne<Room>({ _id: roomId })
  if (!room) return false

  const updatedUsers = room.users.filter(u => u.userId !== userId)
  await db.update({ _id: roomId }, { $set: { users: updatedUsers } })
  return true
}

export async function tickStudy(roomId: string, userId: string): Promise<number> {
  const room = await db.findOne<Room>({ _id: roomId })
  if (!room) return 0

  const current = room.studySeconds[userId] || 0
  const newTotal = current + 1
  await db.update(
    { _id: roomId },
    { $set: { [`studySeconds.${userId}`]: newTotal } }
  )
  return newTotal
}

export async function setFocusing(roomId: string, userId: string, focusing: boolean): Promise<void> {
  const room = await db.findOne<Room>({ _id: roomId })
  if (!room) return

  const updatedUsers = room.users.map(u =>
    u.userId === userId ? { ...u, focusing } : u
  )
  await db.update({ _id: roomId }, { $set: { users: updatedUsers } })
}

export async function getLeaderboard(roomId: string): Promise<Array<{
  userId: string
  nickname: string
  color: string
  initial: string
  focusing: boolean
  studySeconds: number
}>> {
  const room = await db.findOne<Room>({ _id: roomId })
  if (!room) return []

  return room.users
    .map(u => ({
      userId: u.userId,
      nickname: u.nickname,
      color: u.color,
      initial: u.initial,
      focusing: u.focusing,
      studySeconds: room.studySeconds[u.userId] || 0,
    }))
    .sort((a, b) => b.studySeconds - a.studySeconds)
}

export async function getOnlineCount(roomId: string): Promise<number> {
  const room = await db.findOne<Room>({ _id: roomId })
  if (!room) return 0
  return room.users.length
}
