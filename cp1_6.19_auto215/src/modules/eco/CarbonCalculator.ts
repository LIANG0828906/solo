import type { ItemCategory, CarbonResult } from '../../types';

const categoryFactors: Record<ItemCategory, number> = {
  '书籍': 0.3,
  '电子': 0.6,
  '家居': 0.5,
  '服饰': 0.2,
  '运动': 0.25,
  '其他': 0.35,
};

export function calculateCarbon(category: ItemCategory, weight: number): CarbonResult {
  const factor = categoryFactors[category] || 0.3;
  const reduction = weight * factor;
  const carbonPoints = Math.round(reduction);

  return {
    reduction,
    carbonPoints,
    category,
    weight,
  };
}

export function getCategoryFactor(category: ItemCategory): number {
  return categoryFactors[category] || 0.3;
}

export function getTotalReduction(items: Array<{ category: ItemCategory; weight: number }>): number {
  return items.reduce((total, item) => {
    return total + item.weight * getCategoryFactor(item.category);
  }, 0);
}
