export interface Game {
  id: string
  title: string
  developer: string
  description: string
  screenshots: string[]
  thumbnail: string
  htmlPrototype: string
  tags: string[]
  createdAt: number
  averageRating: number
  reviewCount: number
}

export interface Review {
  id: string
  gameId: string
  userId: string
  userName: string
  content: string
  rating: number
  tags: string[]
  createdAt: number
}

const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }
  return response.json()
}

export async function getGames(params?: {
  tag?: string
  search?: string
  sort?: string
}): Promise<Game[]> {
  const queryParams = new URLSearchParams()
  if (params?.tag) queryParams.set('tag', params.tag)
  if (params?.search) queryParams.set('search', params.search)
  if (params?.sort) queryParams.set('sort', params.sort)
  const query = queryParams.toString()
  return request<Game[]>(`/games${query ? `?${query}` : ''}`)
}

export async function getGameById(id: string): Promise<Game> {
  return request<Game>(`/games/${id}`)
}

export async function getReviewsByGameId(gameId: string): Promise<Review[]> {
  return request<Review[]>(`/games/${gameId}/reviews`)
}

export async function addGame(game: {
  title: string
  developer: string
  description?: string
  screenshots?: string[]
  thumbnail?: string
  htmlPrototype?: string
  tags?: string[]
}): Promise<Game> {
  return request<Game>('/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game),
  })
}

export async function addReview(
  gameId: string,
  review: {
    userId: string
    content: string
    rating: number
    tags?: string[]
  }
): Promise<Review> {
  return request<Review>(`/games/${gameId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  })
}

export async function getAvailableTags(): Promise<string[]> {
  return request<string[]>('/tags')
}
