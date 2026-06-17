export type Ingredient = {
  id: string;
  name: string;
  category: 'base' | 'syrup' | 'foam' | 'garnish';
  color: string;
  displayOrder: number;
};

export const BASES: Ingredient[] = [
  { id: 'latte', name: '拿铁', category: 'base', color: '#D4A574', displayOrder: 1 },
  { id: 'matcha', name: '抹茶', category: 'base', color: '#D4A574', displayOrder: 2 },
  { id: 'cocoa', name: '可可', category: 'base', color: '#D4A574', displayOrder: 3 },
  { id: 'espresso', name: '浓缩咖啡', category: 'base', color: '#D4A574', displayOrder: 4 },
  { id: 'black-tea', name: '红茶', category: 'base', color: '#D4A574', displayOrder: 5 },
  { id: 'oolong', name: '乌龙茶', category: 'base', color: '#D4A574', displayOrder: 6 },
];

export const SYRUPS: Ingredient[] = [
  { id: 'mint', name: '薄荷', category: 'syrup', color: '#A8C0A8', displayOrder: 1 },
  { id: 'caramel', name: '焦糖', category: 'syrup', color: '#A8C0A8', displayOrder: 2 },
  { id: 'vanilla', name: '香草', category: 'syrup', color: '#A8C0A8', displayOrder: 3 },
  { id: 'hazelnut', name: '榛果', category: 'syrup', color: '#A8C0A8', displayOrder: 4 },
  { id: 'rose', name: '玫瑰', category: 'syrup', color: '#A8C0A8', displayOrder: 5 },
];

export const GARNISHES: Ingredient[] = [
  { id: 'cinnamon-stick', name: '肉桂棒', category: 'garnish', color: '#6B3A2E', displayOrder: 1 },
  { id: 'chocolate-chips', name: '巧克力碎', category: 'garnish', color: '#6B3A2E', displayOrder: 2 },
  { id: 'cocoa-powder', name: '可可粉', category: 'garnish', color: '#6B3A2E', displayOrder: 3 },
  { id: 'whipped-cream', name: '奶油花', category: 'garnish', color: '#6B3A2E', displayOrder: 4 },
  { id: 'caramel-drizzle', name: '焦糖酱', category: 'garnish', color: '#6B3A2E', displayOrder: 5 },
];

export const ALL_INGREDIENTS: Ingredient[] = [...BASES, ...SYRUPS, ...GARNISHES];

export function getIngredientById(id: string): Ingredient | undefined {
  return ALL_INGREDIENTS.find((item) => item.id === id);
}

export const CATEGORY_LABELS: Record<Ingredient['category'], string> = {
  base: '饮品基底',
  syrup: '糖浆',
  foam: '奶泡',
  garnish: '装饰',
};
