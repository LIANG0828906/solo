import axios from 'axios';
import type {
  Task,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  GameEvent,
  ResolveEventRequest,
  ResolveEventResponse,
  EndPeriodResponse,
  ScoreReport,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateTask = async (): Promise<Task> => {
  const response = await api.post<Task>('/generate_task');
  return response.data;
};

export const submitAnswer = async (data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> => {
  const response = await api.post<SubmitAnswerResponse>('/submit_answer', data);
  return response.data;
};

export const getScore = async (): Promise<ScoreReport> => {
  const response = await api.get<ScoreReport>('/get_score');
  return response.data;
};

export const triggerEvent = async (): Promise<GameEvent> => {
  const response = await api.post<GameEvent>('/trigger_event');
  return response.data;
};

export const resolveEvent = async (data: ResolveEventRequest): Promise<ResolveEventResponse> => {
  const response = await api.post<ResolveEventResponse>('/resolve_event', data);
  return response.data;
};

export const endPeriod = async (): Promise<EndPeriodResponse> => {
  const response = await api.post<EndPeriodResponse>('/end_period');
  return response.data;
};

export default api;
