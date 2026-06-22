import { useMemo } from 'react';
import type { Ingredient, Recipe, MatchedRecipe, MatchCategory } from '../types';
import { matchRecipes, getRecipesByCategory } from '../utils/recipeMatcher';

export function useRecipeMatcher(
  recipes: Recipe[],
  ingredients: Ingredient[]
) {
  const matchedRecipes = useMemo(() => {
    return matchRecipes(recipes, ingredients);
  }, [recipes, ingredients]);

  const categorizedRecipes = useMemo(() => {
    return getRecipesByCategory(matchedRecipes);
  }, [matchedRecipes]);

  const perfectMatches = useMemo(() => {
    return categorizedRecipes['完全匹配'];
  }, [categorizedRecipes]);

  const partialMatches = useMemo(() => {
    return categorizedRecipes['缺少1-2样'];
  }, [categorizedRecipes]);

  const lowMatches = useMemo(() => {
    return categorizedRecipes['缺少更多'];
  }, [categorizedRecipes]);

  const getRecipeById = useMemo(() => {
    const recipeMap = new Map<number, MatchedRecipe>();
    matchedRecipes.forEach((recipe) => {
      if (recipe.id !== undefined) {
        recipeMap.set(recipe.id, recipe);
      }
    });
    return (id: number) => recipeMap.get(id);
  }, [matchedRecipes]);

  return {
    matchedRecipes,
    categorizedRecipes,
    perfectMatches,
    partialMatches,
    lowMatches,
    getRecipeById,
  };
}
