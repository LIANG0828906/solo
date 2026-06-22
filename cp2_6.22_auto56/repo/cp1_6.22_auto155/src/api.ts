import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export interface User {
  id: string
  name: string
}

export interface IssueListItem {
  id: string
  title: string
  description: string
  createdAt: number
  deadline: number
  status: 'ongoing' | 'ended'
  totalVotes: number
  optionCount: number
}

export interface VoteOption {
  id: string
  name: string
  emoji: string
  votes: string[]
}

export interface Comment {
  id: string
  userId: string
  content: string
  createdAt: number
  user?: User
}

export interface VoteRecord {
  optionId: string
  optionName: string
  user: User
}

export interface IssueDetail {
  id: string
  title: string
  description: string
  createdAt: number
  deadline: number
  status: 'ongoing' | 'ended'
  options: VoteOption[]
  comments: Comment[]
  totalVotes: number
  voteRecords: VoteRecord[]
  winningOptionId: string | null
}

export async function fetchUsers(): Promise<User[]> {
  const response = await api.get('/users')
  return response.data
}

export async function fetchIssues(): Promise<IssueListItem[]> {
  const response = await api.get('/issues')
  return response.data
}

export async function fetchIssueDetail(id: string): Promise<IssueDetail> {
  const response = await api.get(`/issues/${id}`)
  return response.data
}

export async function createIssue(data: {
  title: string
  description: string
  options: { name: string; emoji: string }[]
  deadline: number
}): Promise<IssueListItem> {
  const response = await api.post('/issues', data)
  return response.data
}

export async function voteOption(issueId: string, optionId: string, userId: string): Promise<void> {
  await api.post(`/issues/${issueId}/vote`, { optionId, userId })
}

export async function addComment(issueId: string, userId: string, content: string): Promise<Comment> {
  const response = await api.post(`/issues/${issueId}/comments`, { userId, content })
  return response.data
}
