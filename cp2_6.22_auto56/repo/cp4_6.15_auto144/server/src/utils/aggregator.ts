import { FoodJournal } from '../types';

interface CuisineTasteWeight {
  sour: number;
  sweet: number;
  spicy: number;
  salty: number;
  umami: number;
}

const CUISINE_TASTE_MAP: Record<string, CuisineTasteWeight> = {
  '中餐': { sour: 4, sweet: 5, spicy: 4, salty: 6, umami: 7 },
  '川菜': { sour: 5, sweet: 3, spicy: 10, salty: 7, umami: 8 },
  '粤菜': { sour: 2, sweet: 6, spicy: 1, salty: 5, umami: 9 },
  '湘菜': { sour: 4, sweet: 2, spicy: 9, salty: 7, umami: 8 },
  '江浙菜': { sour: 4, sweet: 7, spicy: 1, salty: 4, umami: 7 },
  '北京菜': { sour: 2, sweet: 5, spicy: 2, salty: 6, umami: 8 },
  '上海菜': { sour: 3, sweet: 8, spicy: 1, salty: 5, umami: 8 },
  '西北菜': { sour: 2, sweet: 2, spicy: 5, salty: 7, umami: 8 },
  '日料': { sour: 3, sweet: 3, spicy: 1, salty: 4, umami: 9 },
  '寿司': { sour: 3, sweet: 2, spicy: 1, salty: 4, umami: 10 },
  '拉面': { sour: 3, sweet: 2, spicy: 2, salty: 8, umami: 9 },
  '西餐': { sour: 3, sweet: 4, spicy: 1, salty: 5, umami: 8 },
  '法餐': { sour: 3, sweet: 5, spicy: 0, salty: 5, umami: 8 },
  '意餐': { sour: 4, sweet: 4, spicy: 2, salty: 5, umami: 8 },
  '韩餐': { sour: 5, sweet: 3, spicy: 7, salty: 6, umami: 8 },
  '韩式烤肉': { sour: 4, sweet: 4, spicy: 6, salty: 7, umami: 8 },
  '泡菜': { sour: 8, sweet: 2, spicy: 7, salty: 8, umami: 7 },
  '泰餐': { sour: 8, sweet: 5, spicy: 8, salty: 5, umami: 9 },
  '冬阴功': { sour: 9, sweet: 4, spicy: 9, salty: 5, umami: 9 },
  '甜品': { sour: 1, sweet: 10, spicy: 0, salty: 1, umami: 3 },
  '蛋糕': { sour: 1, sweet: 10, spicy: 0, salty: 1, umami: 3 },
  '火锅': { sour: 3, sweet: 2, spicy: 9, salty: 7, umami: 9 },
  '烤鸭': { sour: 2, sweet: 5, spicy: 1, salty: 6, umami: 9 },
  '早茶': { sour: 2, sweet: 6, spicy: 0, salty: 5, umami: 8 },
  '小笼包': { sour: 3, sweet: 4, spicy: 1, salty: 5, umami: 8 },
  '泡馍': { sour: 2, sweet: 1, spicy: 4, salty: 7, umami: 8 },
  '东坡肉': { sour: 4, sweet: 7, spicy: 0, salty: 4, umami: 7 },
  '其他': { sour: 5, sweet: 5, spicy: 5, salty: 5, umami: 5 },
};

function getCuisineTasteInference(cuisineTags: string[]): CuisineTasteWeight {
  if (cuisineTags.length === 0) {
    return { sour: 5, sweet: 5, spicy: 5, salty: 5, umami: 5 };
  }

  const weights: CuisineTasteWeight = { sour: 0, sweet: 0, spicy: 0, salty: 0, umami: 0 };
  let totalWeight = 0;

  cuisineTags.forEach((tag) => {
    const matchedKey = Object.keys(CUISINE_TASTE_MAP).find(
      (key) => tag.includes(key) || key.includes(tag)
    );
    
    if (matchedKey) {
      const cuisineWeight = CUISINE_TASTE_MAP[matchedKey];
      weights.sour += cuisineWeight.sour;
      weights.sweet += cuisineWeight.sweet;
      weights.spicy += cuisineWeight.spicy;
      weights.salty += cuisineWeight.salty;
      weights.umami += cuisineWeight.umami;
      totalWeight++;
    }
  });

  if (totalWeight === 0) {
    return { sour: 5, sweet: 5, spicy: 5, salty: 5, umami: 5 };
  }

  return {
    sour: Math.round(weights.sour / totalWeight),
    sweet: Math.round(weights.sweet / totalWeight),
    spicy: Math.round(weights.spicy / totalWeight),
    salty: Math.round(weights.salty / totalWeight),
    umami: Math.round(weights.umami / totalWeight),
  };
}

export function calculateRadarData(journals: FoodJournal[]): {
  sour: number;
  sweet: number;
  spicy: number;
  salty: number;
  umami: number;
} {
  if (journals.length === 0) {
    return { sour: 0, sweet: 0, spicy: 0, salty: 0, umami: 0 };
  }

  const TASTE_PROFILE_WEIGHT = 0.6;
  const CUISINE_INFERENCE_WEIGHT = 0.4;

  const totals = journals.reduce(
    (acc, journal) => {
      const cuisineInference = getCuisineTasteInference(journal.cuisineTags);
      const ratingFactor = journal.rating / 10;

      acc.sour += (journal.tasteProfile.sour * TASTE_PROFILE_WEIGHT + cuisineInference.sour * CUISINE_INFERENCE_WEIGHT) * ratingFactor;
      acc.sweet += (journal.tasteProfile.sweet * TASTE_PROFILE_WEIGHT + cuisineInference.sweet * CUISINE_INFERENCE_WEIGHT) * ratingFactor;
      acc.spicy += (journal.tasteProfile.spicy * TASTE_PROFILE_WEIGHT + cuisineInference.spicy * CUISINE_INFERENCE_WEIGHT) * ratingFactor;
      acc.salty += (journal.tasteProfile.salty * TASTE_PROFILE_WEIGHT + cuisineInference.salty * CUISINE_INFERENCE_WEIGHT) * ratingFactor;
      acc.umami += (journal.tasteProfile.umami * TASTE_PROFILE_WEIGHT + cuisineInference.umami * CUISINE_INFERENCE_WEIGHT) * ratingFactor;
      return acc;
    },
    { sour: 0, sweet: 0, spicy: 0, salty: 0, umami: 0 }
  );

  const ratingSum = journals.reduce((sum, j) => sum + (j.rating / 10), 0);
  const divisor = ratingSum > 0 ? ratingSum : journals.length;

  const result = {
    sour: Math.min(10, Math.max(0, Math.round(totals.sour / divisor))),
    sweet: Math.min(10, Math.max(0, Math.round(totals.sweet / divisor))),
    spicy: Math.min(10, Math.max(0, Math.round(totals.spicy / divisor))),
    salty: Math.min(10, Math.max(0, Math.round(totals.salty / divisor))),
    umami: Math.min(10, Math.max(0, Math.round(totals.umami / divisor))),
  };

  console.log('[Radar Calculation] Input journals:', journals.length);
  console.log('[Radar Calculation] Result:', result);
  return result;
}

export function calculateCalendarData(
  journals: FoodJournal[],
  year: number
): { date: string; count: number }[] {
  const dateMap = new Map<string, number>();

  journals.forEach((journal) => {
    const date = new Date(journal.createdAt);
    if (date.getFullYear() === year) {
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getJournalsByDate(
  journals: FoodJournal[],
  dateStr: string
): FoodJournal[] {
  return journals.filter((journal) => {
    const journalDate = new Date(journal.createdAt).toISOString().split('T')[0];
    return journalDate === dateStr;
  });
}
