import type { Bottle } from '../App'

const API_BASE = '/api'

export interface CreateBottleRequest {
  text: string
  imageUrl?: string
  createdBy: string
}

export interface SubmitFeedbackRequest {
  emoji: 'encourage' | 'speechlessness'
}

export const getRandomBottle = async (excludeIds: string[] = []): Promise<Bottle | null> => {
  const params = new URLSearchParams()
  excludeIds.forEach(id => params.append('exclude', id))
  const res = await fetch(`${API_BASE}/bottles/random?${params.toString()}`)
  if (res.status === 404) return null
  return res.json()
}

export const createBottle = async (data: CreateBottleRequest): Promise<Bottle> => {
  const res = await fetch(`${API_BASE}/bottles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export const getBottlesByUser = async (userId: string): Promise<Bottle[]> => {
  const res = await fetch(`${API_BASE}/bottles/user/${userId}`)
  return res.json()
}

export const deleteBottle = async (bottleId: string): Promise<void> => {
  await fetch(`${API_BASE}/bottles/${bottleId}`, {
    method: 'DELETE',
  })
}

export const submitFeedback = async (
  bottleId: string,
  data: SubmitFeedbackRequest
): Promise<Bottle> => {
  const res = await fetch(`${API_BASE}/bottles/${bottleId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}
