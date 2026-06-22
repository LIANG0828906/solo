import type { PetInfo, Recipe, FeedbackRecord, FeedbackType } from './recipeEngine';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export interface PetInfoOptions {
  breeds: string[];
  activityLevels: { value: 'low' | 'medium' | 'high'; label: string }[];
}

export function fetchPetInfo(): Promise<PetInfoOptions> {
  return request<PetInfoOptions>('/mock/petInfo');
}

export interface GenerateRecipeRequest {
  petInfo: PetInfo;
  useFeedback?: boolean;
}

export function generateRecipe(payload: GenerateRecipeRequest): Promise<Recipe> {
  return request<Recipe>('/mock/generateRecipe', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface SubmitFeedbackRequest {
  recipeId: string;
  type: FeedbackType;
  timestamp?: string;
}

export function submitFeedback(payload: SubmitFeedbackRequest): Promise<FeedbackRecord> {
  return request<FeedbackRecord>('/mock/submitFeedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFeedback(id: string, type: FeedbackType): Promise<FeedbackRecord> {
  return request<FeedbackRecord>(`/mock/feedbacks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ type }),
  });
}

export function getFeedbackHistory(): Promise<FeedbackRecord[]> {
  return request<FeedbackRecord[]>('/mock/feedbacks');
}
