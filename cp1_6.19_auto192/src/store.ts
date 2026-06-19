import { create } from 'zustand';
import type { CoffeeBean, BrewRecord, StoreState } from './types';

const mockBeans: CoffeeBean[] = [
  {
    id: 'bean-1',
    name: '埃塞俄比亚 耶加雪菲',
    origin: '埃塞俄比亚 耶加雪菲',
    altitude: 2100,
    processMethod: '水洗处理',
    roastLevel: '浅烘焙',
    flavorProfile: {
      acidity: 8,
      bitterness: 2,
      sweetness: 7,
      body: 5,
      cleanliness: 9,
    },
    flavorTags: ['柑橘', '茉莉', '柠檬', '蜂蜜'],
    createdAt: new Date('2026-01-15'),
  },
  {
    id: 'bean-2',
    name: '哥伦比亚 薇拉',
    origin: '哥伦比亚 薇拉省',
    altitude: 1950,
    processMethod: '厌氧发酵',
    roastLevel: '中浅烘焙',
    flavorProfile: {
      acidity: 6,
      bitterness: 3,
      sweetness: 8,
      body: 6,
      cleanliness: 7,
    },
    flavorTags: ['浆果', '焦糖', '巧克力', '玫瑰'],
    createdAt: new Date('2026-02-20'),
  },
  {
    id: 'bean-3',
    name: '肯尼亚 AA',
    origin: '肯尼亚 涅里郡',
    altitude: 2000,
    processMethod: '水洗处理',
    roastLevel: '中烘焙',
    flavorProfile: {
      acidity: 9,
      bitterness: 4,
      sweetness: 6,
      body: 7,
      cleanliness: 8,
    },
    flavorTags: ['黑醋栗', '番茄', '黑莓', '香料'],
    createdAt: new Date('2026-03-10'),
  },
  {
    id: 'bean-4',
    name: '危地马拉 薇薇特南果',
    origin: '危地马拉 薇薇特南果',
    altitude: 1800,
    processMethod: '水洗处理',
    roastLevel: '中深烘焙',
    flavorProfile: {
      acidity: 5,
      bitterness: 6,
      sweetness: 7,
      body: 8,
      cleanliness: 6,
    },
    flavorTags: ['可可', '坚果', '焦糖', '烟熏'],
    createdAt: new Date('2026-04-05'),
  },
];

const mockBrewRecords: BrewRecord[] = [
  {
    id: 'brew-1',
    beanId: 'bean-1',
    coffeeAmount: 15,
    waterAmount: 250,
    waterTemp: 92,
    grindSize: 3.5,
    brewTime: 150,
    pourMethod: 'three-stage',
    rating: {
      overall: 9,
      acidity: 8,
      sweetness: 8,
      aroma: 9,
    },
    notes: '入口有明亮的柠檬酸，中段是茉莉花茶的清香，尾韵带有蜂蜜的甜感。非常干净的一杯，高温时表现最佳。',
    createdAt: new Date('2026-06-15T08:30:00'),
  },
  {
    id: 'brew-2',
    beanId: 'bean-1',
    coffeeAmount: 15,
    waterAmount: 250,
    waterTemp: 90,
    grindSize: 4.0,
    brewTime: 180,
    pourMethod: 'single-pour',
    rating: {
      overall: 8,
      acidity: 7,
      sweetness: 7,
      aroma: 8,
    },
    notes: '水温降低后酸质更加柔和，甜度更加突出。研磨度调粗让整体口感更顺滑，适合不太喜欢强酸的顾客。',
    createdAt: new Date('2026-06-15T10:15:00'),
  },
  {
    id: 'brew-3',
    beanId: 'bean-2',
    coffeeAmount: 15,
    waterAmount: 240,
    waterTemp: 93,
    grindSize: 3.2,
    brewTime: 165,
    pourMethod: 'three-stage',
    rating: {
      overall: 9,
      acidity: 7,
      sweetness: 9,
      aroma: 9,
    },
    notes: '厌氧发酵带来的复杂水果风味非常明显，草莓和蓝莓的香气扑鼻，尾韵有淡淡的红酒感。',
    createdAt: new Date('2026-06-16T09:00:00'),
  },
  {
    id: 'brew-4',
    beanId: 'bean-3',
    coffeeAmount: 15,
    waterAmount: 250,
    waterTemp: 94,
    grindSize: 3.0,
    brewTime: 145,
    pourMethod: 'stirred',
    rating: {
      overall: 8,
      acidity: 9,
      sweetness: 7,
      aroma: 8,
    },
    notes: '搅拌法带来非常浓郁的黑醋栗和番茄风味，酸质明亮但不尖锐，body厚实。适合喜欢强烈风味的咖啡爱好者。',
    createdAt: new Date('2026-06-16T11:30:00'),
  },
  {
    id: 'brew-5',
    beanId: 'bean-4',
    coffeeAmount: 18,
    waterAmount: 280,
    waterTemp: 95,
    grindSize: 2.8,
    brewTime: 200,
    pourMethod: 'three-stage',
    rating: {
      overall: 8,
      acidity: 5,
      sweetness: 8,
      aroma: 7,
    },
    notes: '中深烘焙的坚果和巧克力风味非常饱满，尾韵带有淡淡的烟熏感。水温稍高让甜感更突出。',
    createdAt: new Date('2026-06-17T08:45:00'),
  },
  {
    id: 'brew-6',
    beanId: 'bean-2',
    coffeeAmount: 15,
    waterAmount: 250,
    waterTemp: 91,
    grindSize: 3.8,
    brewTime: 175,
    pourMethod: 'single-pour',
    rating: {
      overall: 7,
      acidity: 6,
      sweetness: 8,
      aroma: 7,
    },
    notes: '一刀流的方式让这杯厌氧豆的甜感更加集中，焦糖和牛奶巧克力的风味明显，但复杂度稍逊于三段式。',
    createdAt: new Date('2026-06-17T10:00:00'),
  },
  {
    id: 'brew-7',
    beanId: 'bean-1',
    coffeeAmount: 15,
    waterAmount: 250,
    waterTemp: 93,
    grindSize: 3.0,
    brewTime: 130,
    pourMethod: 'stirred',
    rating: {
      overall: 10,
      acidity: 9,
      sweetness: 9,
      aroma: 10,
    },
    notes: '今天最佳！搅拌法完美展现了耶加雪菲的茉莉花香和柑橘类水果的明亮酸质，甜感如蜂蜜般持久，干净度极佳。',
    createdAt: new Date('2026-06-18T09:20:00'),
  },
  {
    id: 'brew-8',
    beanId: 'bean-3',
    coffeeAmount: 15,
    waterAmount: 250,
    waterTemp: 92,
    grindSize: 3.5,
    brewTime: 155,
    pourMethod: 'three-stage',
    rating: {
      overall: 9,
      acidity: 8,
      sweetness: 7,
      aroma: 9,
    },
    notes: '三段式注水让肯尼亚AA的层次完全展现，前调黑莓，中调番茄汤，尾韵黑醋栗，非常有趣的一杯。',
    createdAt: new Date('2026-06-18T14:30:00'),
  },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<StoreState>((set) => ({
  beans: mockBeans,
  brewRecords: mockBrewRecords,
  selectedForComparison: [],

  addBean: (bean) =>
    set((state) => ({
      beans: [
        ...state.beans,
        {
          ...bean,
          id: `bean-${generateId()}`,
          createdAt: new Date(),
        },
      ],
    })),

  addBrewRecord: (record) =>
    set((state) => ({
      brewRecords: [
        {
          ...record,
          id: `brew-${generateId()}`,
          createdAt: new Date(),
        },
        ...state.brewRecords,
      ],
    })),

  toggleComparison: (id) =>
    set((state) => {
      const isSelected = state.selectedForComparison.includes(id);
      if (isSelected) {
        return {
          selectedForComparison: state.selectedForComparison.filter((i) => i !== id),
        };
      }
      if (state.selectedForComparison.length >= 4) {
        return state;
      }
      return {
        selectedForComparison: [...state.selectedForComparison, id],
      };
    })),

  clearComparison: () => set({ selectedForComparison: [] }),
}));
