import { Inventory, CraftableResult, ResourceType } from '../types';
import { RECIPES } from '../data/recipes';

export function detectRecipes(inventory: Inventory): CraftableResult[] {
  const countMap: Record<ResourceType, number> = {
    stone: 0,
    wood: 0,
    iron: 0,
    leather: 0,
    string: 0,
  };

  for (let i = 0; i < inventory.length; i++) {
    const slot = inventory[i];
    if (slot.resource && slot.count > 0) {
      countMap[slot.resource] += slot.count;
    }
  }

  const results: CraftableResult[] = [];

  for (let i = 0; i < RECIPES.length; i++) {
    const recipe = RECIPES[i];
    let match = true;
    const keys = Object.keys(recipe.requirements) as ResourceType[];
    for (let j = 0; j < keys.length; j++) {
      const k = keys[j];
      const required = recipe.requirements[k] ?? 0;
      if (countMap[k] < required) {
        match = false;
        break;
      }
    }
    if (match) {
      results.push({
        recipeId: recipe.id,
        name: recipe.name,
        iconColor: recipe.iconColor,
        requirements: { ...recipe.requirements },
      });
    }
  }

  return results;
}
