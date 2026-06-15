import type { EmissionFactor, ActivityType } from '@/types';

export const TRANSPORT_FACTORS: EmissionFactor[] = [
  { type: 'transport', subtype: 'walk', label: '步行', factor: 0, unit: '公里', icon: '🚶', color: '#2E7D32' },
  { type: 'transport', subtype: 'bike', label: '骑行', factor: 0, unit: '公里', icon: '🚲', color: '#43A047' },
  { type: 'transport', subtype: 'subway', label: '地铁', factor: 0.04, unit: '公里', icon: '🚇', color: '#66BB6A' },
  { type: 'transport', subtype: 'bus', label: '公交', factor: 0.08, unit: '公里', icon: '🚌', color: '#81C784' },
  { type: 'transport', subtype: 'car', label: '私家车', factor: 0.2, unit: '公里', icon: '🚗', color: '#EF6C00' },
];

export const DIET_FACTORS: EmissionFactor[] = [
  { type: 'diet', subtype: 'vegetarian', label: '素食', factor: 0.5, unit: '餐', icon: '🥗', color: '#43A047' },
  { type: 'diet', subtype: 'mixed', label: '混合饮食', factor: 1.2, unit: '餐', icon: '🍱', color: '#FB8C00' },
  { type: 'diet', subtype: 'meat', label: '荤食', factor: 2.5, unit: '餐', icon: '🍖', color: '#E53935' },
];

export const ELECTRICITY_FACTORS: EmissionFactor[] = [
  { type: 'electricity', subtype: 'ac', label: '空调', factor: 0.8, unit: '小时', icon: '❄️', color: '#1976D2' },
  { type: 'electricity', subtype: 'light', label: '照明', factor: 0.05, unit: '小时', icon: '💡', color: '#FBC02D' },
  { type: 'electricity', subtype: 'computer', label: '电脑', factor: 0.15, unit: '小时', icon: '💻', color: '#7B1FA2' },
  { type: 'electricity', subtype: 'other', label: '其他电器', factor: 0.3, unit: '小时', icon: '🔌', color: '#546E7A' },
];

export const ALL_FACTORS: EmissionFactor[] = [
  ...TRANSPORT_FACTORS,
  ...DIET_FACTORS,
  ...ELECTRICITY_FACTORS,
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  transport: '交通出行',
  diet: '饮食消费',
  electricity: '家庭用电',
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  transport: '#43A047',
  diet: '#FB8C00',
  electricity: '#1976D2',
};

export const getFactor = (type: ActivityType, subtype: string): EmissionFactor | undefined => {
  return ALL_FACTORS.find((f) => f.type === type && f.subtype === subtype);
};

export const calculateEmission = (type: ActivityType, subtype: string, value: number): number => {
  const factor = getFactor(type, subtype);
  if (!factor) return 0;
  return Math.round(factor.factor * value * 100) / 100;
};

export const getSubtypesByType = (type: ActivityType): EmissionFactor[] => {
  switch (type) {
    case 'transport':
      return TRANSPORT_FACTORS;
    case 'diet':
      return DIET_FACTORS;
    case 'electricity':
      return ELECTRICITY_FACTORS;
    default:
      return [];
  }
};
