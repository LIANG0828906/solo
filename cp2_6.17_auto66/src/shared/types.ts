export interface Project {
  id: string
  title: string
  description: string
  images: string[]
  author: string
  createdAt: number
}

export interface Activity {
  id: string
  type: 'like' | 'comment'
  projectId: string
  projectTitle: string
  user: string
  content?: string
  createdAt: number
}

export interface Like {
  projectId: string
  userId: string
}

export interface Comment {
  id: string
  projectId: string
  user: string
  content: string
  createdAt: number
}

export const CURRENT_USER_ID = 'current_user'
export const CURRENT_USER_NAME = '我'
