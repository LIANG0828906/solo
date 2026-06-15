import { v4 as uuidv4 } from 'uuid';
import type { Activity, Suggestion, ActivityType } from '@/types';
import { getFactor, calculateEmission } from '@/constants/emissionFactors';
import { getRecentActivities, formatNumber } from './calculations';

interface SubtypeStats {
  subtype: string;
  type: ActivityType;
  totalEmission: number;
  totalValue: number;
  count: number;
  avgValue: number;
}

const getSubtypeStats = (activities: Activity[]): SubtypeStats[] => {
  const map = new Map<string, SubtypeStats>();

  activities.forEach((a) => {
    const existing = map.get(a.subtype);
    if (existing) {
      existing.totalEmission += a.emission;
      existing.totalValue += a.value;
      existing.count += 1;
      existing.avgValue = existing.totalValue / existing.count;
    } else {
      map.set(a.subtype, {
        subtype: a.subtype,
        type: a.type,
        totalEmission: a.emission,
        totalValue: a.value,
        count: 1,
        avgValue: a.value,
      });
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => b.totalEmission - a.totalEmission,
  );
};

const createTransportSuggestion = (
  carStats: SubtypeStats,
): Suggestion | null => {
  const weeklyKm = carStats.avgValue * 5;
  const subwayFactor = getFactor('transport', 'subway');
  const carFactor = getFactor('transport', 'car');
  if (!subwayFactor || !carFactor) return null;

  const currentEmission = carStats.avgValue * carFactor.factor * 5;
  const newEmission = carStats.avgValue * subwayFactor.factor * 5;
  const saving = Math.round((currentEmission - newEmission) * 100) / 100;

  if (saving <= 0) return null;

  return {
    id: uuidv4(),
    title: '绿色通勤建议',
    description: `您本周私家车出行约 ${formatNumber(weeklyKm)} 公里，排放 ${formatNumber(currentEmission)} kg CO₂。建议改为地铁出行，每周可减少约 ${formatNumber(saving)} kg 碳排放，相当于种植 ${Math.max(1, Math.round(saving / 2))} 棵树的年吸收量。`,
    potentialSaving: saving,
    activityType: 'transport',
    relatedSubtype: 'car',
  };
};

const createDietSuggestion = (
  meatStats: SubtypeStats,
): Suggestion | null => {
  const vegFactor = getFactor('diet', 'vegetarian');
  if (!vegFactor) return null;

  const weeklyMeals = Math.max(meatStats.count, 5);
  const currentEmission = meatStats.totalEmission;
  const newEmission = weeklyMeals * vegFactor.factor;
  const saving = Math.max(0, Math.round((currentEmission - newEmission) * 100) / 100);

  if (saving < 0.5) return null;

  return {
    id: uuidv4(),
    title: '低碳饮食建议',
    description: `您本周荤食餐数较多，共排放 ${formatNumber(currentEmission)} kg CO₂。尝试每周增加 ${Math.min(3, weeklyMeals)} 顿素食，可减少约 ${formatNumber(saving)} kg 碳排放，同时有益身体健康！`,
    potentialSaving: saving,
    activityType: 'diet',
    relatedSubtype: 'meat',
  };
};

const createElectricitySuggestion = (
  acStats: SubtypeStats,
): Suggestion | null => {
  const lightFactor = getFactor('electricity', 'light');
  if (!lightFactor) return null;

  const weeklyHours = Math.max(acStats.avgValue * 5, 10);
  const currentEmission = acStats.avgValue * 5 * (getFactor('electricity', 'ac')?.factor || 0.8);
  const savingPct = 0.3;
  const saving = Math.round(currentEmission * savingPct * 100) / 100;

  if (saving < 0.3) return null;

  return {
    id: uuidv4(),
    title: '节能用电建议',
    description: `您本周空调使用时长较长，耗电排放 ${formatNumber(currentEmission)} kg CO₂。建议将温度调高 2℃ 或减少 ${Math.round(weeklyHours * savingPct)} 小时使用，每周可节省约 ${formatNumber(saving)} kg 碳排放。`,
    potentialSaving: saving,
    activityType: 'electricity',
    relatedSubtype: 'ac',
  };
};

const createBusWalkSuggestion = (
  stats: SubtypeStats,
): Suggestion | null => {
  const walkFactor = getFactor('transport', 'walk');
  if (!walkFactor) return null;

  const dailyKm = stats.avgValue;
  if (dailyKm > 5) return null;

  const saving = Math.round(dailyKm * 5 * (getFactor('transport', 'bus')?.factor || 0.08) * 100) / 100;
  if (saving < 0.2) return null;

  return {
    id: uuidv4(),
    title: '短距离出行建议',
    description: `您每次公交出行距离约 ${formatNumber(dailyKm)} 公里，建议尝试步行或骑行，既能锻炼身体，每周又可减少约 ${formatNumber(saving)} kg 碳排放。`,
    potentialSaving: saving,
    activityType: 'transport',
    relatedSubtype: 'bus',
  };
};

const createMixedDietSuggestion = (
  stats: SubtypeStats,
): Suggestion | null => {
  const vegFactor = getFactor('diet', 'vegetarian');
  const mixedFactor = getFactor('diet', 'mixed');
  if (!vegFactor || !mixedFactor) return null;

  const weeklyMeals = stats.count;
  const saving = Math.round(weeklyMeals * (mixedFactor.factor - vegFactor.factor) * 100) / 100;
  if (saving < 0.5) return null;

  return {
    id: uuidv4(),
    title: '提升素食比例',
    description: `您本周共吃了 ${weeklyMeals} 顿混合饮食，若将其中 3 顿改为纯素食，每周可减少约 ${formatNumber(saving)} kg 碳排放，推荐尝试周一无肉日！`,
    potentialSaving: saving,
    activityType: 'diet',
    relatedSubtype: 'mixed',
  };
};

const createComputerSuggestion = (
  stats: SubtypeStats,
): Suggestion | null => {
  const savingPct = 0.2;
  const saving = Math.round(stats.totalEmission * savingPct * 100) / 100;
  if (saving < 0.2) return null;

  return {
    id: uuidv4(),
    title: '电脑使用优化',
    description: `您本周电脑使用累计 ${formatNumber(stats.totalValue)} 小时，建议设置休眠模式并及时关闭电源，可节省约 ${formatNumber(saving)} kg 碳排放。`,
    potentialSaving: saving,
    activityType: 'electricity',
    relatedSubtype: 'computer',
  };
};

const createGenericSuggestions = (): Suggestion[] => [
  {
    id: uuidv4(),
    title: '随手关灯好习惯',
    description: '离开房间时随手关灯、关闭待机电器，每年可减少约 50 kg 碳排放，从今天开始行动吧！',
    potentialSaving: 1,
    activityType: 'electricity',
  },
  {
    id: uuidv4(),
    title: '自带水杯购物袋',
    description: '减少一次性塑料制品使用，自带水杯和购物袋，每人每年可减少约 30 kg 碳排放。',
    potentialSaving: 0.6,
    activityType: 'diet',
  },
  {
    id: uuidv4(),
    title: '理性消费减少浪费',
    description: '按需购买食物和用品，减少食物浪费，支持本地农产品，都是践行低碳生活的好方式。',
    potentialSaving: 0.8,
    activityType: 'diet',
  },
];

export const generateSuggestions = (
  activities: Activity[],
  existingSuggestionIds: Set<string> = new Set(),
  count = 3,
): Suggestion[] => {
  const recent = getRecentActivities(activities, 7);
  const stats = getSubtypeStats(recent);
  const suggestions: Suggestion[] = [];

  const carStats = stats.find((s) => s.subtype === 'car');
  if (carStats) {
    const s = createTransportSuggestion(carStats);
    if (s) suggestions.push(s);
  }

  const meatStats = stats.find((s) => s.subtype === 'meat');
  if (meatStats) {
    const s = createDietSuggestion(meatStats);
    if (s) suggestions.push(s);
  }

  const acStats = stats.find((s) => s.subtype === 'ac');
  if (acStats) {
    const s = createElectricitySuggestion(acStats);
    if (s) suggestions.push(s);
  }

  const busStats = stats.find((s) => s.subtype === 'bus');
  if (busStats && suggestions.length < count) {
    const s = createBusWalkSuggestion(busStats);
    if (s) suggestions.push(s);
  }

  const mixedStats = stats.find((s) => s.subtype === 'mixed');
  if (mixedStats && suggestions.length < count) {
    const s = createMixedDietSuggestion(mixedStats);
    if (s) suggestions.push(s);
  }

  const computerStats = stats.find((s) => s.subtype === 'computer');
  if (computerStats && suggestions.length < count) {
    const s = createComputerSuggestion(computerStats);
    if (s) suggestions.push(s);
  }

  const generic = createGenericSuggestions().filter(
    (s) => !existingSuggestionIds.has(s.id),
  );
  for (const g of generic) {
    if (suggestions.length >= count) break;
    suggestions.push(g);
  }

  const finalList = suggestions
    .filter((s) => !existingSuggestionIds.has(s.id))
    .sort((a, b) => b.potentialSaving - a.potentialSaving)
    .slice(0, count);

  if (finalList.length < count) {
    const fallback = createGenericSuggestions()
      .filter((s) => !finalList.some((f) => f.title === s.title))
      .slice(0, count - finalList.length);
    finalList.push(...fallback);
  }

  return finalList;
};
