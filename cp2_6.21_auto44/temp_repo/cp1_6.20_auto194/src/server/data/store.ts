import { mockRecipes } from './mockRecipes';
import type { Recipe, ShoppingList, ShoppingListHistory, ShoppingListItem } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

let recipes: Recipe[] = [...mockRecipes];
let shoppingListHistory: ShoppingListHistory[] = [];

export const getRecipes = (): Recipe[] => {
  return recipes;
};

export const getRecipeById = (id: string): Recipe | undefined => {
  return recipes.find(r => r.id === id);
};

export const updateFavorite = (id: string, isFavorite: boolean): Recipe | undefined => {
  const recipe = recipes.find(r => r.id === id);
  if (recipe) {
    recipe.isFavorite = isFavorite;
  }
  return recipe;
};

export const generateShoppingList = (recipeIds: string[]): { [category: string]: ShoppingListItem[] } => {
  const selectedRecipes = recipes.filter(r => recipeIds.includes(r.id));
  const ingredientMap = new Map<string, ShoppingListItem>();

  selectedRecipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const key = `${ing.name}-${ing.unit}-${ing.category}`;
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        existing.totalQuantity += Number(ing.quantity);
        if (!existing.fromRecipes.includes(recipe.name)) {
          existing.fromRecipes.push(recipe.name);
        }
      } else {
        ingredientMap.set(key, {
          ingredientId: ing.id,
          name: ing.name,
          totalQuantity: Number(ing.quantity),
          unit: ing.unit,
          category: ing.category,
          isPurchased: false,
          fromRecipes: [recipe.name],
        });
      }
    });
  });

  const grouped: { [category: string]: ShoppingListItem[] } = {};
  ingredientMap.forEach(item => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });

  Object.keys(grouped).forEach(category => {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name));
  });

  const recipeNames = selectedRecipes.map(r => r.name);
  shoppingListHistory.unshift({
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    recipeNames,
  });

  if (shoppingListHistory.length > 5) {
    shoppingListHistory = shoppingListHistory.slice(0, 5);
  }

  return grouped;
};

export const getShoppingListHistory = (): ShoppingListHistory[] => {
  return shoppingListHistory;
};

export const getFavoriteCount = (): number => {
  return recipes.filter(r => r.isFavorite).length;
};
