import type { Template, Component } from '../types'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    })

    const result = (await response.json()) as ApiResponse<T>

    if (!result.success || !response.ok) {
      throw new Error(result.error || `Request failed with status ${response.status}`)
    }

    return result.data as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Network error occurred')
  }
}

export async function getTemplates(): Promise<Template[]> {
  return request<Template[]>('/templates', {
    method: 'GET',
  })
}

export async function saveTemplate(template: {
  name: string
  description?: string
  thumbnail?: string
  components: Component[]
}): Promise<Template> {
  return request<Template>('/templates', {
    method: 'POST',
    body: JSON.stringify(template),
  })
}

export async function loadTemplate(id: string): Promise<Template> {
  return request<Template>(`/templates/${id}`, {
    method: 'GET',
  })
}

export async function deleteTemplate(id: string): Promise<Template> {
  return request<Template>(`/templates/${id}`, {
    method: 'DELETE',
  })
}

export async function updateTemplate(
  id: string,
  updates: Partial<{
    name: string
    description: string
    thumbnail: string
    components: Component[]
  }>
): Promise<Template> {
  return request<Template>(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}
