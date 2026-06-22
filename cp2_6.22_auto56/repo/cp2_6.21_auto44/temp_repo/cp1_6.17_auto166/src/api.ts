import type { Work, Exhibition, Comment } from './store'

const BASE = '/api'

export async function fetchWorks(tag?: string, sort?: string): Promise<Work[]> {
  const params = new URLSearchParams()
  if (tag) params.set('tag', tag)
  if (sort) params.set('sort', sort)
  const query = params.toString()
  const res = await fetch(`${BASE}/works${query ? `?${query}` : ''}`)
  const json = await res.json()
  return json.data.map((w: Work) => ({ ...w, liked: false }))
}

export async function fetchWork(id: string): Promise<Work> {
  const res = await fetch(`${BASE}/works/${id}`)
  const json = await res.json()
  return { ...json.data, liked: false }
}

export async function createWork(data: {
  title: string
  imageUrl: string
  shootDate: string
  cameraParams: string
  tags: string[]
}): Promise<Work> {
  const res = await fetch(`${BASE}/works`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  return { ...json.data, liked: false }
}

export async function updateWork(
  id: string,
  data: Partial<Pick<Work, 'title' | 'shootDate' | 'cameraParams' | 'tags'>>
): Promise<Work> {
  const res = await fetch(`${BASE}/works/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  return { ...json.data, liked: false }
}

export async function deleteWork(id: string): Promise<void> {
  await fetch(`${BASE}/works/${id}`, { method: 'DELETE' })
}

export async function likeWork(id: string, userId: string): Promise<{ likes: number; liked: boolean }> {
  const res = await fetch(`${BASE}/works/${id}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  const json = await res.json()
  return json.data
}

export async function addComment(
  workId: string,
  author: string,
  content: string
): Promise<Comment> {
  const res = await fetch(`${BASE}/works/${workId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, content }),
  })
  const json = await res.json()
  return json.data
}

export async function createExhibition(
  name: string,
  workIds: string[]
): Promise<Exhibition> {
  const res = await fetch(`${BASE}/exhibitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, workIds }),
  })
  const json = await res.json()
  return json.data
}

export async function fetchExhibition(id: string): Promise<Exhibition> {
  const res = await fetch(`${BASE}/exhibitions/${id}`)
  const json = await res.json()
  return json.data
}

export async function fetchExhibitions(): Promise<Exhibition[]> {
  const res = await fetch(`${BASE}/exhibitions`)
  const json = await res.json()
  return json.data
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
