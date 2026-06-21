import axios, { AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export interface MemberData {
  id: string;
  name: string;
  birth_year: number;
  death_year?: number | null;
  gender?: string | null;
  role?: string | null;
  x?: number;
  y?: number;
}

export interface EventData {
  id: string;
  member_id: string;
  name: string;
  year: number;
  event_type: string;
  description?: string | null;
}

export interface RelationData {
  id: string;
  from_member_id: string;
  to_member_id: string;
  relation_type: string;
  control_x?: number | null;
  control_y?: number | null;
}

export interface LifeSpanData {
  member_id: string;
  name: string;
  lifespan: number;
  is_deceased: boolean;
}

export interface StatsData {
  total_members: number;
  total_events: number;
  max_age_diff: number;
  avg_lifespan: number;
  age_distribution: Record<string, number>;
  event_type_counts: Record<string, number>;
  avg_generation_gap: number;
  generation_gaps: number[];
  birth_year_lcm: number;
}

export interface TimelineData {
  events: EventData[];
  members: MemberData[];
  min_year: number;
  max_year: number;
  generation_gaps: number[];
  avg_generation_gap: number;
  birth_year_lcm: number;
  life_spans: LifeSpanData[];
}

export interface ExportData {
  version: string;
  timestamp: string;
  members: MemberData[];
  events: EventData[];
  relations: RelationData[];
}

export const getMembers = async (): Promise<{ members: MemberData[]; relations: RelationData[] }> => {
  const response = await api.get('/members');
  return response.data;
};

export const addMember = async (member: MemberData): Promise<MemberData> => {
  const response = await api.post('/members', member);
  return response.data;
};

export const updateMemberPosition = async (memberId: string, x: number, y: number): Promise<MemberData> => {
  const response = await api.put(`/members/${memberId}/position`, { x, y });
  return response.data;
};

export const getEvents = async (memberId?: string): Promise<{ events: EventData[] }> => {
  const params = memberId ? { member_id: memberId } : {};
  const response = await api.get('/events', { params });
  return response.data;
};

export const addEvent = async (event: {
  member_id: string;
  name: string;
  year: number;
  event_type: string;
  description?: string;
}): Promise<EventData> => {
  const response = await api.post('/events', event);
  return response.data;
};

export const deleteEvent = async (eventId: string): Promise<EventData> => {
  const response = await api.delete(`/events/${eventId}`);
  return response.data;
};

export const getTimelineData = async (): Promise<TimelineData> => {
  const response = await api.get('/timeline');
  return response.data;
};

export const addRelation = async (rel: {
  from_member_id: string;
  to_member_id: string;
  relation_type: string;
}): Promise<RelationData> => {
  const response = await api.post('/relations', rel);
  return response.data;
};

export const updateRelation = async (
  relationId: string,
  data: { relation_type?: string; control_x?: number; control_y?: number }
): Promise<RelationData> => {
  const response = await api.put(`/relations/${relationId}`, data);
  return response.data;
};

export const deleteRelation = async (relationId: string): Promise<RelationData> => {
  const response = await api.delete(`/relations/${relationId}`);
  return response.data;
};

export const getStats = async (): Promise<StatsData> => {
  const response = await api.get('/stats');
  return response.data;
};

export const exportData = async (): Promise<ExportData> => {
  const response = await api.get('/export');
  return response.data;
};

export const importData = async (data: ExportData): Promise<{ message: string; members_count: number; events_count: number }> => {
  const response = await api.post('/import', data);
  return response.data;
};

export default api;
