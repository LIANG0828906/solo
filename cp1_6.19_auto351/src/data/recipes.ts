import type { Item, Recipe } from '@/types';

export const INITIAL_MATERIALS: Item[] = [
  { id: 'scrap_iron', name: '废铁', icon: '🔩', count: 8, weight: 2, slots: 1 },
  { id: 'rubber', name: '橡胶', icon: '🟤', count: 4, weight: 1, slots: 1 },
  { id: 'wood', name: '木头', icon: '🪵', count: 6, weight: 2, slots: 1 },
  { id: 'cloth', name: '布料', icon: '🧶', count: 5, weight: 1, slots: 1 },
  { id: 'glass', name: '玻璃', icon: '🔮', count: 4, weight: 1, slots: 1 },
  { id: 'herb', name: '草药', icon: '🌿', count: 3, weight: 0.5, slots: 1 },
];

export const RECIPES: Recipe[] = [
  {
    id: 'iron_pipe',
    name: '铁管',
    icon: '🔧',
    color: '#1e88e5',
    slots: 2,
    ingredients: { scrap_iron: 2, rubber: 1 },
  },
  {
    id: 'campfire',
    name: '篝火',
    icon: '🔥',
    color: '#f44336',
    slots: 2,
    ingredients: { wood: 3, cloth: 1 },
    statEffects: { hunger: 20 },
  },
  {
    id: 'telescope',
    name: '望远镜',
    icon: '🔭',
    color: '#512da8',
    slots: 2,
    ingredients: { scrap_iron: 1, glass: 2 },
  },
  {
    id: 'drinking_water',
    name: '饮用水',
    icon: '💧',
    color: '#00bcd4',
    slots: 1,
    ingredients: { cloth: 2, rubber: 1 },
    statEffects: { thirst: 30 },
  },
  {
    id: 'medkit',
    name: '医疗包',
    icon: '💊',
    color: '#81c784',
    slots: 1,
    ingredients: { cloth: 2, herb: 1 },
    statEffects: { health: 50 },
  },
  {
    id: 'knife',
    name: '短刀',
    icon: '🗡️',
    color: '#9e9e9e',
    slots: 2,
    ingredients: { scrap_iron: 2, wood: 1 },
  },
  {
    id: 'disinfectant',
    name: '消毒水',
    icon: '🧴',
    color: '#26a69a',
    slots: 1,
    ingredients: { glass: 1, herb: 1 },
    statEffects: { health: 20 },
  },
  {
    id: 'rifle',
    name: '步枪',
    icon: '🔫',
    color: '#6d4c41',
    slots: 2,
    ingredients: { scrap_iron: 3, glass: 1 },
  },
];

export function matchRecipe(workbenchIngredients: Record<string, number>): Recipe | null {
  for (const recipe of RECIPES) {
    const recipeKeys = Object.keys(recipe.ingredients).sort();
    const benchKeys = Object.keys(workbenchIngredients).sort();

    if (recipeKeys.length !== benchKeys.length) continue;

    const keysMatch = recipeKeys.every((key, i) => key === benchKeys[i]);
    if (!keysMatch) continue;

    const amountsMatch = recipeKeys.every(
      (key) => recipe.ingredients[key] === workbenchIngredients[key]
    );
    if (amountsMatch) return recipe;
  }
  return null;
}
