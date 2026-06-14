import { PortfolioState, SaveResponse, PublishResponse } from '../types'

const API_BASE = '/api'

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '请求失败')
      }

      return data as T
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('网络请求失败')
    }
  }

  async saveProject(state: PortfolioState): Promise<SaveResponse> {
    return this.request<SaveResponse>('/projects/save', {
      method: 'POST',
      body: JSON.stringify(state),
    })
  }

  async publishProject(state: PortfolioState): Promise<PublishResponse> {
    return this.request<PublishResponse>('/projects/publish', {
      method: 'POST',
      body: JSON.stringify(state),
    })
  }

  async getProject(projectId: string): Promise<PortfolioState> {
    return this.request<PortfolioState>(`/projects/${projectId}`)
  }
}

export const apiService = new ApiService()
