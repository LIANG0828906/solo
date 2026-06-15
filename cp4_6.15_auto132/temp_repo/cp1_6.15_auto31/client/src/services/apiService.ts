import { PortfolioState, SaveResponse, PublishResponse } from '../types'

const API_BASE = '/api'

export interface ApiError {
  message: string
  code?: number
}

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
        credentials: 'same-origin',
        ...options,
      })

      let data
      try {
        data = await response.json()
      } catch {
        data = { message: '服务器响应格式错误' }
      }

      if (!response.ok) {
        const error: ApiError = {
          message: data.message || `请求失败 (${response.status})`,
          code: response.status,
        }
        throw error
      }

      return data as T
    } catch (error) {
      if ((error as ApiError).message) {
        throw error
      }
      throw { message: '网络连接失败，请检查网络' }
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

  async deleteProject(projectId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/projects/${projectId}`, {
      method: 'DELETE',
    })
  }

  async listProjects(): Promise<{ id: string; updatedAt: string }[]> {
    return this.request<{ id: string; updatedAt: string }[]>('/projects')
  }
}

export const apiService = new ApiService()
