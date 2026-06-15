import axios from 'axios'
import type { Board, BoardsListResponse, ColorItem, ImageItem } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export const boardApi = {
  getBoards: (page: number = 1, pageSize: number = 6) =>
    api.get<BoardsListResponse>('/boards', { params: { page, pageSize } }).then(res => res.data),

  getBoard: (id: string) =>
    api.get<Board>(`/boards/${id}`).then(res => res.data),

  createBoard: (title: string, description: string = '') =>
    api.post<Board>('/boards', { title, description }).then(res => res.data),

  updateBoard: (id: string, data: { title?: string; description?: string }) =>
    api.put<Board>(`/boards/${id}`, data).then(res => res.data),

  deleteBoard: (id: string) =>
    api.delete(`/boards/${id}`).then(res => res.data),

  updatePalette: (boardId: string, palette: ColorItem[]) =>
    api.put<{ palette: ColorItem[] }>(`/boards/${boardId}/palette`, { palette }).then(res => res.data),

  updateImage: (boardId: string, imageId: string, data: { composition?: string; colors?: ColorItem[] }) =>
    api.put<ImageItem>(`/boards/${boardId}/images/${imageId}`, data).then(res => res.data),

  deleteImage: (boardId: string, imageId: string) =>
    api.delete(`/boards/${boardId}/images/${imageId}`).then(res => res.data),
}

export const extractApi = {
  uploadImage: (boardId: string, file: File, onProgress?: (progress: number) => void) =>
    api.post<{ image: ImageItem }>(
      `/extract/${boardId}`,
      (() => {
        const formData = new FormData()
        formData.append('image', file)
        return formData
      })(),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 50
            onProgress(progress)
          }
        },
      }
    ).then(res => res.data),
}
