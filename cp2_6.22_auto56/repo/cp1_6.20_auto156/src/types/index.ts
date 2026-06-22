export interface Guest {
  name: string
  avatar: string
}

export interface TimelineItem {
  id: string
  timestamp: number
  title: string
  description: string
}

export interface Episode {
  id: string
  podcastName: string
  episodeNumber: string
  coverImage: string
  audioUrl: string
  guests: Guest[]
  description: string
  timeline: TimelineItem[]
  createdAt: string
  visitCount: number
}

export interface Comment {
  id: string
  nickname: string
  content: string
  timestamp?: number
  createdAt: string
}

export interface EpisodeStats {
  visitCount: number
  commentCount: number
  topTimeSegments: {
    segment: string
    count: number
  }[]
}

export interface CreateEpisodeRequest {
  podcastName: string
  episodeNumber: string
  coverImage: string
  audioUrl: string
  guests: Guest[]
  description: string
  timeline: TimelineItem[]
}

export interface CreateCommentRequest {
  nickname: string
  content: string
  timestamp?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface CommentsResponse {
  list: Comment[]
  total: number
  page: number
  pageSize: number
}
