import type { Spot, TravelPlan, CommunityPost, Comment } from './types'

const baseURL = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${baseURL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json() as T
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API request failed: ${error.message}`)
    }
    throw new Error('API request failed')
  }
}

export function fetchSpots(destination: string): Promise<Spot[]> {
  return request<Spot[]>(`/spots?destination=${encodeURIComponent(destination)}`)
}

export function searchSpots(keyword: string): Promise<Spot[]> {
  return request<Spot[]>(`/spots/search?keyword=${encodeURIComponent(keyword)}`)
}

export function generatePlan(destination: string, days: number): Promise<TravelPlan> {
  return request<TravelPlan>('/plan/generate', {
    method: 'POST',
    body: JSON.stringify({ destination, days }),
  })
}

export function publishPlan(plan: TravelPlan): Promise<CommunityPost> {
  return request<CommunityPost>('/plan/publish', {
    method: 'POST',
    body: JSON.stringify(plan),
  })
}

export function fetchCommunity(): Promise<CommunityPost[]> {
  return request<CommunityPost[]>('/community')
}

export function likePost(postId: string): Promise<{ likes: number; liked: boolean }> {
  return request<{ likes: number; liked: boolean }>(`/community/${postId}/like`, {
    method: 'POST',
  })
}

export function addComment(postId: string, content: string): Promise<Comment> {
  return request<Comment>(`/community/${postId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}
