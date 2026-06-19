import type { Crop, Plot, PlantingPlan, YieldHistory } from './types';

export const CROPS: Crop[] = [
  {
    id: 'tomato',
    name: '番茄',
    family: 'solanaceae',
    color: '#E53935',
    nutrientConsumption: { n: 30, p: 15, k: 25 },
    growthMonths: 3,
    baseYield: 80,
  },
  {
    id: 'eggplant',
    name: '茄子',
    family: 'solanaceae',
    color: '#7B1FA2',
    nutrientConsumption: { n: 25, p: 20, k: 20 },
    growthMonths: 3,
    baseYield: 65,
  },
  {
    id: 'pepper',
    name: '辣椒',
    family: 'solanaceae',
    color: '#FF5722',
    nutrientConsumption: { n: 20, p: 15, k: 30 },
    growthMonths: 3,
    baseYield: 50,
  },
  {
    id: 'cucumber',
    name: '黄瓜',
    family: 'cucurbitaceae',
    color: '#388E3C',
    nutrientConsumption: { n: 35, p: 10, k: 20 },
    growthMonths: 2,
    baseYield: 120,
  },
  {
    id: 'pumpkin',
    name: '南瓜',
    family: 'cucurbitaceae',
    color: '#FF9800',
    nutrientConsumption: { n: 20, p: 25, k: 15 },
    growthMonths: 4,
    baseYield: 90,
  },
  {
    id: 'lettuce',
    name: '生菜',
    family: 'asteraceae',
    color: '#8BC34A',
    nutrientConsumption: { n: 15, p: 5, k: 10 },
    growthMonths: 1,
    baseYield: 40,
  },
  {
    id: 'carrot',
    name: '胡萝卜',
    family: 'apiaceae',
    color: '#FF7043',
    nutrientConsumption: { n: 10, p: 20, k: 25 },
    growthMonths: 3,
    baseYield: 55,
  },
  {
    id: 'beans',
    name: '豆角',
    family: 'fabaceae',
    color: '#689F38',
    nutrientConsumption: { n: -20, p: 10, k: 15 },
    growthMonths: 2,
    baseYield: 70,
  },
  {
    id: 'cabbage',
    name: '白菜',
    family: 'brassicaceae',
    color: '#C0CA33',
    nutrientConsumption: { n: 25, p: 10, k: 15 },
    growthMonths: 2,
    baseYield: 100,
  },
  {
    id: 'spinach',
    name: '菠菜',
    family: 'amaranthaceae',
    color: '#558B2F',
    nutrientConsumption: { n: 20, p: 8, k: 12 },
    growthMonths: 1,
    baseYield: 35,
  },
];

export const PLOTS: Plot[] = [
  {
    id: 'plot-1',
    name: '地块 A',
    nutrients: { n: 75, p: 60, k: 70 },
  },
  {
    id: 'plot-2',
    name: '地块 B',
    nutrients: { n: 80, p: 65, k: 75 },
  },
  {
    id: 'plot-3',
    name: '地块 C',
    nutrients: { n: 70, p: 55, k: 65 },
  },
];

export const FAMILY_NAMES: Record<string, string> = {
  solanaceae: '茄科',
  cucurbitaceae: '葫芦科',
  asteraceae: '菊科',
  apiaceae: '伞形科',
  fabaceae: '豆科',
  brassicaceae: '十字花科',
  amaranthaceae: '苋科',
};

export const FERTILIZER_RECOMMENDATIONS: Record<string, string> = {
  n: '腐熟鸡粪、豆饼肥、尿素',
  p: '骨粉、过磷酸钙、磷矿粉',
  k: '草木灰、硫酸钾、氯化钾',
};

export const generateInitialPlans = (): PlantingPlan[] => {
  const plans: PlantingPlan[] = [];
  for (let i = 1; i <= 3; i++) {
    for (let m = 1; m <= 12; m++) {
      plans.push({
        plotId: `plot-${i}`,
        month: m,
        cropId: null,
      });
    }
  }
  return plans;
};

export const generateYieldHistory = (): YieldHistory[] => {
  const history: YieldHistory[] = [];
  const crops = ['tomato', 'cucumber', 'lettuce', 'carrot', 'beans', 'cabbage'];
  const plots = ['plot-1', 'plot-2', 'plot-3'];

  for (const plotId of plots) {
    for (const cropId of crops) {
      for (let year = 2023; year <= 2024; year++) {
        for (let month = 1; month <= 12; month++) {
          const crop = CROPS.find(c => c.id === cropId)!;
          const seasonalFactor = 1 + 0.3 * Math.sin((month - 3) * Math.PI / 6);
          const randomFactor = 0.85 + Math.random() * 0.3;
          const yieldValue = Math.round(crop.baseYield * seasonalFactor * randomFactor);
          history.push({
            plotId,
            cropId,
            month,
            year,
            yield: yieldValue,
          });
        }
      }
    }
  }

  return history;
};

export const YIELD_HISTORY = generateYieldHistory();
export const INITIAL_PLANS = generateInitialPlans();
