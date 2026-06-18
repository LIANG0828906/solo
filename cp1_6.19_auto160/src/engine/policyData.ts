export interface PolicyTag {
  id: string;
  name: string;
  category: 'transport' | 'economy' | 'environment' | 'social';
  color: string;
  description: string;
  effects: {
    satisfaction: number;
    carbon: number;
    economy: number;
  };
  growthRate: {
    satisfaction: number;
    carbon: number;
    economy: number;
  };
}

export const policyTags: PolicyTag[] = [
  {
    id: 'bus_expansion',
    name: '公交加密',
    category: 'transport',
    color: '#673AB7',
    description: '增加公交线路和班次',
    effects: { satisfaction: 8, carbon: -12, economy: 3 },
    growthRate: { satisfaction: 0.03, carbon: -0.02, economy: 0.01 },
  },
  {
    id: 'tax_adjustment',
    name: '税收调整',
    category: 'economy',
    color: '#FF5722',
    description: '提高个税起征点',
    effects: { satisfaction: 12, carbon: 2, economy: 15 },
    growthRate: { satisfaction: 0.02, carbon: 0.01, economy: 0.05 },
  },
  {
    id: 'night_economy',
    name: '夜间经济',
    category: 'economy',
    color: '#FF5722',
    description: '开放夜间经济区',
    effects: { satisfaction: 10, carbon: 8, economy: 20 },
    growthRate: { satisfaction: 0.04, carbon: 0.03, economy: 0.06 },
  },
  {
    id: 'green_belt',
    name: '绿化带建设',
    category: 'environment',
    color: '#4CAF50',
    description: '增加城市绿地面积',
    effects: { satisfaction: 15, carbon: -10, economy: -2 },
    growthRate: { satisfaction: 0.05, carbon: -0.04, economy: -0.01 },
  },
  {
    id: 'traffic_restriction',
    name: '限行政策',
    category: 'transport',
    color: '#673AB7',
    description: '机动车尾号限行',
    effects: { satisfaction: -5, carbon: -18, economy: -8 },
    growthRate: { satisfaction: -0.02, carbon: -0.06, economy: -0.03 },
  },
  {
    id: 'education_subsidy',
    name: '教育补贴',
    category: 'social',
    color: '#2196F3',
    description: '增加教育经费补贴',
    effects: { satisfaction: 18, carbon: 1, economy: 5 },
    growthRate: { satisfaction: 0.06, carbon: 0.005, economy: 0.02 },
  },
  {
    id: 'healthcare_reform',
    name: '医疗改革',
    category: 'social',
    color: '#2196F3',
    description: '优化医疗资源配置',
    effects: { satisfaction: 20, carbon: 3, economy: 8 },
    growthRate: { satisfaction: 0.05, carbon: 0.01, economy: 0.03 },
  },
  {
    id: 'waste_pricing',
    name: '垃圾收费',
    category: 'environment',
    color: '#4CAF50',
    description: '实施垃圾分类计量收费',
    effects: { satisfaction: -3, carbon: -8, economy: -1 },
    growthRate: { satisfaction: -0.01, carbon: -0.03, economy: -0.005 },
  },
];

export interface SynergyEffect {
  policies: [string, string];
  effects: {
    satisfaction: number;
    carbon: number;
    economy: number;
  };
}

export const synergyEffects: SynergyEffect[] = [
  {
    policies: ['bus_expansion', 'traffic_restriction'],
    effects: { satisfaction: 5, carbon: -8, economy: 2 },
  },
  {
    policies: ['night_economy', 'tax_adjustment'],
    effects: { satisfaction: 3, carbon: 2, economy: 8 },
  },
  {
    policies: ['green_belt', 'waste_pricing'],
    effects: { satisfaction: 4, carbon: -5, economy: 1 },
  },
  {
    policies: ['education_subsidy', 'healthcare_reform'],
    effects: { satisfaction: 6, carbon: 1, economy: 3 },
  },
  {
    policies: ['bus_expansion', 'green_belt'],
    effects: { satisfaction: 3, carbon: -3, economy: 1 },
  },
];

export const BASELINE = {
  satisfaction: 50,
  carbon: 120,
  economy: 50,
};

export const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    transport: '#673AB7',
    economy: '#FF5722',
    environment: '#4CAF50',
    social: '#2196F3',
  };
  return colorMap[category] || '#9E9E9E';
};
