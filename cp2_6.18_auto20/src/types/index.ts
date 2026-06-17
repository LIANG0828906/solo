export interface User {
  id: string
  name: string
  avatar: string
}

export interface BookList {
  id: string
  title: string
  description: string
  tags: string[]
  userId: string
  createdAt: number
  likedBy: string[]
}

export interface Comment {
  id: string
  content: string
  userId: string
  bookListId: string
  createdAt: number
}

export interface Rating {
  id: string
  value: 1 | 2 | 3 | 4 | 5
  userId: string
  bookListId: string
  createdAt: number
}

export interface Like {
  id: string
  userId: string
  bookListId: string
  createdAt: number
}

export interface BookListWithStats extends BookList {
  averageRating: number
  commentCount: number
  likeCount: number
  hotScore: number
  userHasLiked: boolean
  userRating: number | null
}

export const PRESET_TAGS = ['科幻', '哲学', '心理学', '历史', '文学', '科技', '艺术', '经济', '教育', '生活']
