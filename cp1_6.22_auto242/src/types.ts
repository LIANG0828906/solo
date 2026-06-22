export interface Ingredient {
  id: string;
  name: string;
  brand: string;
  type: string;
  family: string;
  stock: number;
  unit: string;
  cost: number;
  supplier: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  percentage: number;
}

export interface RecipeVersion {
  id: string;
  timestamp: string;
  note: string;
  ingredients: RecipeIngredient[];
}

export interface Recipe {
  id: string;
  name: string;
  targetNote: string;
  description: string;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
  versions: RecipeVersion[];
}

export interface TestingRecord {
  id: string;
  recipeId: string;
  date: string;
  duration: string;
  rating: number;
  longevity: string;
  evolution: string;
}

export interface CostReportItem {
  id: string;
  name: string;
  cost: number;
  percentage: number;
}

export interface CostReport {
  totalCostPer10ml: number;
  ingredientCosts: CostReportItem[];
}

export type StockStatus = '充足' | '低库存' | '缺货';

export const FAMILY_COLORS: Record<string, string> = {
  '花香': '#E8B4B8',
  '木质': '#8B7355',
  '辛香': '#D4A373',
  '柑橘': '#F4D35E',
  '果香': '#EE964B',
  '草本': '#7C9A73',
  '麝香': '#A68DAD',
  '海洋': '#7EC8E3',
  '皮革': '#8B4513',
  '东方': '#C9A96E',
};

export const STOCK_COLORS = {
  充足: '#7C9A73',
  低库存: '#D4A373',
  缺货: '#C47A7A',
};
