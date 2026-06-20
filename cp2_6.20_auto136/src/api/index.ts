import axios from 'axios'
import type {
  Club,
  ClubDetail,
  Activity,
  Member,
  Application,
  PaginatedResponse,
  ClubCategory,
  ActivityFrequency,
} from '@/types'

const request = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
)

export const clubApi = {
  getClubs: (params?: {
    category?: ClubCategory
    frequency?: ActivityFrequency
  }) => request.get<any, Club[]>('/clubs', { params }),

  getClubDetail: (id: number) => request.get<any, ClubDetail>(`/clubs/${id}`),

  getClubActivities: (
    id: number,
    params: { page: number; pageSize: number }
  ) =>
    request.get<any, PaginatedResponse<Activity>>(
      `/clubs/${id}/activities`,
      { params }
    ),

  getClubMembers: (id: number) =>
    request.get<any, Member[]>(`/clubs/${id}/members`),

  applyClub: (id: number, data?: { reason?: string }) =>
    request.post<any, Application>(`/clubs/${id}/apply`, data),
}

export const applicationApi = {
  getMyApplications: () =>
    request.get<any, (Application & { club: Club })[]>('/my-applications'),
}
