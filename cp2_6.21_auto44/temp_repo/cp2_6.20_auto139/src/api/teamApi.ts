import axios from 'axios';
import type { TeamData, TeamMember, UpdatePositionRequest } from '../types';

const API_BASE = '/api/team';

export const teamApi = {
  async getTeam(routeId: string): Promise<TeamData> {
    const response = await axios.get(`${API_BASE}/${routeId}`);
    return response.data;
  },

  async getMembers(routeId: string): Promise<TeamMember[]> {
    const response = await axios.get(`${API_BASE}/${routeId}/members`);
    return response.data;
  },

  async updatePosition(data: UpdatePositionRequest): Promise<TeamMember> {
    const response = await axios.post(`${API_BASE}/position`, data);
    return response.data;
  },

  async joinRoute(routeId: string, name: string): Promise<TeamMember> {
    const response = await axios.post(`${API_BASE}/${routeId}/join`, { name });
    return response.data;
  }
};
