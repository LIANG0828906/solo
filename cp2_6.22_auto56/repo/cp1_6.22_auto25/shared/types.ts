export type ReviewStatus = 'pending' | 'approved' | 'changes_required'

export interface User {
  id: string
  name: string
  avatar: string
  color: string
}

export interface CodeDiff {
  filename: string
  oldCode: string[]
  newCode: string[]
  language: string
}

export interface Review {
  id: string
  title: string
  description: string
  creator: User
  reviewers: User[]
  codeSnippet: CodeDiff
  status: ReviewStatus
  deadline: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  reviewId: string
  lineNumber: number
  author: User
  content: string
  createdAt: string
  replies?: Comment[]
  proposedChange?: {
    oldLine: string
    newLine: string
  }
}

export interface Notification {
  id: string
  userId: string
  type: 'status_change' | 'new_comment' | 'new_review' | 'reply' | 'proposal'
  title: string
  message: string
  reviewId: string
  read: boolean
  createdAt: string
}

export interface Activity {
  id: string
  type: 'comment' | 'status_change' | 'review_created' | 'proposal'
  user: User
  reviewId: string
  reviewTitle: string
  timestamp: string
  description: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
