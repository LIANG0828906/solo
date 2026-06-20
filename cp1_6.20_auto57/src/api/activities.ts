const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

export interface CreateActivityData {
  title: string;
  bookTitle: string;
  bookAuthor: string;
  totalPages: number;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface UpdateProgressData {
  currentPage: number;
  note?: string;
}

export function createActivity(data: CreateActivityData) {
  return request('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getActivities() {
  return request('/activities');
}

export function getActivity(id: string) {
  return request(`/activities/${id}`);
}

export function joinActivity(activityId: string, memberId: string) {
  return request(`/activities/${activityId}/join`, {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  });
}

export function getProgress(activityId: string, memberId: string) {
  return request(`/activities/${activityId}/progress/${memberId}`);
}

export function updateProgress(activityId: string, memberId: string, data: UpdateProgressData) {
  return request(`/activities/${activityId}/progress/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function getActivityStats(activityId: string) {
  return request(`/activities/${activityId}/stats`);
}
