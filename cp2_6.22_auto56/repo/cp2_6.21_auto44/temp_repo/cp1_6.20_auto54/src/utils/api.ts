import type { Poll, CreatePollRequest } from '@/types/poll'

const BASE_URL = '/api'

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let errorMessage = 'Request failed'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      errorMessage = response.statusText || errorMessage
    }
    throw new ApiError(errorMessage, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return await response.json() as T
}

export async function createPoll(
  pollData: CreatePollRequest
): Promise<{ poll: Poll; code: string }> {
  return request<{ poll: Poll; code: string }>('/polls', {
    method: 'POST',
    body: JSON.stringify(pollData),
  })
}

export async function getPollByCode(
  code: string
): Promise<{ poll: Poll }> {
  return request<{ poll: Poll }>(`/polls/code/${code}`)
}

export async function submitVote(
  pollId: string,
  optionIds: string[],
  participantId: string
): Promise<{ success: boolean; poll: Poll }> {
  return request<{ success: boolean; poll: Poll }>(`/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionIds, participantId }),
  })
}

export async function getPollResults(
  pollId: string
): Promise<{ poll: Poll }> {
  return request<{ poll: Poll }>(`/polls/${pollId}/results`)
}

export async function getHistory(): Promise<{ polls: Poll[] }> {
  return request<{ polls: Poll[] }>('/polls/history')
}

export async function exportCSV(
  pollId: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/polls/${pollId}/export`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    let errorMessage = 'Export failed'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      errorMessage = response.statusText || errorMessage
    }
    throw new ApiError(errorMessage, response.status)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `poll-${pollId}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export async function joinPoll(
  pollId: string,
  participantId: string
): Promise<{ success: boolean; poll: Poll }> {
  return request<{ success: boolean; poll: Poll }>(`/polls/${pollId}/join`, {
    method: 'POST',
    body: JSON.stringify({ participantId }),
  })
}
