import type { Ingredient, CalculateRequest } from "../../shared/types.js";

export function calculateIngredients(
  request: CalculateRequest
): Ingredient[] {
  const { ingredients, originalServings, targetServings } = request;

  if (originalServings <= 0 || targetServings <= 0) {
    return ingredients;
  }

  const ratio = targetServings / originalServings;

  return ingredients.map((ingredient) => ({
    name: ingredient.name,
    amount: Math.round(ingredient.amount * ratio * 100) / 100,
    unit: ingredient.unit,
  }));
}
