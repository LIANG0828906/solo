import { Inventory, CraftableResult, ResourceType, Recipe } from '../types';
import { RECIPES } from '../data/recipes';

function aggregateInventory(inventory: Inventory): Record<ResourceType, number> {
  const countMap = {} as Record<ResourceType, number>;
  const keys: ResourceType[] = ['stone', 'wood', 'iron', 'leather', 'string'];
  for (let i = 0; i < keys.length; i++) {
    countMap[keys[i]] = 0;
  }

  for (let i = 0; i < inventory.length; i++) {
    const slot = inventory[i];
    if (slot.resource && slot.count > 0) {
      countMap[slot.resource] += slot.count;
    }
  }

  return countMap;
}

function matchRecipe(
  recipe: Recipe,
  countMap: Record<ResourceType, number>
): boolean {
  const reqKeys = Object.keys(recipe.requirements) as ResourceType[];
  for (let i = 0; i < reqKeys.length; i++) {
    const k = reqKeys[i];
    const required = recipe.requirements[k] ?? 0;
    if (countMap[k] < required) {
      return false;
    }
  }
  return true;
}

export function detectRecipes(inventory: Inventory): CraftableResult[] {
  const countMap = aggregateInventory(inventory);
  const results: CraftableResult[] = [];

  for (let i = 0; i < RECIPES.length; i++) {
    const recipe = RECIPES[i];
    if (matchRecipe(recipe, countMap)) {
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

export function canCraft(
  recipeId: string,
  inventory: Inventory
): boolean {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return false;
  const countMap = aggregateInventory(inventory);
  return matchRecipe(recipe, countMap);
}

export function consumeResources(
  recipeId: string,
  inventory: Inventory
): Inventory | null {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return null;

  const countMap = aggregateInventory(inventory);
  if (!matchRecipe(recipe, countMap)) {
    return null;
  }

  const newInv = inventory.map((s) => ({ ...s }));
  const remaining = {} as Record<ResourceType, number>;
  const reqKeys = Object.keys(recipe.requirements) as ResourceType[];

  for (let i = 0; i < reqKeys.length; i++) {
    const k = reqKeys[i];
    remaining[k] = recipe.requirements[k] ?? 0;
  }

  for (let i = 0; i < newInv.length; i++) {
    const slot = newInv[i];
    if (!slot.resource || slot.count <= 0) continue;

    const need = remaining[slot.resource] ?? 0;
    if (need <= 0) continue;

    if (slot.count >= need) {
      slot.count -= need;
      remaining[slot.resource] = 0;
      if (slot.count <= 0) {
        slot.resource = null;
        slot.count = 0;
      }
    } else {
      remaining[slot.resource] = need - slot.count;
      slot.resource = null;
      slot.count = 0;
    }
  }

  return newInv;
}

export function getRecipeById(recipeId: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === recipeId);
}
