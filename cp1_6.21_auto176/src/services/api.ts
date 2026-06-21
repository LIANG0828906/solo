import axios from 'axios'
import type { ContentItem, Material, CalendarDay, ScheduleEntry, SyncLog, PublishStatus, Platform } from '@/types'

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
})

export const contentApi = {
  getContent: () => api.get<ContentItem[]>('/content').then(r => r.data),

  createContent: (data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<ContentItem>('/content', data).then(r => r.data),

  updateContent: (id: string, data: Partial<ContentItem>) =>
    api.put<ContentItem>(`/content/${id}`, data).then(r => r.data),

  deleteContent: (id: string) =>
    api.delete(`/content/${id}`).then(r => r.data),

  updateStatus: (id: string, status: PublishStatus) =>
    api.put<ContentItem>(`/content/${id}/status`, { status }).then(r => r.data),

  reorderContent: (orderedIds: string[]) =>
    api.put('/content/reorder', { orderedIds }).then(r => r.data),
}

export const materialApi = {
  getMaterials: (page = 1, limit = 20) =>
    api.get<{ items: Material[]; total: number }>('/materials', { params: { page, limit } }).then(r => r.data),

  uploadMaterial: (file: File, type: 'image' | 'video') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return api.post<Material>('/materials/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  deleteMaterial: (id: string) =>
    api.delete(`/materials/${id}`).then(r => r.data),

  linkMaterial: (id: string, contentId: string) =>
    api.post(`/materials/${id}/link`, { contentId }).then(r => r.data),
}

export const calendarApi = {
  getCalendar: (year: number, month: number) =>
    api.get<CalendarDay[]>(`/calendar/${year}/${month}`).then(r => r.data),

  createSchedule: (data: { contentId: string; date: string; platforms: Platform[] }) =>
    api.post<ScheduleEntry>('/calendar/schedule', data).then(r => r.data),

  updateSchedule: (id: string, data: Partial<ScheduleEntry>) =>
    api.put<ScheduleEntry>(`/calendar/schedule/${id}`, data).then(r => r.data),

  getSyncLogs: (contentId?: string) =>
    api.get<SyncLog[]>('/calendar/logs', { params: contentId ? { contentId } : {} }).then(r => r.data),

  simulatePublish: (id: string) =>
    api.post<SyncLog[]>(`/calendar/simulate-publish/${id}`).then(r => r.data),
}
