import { db, Item } from '../db'
import { v4 as uuidv4 } from 'uuid'

interface CreateItemInput {
  title: string
  description: string
  category: string
  condition: string
  images: string[]
  ownerId: string
  city: string
}

interface SearchItemsInput {
  keyword?: string
  category?: string
  page?: number
  limit?: number
}

export const createItem = async (input: CreateItemInput): Promise<Item> => {
  await db.read()
  const item: Item = {
    id: uuidv4(),
    title: input.title,
    description: input.description,
    category: input.category,
    condition: input.condition,
    images: input.images,
    ownerId: input.ownerId,
    status: 'available',
    createdAt: new Date().toISOString(),
    city: input.city,
  }
  db.data!.items.push(item)
  await db.write()
  return item
}

export const getItemById = async (id: string): Promise<Item | null> => {
  await db.read()
  return db.data!.items.find((item) => item.id === id) || null
}

export const getItems = async (input: SearchItemsInput = {}): Promise<{ items: Item[]; total: number }> => {
  await db.read()
  let items = [...db.data!.items]

  items = items.filter((item) => item.status !== 'exchanged')

  if (input.keyword) {
    const keyword = input.keyword.toLowerCase()
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
    )
  }

  if (input.category && input.category !== 'all') {
    items = items.filter((item) => item.category === input.category)
  }

  items.sort((a, b) => {
    const scoreA = a.status === 'available' ? 1000 : 0
    const scoreB = b.status === 'available' ? 1000 : 0
    if (scoreA !== scoreB) return scoreB - scoreA
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const total = items.length
  const page = input.page || 1
  const limit = input.limit || 50
  const start = (page - 1) * limit
  items = items.slice(start, start + limit)

  return { items, total }
}

export const getItemsByOwner = async (ownerId: string): Promise<Item[]> => {
  await db.read()
  const items = db.data!.items.filter((item) => item.ownerId === ownerId)
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items
}

export const updateItem = async (
  id: string,
  updates: Partial<Item>
): Promise<Item | null> => {
  await db.read()
  const index = db.data!.items.findIndex((item) => item.id === id)
  if (index === -1) return null
  db.data!.items[index] = { ...db.data!.items[index], ...updates }
  await db.write()
  return db.data!.items[index]
}

export const deleteItem = async (id: string): Promise<boolean> => {
  await db.read()
  const index = db.data!.items.findIndex((item) => item.id === id)
  if (index === -1) return false
  db.data!.items.splice(index, 1)
  await db.write()
  return true
}
