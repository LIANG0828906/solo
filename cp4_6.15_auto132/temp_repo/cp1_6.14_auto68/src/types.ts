export type RecipeCategory = 'bread' | 'cake' | 'cookie' | 'other';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Step {
  id: string;
  description: string;
  order: number;
}

export interface FinalProduct {
  description: string;
  images: string[];
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  ovenModel: string;
  ingredients: Ingredient[];
  steps: Step[];
  finalProduct: FinalProduct;
  latestRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Experiment {
  id: string;
  recipeId: string;
  date: string;
  modification: string;
  temperature: number;
  humidity: number;
  rating: number;
  tags: string[];
  createdAt: string;
}

export const CATEGORY_COLORS: Record<RecipeCategory, { bg: string; text: string; ribbon: string; label: string }> = {
  bread: { bg: '#FFF3E0', text: '#E65100', ribbon: '#FF9800', label: '面包' },
  cake: { bg: '#FCE4EC', text: '#C2185B', ribbon: '#E91E63', label: '蛋糕' },
  cookie: { bg: '#E8F5E9', text: '#2E7D32', ribbon: '#4CAF50', label: '饼干' },
  other: { bg: '#F3E5F5', text: '#7B1FA2', ribbon: '#9C27B0', label: '其他' },
};

export const CATEGORY_OPTIONS: { value: RecipeCategory; label: string; color: string }[] = [
  { value: 'bread', label: '面包', color: '#FF9800' },
  { value: 'cake', label: '蛋糕', color: '#E91E63' },
  { value: 'cookie', label: '饼干', color: '#4CAF50' },
  { value: 'other', label: '其他', color: '#9C27B0' },
];
