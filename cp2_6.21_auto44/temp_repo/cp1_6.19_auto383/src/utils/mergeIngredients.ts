import type { Recipe, MergedIngredient, CategoryGroup } from '../types';

const categoryOrder = ['肉类', '水产', '蛋类', '豆制品', '蔬菜', '主食', '干货', '调料'];

export function mergeIngredients(recipes: Recipe[]): CategoryGroup[] {
  const ingredientMap = new Map<string, MergedIngredient>();

  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const key = `${ing.name}-${ing.unit}`;
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        existing.totalQuantity += ing.quantity;
        existing.subtotal = existing.totalQuantity * ing.price;
      } else {
        ingredientMap.set(key, {
          ...ing,
          totalQuantity: ing.quantity,
          subtotal: ing.quantity * ing.price,
          checked: false,
          key
        });
      }
    });
  });

  const categoryMap = new Map<string, MergedIngredient[]>();
  
  ingredientMap.forEach(ing => {
    if (!categoryMap.has(ing.category)) {
      categoryMap.set(ing.category, []);
    }
    categoryMap.get(ing.category)!.push(ing);
  });

  const result: CategoryGroup[] = [];
  
  categoryOrder.forEach(cat => {
    if (categoryMap.has(cat)) {
      result.push({
        category: cat,
        ingredients: categoryMap.get(cat)!.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
  });

  categoryMap.forEach((ings, cat) => {
    if (!categoryOrder.includes(cat)) {
      result.push({
        category: cat,
        ingredients: ings.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
  });

  return result;
}
