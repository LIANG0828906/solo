export interface Resolution {
  id: string
  content: string
  assignee: string
  deadline: string
  status: 'in_progress' | 'completed'
}

export interface Todo {
  id: string
  description: string
  assignee: string
  priority: 'high' | 'medium' | 'low'
  deadline: string
  completed: boolean
}

export interface Meeting {
  id: string
  title: string
  content: string
  createdAt: string
  resolutions: Resolution[]
  todos: Todo[]
}

export interface CreateMeetingRequest {
  content: string
  title?: string
  file?: File
}

export type Page = 'home' | 'detail'
