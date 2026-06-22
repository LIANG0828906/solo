export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  sodium: number;
}

export interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  sodium: number;
}

export interface FoodItem {
  food: Food;
  grams: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealRecord {
  id: number;
  date: string;
  mealType: MealType;
  foods: FoodItem[];
  createdAt: string;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  sodium: number;
}

export interface DailySummary {
  date: string;
  total: Nutrition;
  goals: DailyGoals;
  percentage: Nutrition;
  meals: MealRecord[];
}

export type SuggestionType = 'warning' | 'info';

export interface Suggestion {
  type: SuggestionType;
  text: string;
}

export interface AddMealPayload {
  date: string;
  mealType: MealType;
  foods: Array<{
    foodId: number;
    grams: number;
  } | {
    food: Food;
    grams: number;
  }>;
}

const BASE_URL = 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    let msg = `请求失败: ${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err?.error) {
        msg = err.error;
      }
    } catch {
    }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export function searchFoods(q: string): Promise<Food[]> {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  const query = params.toString();
  return request<Food[]>(`/api/foods/search${query ? `?${query}` : ''}`);
}

export function addMeal(meal: AddMealPayload): Promise<MealRecord> {
  return request<MealRecord>('/api/meals', {
    method: 'POST',
    body: JSON.stringify(meal),
  });
}

export function getMealsByDate(date: string): Promise<MealRecord[]> {
  return request<MealRecord[]>(`/api/meals?date=${encodeURIComponent(date)}`);
}

export function getMealHistory(days: number): Promise<MealRecord[]> {
  return request<MealRecord[]>(`/api/meals/history?days=${days}`);
}

export function getGoals(): Promise<DailyGoals> {
  return request<DailyGoals>('/api/goals');
}

export function updateGoals(goals: DailyGoals): Promise<DailyGoals> {
  return request<DailyGoals>('/api/goals', {
    method: 'PUT',
    body: JSON.stringify(goals),
  });
}

export function getDailySummary(date: string): Promise<DailySummary> {
  return request<DailySummary>(`/api/daily-summary?date=${encodeURIComponent(date)}`);
}

export function getSuggestions(date: string): Promise<Suggestion[]> {
  return request<Suggestion[]>(`/api/suggestions?date=${encodeURIComponent(date)}`);
}
