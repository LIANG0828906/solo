import type { ApiResponse, Script, Version, DiffResult } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const result = await response.json().catch(() => ({
      success: false,
      error: 'Request failed',
    })) as ApiResponse<T>

    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP ${response.status}`)
    }

    if (result.data === undefined) {
      throw new Error('No data received')
    }

    return result.data
  }

  async getScripts(): Promise<Script[]> {
    return this.request<Script[]>('/scripts')
  }

  async createScript(title: string, content: string, description?: string): Promise<Script> {
    return this.request<Script>('/scripts', {
      method: 'POST',
      body: JSON.stringify({ title, content, description }),
    })
  }

  async getScript(id: string): Promise<Script> {
    return this.request<Script>(`/scripts/${id}`)
  }

  async updateScript(id: string, data: { title?: string; description?: string; content?: string }): Promise<Script> {
    return this.request<Script>(`/scripts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getVersions(scriptId: string): Promise<Version[]> {
    return this.request<Version[]>(`/scripts/${scriptId}/versions`)
  }

  async createVersion(
    scriptId: string,
    content: string,
    message?: string
  ): Promise<Version> {
    return this.request<Version>(`/scripts/${scriptId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ content, message }),
    })
  }

  async getVersion(scriptId: string, versionId: string): Promise<Version> {
    return this.request<Version>(`/scripts/${scriptId}/versions/${versionId}`)
  }

  async compareVersions(
    scriptId: string,
    oldVersionId: string,
    newVersionId: string
  ): Promise<DiffResult> {
    return this.request<DiffResult>(`/scripts/${scriptId}/diff`, {
      method: 'POST',
      body: JSON.stringify({ oldVersionId, newVersionId }),
    })
  }
}

export const apiClient = new ApiClient()
