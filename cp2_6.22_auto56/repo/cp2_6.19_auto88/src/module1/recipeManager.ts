import { v4 as uuidv4 } from 'uuid';
import { formatISO } from 'date-fns';
import * as db from '../utils/db';
import type { Recipe, RecipeCreateData, RecipeUpdateData, Favorite, Rating, Ingredient, Step } from '../types';

function generateId(): string {
  return uuidv4();
}

function getCurrentTimestamp(): string {
  return formatISO(new Date());
}

async function createRecipe(recipeData: RecipeCreateData): Promise<Recipe> {
  try {
    const now = getCurrentTimestamp();
    
    const ingredients: Ingredient[] = recipeData.ingredients.map(ing => ({
      ...ing,
      id: generateId(),
    }));
    
    const steps: Step[] = recipeData.steps.map((step, index) => ({
      ...step,
      id: generateId(),
      order: index,
    }));
    
    const recipe: Recipe = {
      id: generateId(),
      title: recipeData.title,
      description: recipeData.description,
      coverImage: recipeData.coverImage,
      ingredients,
      steps,
      tags: recipeData.tags || [],
      cookingTime: recipeData.cookingTime,
      servings: recipeData.servings,
      difficulty: recipeData.difficulty,
      rating: 0,
      ratingCount: 0,
      authorId: recipeData.authorId,
      authorName: recipeData.authorName,
      createdAt: now,
      updatedAt: now,
    };
    
    await db.add('recipes', recipe);
    return recipe;
  } catch (error) {
    console.error('Failed to create recipe:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create recipe');
  }
}

async function updateRecipe(id: string, updates: RecipeUpdateData): Promise<Recipe> {
  try {
    const existingRecipe = await db.get<Recipe>('recipes', id);
    if (!existingRecipe) {
      throw new Error(`Recipe with id ${id} not found`);
    }
    
    let ingredients = existingRecipe.ingredients;
    if (updates.ingredients) {
      ingredients = updates.ingredients.map(ing => ({
        ...ing,
        id: 'id' in ing ? ing.id : generateId(),
      })) as Ingredient[];
    }
    
    let steps = existingRecipe.steps;
    if (updates.steps) {
      steps = updates.steps.map((step, index) => ({
        ...step,
        id: 'id' in step ? step.id : generateId(),
        order: 'order' in step ? step.order : index,
      })) as Step[];
    }
    
    const updatedRecipe: Recipe = {
      ...existingRecipe,
      ...updates,
      ingredients,
      steps,
      tags: updates.tags !== undefined ? updates.tags : existingRecipe.tags,
      cookingTime: updates.cookingTime !== undefined ? updates.cookingTime : existingRecipe.cookingTime,
      servings: updates.servings !== undefined ? updates.servings : existingRecipe.servings,
      difficulty: updates.difficulty !== undefined ? updates.difficulty : existingRecipe.difficulty,
      updatedAt: getCurrentTimestamp(),
    };
    
    await db.put('recipes', updatedRecipe);
    return updatedRecipe;
  } catch (error) {
    console.error('Failed to update recipe:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update recipe');
  }
}

async function deleteRecipe(id: string): Promise<void> {
  try {
    const existingRecipe = await db.get<Recipe>('recipes', id);
    if (!existingRecipe) {
      throw new Error(`Recipe with id ${id} not found`);
    }
    
    await db.remove('recipes', id);
    
    const favorites = await db.getByIndex<Favorite>('favorites', 'recipeId', id);
    for (const favorite of favorites) {
      await db.remove('favorites', favorite.id);
    }
    
    const ratings = await db.getByIndex<Rating>('ratings', 'recipeId', id);
    for (const rating of ratings) {
      await db.remove('ratings', rating.id);
    }
  } catch (error) {
    console.error('Failed to delete recipe:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete recipe');
  }
}

async function getRecipe(id: string): Promise<Recipe | null> {
  try {
    const recipe = await db.get<Recipe>('recipes', id);
    return recipe || null;
  } catch (error) {
    console.error('Failed to get recipe:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get recipe');
  }
}

async function getAllRecipes(): Promise<Recipe[]> {
  try {
    const recipes = await db.getAll<Recipe>('recipes');
    return recipes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Failed to get all recipes:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get all recipes');
  }
}

async function searchRecipes(keyword: string): Promise<Recipe[]> {
  try {
    if (!keyword.trim()) {
      return getAllRecipes();
    }
    
    const lowerKeyword = keyword.toLowerCase();
    const recipes = await getAllRecipes();
    
    return recipes.filter(recipe => {
      const titleMatch = recipe.title.toLowerCase().includes(lowerKeyword);
      const descriptionMatch = recipe.description.toLowerCase().includes(lowerKeyword);
      const ingredientMatch = recipe.ingredients.some(ing => 
        ing.name.toLowerCase().includes(lowerKeyword)
      );
      const tagMatch = recipe.tags.some(tag => 
        tag.toLowerCase().includes(lowerKeyword)
      );
      return titleMatch || descriptionMatch || ingredientMatch || tagMatch;
    });
  } catch (error) {
    console.error('Failed to search recipes:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to search recipes');
  }
}

async function getRecipesByAuthor(authorId: string): Promise<Recipe[]> {
  try {
    const recipes = await db.getByIndex<Recipe>('recipes', 'authorId', authorId);
    return recipes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Failed to get recipes by author:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get recipes by author');
  }
}

async function toggleFavorite(userId: string, recipeId: string): Promise<{ isFavorited: boolean; favorite: Favorite }> {
  try {
    const recipe = await db.get<Recipe>('recipes', recipeId);
    if (!recipe) {
      throw new Error(`Recipe with id ${recipeId} not found`);
    }
    
    const existingFavorites = await db.getByIndex<Favorite>('favorites', 'userId-recipeId', [userId, recipeId]);
    
    if (existingFavorites.length > 0) {
      const existingFavorite = existingFavorites[0];
      await db.remove('favorites', existingFavorite.id);
      return { isFavorited: false, favorite: existingFavorite };
    } else {
      const newFavorite: Favorite = {
        id: generateId(),
        userId,
        recipeId,
        createdAt: getCurrentTimestamp(),
      };
      await db.add('favorites', newFavorite);
      return { isFavorited: true, favorite: newFavorite };
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to toggle favorite');
  }
}

async function getFavoritesByUser(userId: string): Promise<Recipe[]> {
  try {
    const favorites = await db.getByIndex<Favorite>('favorites', 'userId', userId);
    const recipeIds = favorites.map(f => f.recipeId);
    
    const allRecipes = await getAllRecipes();
    return allRecipes.filter(recipe => recipeIds.includes(recipe.id));
  } catch (error) {
    console.error('Failed to get favorites by user:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get favorites by user');
  }
}

async function isFavorited(userId: string, recipeId: string): Promise<boolean> {
  try {
    const existingFavorites = await db.getByIndex<Favorite>('favorites', 'userId-recipeId', [userId, recipeId]);
    return existingFavorites.length > 0;
  } catch (error) {
    console.error('Failed to check if favorited:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to check if favorited');
  }
}

async function getFavoriteCount(recipeId: string): Promise<number> {
  try {
    const favorites = await db.getByIndex<Favorite>('favorites', 'recipeId', recipeId);
    return favorites.length;
  } catch (error) {
    console.error('Failed to get favorite count:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get favorite count');
  }
}

async function rateRecipe(recipeId: string, ratingValue: number, userId?: string): Promise<Recipe> {
  if (!userId) {
    userId = 'default-user';
  }
  try {
    if (ratingValue < 1 || ratingValue > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    const recipe = await db.get<Recipe>('recipes', recipeId);
    if (!recipe) {
      throw new Error(`Recipe with id ${recipeId} not found`);
    }
    
    const existingRatings = await db.getByIndex<Rating>('ratings', 'userId-recipeId', [userId, recipeId]);
    
    let newRating: Rating;
    let newRatingCount: number;
    let newTotalRating: number;
    
    if (existingRatings.length > 0) {
      const existingRating = existingRatings[0];
      newRating = {
        ...existingRating,
        rating: ratingValue,
      };
      await db.put('ratings', newRating);
      
      const allRatings = await db.getByIndex<Rating>('ratings', 'recipeId', recipeId);
      newRatingCount = allRatings.length;
      newTotalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
    } else {
      newRating = {
        id: generateId(),
        userId,
        recipeId,
        rating: ratingValue,
        createdAt: getCurrentTimestamp(),
      };
      await db.add('ratings', newRating);
      
      newRatingCount = recipe.ratingCount + 1;
      newTotalRating = recipe.rating * recipe.ratingCount + ratingValue;
    }
    
    const newAverageRating = newRatingCount > 0 ? newTotalRating / newRatingCount : 0;
    
    const updatedRecipe: Recipe = {
      ...recipe,
      rating: Math.round(newAverageRating * 10) / 10,
      ratingCount: newRatingCount,
      updatedAt: getCurrentTimestamp(),
    };
    
    await db.put('recipes', updatedRecipe);
    return updatedRecipe;
  } catch (error) {
    console.error('Failed to rate recipe:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to rate recipe');
  }
}

export const recipeManager = {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipe,
  getAllRecipes,
  searchRecipes,
  getRecipesByAuthor,
  toggleFavorite,
  getFavoritesByUser,
  isFavorited,
  getFavoriteCount,
  rateRecipe,
};
