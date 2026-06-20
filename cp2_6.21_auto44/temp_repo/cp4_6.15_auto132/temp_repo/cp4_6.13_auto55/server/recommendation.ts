import { Recipe, RecommendationResult } from './types';

function normalizeIngredient(ing: string): string {
  return ing.trim().toLowerCase();
}

export default function recommendRecipes(
  ingredients: string[],
  recipes: Recipe[]
): RecommendationResult[] {
  if (!ingredients || ingredients.length === 0) {
    return [];
  }

  const normalizedInput = ingredients.map(normalizeIngredient);

  const results: RecommendationResult[] = [];

  for (const recipe of recipes) {
    const normalizedRecipeIngredients = recipe.ingredients.map(normalizeIngredient);

    let intersectionCount = 0;
    const counted = new Set<number>();

    for (const inputIng of normalizedInput) {
      for (let i = 0; i < normalizedRecipeIngredients.length; i++) {
        if (!counted.has(i) && normalizedRecipeIngredients[i] === inputIng) {
          intersectionCount++;
          counted.add(i);
          break;
        }
      }
    }

    if (recipe.ingredients.length === 0) {
      continue;
    }

    const matchScore = Math.round((intersectionCount / recipe.ingredients.length) * 100);

    if (matchScore > 0) {
      results.push({ recipe, matchScore });
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);

  return results.slice(0, 10);
}
