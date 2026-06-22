import axios from 'axios'
import type { TeamData, TeamMember, MemberStatus } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

export const teamApi = {
  async getTeam(routeId: string): Promise<TeamData> {
    const { data } = await api.get(`/team/${routeId}`)
    return data
  },

  async joinRoute(payload: {
    routeCode: string
    memberName: string
  }): Promise<TeamMember> {
    const { data } = await api.post('/team/join', payload)
    return data
  },

  async updatePosition(payload: {
    memberId: string
    lat: number
    lng: number
    status: MemberStatus
  }): Promise<TeamMember> {
    const { data } = await api.post('/team/position', payload)
    return data
  },
}
