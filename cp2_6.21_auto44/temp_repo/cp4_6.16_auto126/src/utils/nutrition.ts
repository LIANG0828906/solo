import { RecipeIngredient, RecipeSeasoning, NutritionInfo } from '@/types';
import { ingredients, seasonings } from '@/data/ingredients';

export function calculateNutrition(
  recipeIngredients: RecipeIngredient[],
  recipeSeasonings: RecipeSeasoning[]
): NutritionInfo {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const ri of recipeIngredients) {
    const ingredient = ingredients.find((i) => i.id === ri.ingredientId);
    if (ingredient) {
      const factor = ri.amount / 100;
      totalCalories += ingredient.caloriesPer100g * factor;
      totalProtein += ingredient.proteinPer100g * factor;
      totalCarbs += ingredient.carbsPer100g * factor;
      totalFat += ingredient.fatPer100g * factor;
    }
  }

  for (const rs of recipeSeasonings) {
    const seasoning = seasonings.find((s) => s.id === rs.seasoningId);
    if (seasoning) {
      totalCalories += seasoning.caloriesPerGram * rs.amount;
    }
  }

  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
  };
}

export function formatNutritionValue(value: number, unit = 'g'): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k${unit}`;
  }
  return `${value}${unit}`;
}
