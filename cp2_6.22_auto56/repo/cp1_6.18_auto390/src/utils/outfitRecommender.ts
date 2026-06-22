import type { ClothingItem, Outfit, Weather, Style } from '@/store/useStore';

export const outfitRecommender = {
  recommend(
    wardrobe: ClothingItem[],
    weather: Weather,
    style: Style = 'casual'
  ): Outfit | null {
    const season = getSeasonByTemperature(weather.temperature);

    const tops = filterByTypeAndSeason(wardrobe, 'top', season);
    const bottoms = filterByTypeAndSeason(wardrobe, 'bottom', season);
    const shoes = filterByTypeAndSeason(wardrobe, 'shoes', season);
    const accessories = filterByTypeAndSeason(wardrobe, 'accessory', season);

    if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) {
      return null;
    }

    const top = tops[Math.floor(Math.random() * tops.length)];
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    const shoe = shoes[Math.floor(Math.random() * shoes.length)];
    const accessory = accessories.length > 0
      ? accessories[Math.floor(Math.random() * accessories.length)]
      : { id: 'default', type: 'accessory' as const, name: '无', season, color: '无' };

    const reason = generateReason(weather, style, season);

    return { top, bottom, shoes: shoe, accessory, reason };
  },
};

function getSeasonByTemperature(temp: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (temp >= 28) return 'summer';
  if (temp >= 18) return 'spring';
  if (temp >= 10) return 'autumn';
  return 'winter';
}

function filterByTypeAndSeason(
  wardrobe: ClothingItem[],
  type: ClothingItem['type'],
  season: string
): ClothingItem[] {
  return wardrobe.filter(
    (item) => item.type === type && (item.season === season || item.season === 'spring')
  );
}

function generateReason(weather: Weather, style: Style, season: string): string {
  const styleMap: Record<Style, string> = {
    casual: '休闲舒适',
    business: '商务正式',
    sport: '运动活力',
    vintage: '复古优雅',
  };

  const tempDesc = weather.temperature >= 28
    ? '炎热天气，选择透气轻薄'
    : weather.temperature >= 18
    ? '温暖宜人，适合层次搭配'
    : weather.temperature >= 10
    ? '凉爽舒适，注意保暖'
    : '寒冷天气，选择厚实保暖';

  return `${tempDesc}。今日${styleMap[style]}风格，搭配${weather.icon}${weather.temperature}°C的天气，让你时尚又舒适。`;
}
