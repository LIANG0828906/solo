import { v4 as uuidv4 } from 'uuid';
import type { Activity, Suggestion, ActivityType } from '@/types';
import { getFactor, TRANSPORT_FACTORS, DIET_FACTORS, ELECTRICITY_FACTORS } from '@/constants/emissionFactors';
import { getRecentActivities, formatNumber } from './calculations';

interface SubtypeStats {
  subtype: string;
  type: ActivityType;
  label: string;
  icon: string;
  color: string;
  totalEmission: number;
  totalValue: number;
  count: number;
  avgValue: number;
  factor: number;
  unit: string;
}

interface SuggestionTemplate {
  id: string;
  type: ActivityType;
  relatedSubtype?: string;
  title: string;
  buildDescription: (stats: SubtypeStats) => string;
  calculateSaving: (stats: SubtypeStats) => number;
  minSaving: number;
  priority: number;
}

const getSubtypeStats = (activities: Activity[]): SubtypeStats[] => {
  const map = new Map<string, SubtypeStats>();

  activities.forEach((a) => {
    const factor = getFactor(a.type, a.subtype);
    if (!factor) return;

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
        label: factor.label,
        icon: factor.icon,
        color: factor.color,
        totalEmission: a.emission,
        totalValue: a.value,
        count: 1,
        avgValue: a.value,
        factor: factor.factor,
        unit: factor.unit,
      });
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => b.totalEmission - a.totalEmission,
  );
};

const TRANSPORT_SUGGESTION_TEMPLATES: SuggestionTemplate[] = [
  {
    id: 'car-to-subway',
    type: 'transport',
    relatedSubtype: 'car',
    title: '试试地铁通勤',
    buildDescription: (stats) =>
      `您本周私家车出行约 ${formatNumber(stats.totalValue)} 公里，排放 ${formatNumber(stats.totalEmission)} kg CO₂。如果每周有 ${Math.min(3, stats.count)} 天改乘地铁，可减少约 ${formatNumber(stats.totalEmission * 0.4)} kg 碳排放。`,
    calculateSaving: (stats) => Math.round(stats.totalEmission * 0.4 * 100) / 100,
    minSaving: 0.5,
    priority: 1,
  },
  {
    id: 'car-carpool',
    type: 'transport',
    relatedSubtype: 'car',
    title: '拼车出行更环保',
    buildDescription: (stats) =>
      `您本周私家车使用 ${stats.count} 次，排放 ${formatNumber(stats.totalEmission)} kg CO₂。尝试与同事或邻居拼车，每次可减少约 ${formatNumber(stats.avgValue * 0.2 * stats.factor)} kg 碳排放。`,
    calculateSaving: (stats) => Math.round(stats.avgValue * stats.count * 0.2 * stats.factor * 100) / 100,
    minSaving: 0.3,
    priority: 2,
  },
  {
    id: 'bus-to-walk',
    type: 'transport',
    relatedSubtype: 'bus',
    title: '短途改步行或骑行',
    buildDescription: (stats) =>
      `您每次公交出行平均 ${formatNumber(stats.avgValue)} 公里，短距离出行可尝试步行或骑行，既锻炼身体又零排放，每周可减少约 X kg CO₂。`,
    calculateSaving: (stats) => {
      if (stats.avgValue > 5) return 0;
      return Math.round(stats.avgValue * stats.count * 0.3 * stats.factor * 100) / 100;
    },
    minSaving: 0.15,
    priority: 3,
  },
];

const DIET_SUGGESTION_TEMPLATES: SuggestionTemplate[] = [
  {
    id: 'meat-to-veg',
    type: 'diet',
    relatedSubtype: 'meat',
    title: '增加素食比例',
    buildDescription: (stats) =>
      `您本周吃了 ${stats.count} 顿荤食，排放 ${formatNumber(stats.totalEmission)} kg CO₂。试试每周 ${Math.min(3, stats.count)} 顿换成素食，可减少约 ${formatNumber(stats.totalEmission * 0.5)} kg 碳排放。`,
    calculateSaving: (stats) => Math.round(stats.totalEmission * 0.5 * 100) / 100,
    minSaving: 0.5,
    priority: 1,
  },
  {
    id: 'mixed-to-veg',
    type: 'diet',
    relatedSubtype: 'mixed',
    title: '尝试周一无肉日',
    buildDescription: (stats) =>
      `您本周有 ${stats.count} 顿混合饮食，每周安排 1-2 天纯素食，既能清肠排毒又能减少碳排放，预计可减少 ${formatNumber(stats.totalEmission * 0.2)} kg/周。`,
    calculateSaving: (stats) => Math.round(stats.totalEmission * 0.2 * 100) / 100,
    minSaving: 0.3,
    priority: 2,
  },
  {
    id: 'reduce-food-waste',
    type: 'diet',
    title: '减少食物浪费',
    buildDescription: () =>
      '按需购买食材，减少食物浪费。每减少 1kg 食物浪费，可减少约 2.5kg 碳排放，同时节省开支。',
    calculateSaving: () => 1.2,
    minSaving: 0.1,
    priority: 4,
  },
];

const ELECTRICITY_SUGGESTION_TEMPLATES: SuggestionTemplate[] = [
  {
    id: 'ac-temperature',
    type: 'electricity',
    relatedSubtype: 'ac',
    title: '空调温度调高 2℃',
    buildDescription: (stats) =>
      `您本周空调使用 ${formatNumber(stats.totalValue)} 小时，排放 ${formatNumber(stats.totalEmission)} kg CO₂。将温度调高 2℃，可节省约 ${Math.round(stats.totalEmission * 0.2 * 100) / 100} kg 碳排放，体感几乎无差别。`,
    calculateSaving: (stats) => Math.round(stats.totalEmission * 0.2 * 100) / 100,
    minSaving: 0.3,
    priority: 1,
  },
  {
    id: 'computer-sleep',
    type: 'electricity',
    relatedSubtype: 'computer',
    title: '电脑不用时及时休眠',
    buildDescription: (stats) =>
      `您本周电脑使用 ${formatNumber(stats.totalValue)} 小时，设置休眠模式、关闭屏幕保护可减少待机功耗，每周可节省约 ${formatNumber(stats.totalEmission * 0.15)} kg 碳排放。`,
    calculateSaving: (stats) => Math.round(stats.totalEmission * 0.15 * 100) / 100,
    minSaving: 0.1,
    priority: 2,
  },
  {
    id: 'led-bulbs',
    type: 'electricity',
    relatedSubtype: 'light',
    title: '更换 LED 节能灯',
    buildDescription: (stats) =>
      `您本周照明使用 ${formatNumber(stats.totalValue)} 小时，将白炽灯换成 LED 灯可节电约 80%，长期使用既环保又省钱。`,
    calculateSaving: (stats) => Math.round(stats.totalEmission * 0.5 * 100) / 100,
    minSaving: 0.1,
    priority: 3,
  },
  {
    id: 'unplug-charger',
    type: 'electricity',
    title: '拔下不用的充电器',
    buildDescription: () =>
      '手机充电器、充电宝等设备即使未充电也会消耗少量电力，及时拔下既安全又节能。',
    calculateSaving: () => 0.2,
    minSaving: 0.05,
    priority: 5,
  },
];

const ALL_TEMPLATES = [
  ...TRANSPORT_SUGGESTION_TEMPLATES,
  ...DIET_SUGGESTION_TEMPLATES,
  ...ELECTRICITY_SUGGESTION_TEMPLATES,
];

const GENERIC_SUGGESTIONS: SuggestionTemplate[] = [
  {
    id: 'reusable-bottle',
    type: 'diet',
    title: '自带水杯和购物袋',
    buildDescription: () =>
      '减少一次性塑料制品使用，自带水杯和购物袋，每人每年可减少约 30 kg 碳排放。',
    calculateSaving: () => 0.6,
    minSaving: 0.1,
    priority: 10,
  },
  {
    id: 'local-produce',
    type: 'diet',
    title: '选择本地农产品',
    buildDescription: () =>
      '购买本地生产的食物可减少运输过程中的碳排放，同时更新鲜更健康。',
    calculateSaving: () => 0.5,
    minSaving: 0.1,
    priority: 10,
  },
  {
    id: 'paperless',
    type: 'electricity',
    title: '无纸化办公',
    buildDescription: () =>
      '多用电子文档、电子发票，减少纸张使用，每节约 1 张 A4 纸约减少 0.01 kg 碳排放。',
    calculateSaving: () => 0.3,
    minSaving: 0.1,
    priority: 10,
  },
];

const buildSuggestion = (
  template: SuggestionTemplate,
  stats: SubtypeStats | null,
): Suggestion => {
  const description = stats ? template.buildDescription(stats) : template.buildDescription({} as SubtypeStats);
  const potentialSaving = stats
    ? template.calculateSaving(stats)
    : template.calculateSaving({} as SubtypeStats);

  return {
    id: `${template.id}-${uuidv4().slice(0, 8)}`,
    title: template.title,
    description,
    potentialSaving,
    activityType: template.type,
    relatedSubtype: template.relatedSubtype,
  };
};

export const generateSuggestions = (
  activities: Activity[],
  dismissedSuggestionIds: Set<string> = new Set(),
  count = 3,
): Suggestion[] => {
  const recent = getRecentActivities(activities, 7);
  const subtypeStats = getSubtypeStats(recent);

  const top3Subtypes = subtypeStats.slice(0, 3);

  const results: Suggestion[] = [];
  const usedTemplateIds = new Set<string>();

  for (const stats of top3Subtypes) {
    const templatesForSubtype = ALL_TEMPLATES.filter(
      (t) =>
        t.relatedSubtype === stats.subtype &&
        !usedTemplateIds.has(t.id) &&
        t.calculateSaving(stats) >= t.minSaving,
    );

    if (templatesForSubtype.length > 0) {
      const best = templatesForSubtype.sort((a, b) => a.priority - b.priority)[0];
      results.push(buildSuggestion(best, stats));
      usedTemplateIds.add(best.id);
    }
  }

  for (const stats of subtypeStats) {
    if (results.length >= count) break;

    const typeTemplates = ALL_TEMPLATES.filter(
      (t) =>
        t.type === stats.type &&
        !usedTemplateIds.has(t.id) &&
        t.relatedSubtype !== stats.subtype,
    );

    for (const tpl of typeTemplates.sort((a, b) => a.priority - b.priority)) {
      if (results.length >= count) break;
      if (usedTemplateIds.has(tpl.id)) continue;
      const saving = tpl.calculateSaving(stats);
      if (saving >= tpl.minSaving) {
        results.push(buildSuggestion(tpl, stats));
        usedTemplateIds.add(tpl.id);
      }
    }
  }

  if (results.length < count) {
    for (const tpl of GENERIC_SUGGESTIONS) {
      if (results.length >= count) break;
      if (usedTemplateIds.has(tpl.id)) continue;
      const s = buildSuggestion(tpl, null);
      const baseId = tpl.id;
      const isDismissed = Array.from(dismissedSuggestionIds).some((d) =>
        d.startsWith(baseId),
      );
      if (!isDismissed) {
        results.push(s);
        usedTemplateIds.add(tpl.id);
      }
    }
  }

  const filtered = results.filter(
    (s) => !dismissedSuggestionIds.has(s.id),
  );

  filtered.sort((a, b) => b.potentialSaving - a.potentialSaving);

  if (filtered.length < count) {
    const fallback = GENERIC_SUGGESTIONS
      .map((t) => buildSuggestion(t, null))
      .filter((s) => !filtered.some((f) => f.title === s.title))
      .slice(0, count - filtered.length);
    filtered.push(...fallback);
  }

  return filtered.slice(0, count);
};

export default generateSuggestions;
