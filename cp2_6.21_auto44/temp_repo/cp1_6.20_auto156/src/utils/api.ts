import type {
  Episode,
  Comment,
  EpisodeStats,
  CreateEpisodeRequest,
  CreateCommentRequest,
  ApiResponse,
  CommentsResponse,
} from '@/types'

const BASE_URL = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    const data: ApiResponse<T> = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || `请求失败: ${response.status}`)
    }

    return data.data as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('网络请求失败，请稍后重试')
  }
}

export function createEpisode(data: CreateEpisodeRequest): Promise<Episode> {
  return request<Episode>('/episodes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getEpisode(id: string): Promise<Episode> {
  return request<Episode>(`/episodes/${id}`)
}

export function createComment(
  episodeId: string,
  data: CreateCommentRequest,
): Promise<Comment> {
  return request<Comment>(`/episodes/${episodeId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getComments(
  episodeId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<CommentsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  return request<CommentsResponse>(`/episodes/${episodeId}/comments?${params}`)
}

export function getStats(episodeId: string): Promise<EpisodeStats> {
  return request<EpisodeStats>(`/episodes/${episodeId}/stats`)
}
