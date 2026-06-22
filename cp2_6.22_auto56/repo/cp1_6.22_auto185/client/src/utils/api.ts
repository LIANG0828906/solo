import type { Team, TeamMember, Meeting } from './types';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, ...rest } = options;
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...rest,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data as T;
}

export const api = {
  getTimezones: () => request<{ timezones: string[] }>('/timezones'),

  createTeam: (name: string, description: string) =>
    request<{ team: Team }>('/teams', {
      method: 'POST',
      body: { name, description },
    }),

  getTeams: () => request<{ teams: Team[] }>('/teams'),

  getTeam: (id: string) => request<{ team: Team }>(`/teams/${id}`),

  deleteTeam: (id: string) => request<{ success: boolean }>(`/teams/${id}`, {
    method: 'DELETE',
  }),

  addMember: (teamId: string, data: Partial<TeamMember>) =>
    request<{ member: TeamMember }>(`/teams/${teamId}/members`, {
      method: 'POST',
      body: data,
    }),

  updateMember: (teamId: string, memberId: string, data: Partial<TeamMember>) =>
    request<{ member: TeamMember }>(`/teams/${teamId}/members/${memberId}`, {
      method: 'PUT',
      body: data,
    }),

  deleteMember: (teamId: string, memberId: string) =>
    request<{ success: boolean }>(`/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  getAvailabilityMatrix: (teamId: string, date: string) =>
    request<{
      matrix: { [hour: number]: string[] };
      members: TeamMember[];
      totalMembers: number;
    }>(`/teams/${teamId}/availability-matrix`, {
      method: 'POST',
      body: { date },
    }),

  getRecommendations: (teamId: string, date: string) =>
    request<{
      recommendations: Array<{
        startHourUTC: number;
        endHourUTC: number;
        availableMemberIds: string[];
        availableMembers: TeamMember[];
        score: number;
      }>;
    }>(`/teams/${teamId}/recommendations`, {
      method: 'POST',
      body: { date },
    }),

  createMeeting: (data: {
    teamId: string;
    title: string;
    date: string;
    startTimeUTC: string;
    endTimeUTC: string;
    durationMinutes: number;
    notes?: string;
    participantIds: string[];
  }) =>
    request<{ meeting: Meeting }>('/meetings', {
      method: 'POST',
      body: data,
    }),

  getMeetings: (teamId?: string) =>
    request<{ meetings: Meeting[] }>(
      `/meetings${teamId ? `?teamId=${encodeURIComponent(teamId)}` : ''}`
    ),

  getUpcomingMeetings: () =>
    request<{ meetings: Meeting[] }>('/meetings/upcoming'),

  deleteMeeting: (id: string) =>
    request<{ success: boolean }>(`/meetings/${id}`, {
      method: 'DELETE',
    }),
};
