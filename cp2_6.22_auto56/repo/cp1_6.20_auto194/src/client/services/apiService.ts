import type { Recipe, ShoppingListItem, ShoppingListHistory } from '../../shared/types';

const API_BASE = '/api';

export const apiService = {
  async getRecipes(): Promise<{ recipes: Recipe[] }> {
    const response = await fetch(`${API_BASE}/recipes`);
    if (!response.ok) throw new Error('Failed to fetch recipes');
    return response.json();
  },

  async getRecipeById(id: string): Promise<{ recipe: Recipe }> {
    const response = await fetch(`${API_BASE}/recipes/${id}`);
    if (!response.ok) throw new Error('Failed to fetch recipe');
    return response.json();
  },

  async toggleFavorite(id: string, isFavorite: boolean): Promise<{ recipe: Recipe }> {
    const response = await fetch(`${API_BASE}/recipes/${id}/favorite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isFavorite }),
    });
    if (!response.ok) throw new Error('Failed to update favorite');
    return response.json();
  },

  async generateShoppingList(recipeIds: string[]): Promise<{ shoppingList: { [category: string]: ShoppingListItem[] } }> {
    const response = await fetch(`${API_BASE}/shopping-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipeIds }),
    });
    if (!response.ok) throw new Error('Failed to generate shopping list');
    return response.json();
  },

  async getUserStats(): Promise<{ favoriteCount: number; shoppingListHistory: ShoppingListHistory[] }> {
    const response = await fetch(`${API_BASE}/recipes/stats`);
    if (!response.ok) throw new Error('Failed to fetch user stats');
    return response.json();
  },
};
