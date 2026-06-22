export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface Script {
  id: string
  title: string
  description: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Version {
  id: string
  scriptId: string
  version: number
  content: string
  message: string
  author: string
  createdAt: string
}

export interface Collaborator {
  id: string
  name: string
  avatarColor: string
  currentLine?: number
}

export interface DiffChange {
  type: 'added' | 'removed' | 'unchanged'
  value: string
  lineNumber: number
}

export interface DiffResult {
  added: number
  removed: number
  modified: number
  changes: DiffChange[]
}

export interface UserJoinedEvent {
  userId: string
  userName: string
  users: string[]
}

export interface UserLeftEvent {
  userId: string
  userName?: string
  users: string[]
}

export interface CursorEvent {
  userId: string
  userName: string
  line: number
  column: number
}

export interface CursorRemovedEvent {
  userId: string
}

export interface EditEvent {
  content: string
  userId: string
}
