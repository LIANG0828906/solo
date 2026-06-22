import { get, set, del } from 'idb-keyval';
import { Recipe, Review } from '@/types';

const RECIPES_KEY = 'flavorfuse_recipes';
const FAVORITES_KEY = 'flavorfuse_favorites';
const MY_RECIPES_KEY = 'flavorfuse_my_recipes';
const REVIEWS_KEY = 'flavorfuse_reviews';

export async function getStoredRecipes(): Promise<Recipe[]> {
  try {
    const recipes = await get<Recipe[]>(RECIPES_KEY);
    return recipes || [];
  } catch {
    return [];
  }
}

export async function storeRecipes(recipes: Recipe[]): Promise<void> {
  await set(RECIPES_KEY, recipes);
}

export async function getStoredFavorites(): Promise<string[]> {
  try {
    const favorites = await get<string[]>(FAVORITES_KEY);
    return favorites || [];
  } catch {
    return [];
  }
}

export async function storeFavorites(favorites: string[]): Promise<void> {
  await set(FAVORITES_KEY, favorites);
}

export async function getStoredMyRecipes(): Promise<string[]> {
  try {
    const myRecipes = await get<string[]>(MY_RECIPES_KEY);
    return myRecipes || [];
  } catch {
    return [];
  }
}

export async function storeMyRecipes(myRecipes: string[]): Promise<void> {
  await set(MY_RECIPES_KEY, myRecipes);
}

export async function getStoredReviews(): Promise<Review[]> {
  try {
    const reviews = await get<Review[]>(REVIEWS_KEY);
    return reviews || [];
  } catch {
    return [];
  }
}

export async function storeReviews(reviews: Review[]): Promise<void> {
  await set(REVIEWS_KEY, reviews);
}

export async function clearAllData(): Promise<void> {
  await del(RECIPES_KEY);
  await del(FAVORITES_KEY);
  await del(MY_RECIPES_KEY);
  await del(REVIEWS_KEY);
}
