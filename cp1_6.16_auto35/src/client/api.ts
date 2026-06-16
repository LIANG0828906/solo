import type { User, Plant, DiaryEntry, LeaderboardEntry, PlantSpecies } from './types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface LoginResponse {
  user: User;
  token: string;
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function register(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getUser(userId: string): Promise<User> {
  return request<User>(`/users/${userId}`);
}

export function searchUsers(query: string): Promise<User[]> {
  return request<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
}

export function addFriend(userId: string, friendId: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/users/${userId}/friends`, {
    method: 'POST',
    body: JSON.stringify({ friendId }),
  });
}

export function getFriends(userId: string): Promise<User[]> {
  return request<User[]>(`/users/${userId}/friends`);
}

export function createPlant(ownerId: string, species: PlantSpecies, name: string): Promise<Plant> {
  return request<Plant>('/plants', {
    method: 'POST',
    body: JSON.stringify({ ownerId, species, name }),
  });
}

export function getPlants(userId: string): Promise<Plant[]> {
  return request<Plant[]>(`/plants?userId=${userId}`);
}

export function getPlantDetail(plantId: string): Promise<Plant> {
  return request<Plant>(`/plants/${plantId}`);
}

export function waterPlant(plantId: string, userId: string): Promise<{ success: boolean; updatedPlant: Plant; diaryEntry: DiaryEntry; message?: string }> {
  return request<{ success: boolean; updatedPlant: Plant; diaryEntry: DiaryEntry; message?: string }>(`/plants/${plantId}/water`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export function fertilizePlant(plantId: string, userId: string): Promise<{ success: boolean; updatedPlant: Plant; diaryEntry: DiaryEntry; message?: string }> {
  return request<{ success: boolean; updatedPlant: Plant; diaryEntry: DiaryEntry; message?: string }>(`/plants/${plantId}/fertilize`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export function adjustLight(plantId: string, userId: string): Promise<{ success: boolean; updatedPlant: Plant; diaryEntry: DiaryEntry; message?: string }> {
  return request<{ success: boolean; updatedPlant: Plant; diaryEntry: DiaryEntry; message?: string }>(`/plants/${plantId}/light`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export function getDiary(plantId: string): Promise<DiaryEntry[]> {
  return request<DiaryEntry[]>(`/plants/${plantId}/diary`);
}

export function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return request<LeaderboardEntry[]>('/leaderboard');
}
