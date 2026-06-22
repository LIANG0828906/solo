import axios from 'axios'
import type { Comment, ApiResponse } from '../../shared/types'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

export async function addComment(itemId: string, content: string): Promise<Comment> {
  const response = await api.post<ApiResponse<Comment>>(`/items/${itemId}/comments`, { content })
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to add comment')
  }
  return response.data.data
}

export default api
