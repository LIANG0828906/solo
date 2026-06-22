export type Category = '中餐' | '西餐' | '早餐' | '甜点';
export type Zone = '蔬菜区' | '肉禽区' | '水产区' | '干货调味区' | '乳制品区' | '主食区';
export type DayOfWeek = '周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日';
export type MealType = '早餐' | '午餐' | '晚餐';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  zone: Zone;
}

export interface Recipe {
  id: string;
  name: string;
  category: Category;
  cookTime: number;
  ingredients: Ingredient[];
  steps: string[];
  isCustom?: boolean;
}

export interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  zone: Zone;
  checked: boolean;
}

export const DAYS: DayOfWeek[] = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const MEALS: MealType[] = ['早餐', '午餐', '晚餐'];
export const ZONES: Zone[] = ['蔬菜区', '肉禽区', '水产区', '干货调味区', '乳制品区', '主食区'];
export const CATEGORIES: Category[] = ['中餐', '西餐', '早餐', '甜点'];

export const CATEGORY_COLORS: Record<Category, string> = {
  '中餐': '#E74C3C',
  '西餐': '#3498DB',
  '早餐': '#F39C12',
  '甜点': '#E91E90',
};

export const ZONE_ICONS: Record<Zone, string> = {
  '蔬菜区': '🥬',
  '肉禽区': '🥩',
  '水产区': '🐟',
  '干货调味区': '🧂',
  '乳制品区': '🧀',
  '主食区': '🍚',
};
