import type {
  Activity,
  EmissionFactor,
  CarbonResult,
  CategoryBreakdown,
  MonthlyData,
  ActivityCategory,
  TransportType,
  DietType,
  EnergyType
} from './types';

const EMISSION_FACTORS: EmissionFactor[] = [
  { category: 'transport', subType: 'walk', factor: 0, unit: 'km', name: '步行', description: '步行零排放，绿色出行最佳选择' },
  { category: 'transport', subType: 'subway', factor: 0.035, unit: 'km', name: '地铁', description: '城市轨道交通人均碳排放约0.035kg CO₂e/公里' },
  { category: 'transport', subType: 'bus', factor: 0.089, unit: 'km', name: '公交', description: '城市公交人均碳排放约0.089kg CO₂e/公里' },
  { category: 'transport', subType: 'car', factor: 0.21, unit: 'km', name: '自驾', description: '小型乘用车人均碳排放约0.21kg CO₂e/公里' },
  { category: 'transport', subType: 'flight', factor: 0.255, unit: 'km', name: '飞行', description: '民航客机人均碳排放约0.255kg CO₂e/公里' },

  { category: 'diet', subType: 'meat', factor: 27.0, unit: 'kg', name: '肉类', description: '牛肉、羊肉等红肉平均碳排放约27kg CO₂e/公斤' },
  { category: 'diet', subType: 'vegetable', factor: 2.0, unit: 'kg', name: '蔬菜', description: '新鲜蔬菜平均碳排放约2kg CO₂e/公斤' },
  { category: 'diet', subType: 'grain', factor: 2.5, unit: 'kg', name: '谷物', description: '大米、小麦等谷物平均碳排放约2.5kg CO₂e/公斤' },

  { category: 'energy', subType: 'electricity', factor: 0.581, unit: 'kWh', name: '电力', description: '中国电网平均碳排放约0.581kg CO₂e/千瓦时' },
  { category: 'energy', subType: 'gas', factor: 2.162, unit: 'm³', name: '天然气', description: '天然气燃烧碳排放约2.162kg CO₂e/立方米' }
];

const CATEGORY_NAMES: Record<ActivityCategory, string> = {
  transport: '交通出行',
  diet: '饮食消费',
  energy: '能源使用'
};

const SUBTYPE_NAMES: Record<string, string> = {
  walk: '步行',
  subway: '地铁',
  bus: '公交',
  car: '自驾',
  flight: '飞行',
  meat: '肉类',
  vegetable: '蔬菜',
  grain: '谷物',
  electricity: '电力',
  gas: '天然气'
};

export function getFactor(category: ActivityCategory, subType: string): EmissionFactor | undefined {
  return EMISSION_FACTORS.find(f => f.category === category && f.subType === subType);
}

export function getSubTypeName(subType: string): string {
  return SUBTYPE_NAMES[subType] || subType;
}

export function getCategoryName(category: ActivityCategory): string {
  return CATEGORY_NAMES[category];
}

export function calculateEmission(activity: Activity): number {
  const factor = getFactor(activity.category, activity.subType);
  if (!factor) return 0;
  return activity.amount * factor.factor;
}

export function calculateTotal(activities: Activity[]): CarbonResult {
  const categoryMap = new Map<ActivityCategory, CategoryBreakdown>();
  let total = 0;

  for (const activity of activities) {
    const emission = calculateEmission(activity);
    total += emission;

    if (!categoryMap.has(activity.category)) {
      categoryMap.set(activity.category, {
        category: activity.category,
        categoryName: CATEGORY_NAMES[activity.category],
        total: 0,
        subItems: []
      });
    }

    const breakdown = categoryMap.get(activity.category)!;
    breakdown.total += emission;

    const factor = getFactor(activity.category, activity.subType);
    breakdown.subItems.push({
      subType: activity.subType,
      subTypeName: factor?.name || activity.subType,
      amount: activity.amount,
      emission,
      description: factor?.description || '',
      activityId: activity.id
    });
  }

  const breakdown: CategoryBreakdown[] = Array.from(categoryMap.values());
  breakdown.sort((a, b) => b.total - a.total);

  return {
    totalEmission: total,
    breakdown,
    activities: [...activities].sort((a, b) => b.timestamp - a.timestamp)
  };
}

export function getMonthlyData(activities: Activity[]): MonthlyData[] {
  const monthMap = new Map<string, MonthlyData>();

  for (const activity of activities) {
    const date = new Date(activity.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: monthKey,
        total: 0,
        transport: 0,
        diet: 0,
        energy: 0
      });
    }

    const data = monthMap.get(monthKey)!;
    const emission = calculateEmission(activity);
    data.total += emission;
    data[activity.category] += emission;
  }

  const result = Array.from(monthMap.values());
  result.sort((a, b) => a.month.localeCompare(b.month));
  return result;
}

export function generateActivityId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function exportToCSV(activities: Activity[]): string {
  const headers = ['日期', '分类', '子类型', '数量', '单位', '碳排放量(kg CO₂e)'];
  const rows = activities.map(a => {
    const factor = getFactor(a.category, a.subType);
    const emission = calculateEmission(a);
    const dateStr = new Date(a.timestamp).toLocaleString('zh-CN');
    return [
      dateStr,
      CATEGORY_NAMES[a.category],
      factor?.name || a.subType,
      a.amount.toString(),
      factor?.unit || a.unit,
      emission.toFixed(4)
    ].map(v => `"${v}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getUnitBySubType(subType: TransportType | DietType | EnergyType): string {
  const factor = EMISSION_FACTORS.find(f => f.subType === subType);
  return factor?.unit || '';
}
