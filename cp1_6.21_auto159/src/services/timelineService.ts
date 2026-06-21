import axios from 'axios';
import type { LogEntry, MemberLoad } from '@/types';

const api = axios.create({ baseURL: '/api' });

export const getLogs = (boardId: string): Promise<LogEntry[]> =>
  api.get<LogEntry[]>(`/boards/${boardId}/logs`).then((r) => r.data);

export const getMemberLoad = (boardId: string): Promise<MemberLoad[]> =>
  api.get<MemberLoad[]>(`/boards/${boardId}/member-load`).then((r) => r.data);
