export interface FlavorProfile {
  acidity: number;
  bitterness: number;
  sweetness: number;
  body: number;
  cleanliness: number;
}

export interface CoffeeBean {
  id: string;
  name: string;
  origin: string;
  altitude: number;
  processMethod: string;
  roastLevel: string;
  flavorProfile: FlavorProfile;
  flavorTags: string[];
  createdAt: Date;
}

export interface Rating {
  overall: number;
  acidity: number;
  sweetness: number;
  aroma: number;
}

export type PourMethod = 'single-pour' | 'three-stage' | 'stirred';

export interface BrewRecord {
  id: string;
  beanId: string;
  coffeeAmount: number;
  waterAmount: number;
  waterTemp: number;
  grindSize: number;
  brewTime: number;
  pourMethod: PourMethod;
  rating: Rating;
  notes: string;
  createdAt: Date;
}

export interface StoreState {
  beans: CoffeeBean[];
  brewRecords: BrewRecord[];
  selectedForComparison: string[];
  addBean: (bean: Omit<CoffeeBean, 'id' | 'createdAt'>) => void;
  addBrewRecord: (record: Omit<BrewRecord, 'id' | 'createdAt'>) => void;
  toggleComparison: (id: string) => void;
  clearComparison: () => void;
}

export const pourMethodLabels: Record<PourMethod, string> = {
  'single-pour': '一刀流',
  'three-stage': '三段式',
  'stirred': '搅拌法',
};

export const flavorCategories = [
  { name: '水果', color: '#E57373', tags: ['浆果', '柑橘', '核果', '热带水果'] },
  { name: '花香', color: '#BA68C8', tags: ['茉莉', '玫瑰', '洋甘菊', '薰衣草'] },
  { name: '坚果', color: '#A1887F', tags: ['杏仁', '榛果', '核桃', '花生'] },
  { name: '巧克力', color: '#795548', tags: ['黑巧克力', '牛奶巧克力', '可可'] },
  { name: '焦糖', color: '#FFB74D', tags: ['焦糖', '红糖', '蜂蜜'] },
  { name: '香料', color: '#FF8A65', tags: ['肉桂', '丁香', '胡椒'] },
];
