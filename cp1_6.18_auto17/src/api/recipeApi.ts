import type { Recipe, Ingredient } from '@/types';
import { mockRecipes } from '@/data/recipeData';
import { presetIngredients } from '@/data/presetIngredients';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const recipeApi = {
  async getAllRecipes(): Promise<Recipe[]> {
    await delay(50);
    return mockRecipes;
  },

  async searchByIngredients(ingredients: string[]): Promise<Recipe[]> {
    await delay(30);
    if (ingredients.length === 0) return [];
    
    return mockRecipes.filter(recipe => 
      recipe.ingredients.some(ri => 
        ingredients.some(ui => ri.includes(ui) || ui.includes(ri))
      )
    );
  },

  async getRecipeById(id: string): Promise<Recipe | undefined> {
    await delay(20);
    return mockRecipes.find(recipe => recipe.id === id);
  },

  async getAllIngredients(): Promise<Ingredient[]> {
    await delay(30);
    return presetIngredients;
  },

  async searchIngredients(keyword: string): Promise<Ingredient[]> {
    await delay(20);
    if (!keyword) return presetIngredients;
    const lowerKeyword = keyword.toLowerCase();
    return presetIngredients.filter(
      ing => ing.name.toLowerCase().includes(lowerKeyword)
    );
  },
};
