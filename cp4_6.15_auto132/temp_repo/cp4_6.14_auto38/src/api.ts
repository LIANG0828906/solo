import axios from 'axios';
import type { Recipe, TimerState, CreateRecipeRequest, AddReviewRequest } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const recipeApi = {
  createRecipe: (data: CreateRecipeRequest): Promise<Recipe> =>
    api.post('/recipes', data).then((res) => res.data),

  getRecipes: (): Promise<Recipe[]> =>
    api.get('/recipes').then((res) => res.data),

  getRecipe: (id: string): Promise<Recipe> =>
    api.get(`/recipes/${id}`).then((res) => res.data),

  addReview: (recipeId: string, data: AddReviewRequest): Promise<Recipe> =>
    api.post(`/recipes/${recipeId}/reviews`, data).then((res) => res.data),
};

export const timerApi = {
  getTimerState: (recipeId: string): Promise<TimerState> =>
    api.get(`/timer/${recipeId}`).then((res) => res.data),

  startTimer: (recipeId: string): Promise<TimerState> =>
    api.post(`/timer/${recipeId}/start`).then((res) => res.data),

  pauseTimer: (recipeId: string): Promise<TimerState> =>
    api.post(`/timer/${recipeId}/pause`).then((res) => res.data),

  skipStep: (recipeId: string): Promise<TimerState> =>
    api.post(`/timer/${recipeId}/skip`).then((res) => res.data),

  resetTimer: (recipeId: string): Promise<TimerState> =>
    api.post(`/timer/${recipeId}/reset`).then((res) => res.data),

  syncTimer: (recipeId: string, state: TimerState): Promise<TimerState> =>
    api.post(`/timer/${recipeId}/sync`, state).then((res) => res.data),
};
