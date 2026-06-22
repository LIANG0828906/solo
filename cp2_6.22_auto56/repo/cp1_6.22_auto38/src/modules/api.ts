export interface FlavorNode {
  id: string;
  name: string;
  description?: string;
  roastLevel?: ('light' | 'medium' | 'dark')[];
  origin?: ('africa' | 'central_south_america' | 'asia')[];
  intensity?: number;
  children?: FlavorNode[];
}

export interface FlavorLogItem {
  id: string;
  name: string;
  intensity: number;
}

export interface FlavorLogRequest {
  beanName: string;
  flavors: FlavorLogItem[];
  timestamp: string;
}

export interface FlavorLogResponse {
  success: boolean;
  message: string;
  id: string;
}

const API_BASE = '/api';

export async function getFlavors(): Promise<FlavorNode> {
  const response = await fetch(`${API_BASE}/flavors`);
  if (!response.ok) {
    throw new Error('Failed to fetch flavors');
  }
  return response.json();
}

export async function submitLog(data: FlavorLogRequest): Promise<FlavorLogResponse> {
  const response = await fetch(`${API_BASE}/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to submit log');
  }
  return response.json();
}
