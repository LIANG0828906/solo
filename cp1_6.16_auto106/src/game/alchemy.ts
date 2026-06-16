export type MaterialType = 'red' | 'blue' | 'green' | 'yellow';

export type CreatureType =
  | 'dragon' | 'hellhound' | 'phoenix' | 'nymph'
  | 'unicorn' | 'treant' | 'gargoyle' | 'griffin'
  | 'troll' | 'elk' | 'ancient_dragon' | 'salamander';

export interface Recipe {
  materials: MaterialType[];
  potionName: string;
  potionColor: string;
  creatureId: CreatureType;
  creatureName: string;
}

export interface Potion {
  id: string;
  recipe: Recipe;
}

export interface BrewResult {
  success: boolean;
  potion?: Potion;
  failMessage?: string;
}

const RECIPES: Recipe[] = [
  { materials: ['red', 'blue'], potionName: '紫色幻兽引诱剂', potionColor: '#9933FF', creatureId: 'dragon', creatureName: '飞龙' },
  { materials: ['red', 'green'], potionName: '猩红狂暴药水', potionColor: '#8B0000', creatureId: 'hellhound', creatureName: '地狱犬' },
  { materials: ['red', 'yellow'], potionName: '烈日之焰药剂', potionColor: '#FF4500', creatureId: 'phoenix', creatureName: '凤凰' },
  { materials: ['blue', 'green'], potionName: '深渊安神露', potionColor: '#00CED1', creatureId: 'nymph', creatureName: '水妖' },
  { materials: ['blue', 'yellow'], potionName: '星辉觉醒剂', potionColor: '#4169E1', creatureId: 'unicorn', creatureName: '独角兽' },
  { materials: ['green', 'yellow'], potionName: '生命复苏药水', potionColor: '#7CFC00', creatureId: 'treant', creatureName: '树精' },
  { materials: ['red', 'blue', 'green'], potionName: '暗影通灵剂', potionColor: '#4B0082', creatureId: 'gargoyle', creatureName: '石像鬼' },
  { materials: ['red', 'blue', 'yellow'], potionName: '王者威仪药水', potionColor: '#8B6914', creatureId: 'griffin', creatureName: '狮鹫' },
  { materials: ['red', 'green', 'yellow'], potionName: '大地之力药剂', potionColor: '#8B4513', creatureId: 'troll', creatureName: '巨魔' },
  { materials: ['blue', 'green', 'yellow'], potionName: '精灵祝福露', potionColor: '#DAA520', creatureId: 'elk', creatureName: '精灵鹿' },
  { materials: ['red', 'blue', 'green', 'yellow'], potionName: '万物始源圣液', potionColor: '#FF69B4', creatureId: 'ancient_dragon', creatureName: '远古巨龙' },
  { materials: ['red', 'red'], potionName: '纯焰精华', potionColor: '#FF0000', creatureId: 'salamander', creatureName: '火蜥蜴' },
];

function countMaterials(slots: (MaterialType | null)[]): Map<MaterialType, number> {
  const counts = new Map<MaterialType, number>();
  for (const s of slots) {
    if (s) {
      counts.set(s, (counts.get(s) || 0) + 1);
    }
  }
  return counts;
}

function mapsEqual(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, val] of a) {
    if (b.get(key) !== val) return false;
  }
  return true;
}

export function matchRecipe(slots: (MaterialType | null)[]): Recipe | null {
  const inputCounts = countMaterials(slots);
  const inputMap = new Map<string, number>();
  for (const [k, v] of inputCounts) inputMap.set(k, v);

  for (const recipe of RECIPES) {
    const recipeCounts = new Map<string, number>();
    for (const m of recipe.materials) {
      recipeCounts.set(m, (recipeCounts.get(m) || 0) + 1);
    }
    if (mapsEqual(inputMap, recipeCounts)) {
      return recipe;
    }
  }
  return null;
}

export function brew(slots: (MaterialType | null)[]): BrewResult {
  const filledSlots = slots.filter((s): s is MaterialType => s !== null);
  if (filledSlots.length === 0) {
    return { success: false, failMessage: '请先放入材料！' };
  }
  const recipe = matchRecipe(slots);
  if (recipe) {
    const potion: Potion = {
      id: `potion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      recipe,
    };
    return { success: true, potion };
  }
  return { success: false, failMessage: '材料组合无效，产生了浑浊的液体...' };
}

export function getMaterialColor(type: MaterialType): string {
  switch (type) {
    case 'red': return '#CC2222';
    case 'blue': return '#2266CC';
    case 'green': return '#22AA44';
    case 'yellow': return '#CCAA22';
  }
}

export function getMaterialName(type: MaterialType): string {
  switch (type) {
    case 'red': return '龙血草';
    case 'blue': return '月光石';
    case 'green': return '魔菇';
    case 'yellow': return '黄金砂';
  }
}

export function getAllRecipes(): Recipe[] {
  return [...RECIPES];
}
