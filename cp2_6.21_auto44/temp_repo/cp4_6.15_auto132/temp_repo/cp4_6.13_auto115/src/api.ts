import { SurveyData, StatsData } from './types';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

function getAuthHeaders(): Headers {
  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + btoa(`${ADMIN_USER}:${ADMIN_PASS}`));
  headers.set('Content-Type', 'application/json');
  return headers;
}

export async function createSurvey(data: SurveyData): Promise<{ id: string }> {
  const res = await fetch('/api/surveys', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('创建失败');
  return res.json();
}

export async function updateSurvey(id: string, data: SurveyData): Promise<{ success: boolean }> {
  const res = await fetch(`/api/surveys/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('更新失败');
  return res.json();
}

export async function getSurvey(id: string): Promise<any> {
  const res = await fetch(`/api/surveys/${id}`);
  if (!res.ok) throw new Error('问卷不存在');
  return res.json();
}

export async function getSurveyStats(id: string): Promise<StatsData> {
  const res = await fetch(`/api/surveys/${id}/stats`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('获取失败');
  return res.json();
}

export async function submitResponse(surveyId: string, answers: { questionId: string; answer: string }[]): Promise<{ success: boolean }> {
  const res = await fetch(`/api/surveys/${surveyId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || '提交失败');
  }
  return res.json();
}

export async function getAllSurveys(): Promise<any[]> {
  const res = await fetch('/api/surveys', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('获取失败');
  return res.json();
}
