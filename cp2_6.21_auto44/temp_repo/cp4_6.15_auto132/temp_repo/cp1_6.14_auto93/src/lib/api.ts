import axios from 'axios';
import type {
  Food,
  MealEntry,
  UserProfile,
  DailyNutrition,
  WeeklyPlan,
} from '../../shared/types';

const api = axios.create({
  baseURL: '/api',
});

export const searchFoods = async (q: string, limit?: number): Promise<Food[]> => {
  const params: Record<string, string | number> = { q };
  if (limit !== undefined) params.limit = limit;
  const response = await api.get<Food[]>('/foods', { params });
  return response.data;
};

export const getFood = async (id: string): Promise<Food> => {
  const response = await api.get<Food>(`/foods/${id}`);
  return response.data;
};

export const getMeals = async (date: string): Promise<MealEntry[]> => {
  const response = await api.get<MealEntry[]>('/meals', { params: { date } });
  return response.data;
};

export interface AddMealBody {
  foodId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  date: string;
}

export const addMeal = async (body: AddMealBody): Promise<MealEntry> => {
  const response = await api.post<MealEntry>('/meals', body);
  return response.data;
};

export const deleteMeal = async (id: string): Promise<void> => {
  await api.delete(`/meals/${id}`);
};

export const getDailyNutrition = async (date: string): Promise<DailyNutrition> => {
  const response = await api.get<DailyNutrition>('/nutrition/daily', { params: { date } });
  return response.data;
};

export const getWeeklyNutrition = async (days?: number): Promise<DailyNutrition[]> => {
  const params: Record<string, number> = {};
  if (days !== undefined) params.days = days;
  const response = await api.get<DailyNutrition[]>('/nutrition/weekly', { params });
  return response.data;
};

export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('/profile');
  return response.data;
};

export interface SaveProfileBody {
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: number;
  goal: 'lose' | 'gain' | 'maintain';
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

export const saveProfile = async (body: SaveProfileBody): Promise<UserProfile> => {
  const response = await api.post<UserProfile>('/profile', body);
  return response.data;
};

export interface CalculateProfileBody {
  age: number;
  gender: 'male' | 'female';
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: number;
  goal: 'lose' | 'gain' | 'maintain';
}

export interface CalculateProfileResult {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export const calculateProfile = async (body: CalculateProfileBody): Promise<CalculateProfileResult> => {
  const response = await api.post<CalculateProfileResult>('/profile/calculate', body);
  return response.data;
};

export const getPlans = async (): Promise<WeeklyPlan[]> => {
  const response = await api.get<WeeklyPlan[]>('/plans');
  return response.data;
};

export interface GeneratePlanBody {
  startDate?: string;
}

export const generatePlan = async (startDate?: string): Promise<WeeklyPlan> => {
  const body: GeneratePlanBody = {};
  if (startDate !== undefined) body.startDate = startDate;
  const response = await api.post<WeeklyPlan>('/plans/generate', body);
  return response.data;
};
