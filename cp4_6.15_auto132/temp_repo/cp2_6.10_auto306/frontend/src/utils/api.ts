import type {
  Sigil,
  DivinationResult,
  DailyStats,
  WeeklyReport,
  SaveResponse,
  DeleteResponse,
} from '../types';

const BASE_URL = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function divinate(sigils: [Sigil, Sigil]): Promise<DivinationResult> {
  return request<DivinationResult>('/divination', {
    method: 'POST',
    body: JSON.stringify({ sigils }),
  });
}

export function saveResult(result: DivinationResult): Promise<SaveResponse> {
  return request<SaveResponse>('/save', {
    method: 'POST',
    body: JSON.stringify({ result }),
  });
}

export function getCollection(): Promise<DivinationResult[]> {
  return request<DivinationResult[]>('/collection');
}

export function getHistory(limit = 5): Promise<DivinationResult[]> {
  return request<DivinationResult[]>(`/history?limit=${limit}`);
}

export function getDailyStats(): Promise<DailyStats> {
  return request<DailyStats>('/daily-stats');
}

export function getWeeklyReport(week?: string): Promise<WeeklyReport> {
  const url = week ? `/weekly-report?week=${week}` : '/weekly-report';
  return request<WeeklyReport>(url);
}

export function deleteFromCollection(id: string): Promise<DeleteResponse> {
  return request<DeleteResponse>(`/collection/${id}`, {
    method: 'DELETE',
  });
}
