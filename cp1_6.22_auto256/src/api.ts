import type { User, Team, Vote, PlanHistory, RecommendedPlan, WeatherData, SportItem, FitnessLevel, SportType } from '@/types'

const API_BASE = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export async function getCurrentUser(): Promise<{ user: User }> {
  return request<{ user: User }>('/user/current')
}

export async function updateUserPreferences(
  fitnessLevel: FitnessLevel,
  preferences: SportType[],
  locationRadius: number
): Promise<{ user: User }> {
  return request<{ user: User }>('/user/preferences', {
    method: 'PUT',
    body: JSON.stringify({ fitnessLevel, preferences, locationRadius })
  })
}

export async function getUserHistory(): Promise<{ history: PlanHistory[] }> {
  return request<{ history: PlanHistory[] }>('/user/history')
}

export async function getRecommendations(userId: string): Promise<{ plans: RecommendedPlan[]; weather: WeatherData[] }> {
  return request<{ plans: RecommendedPlan[]; weather: WeatherData[] }>(`/plan/recommendations?userId=${userId}`)
}

export async function getSports(): Promise<{ sports: SportItem[] }> {
  return request<{ sports: SportItem[] }>('/plan/sports')
}

export async function createTeam(team: Team): Promise<{ team: Team }> {
  return request<{ team: Team }>('/team', {
    method: 'POST',
    body: JSON.stringify(team)
  })
}

export async function joinTeam(teamId: string, user: User): Promise<{ team: Team }> {
  return request<{ team: Team }>('/team/join', {
    method: 'POST',
    body: JSON.stringify({ userId: user.id, inviteCode: '' })
  })
}

export async function getTeam(teamId: string): Promise<{ team: Team }> {
  return request<{ team: Team }>(`/team/${teamId}`)
}

export async function startVote(teamId: string, vote: Vote): Promise<{ vote: Vote }> {
  return request<{ vote: Vote }>(`/team/${teamId}/vote/start`, {
    method: 'PUT',
    body: JSON.stringify({ leaderId: '', options: vote.options })
  })
}

export async function submitVote(teamId: string, userId: string, optionId: string): Promise<{ vote: Vote }> {
  return request<{ vote: Vote }>(`/team/${teamId}/vote`, {
    method: 'PUT',
    body: JSON.stringify({ userId, optionId })
  })
}

export async function getVoteStatus(teamId: string): Promise<{ vote: Vote }> {
  return request<{ vote: Vote }>(`/team/${teamId}/vote`)
}
