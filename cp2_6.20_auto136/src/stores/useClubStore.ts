import { create } from 'zustand'
import { clubApi, applicationApi } from '@/api'
import type {
  Club,
  ClubDetail,
  Activity,
  Member,
  Application,
  ClubCategory,
  ActivityFrequency,
  PaginatedResponse,
} from '@/types'

interface ClubState {
  clubs: Club[]
  clubDetail: ClubDetail | null
  activities: Activity[]
  activitiesTotal: number
  members: Member[]
  myApplications: (Application & { club: Club })[]
  loading: boolean
  error: string | null

  fetchClubs: (params?: {
    category?: ClubCategory
    frequency?: ActivityFrequency
  }) => Promise<void>
  fetchClubDetail: (id: number) => Promise<void>
  fetchClubActivities: (
    id: number,
    page: number,
    pageSize: number
  ) => Promise<void>
  fetchClubMembers: (id: number) => Promise<void>
  applyClub: (id: number, reason?: string) => Promise<Application>
  fetchMyApplications: () => Promise<void>
  clearClubDetail: () => void
}

export const useClubStore = create<ClubState>((set, get) => ({
  clubs: [],
  clubDetail: null,
  activities: [],
  activitiesTotal: 0,
  members: [],
  myApplications: [],
  loading: false,
  error: null,

  fetchClubs: async (params) => {
    set({ loading: true, error: null })
    try {
      const data = await clubApi.getClubs(params)
      set({ clubs: data, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  fetchClubDetail: async (id) => {
    set({ loading: true, error: null })
    try {
      const data = await clubApi.getClubDetail(id)
      set({ clubDetail: data, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  fetchClubActivities: async (id, page, pageSize) => {
    set({ loading: true, error: null })
    try {
      const data: PaginatedResponse<Activity> = await clubApi.getClubActivities(
        id,
        { page, pageSize }
      )
      set({
        activities: data.items,
        activitiesTotal: data.total,
        loading: false,
      })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  fetchClubMembers: async (id) => {
    try {
      const data = await clubApi.getClubMembers(id)
      set({ members: data })
    } catch (_err) {
      // ignore
    }
  },

  applyClub: async (id, reason) => {
    const data = await clubApi.applyClub(id, reason ? { reason } : undefined)
    const { clubDetail, myApplications } = get()
    if (clubDetail && clubDetail.id === id) {
      set({
        clubDetail: {
          ...clubDetail,
          memberCount: clubDetail.memberCount + 1,
        },
      })
    }
    return data
  },

  fetchMyApplications: async () => {
    set({ loading: true, error: null })
    try {
      const data = await applicationApi.getMyApplications()
      set({ myApplications: data, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  clearClubDetail: () => {
    set({ clubDetail: null, activities: [], members: [], activitiesTotal: 0 })
  },
}))
