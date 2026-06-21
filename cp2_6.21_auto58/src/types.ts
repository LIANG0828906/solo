export interface Ingredient {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: '蔬菜' | '肉类' | '调味料' | '其他';
}

export interface Recipe {
  id: string;
  name: string;
  cooking_time: number;
  image_data?: string;
  ingredients: Ingredient[];
  steps: string[];
  servings: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  last_updated: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: '蔬菜' | '肉类' | '调味料' | '其他';
  checked?: boolean;
  removing?: boolean;
}

export type Unit = '克' | '千克' | '毫升' | '升' | '个' | '只' | '勺' | '茶匙' | '汤匙' | '把' | '片' | '块';

export const UNITS: Unit[] = ['克', '千克', '毫升', '升', '个', '只', '勺', '茶匙', '汤匙', '把', '片', '块'];

export type SortOrder = 'asc' | 'desc' | null;
