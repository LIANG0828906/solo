import type { SkillNode, LearningResource, PlanRequest, PlanResponse, ApiResponse } from '../types';

const API_BASE_URL = '/api';

async function fetchWrapper<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data = await response.json() as ApiResponse<T>;

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
}

export async function getSkills(): Promise<SkillNode[]> {
  return fetchWrapper<SkillNode[]>('/skills', {
    method: 'GET',
  });
}

export async function generatePlan(request: PlanRequest): Promise<PlanResponse> {
  return fetchWrapper<PlanResponse>('/plan', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getResources(skillId: string): Promise<LearningResource[]> {
  return fetchWrapper<LearningResource[]>(`/resources/${skillId}`, {
    method: 'GET',
  });
}

export async function getJobs(): Promise<{ id: string; title: string }[]> {
  return fetchWrapper<{ id: string; title: string }[]>('/jobs', {
    method: 'GET',
  });
}
