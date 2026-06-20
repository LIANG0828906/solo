import type { Poem, Comment } from '@/types'

const API_BASE = '/api'

export async function fetchPoems(): Promise<Poem[]> {
  const response = await fetch(`${API_BASE}/poems`)
  if (!response.ok) {
    throw new Error('Failed to fetch poems')
  }
  const data = await response.json()
  return data.poems
}

export async function fetchPoemById(id: string): Promise<Poem> {
  const response = await fetch(`${API_BASE}/poems/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch poem')
  }
  const data = await response.json()
  return data.poem
}

export async function fetchComments(poemId: string): Promise<Comment[]> {
  const response = await fetch(`${API_BASE}/poems/${poemId}/comments`)
  if (!response.ok) {
    return []
  }
  const data = await response.json()
  return data.comments
}

export async function postComment(params: {
  poemId: string
  author: string
  content: string
  mentions?: string[]
}): Promise<Comment> {
  const response = await fetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    throw new Error('Failed to post comment')
  }
  const data = await response.json()
  return data.comment
}

export async function likePoem(poemId: string): Promise<{ likes: number }> {
  const response = await fetch(`${API_BASE}/poems/${poemId}/like`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error('Failed to like poem')
  }
  return response.json()
}
