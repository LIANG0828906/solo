import axios from 'axios'

export interface Bookmark {
  id: string
  url: string
  title: string
  description: string
  favicon: string | null
  category: string
  note: string
  createdAt: number
  position: number
}

export interface Category {
  id: string
  name: string
  color: string
}

const api = axios.create({
  baseURL: '/api',
  timeout: 5000
})

export const getBookmarks = async (): Promise<Bookmark[]> => {
  const response = await api.get('/bookmarks')
  return response.data
}

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/categories')
  return response.data
}

export const createBookmark = async (url: string): Promise<Bookmark> => {
  const response = await api.post('/bookmarks', { url })
  return response.data
}

export const updateBookmark = async (id: string, data: { category?: string; position?: number }): Promise<Bookmark> => {
  const response = await api.put(`/bookmarks/${id}`, data)
  return response.data
}

let noteDebounceTimer: ReturnType<typeof setTimeout> | null = null

export const updateBookmarkNote = async (id: string, note: string): Promise<Bookmark> => {
  if (noteDebounceTimer) {
    clearTimeout(noteDebounceTimer)
  }
  
  return new Promise((resolve) => {
    noteDebounceTimer = setTimeout(async () => {
      const response = await api.put(`/bookmarks/${id}/note`, { note })
      resolve(response.data)
    }, 1000)
  })
}

export const deleteBookmark = async (id: string): Promise<void> => {
  await api.delete(`/bookmarks/${id}`)
}