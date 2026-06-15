import type { StarDust, InspirationTask, CombineResponse, TenDayReport, StarDustColor } from '@/types';

const API_BASE_URL = 'http://localhost:8000/api';

export async function getStarDust(): Promise<StarDust[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/stardust`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch stardust:', error);
    throw error;
  }
}

export async function getTasks(): Promise<InspirationTask[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
}

export async function submitCombination(
  taskId: string,
  colors: StarDustColor[]
): Promise<CombineResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/combine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId, colors }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to submit combination:', error);
    throw error;
  }
}

export async function getTenDayReport(): Promise<TenDayReport> {
  try {
    const response = await fetch(`${API_BASE_URL}/report/ten-day`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch ten day report:', error);
    throw error;
  }
}
