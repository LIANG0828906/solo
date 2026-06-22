import axios from 'axios';
import { EvaluationTask, EvaluationResult, HistoryRecord, ScoreSubmission } from '../../shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export async function getEvaluations(employeeId: string, status?: 'pending' | 'completed'): Promise<EvaluationTask[]> {
  const params: Record<string, string> = { employeeId };
  if (status) params.status = status;
  const res = await api.get<EvaluationTask[]>('/evaluations', { params });
  return res.data;
}

export async function getEvaluationById(id: string): Promise<EvaluationTask> {
  const res = await api.get<EvaluationTask>(`/evaluations/${id}`);
  return res.data;
}

export async function submitScore(taskId: string, scores: Record<string, number>): Promise<EvaluationResult> {
  const body: ScoreSubmission = { scores };
  const res = await api.post<EvaluationResult>(`/evaluations/${taskId}/score`, body);
  return res.data;
}

export async function getHistory(employeeId: string): Promise<HistoryRecord[]> {
  const res = await api.get<HistoryRecord[]>(`/history/${employeeId}`);
  return res.data;
}
