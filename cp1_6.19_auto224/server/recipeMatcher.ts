import { Ingredient, Recipe, RecommendRequest } from './types';
import { recipes } from './recipesData';

function calculateDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateUrgencyBonus(daysUntilExpiry: number): number {
  if (daysUntilExpiry <= 0) return 1.0;
  if (daysUntilExpiry <= 1) return 0.7;
  if (daysUntilExpiry <= 3) return 0.4;
  if (daysUntilExpiry <= 7) return 0.2;
  return 0;
}

export function matchRecipes(
  ingredients: Ingredient[],
  preferences: RecommendRequest['preferences'],
  allRecipes: Recipe[]
): Recipe[] {
  const ingredientNames = new Set(ingredients.map(i => i.name));
  const ingredientUrgency = new Map<string, number>();

  ingredients.forEach(ing => {
    const days = calculateDaysUntilExpiry(ing.expiryDate);
    ingredientUrgency.set(ing.name, calculateUrgencyBonus(days));
  });

  const preferredTags = new Set(preferences?.tags || []);
  const maxTime = preferences?.maxTimeMinutes;
  const maxDifficulty = preferences?.maxDifficulty;

  const filteredRecipes = allRecipes.filter(recipe => {
    if (maxTime && recipe.timeMinutes > maxTime) return false;
    if (maxDifficulty && recipe.difficulty > maxDifficulty) return false;
    return true;
  });

  const scoredRecipes = filteredRecipes.map(recipe => {
    const recipeIngredientNames = recipe.ingredients.map(ri => ri.name);
    const matchedIngredients = recipeIngredientNames.filter(name => ingredientNames.has(name));
    const coverageRatio = recipeIngredientNames.length > 0
      ? matchedIngredients.length / recipeIngredientNames.length
      : 0;

    let tagMatchRatio = 0;
    if (preferredTags.size > 0 && recipe.tags.length > 0) {
      const matchedTags = recipe.tags.filter(tag => preferredTags.has(tag));
      tagMatchRatio = matchedTags.length / Math.min(preferredTags.size, recipe.tags.length);
    }

    let urgencySum = 0;
    matchedIngredients.forEach(name => {
      urgencySum += ingredientUrgency.get(name) || 0;
    });
    const urgencyBonus = matchedIngredients.length > 0
      ? urgencySum / matchedIngredients.length
      : 0;

    const matchScore =
      coverageRatio * 60 +
      tagMatchRatio * 30 +
      urgencyBonus * 10;

    return { ...recipe, matchScore: parseFloat(matchScore.toFixed(2)) };
  });

  return scoredRecipes
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 3);
}

export { recipes };
