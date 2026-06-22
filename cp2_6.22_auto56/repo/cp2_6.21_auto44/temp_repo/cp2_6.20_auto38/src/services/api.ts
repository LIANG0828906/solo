import axios from 'axios';
import type { Assignment, EvaluationResult } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(message));
  },
);

export async function getAssignments(): Promise<Assignment[]> {
  const res = await api.get<Assignment[]>('/assignments');
  return res.data;
}

export async function getAssignment(id: string): Promise<Assignment> {
  const res = await api.get<Assignment>(`/assignments/${id}`);
  return res.data;
}

export async function evaluateCode(
  id: string,
  code: string,
  language: string,
): Promise<EvaluationResult> {
  const res = await api.post<EvaluationResult>(`/assignments/${id}/evaluate`, {
    code,
    language,
  });
  return res.data;
}

export async function submitCode(
  id: string,
  code: string,
  language: string,
): Promise<EvaluationResult> {
  const res = await api.post<EvaluationResult>(`/assignments/${id}/submit`, {
    code,
    language,
  });
  return res.data;
}
