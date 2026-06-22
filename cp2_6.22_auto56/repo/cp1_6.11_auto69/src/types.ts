export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  note: string;
}

export interface Step {
  id: string;
  order: number;
  description: string;
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  baseServings: number;
  ingredients: Ingredient[];
  steps: Step[];
  shareCode: string;
}

export interface User {
  id: string;
  nickname: string;
}

export interface RoomState {
  recipe: Recipe;
  users: User[];
}

export type UnitType = 'g' | 'kg' | 'ml' | 'l' | '杯' | '汤匙' | '茶匙' | '个' | '适量';

export const UNIT_CONVERSIONS: Record<string, { toMl?: number; toG?: number }> = {
  '杯': { toMl: 240 },
  '汤匙': { toMl: 15 },
  '茶匙': { toMl: 5 },
  'ml': { toMl: 1 },
  'l': { toMl: 1000 },
  'g': { toG: 1 },
  'kg': { toG: 1000 },
};

export const COMMON_UNITS: string[] = ['g', 'kg', 'ml', 'l', '杯', '汤匙', '茶匙', '个', '适量'];
