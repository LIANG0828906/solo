import axios from 'axios';
import type { Task, TimerState, SummaryResponse } from '../../shared/types';

const API_BASE = '/api/tasks';

export interface CreateTaskData {
  name: string;
  clientId?: string | null;
  startTime: string;
  endTime: string;
}

export interface UpdateTaskData {
  name?: string;
  clientId?: string | null;
  startTime?: string;
  endTime?: string;
}

export interface SummaryParams {
  startDate?: string;
  endDate?: string;
  clientId?: string;
}

export async function getTasks(clientId?: string, limit = 20, offset = 0): Promise<Task[]> {
  const params: Record<string, any> = { limit, offset };
  if (clientId) params.clientId = clientId;
  
  const response = await axios.get(`${API_BASE}`, { params });
  return response.data.data;
}

export async function getSummary(params: SummaryParams): Promise<SummaryResponse> {
  const response = await axios.get(`${API_BASE}/summary`, { params });
  return response.data.data;
}

export async function getTimerState(): Promise<TimerState> {
  const response = await axios.get(`${API_BASE}/timer-state`);
  return response.data.data;
}

export async function startTask(taskName: string, clientId?: string | null): Promise<TimerState> {
  const response = await axios.post(`${API_BASE}/start`, { taskName, clientId });
  return response.data.data;
}

export async function stopTask(): Promise<Task | null> {
  const response = await axios.post(`${API_BASE}/stop`);
  return response.data.data;
}

export async function createTask(data: CreateTaskData): Promise<Task> {
  const response = await axios.post(`${API_BASE}`, data);
  return response.data.data;
}

export async function updateTask(id: string, data: UpdateTaskData): Promise<Task> {
  const response = await axios.put(`${API_BASE}/${id}`, data);
  return response.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/${id}`);
}
