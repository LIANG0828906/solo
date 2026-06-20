import type { Ingredient, Recipe, RecipeIngredient } from '../types';

export interface MatchedRecipe extends Recipe {
  matchRate: number;
  utilizationRate: number;
  availableIngredients: string[];
  missingIngredients: RecipeIngredient[];
}

const difficultyOrder: Record<string, number> = {
  '简单': 0,
  '中等': 1,
  '复杂': 2,
};

function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

function isIngredientAvailable(recipeIngredientName: string, availableNames: string[]): boolean {
  const normalizedTarget = normalizeName(recipeIngredientName);
  return availableNames.some(
    (avail) =>
      normalizeName(avail) === normalizedTarget ||
      normalizeName(avail).includes(normalizedTarget) ||
      normalizedTarget.includes(normalizeName(avail)),
  );
}

export function matchRecipes(ingredients: Ingredient[], recipes: Recipe[]): MatchedRecipe[] {
  const availableNames = ingredients.map((i) => i.name);
  const totalIngredients = availableNames.length;

  const matched: MatchedRecipe[] = [];

  for (const recipe of recipes) {
    const availableIngredients: string[] = [];
    const missingIngredients: RecipeIngredient[] = [];

    for (const ri of recipe.ingredients) {
      if (isIngredientAvailable(ri.name, availableNames)) {
        availableIngredients.push(ri.name);
      } else {
        missingIngredients.push(ri);
      }
    }

    const total = recipe.ingredients.length;
    if (total === 0) continue;

    const matchRate = availableIngredients.length / total;
    const utilizationRate = totalIngredients > 0 ? availableIngredients.length / totalIngredients : 0;
    const minUtilization = totalIngredients > 0 ? 0.7 : 0;

    if (matchRate >= 0.7 && utilizationRate >= minUtilization) {
      matched.push({
        ...recipe,
        matchRate,
        utilizationRate,
        availableIngredients,
        missingIngredients,
      });
    }
  }

  matched.sort((a, b) => {
    if (b.matchRate !== a.matchRate) return b.matchRate - a.matchRate;
    if (b.utilizationRate !== a.utilizationRate) return b.utilizationRate - a.utilizationRate;
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });

  return matched.slice(0, 5);
}
