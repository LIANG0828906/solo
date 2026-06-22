import axios from 'axios';
import type { GameState, LogEntry } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const saveSnapshot = async (state: GameState): Promise<{ success: boolean; filename: string }> => {
  const response = await api.post('/state', state);
  return response.data;
};

export const loadSnapshot = async (filename: string): Promise<GameState> => {
  const response = await api.post('/state/load', { filename });
  return response.data;
};

export const fetchState = async (): Promise<GameState> => {
  const response = await api.get('/state');
  return response.data;
};

export const fetchLog = async (): Promise<LogEntry[]> => {
  const response = await api.get('/log');
  return response.data;
};

export const appendLog = async (log: LogEntry): Promise<{ success: boolean }> => {
  const response = await api.post('/log', log);
  return response.data;
};

export const fetchSnapshots = async (): Promise<{ filenames: string[] }> => {
  const response = await api.get('/snapshots');
  return response.data;
};

export default api;
