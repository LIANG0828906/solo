import type { Ingredient, RecipeIngredient, CostReport, CostReportItem } from '../src/types';

export function calculateCost(
  ingredients: Ingredient[],
  recipeIngredients: RecipeIngredient[]
): CostReport {
  const totalVolumeMl = 10;
  
  const ingredientCosts: CostReportItem[] = recipeIngredients.map(ri => {
    const ingredient = ingredients.find(i => i.id === ri.ingredientId);
    if (!ingredient) {
      return {
        id: ri.ingredientId,
        name: '未知原料',
        cost: 0,
        percentage: ri.percentage,
      };
    }
    
    const volumeMl = totalVolumeMl * (ri.percentage / 100);
    const cost = volumeMl * (ingredient.cost / 100);
    
    return {
      id: ingredient.id,
      name: ingredient.name,
      cost: Math.round(cost * 100) / 100,
      percentage: ri.percentage,
    };
  });
  
  const totalCostPer10ml = ingredientCosts.reduce((sum, item) => sum + item.cost, 0);
  
  return {
    totalCostPer10ml: Math.round(totalCostPer10ml * 100) / 100,
    ingredientCosts,
  };
}

export function validatePercentageSum(ingredients: RecipeIngredient[]): boolean {
  const sum = ingredients.reduce((s, i) => s + i.percentage, 0);
  return Math.abs(sum - 100) < 0.01;
}

export function getPercentageSum(ingredients: RecipeIngredient[]): number {
  return ingredients.reduce((s, i) => s + i.percentage, 0);
}
