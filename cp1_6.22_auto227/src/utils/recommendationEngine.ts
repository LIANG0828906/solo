import type { InventoryItem, Recipe, RecipeRecommendation } from './types';

export function calculateMatchPercentage(
  inventory: InventoryItem[],
  recipe: Recipe
): RecipeRecommendation {
  const inventoryNames = new Set(inventory.map((item) => item.name));
  const recipeIngredientNames = recipe.ingredients.map((ing) => ing.name);

  const matchedIngredients: string[] = [];
  const missingIngredients: string[] = [];

  for (const name of recipeIngredientNames) {
    if (inventoryNames.has(name)) {
      matchedIngredients.push(name);
    } else {
      missingIngredients.push(name);
    }
  }

  const totalIngredients = recipeIngredientNames.length;
  const matchPercentage =
    totalIngredients === 0
      ? 0
      : Math.round((matchedIngredients.length / totalIngredients) * 100);

  return {
    recipe,
    matchPercentage,
    matchedIngredients,
    missingIngredients,
  };
}

export function getRecommendations(
  inventory: InventoryItem[],
  recipes: Recipe[]
): RecipeRecommendation[] {
  const recommendations = recipes.map((recipe) =>
    calculateMatchPercentage(inventory, recipe)
  );

  return recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

export function filterRecipesByExpiring(
  inventory: InventoryItem[],
  recipes: Recipe[],
  expiringItemNames: string[]
): RecipeRecommendation[] {
  const expiringSet = new Set(expiringItemNames);

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.ingredients.some((ing) => expiringSet.has(ing.name))
  );

  const recommendations = filteredRecipes.map((recipe) =>
    calculateMatchPercentage(inventory, recipe)
  );

  return recommendations.sort((a, b) => {
    const aExpiringCount = a.matchedIngredients.filter((name) =>
      expiringSet.has(name)
    ).length;
    const bExpiringCount = b.matchedIngredients.filter((name) =>
      expiringSet.has(name)
    ).length;

    if (bExpiringCount !== aExpiringCount) {
      return bExpiringCount - aExpiringCount;
    }

    return b.matchPercentage - a.matchPercentage;
  });
}
