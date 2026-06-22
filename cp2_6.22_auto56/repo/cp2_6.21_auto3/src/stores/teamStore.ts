import { create } from 'zustand'
import { teamApi } from '../api/teamApi'
import type { TeamData, TeamMember, MemberStatus } from '../types'

interface TeamStore {
  teamData: TeamData | null
  currentMember: TeamMember | null
  loading: boolean
  error: string | null
  consecutiveFailures: number
  fetchTeam: (routeId: string) => Promise<void>
  joinRoute: (routeCode: string, memberName: string) => Promise<TeamMember>
  updatePosition: (
    memberId: string,
    lat: number,
    lng: number,
    status: MemberStatus,
  ) => Promise<void>
  setCurrentMember: (member: TeamMember | null) => void
  resetFailures: () => void
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  teamData: null,
  currentMember: null,
  loading: false,
  error: null,
  consecutiveFailures: 0,

  setCurrentMember: (member) => set({ currentMember: member }),

  resetFailures: () => set({ consecutiveFailures: 0 }),

  fetchTeam: async (routeId) => {
    try {
      const data = await teamApi.getTeam(routeId)
      set({ teamData: data, error: null })
    } catch (e) {
      set({ error: '加载队伍数据失败' })
    }
  },

  joinRoute: async (routeCode, memberName) => {
    set({ loading: true, error: null })
    try {
      const member = await teamApi.joinRoute({ routeCode, memberName })
      set({ currentMember: member, loading: false })
      return member
    } catch (e) {
      set({ error: '加入路线失败', loading: false })
      throw e
    }
  },

  updatePosition: async (memberId, lat, lng, status) => {
    try {
      const member = await teamApi.updatePosition({ memberId, lat, lng, status })
      set({
        currentMember: member,
        consecutiveFailures: 0,
        error: null,
      })
    } catch (e) {
      const failures = get().consecutiveFailures + 1
      set({
        consecutiveFailures: failures,
        error: failures >= 2 ? '位置同步失败' : null,
      })
    }
  },
}))
