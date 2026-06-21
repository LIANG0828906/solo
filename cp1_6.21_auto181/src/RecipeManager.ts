export interface Element {
  id: string;
  name: string;
  color: string;
  icon: string;
  tier: 'basic' | 'common' | 'rare' | 'legendary';
}

export interface Recipe {
  id: string;
  ingredients: [string, string];
  result: string;
  isAchievement?: boolean;
}

const ELEMENTS: Element[] = [
  { id: 'fire', name: '火', color: '#EF4444', icon: '🔥', tier: 'basic' },
  { id: 'water', name: '水', color: '#3B82F6', icon: '💧', tier: 'basic' },
  { id: 'earth', name: '土', color: '#92400E', icon: '🪨', tier: 'basic' },
  { id: 'wind', name: '风', color: '#A7F3D0', icon: '💨', tier: 'basic' },

  { id: 'steam', name: '蒸汽', color: '#E5E7EB', icon: '♨️', tier: 'common' },
  { id: 'lava', name: '岩浆', color: '#F97316', icon: '🌋', tier: 'common' },
  { id: 'mud', name: '泥浆', color: '#78716C', icon: '🟤', tier: 'common' },
  { id: 'dust', name: '尘埃', color: '#D6D3D1', icon: '✨', tier: 'common' },
  { id: 'lightning', name: '闪电', color: '#FDE047', icon: '⚡', tier: 'common' },
  { id: 'ice', name: '冰', color: '#67E8F9', icon: '🧊', tier: 'common' },

  { id: 'metal', name: '金属', color: '#9CA3AF', icon: '⚙️', tier: 'rare' },
  { id: 'glass', name: '玻璃', color: '#7DD3FC', icon: '🔮', tier: 'rare' },
  { id: 'plant', name: '植物', color: '#22C55E', icon: '🌱', tier: 'rare' },
  { id: 'energy', name: '能量', color: '#FBBF24', icon: '✨', tier: 'rare' },
  { id: 'cloud', name: '云', color: '#F1F5F9', icon: '☁️', tier: 'rare' },
  { id: 'crystal', name: '水晶', color: '#C084FC', icon: '💎', tier: 'rare' },

  { id: 'life', name: '生命', color: '#4ADE80', icon: '🌸', tier: 'legendary' },
  { id: 'time', name: '时间', color: '#818CF8', icon: '⏳', tier: 'legendary' },
  { id: 'phoenix', name: '凤凰', color: '#F97316', icon: '🦅', tier: 'legendary' },
  { id: 'philosopher_stone', name: '贤者之石', color: '#DC2626', icon: '🔴', tier: 'legendary' },
];

const RECIPES: Recipe[] = [
  { id: 'r1', ingredients: ['fire', 'water'], result: 'steam' },
  { id: 'r2', ingredients: ['fire', 'earth'], result: 'lava' },
  { id: 'r3', ingredients: ['water', 'earth'], result: 'mud' },
  { id: 'r4', ingredients: ['earth', 'wind'], result: 'dust' },
  { id: 'r5', ingredients: ['fire', 'wind'], result: 'lightning' },
  { id: 'r6', ingredients: ['water', 'wind'], result: 'ice' },

  { id: 'r7', ingredients: ['lava', 'earth'], result: 'metal' },
  { id: 'r8', ingredients: ['dust', 'fire'], result: 'glass' },
  { id: 'r9', ingredients: ['mud', 'water'], result: 'plant' },
  { id: 'r10', ingredients: ['lightning', 'fire'], result: 'energy' },
  { id: 'r11', ingredients: ['steam', 'wind'], result: 'cloud' },
  { id: 'r12', ingredients: ['lava', 'water'], result: 'crystal' },

  { id: 'r13', ingredients: ['plant', 'energy'], result: 'life', isAchievement: true },
  { id: 'r14', ingredients: ['crystal', 'energy'], result: 'time', isAchievement: true },
  { id: 'r15', ingredients: ['fire', 'life'], result: 'phoenix', isAchievement: true },
  { id: 'r16', ingredients: ['metal', 'life'], result: 'philosopher_stone', isAchievement: true },
];

export function getAllElements(): Element[] {
  return [...ELEMENTS];
}

export function getAllRecipes(): Recipe[] {
  return [...RECIPES];
}

export function getElementById(id: string): Element | undefined {
  return ELEMENTS.find(e => e.id === id);
}

export function getBasicElements(): Element[] {
  return ELEMENTS.filter(e => e.tier === 'basic');
}

export function synthesize(element1Id: string, element2Id: string): Recipe | null {
  const recipe = RECIPES.find(r =>
    (r.ingredients[0] === element1Id && r.ingredients[1] === element2Id) ||
    (r.ingredients[0] === element2Id && r.ingredients[1] === element1Id)
  );
  return recipe || null;
}

export function getTotalRecipeCount(): number {
  return RECIPES.length;
}

export function getElementColors(elementIds: string[]): string[] {
  return elementIds
    .map(id => getElementById(id)?.color)
    .filter((c): c is string => c !== undefined);
}
