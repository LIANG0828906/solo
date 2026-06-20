import type { Recipe, ShoppingListItem } from '../../shared/types';
import { apiService } from './apiService';

class RecipeService {
  private recipesCache: Recipe[] = [];
  private selectedRecipes: Set<string> = new Set();
  private shoppingList: { [category: string]: ShoppingListItem[] } = {};

  async loadRecipes(): Promise<Recipe[]> {
    const { recipes } = await apiService.getRecipes();
    this.recipesCache = recipes;
    return recipes;
  }

  getCachedRecipes(): Recipe[] {
    return this.recipesCache;
  }

  async getRecipeById(id: string): Promise<Recipe | undefined> {
    const cached = this.recipesCache.find(r => r.id === id);
    if (cached) return cached;
    const { recipe } = await apiService.getRecipeById(id);
    return recipe;
  }

  async toggleFavorite(id: string, isFavorite: boolean): Promise<Recipe | undefined> {
    const { recipe } = await apiService.toggleFavorite(id, isFavorite);
    const index = this.recipesCache.findIndex(r => r.id === id);
    if (index !== -1) {
      this.recipesCache[index] = recipe;
    }
    return recipe;
  }

  addToShoppingList(recipeId: string): void {
    this.selectedRecipes.add(recipeId);
  }

  removeFromShoppingList(recipeId: string): void {
    this.selectedRecipes.delete(recipeId);
  }

  isRecipeSelected(recipeId: string): boolean {
    return this.selectedRecipes.has(recipeId);
  }

  getSelectedRecipeIds(): string[] {
    return Array.from(this.selectedRecipes);
  }

  clearSelectedRecipes(): void {
    this.selectedRecipes.clear();
  }

  getSelectedCount(): number {
    return this.selectedRecipes.size;
  }

  async generateShoppingList(): Promise<{ [category: string]: ShoppingListItem[] }> {
    const ids = this.getSelectedRecipeIds();
    const { shoppingList } = await apiService.generateShoppingList(ids);
    this.shoppingList = shoppingList;
    this.clearSelectedRecipes();
    return shoppingList;
  }

  getShoppingList(): { [category: string]: ShoppingListItem[] } {
    return this.shoppingList;
  }

  setShoppingList(list: { [category: string]: ShoppingListItem[] }): void {
    this.shoppingList = list;
  }

  searchRecipes(keyword: string, cuisine: string = 'all'): Recipe[] {
    return this.recipesCache.filter(recipe => {
      const matchesKeyword = keyword === '' ||
        recipe.name.toLowerCase().includes(keyword.toLowerCase()) ||
        recipe.description.toLowerCase().includes(keyword.toLowerCase());
      const matchesCuisine = cuisine === 'all' || recipe.cuisine === cuisine;
      return matchesKeyword && matchesCuisine;
    });
  }

  getFavoriteRecipes(): Recipe[] {
    return this.recipesCache.filter(r => r.isFavorite);
  }

  filterByCuisine(cuisine: string): Recipe[] {
    if (cuisine === 'all') return this.recipesCache;
    return this.recipesCache.filter(r => r.cuisine === cuisine);
  }
}

export const recipeService = new RecipeService();
