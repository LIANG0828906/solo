import axios from 'axios'
import type { Song } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export async function fetchSongs(): Promise<Song[]> {
  const res = await api.get('/songs')
  return res.data.songs
}

export async function fetchSongDetail(id: string): Promise<Song> {
  const res = await api.get(`/songs/${id}`)
  return res.data.song
}

export async function uploadSong(formData: FormData, onProgress?: (progress: number) => void): Promise<Song> {
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
  return res.data.song
}

export async function purchaseSong(songId: string, type: 'digital' | 'cd'): Promise<{ success: boolean; downloadUrl?: string; message: string }> {
  const res = await api.post('/purchase', { songId, type })
  return res.data
}
