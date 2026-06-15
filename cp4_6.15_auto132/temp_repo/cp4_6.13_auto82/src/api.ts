import type { Activity, Stall, Item, SearchResult, StallType, ItemStatus } from './types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `请求失败: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface CreateActivityData {
  name: string;
  date: string;
  totalStalls: number;
}

export function createActivity(data: CreateActivityData): Promise<{ activity: Activity; stalls: Stall[] }> {
  return request('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getActivity(id: string): Promise<{ activity: Activity; stalls: Stall[] }> {
  return request(`/activities/${id}`);
}

export function getActivityList(): Promise<Activity[]> {
  return request('/activities');
}

export function assignStall(
  activityId: string,
  stallId: string,
  data: { ownerName: string; type: StallType } | { ownerName?: undefined; type?: undefined }
): Promise<Stall> {
  return request(`/activities/${activityId}/stalls/${stallId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function getStallsByType(activityId: string, type?: StallType): Promise<Stall[]> {
  const url = type
    ? `/activities/${activityId}/stalls?type=${type}`
    : `/activities/${activityId}/stalls`;
  return request(url);
}

export interface AddItemData {
  name: string;
  price: number;
}

export function addItem(activityId: string, stallId: string, data: AddItemData): Promise<Item> {
  return request(`/activities/${activityId}/stalls/${stallId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getItems(activityId: string, stallId: string): Promise<Item[]> {
  return request(`/activities/${activityId}/stalls/${stallId}/items`);
}

export function updateItemStatus(itemId: string, status: ItemStatus): Promise<Item> {
  return request(`/items/${itemId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export function search(activityId: string, q: string): Promise<{ results: SearchResult[] }> {
  const url = `/activities/${activityId}/search?q=${encodeURIComponent(q)}`;
  return request(url);
}
