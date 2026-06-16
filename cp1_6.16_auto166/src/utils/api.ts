export interface Ingredient {
  id: string;
  name: string;
  category: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sodium: number;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  cover: string;
  ingredients: string[];
  steps: string[];
  nutrition: Nutrition;
}

export interface SearchResult extends Recipe {
  matchedIngredients: string[];
  missingIngredients: string[];
  matchRate: number;
}

export interface Substitution {
  substitute: string;
  reason: string;
  diffPercent: string;
}

const API_BASE = '/api';

export async function fetchIngredients(): Promise<Ingredient[]> {
  const res = await fetch(`${API_BASE}/ingredients`);
  return res.json();
}

export async function searchRecipes(ingredientIds: string[]): Promise<SearchResult[]> {
  const res = await fetch(`${API_BASE}/recipes/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredientIds }),
  });
  return res.json();
}

export async function fetchRecipeDetail(id: string): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/recipes/${id}`);
  return res.json();
}

export async function fetchSubstitutions(ingredientId: string): Promise<Substitution[]> {
  const res = await fetch(`${API_BASE}/substitutions/${ingredientId}`);
  return res.json();
}
