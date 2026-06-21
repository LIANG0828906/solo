import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const fetchClasses = () => api.get('/classes');

export const createClass = (data: { name: string; students: string }) =>
  api.post('/classes', data);

export const fetchClass = (id: string) => api.get(`/classes/${id}`);

export const generateGroups = (classId: string, groupSize: number) =>
  api.post(`/classes/${classId}/groups`, { groupSize });

export const fetchGroups = (classId: string) =>
  api.get(`/classes/${classId}/groups`);

export const claimTask = (groupId: string, classId: string) =>
  api.post('/tasks/claim', { groupId, classId });

export const submitProgress = (
  groupId: string,
  text: string,
  rating: number
) => api.post('/tasks/progress', { groupId, text, rating });

export const fetchAllProgress = () => api.get('/admin/progress');
