export interface UserProfile {
  id: string
  username: string
  avatar: string
  bio: string
  recipeCount: number
  followerCount: number
  followingCount: number
}

export interface Comment {
  id: string
  recipeId: string
  userId: string
  username: string
  avatar: string
  content: string
  createdAt: string
  likes: number
  isLiked: boolean
  replies?: Comment[]
}

export interface Rating {
  id: string
  recipeId: string
  userId: string
  score: 1 | 2 | 3 | 4 | 5
  comment?: string
  createdAt: string
}

export interface CommunityRecipe {
  recipeId: string
  authorId: string
  authorName: string
  authorAvatar: string
  title: string
  coverImage?: string
  cuisine: string
  difficulty: number
  totalTime: number
  favoriteCount: number
  commentCount: number
  averageRating: number
  ratingCount: number
  isFavorited: boolean
  myRating?: number
  createdAt: string
}
