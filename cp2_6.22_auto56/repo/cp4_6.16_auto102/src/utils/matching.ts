import { ClothingItem, Season, Occasion } from '../types';

const SEASON_COLORS: Record<Season, string[]> = {
  spring: ['粉', '绿', '粉绿', '粉色', '绿色', '浅粉', '浅绿'],
  summer: ['蓝', '白', '蓝白', '蓝色', '白色', '浅蓝', '天蓝'],
  autumn: ['橙', '棕', '橙棕', '橙色', '棕色', '卡其', '驼色'],
  winter: ['灰', '黑', '灰黑', '灰色', '黑色', '深灰', '藏青'],
};

export function findMatchingOutfit(
  clothes: ClothingItem[],
  season: Season,
  occasion: Occasion
): { top: ClothingItem | null; bottom: ClothingItem | null; error?: string } {
  const seasonColors = SEASON_COLORS[season];
  
  const tops = clothes.filter(c => c.category === 'top');
  const bottoms = clothes.filter(c => c.category === 'bottom');
  const dresses = clothes.filter(c => c.category === 'accessory' && c.name.includes('裙'));
  
  const hasSeasonColor = (item: ClothingItem) => 
    seasonColors.some(color => item.color.includes(color));
  
  const seasonTops = tops.filter(hasSeasonColor);
  const seasonBottoms = bottoms.filter(hasSeasonColor);
  
  const topPool = seasonTops.length > 0 ? seasonTops : tops;
  const bottomPool = seasonBottoms.length > 0 ? seasonBottoms : bottoms;
  
  if (topPool.length === 0 && bottomPool.length === 0) {
    return { top: null, bottom: null, error: '衣橱中没有足够的衣物来生成搭配，请先添加衣物！' };
  }
  
  const top = topPool.length > 0 ? topPool[Math.floor(Math.random() * topPool.length)] : null;
  const bottom = bottomPool.length > 0 ? bottomPool[Math.floor(Math.random() * bottomPool.length)] : null;
  
  return { top, bottom };
}
