import type { Plant, CareEvent, HealthAnalysis } from '@/types'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getPlants: () => request<Plant[]>('/plants'),

  getPlant: (id: string) => request<Plant>(`/plants/${id}`),

  createPlant: (data: Omit<Plant, 'id'>) =>
    request<Plant>('/plants', { method: 'POST', body: JSON.stringify(data) }),

  updatePlant: (id: string, data: Partial<Plant>) =>
    request<Plant>(`/plants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deletePlant: (id: string) =>
    request<{ success: boolean }>(`/plants/${id}`, { method: 'DELETE' }),

  getEvents: (plantId: string) =>
    request<CareEvent[]>(`/plants/${plantId}/events`),

  createEvent: (plantId: string, data: { type: string; date: string; notes?: string }) =>
    request<CareEvent>(`/plants/${plantId}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteEvent: (eventId: string) =>
    request<{ success: boolean }>(`/events/${eventId}`, { method: 'DELETE' }),

  getHealthAnalysis: () =>
    request<HealthAnalysis>('/health-analysis'),
}
