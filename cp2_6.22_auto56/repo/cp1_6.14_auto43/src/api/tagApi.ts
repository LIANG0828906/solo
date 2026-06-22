import axios from 'axios'

export interface Tag {
  id: string
  title: string
  url: string
  group: 'work' | 'study' | 'life' | 'other'
  savedAt: string
  order: number
}

export interface TagCreateRequest {
  title: string
  url: string
  group?: string
}

export interface TagUpdateRequest {
  title?: string
  url?: string
  group?: string
  order?: number
}

const api = axios.create({
  baseURL: '/api/tags',
})

export async function fetchTags(): Promise<Tag[]> {
  const res = await api.get<Tag[]>('/')
  return res.data
}

export async function addTag(data: TagCreateRequest): Promise<Tag> {
  const res = await api.post<Tag>('/', data)
  return res.data
}

export async function updateTag(id: string, data: TagUpdateRequest): Promise<Tag> {
  const res = await api.put<Tag>(`/${id}`, data)
  return res.data
}

export async function deleteTag(id: string): Promise<void> {
  await api.delete(`/${id}`)
}

export async function searchTags(q: string): Promise<Tag[]> {
  const res = await api.get<Tag[]>('/search', { params: { q } })
  return res.data
}
