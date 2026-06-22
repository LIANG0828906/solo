import type {
  Ingredient,
  Recipe,
  MatchedRecipe,
  RecipeIngredient,
  MatchCategory,
} from '../types';

function findIngredientInStock(
  ingredientName: string,
  stock: Ingredient[]
): Ingredient | undefined {
  return stock.find(
    (item) => item.name === ingredientName && item.quantity > 0
  );
}

function isQuantitySufficient(
  stockItem: Ingredient,
  required: RecipeIngredient
): boolean {
  if (stockItem.unit !== required.unit) {
    return stockItem.quantity >= required.quantity;
  }
  return stockItem.quantity >= required.quantity;
}

export function matchRecipes(
  recipes: Recipe[],
  ingredients: Ingredient[]
): MatchedRecipe[] {
  return recipes.map((recipe) => {
    const matchedIngredients: string[] = [];
    const missingIngredients: RecipeIngredient[] = [];

    recipe.ingredients.forEach((reqIng) => {
      const stockItem = findIngredientInStock(reqIng.name, ingredients);
      if (stockItem && isQuantitySufficient(stockItem, reqIng)) {
        matchedIngredients.push(reqIng.name);
      } else {
        missingIngredients.push(reqIng);
      }
    });

    const missingCount = missingIngredients.length;
    let matchCategory: MatchCategory;

    if (missingCount === 0) {
      matchCategory = '完全匹配';
    } else if (missingCount <= 2) {
      matchCategory = '缺少1-2样';
    } else {
      matchCategory = '缺少更多';
    }

    return {
      ...recipe,
      matchCategory,
      matchedIngredients,
      missingIngredients,
    };
  });
}

export function sortMatchedRecipes(recipes: MatchedRecipe[]): MatchedRecipe[] {
  const categoryOrder: Record<MatchCategory, number> = {
    '完全匹配': 0,
    '缺少1-2样': 1,
    '缺少更多': 2,
  };

  return [...recipes].sort((a, b) => {
    const categoryDiff = categoryOrder[a.matchCategory] - categoryOrder[b.matchCategory];
    if (categoryDiff !== 0) return categoryDiff;
    return a.cookTime - b.cookTime;
  });
}

export function getRecipesByCategory(
  recipes: MatchedRecipe[]
): Record<MatchCategory, MatchedRecipe[]> {
  const sorted = sortMatchedRecipes(recipes);
  return {
    '完全匹配': sorted.filter((r) => r.matchCategory === '完全匹配'),
    '缺少1-2样': sorted.filter((r) => r.matchCategory === '缺少1-2样'),
    '缺少更多': sorted.filter((r) => r.matchCategory === '缺少更多'),
  };
}
