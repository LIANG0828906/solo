import type { Exam, Question, SubmitRequest, SubmitResponse } from './types';

const API_BASE = '/api';

export const createExam = async (title: string, questions: Question[]): Promise<{ id: string }> => {
  const response = await fetch(`${API_BASE}/exam`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, questions }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '创建失败' }));
    throw new Error(error.error || '创建失败');
  }

  return response.json();
};

export const getExam = async (id: string): Promise<Exam> => {
  const response = await fetch(`${API_BASE}/exam/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '获取失败' }));
    throw new Error(error.error || '获取失败');
  }

  return response.json();
};

export const submitAnswers = async (id: string, answers: SubmitRequest): Promise<SubmitResponse> => {
  const response = await fetch(`${API_BASE}/exam/${id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(answers),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '提交失败' }));
    throw new Error(error.error || '提交失败');
  }

  return response.json();
};
