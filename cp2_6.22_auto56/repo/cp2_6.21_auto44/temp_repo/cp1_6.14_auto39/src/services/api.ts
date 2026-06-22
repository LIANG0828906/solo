import axios from 'axios'
import type { Artwork, Exhibition, PlacedArtwork, UserData } from '../types'

const api = axios.create({
  baseURL: '/api'
})

export const authAPI = {
  login: async (username: string, password: string): Promise<UserData & { success: boolean; message?: string }> => {
    const res = await api.post('/auth/login', { username, password })
    return res.data
  },
  register: async (username: string, password: string): Promise<UserData & { success: boolean; message?: string }> => {
    const res = await api.post('/auth/register', { username, password })
    return res.data
  }
}

export const artworksAPI = {
  getAll: async (): Promise<Artwork[]> => {
    const res = await api.get('/artworks')
    return res.data
  }
}

export const exhibitionAPI = {
  getByUser: async (userId: string): Promise<Exhibition[]> => {
    const res = await api.get(`/exhibitions/${userId}`)
    return res.data
  },
  create: async (userId: string, name: string, artworks: PlacedArtwork[]): Promise<Exhibition> => {
    const res = await api.post('/exhibitions', { userId, name, artworks })
    return res.data
  },
  update: async (id: string, data: { name?: string; artworks?: PlacedArtwork[] }): Promise<Exhibition> => {
    const res = await api.put(`/exhibitions/${id}`, data)
    return res.data
  },
  getShare: async (id: string): Promise<Exhibition> => {
    const res = await api.get(`/exhibition/share/${id}`)
    return res.data
  },
  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/exhibitions/${id}`)
    return res.data
  }
}
