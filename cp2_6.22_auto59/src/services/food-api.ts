import axios from 'axios';
import type { Food, FoodLogEntry, UserProfile, NutritionGoals, MealType } from '@/types';

const api = axios.create({ baseURL: '/api' });

export async function searchFoods(query: string): Promise<Food[]> {
  const res = await api.get('/foods/search', { params: { q: query } });
  return res.data;
}

export async function getAllFoods(): Promise<Food[]> {
  const res = await api.get('/foods');
  return res.data;
}

export async function addFoodLog(data: { foodId: string; amount: number; mealType: MealType; date: string }): Promise<FoodLogEntry> {
  const res = await api.post('/foods/log', data);
  return res.data;
}

export async function getFoodLogs(date: string): Promise<FoodLogEntry[]> {
  const res = await api.get('/foods/log', { params: { date } });
  return res.data;
}

export async function getFoodLogsRange(start: string, end: string): Promise<FoodLogEntry[]> {
  const res = await api.get('/foods/log/range', { params: { start, end } });
  return res.data;
}

export async function deleteFoodLog(id: string): Promise<void> {
  await api.delete(`/foods/log/${id}`);
}

export async function updateFoodLog(id: string, data: { amount: number; mealType: MealType }): Promise<FoodLogEntry> {
  const res = await api.put(`/foods/log/${id}`, data);
  return res.data;
}

export async function getProfile(): Promise<(UserProfile & { bmr: number; tdee: number }) | null> {
  const res = await api.get('/profile');
  return res.data;
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile & { bmr: number; tdee: number }> {
  const res = await api.post('/profile', profile);
  return res.data;
}

export async function getGoals(): Promise<NutritionGoals | null> {
  const res = await api.get('/goals');
  return res.data;
}

export async function updateGoals(goals: NutritionGoals): Promise<NutritionGoals> {
  const res = await api.put('/goals', goals);
  return res.data;
}
