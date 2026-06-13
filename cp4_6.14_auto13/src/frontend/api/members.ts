import axios from 'axios';
import type { Member } from '../types';

const BASE = '/api';

export const membersApi = {
  getAll: () => axios.get<Member[]>(`${BASE}/members`).then((r) => r.data),
  create: (data: Omit<Member, 'id'>) =>
    axios.post<Member>(`${BASE}/members`, data).then((r) => r.data),
  update: (id: string, data: Partial<Member>) =>
    axios.put<Member>(`${BASE}/members/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    axios.delete<{ success: boolean }>(`${BASE}/members/${id}`).then((r) => r.data),
};
