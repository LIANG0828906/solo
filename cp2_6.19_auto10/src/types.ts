export interface CoffeeRecord {
  id: string;
  name: string;
  roaster: string;
  brewingMethod: string;
  aromas: string[];
  acidity: number;
  body: number;
  aftertaste: number;
  overall: number;
  notes: string;
  date: string;
}

export type ViewType = 'list' | 'detail' | 'add' | 'compare';

export const AROMA_OPTIONS: readonly string[] = [
  '花香', '果香', '坚果', '巧克力', '焦糖',
  '柑橘', '浆果', '木质', '草本', '香料',
  '蜂蜜', '奶油', '烟熏', '发酵', '茶感'
];

export const BREWING_METHODS: readonly string[] = [
  '手冲', '意式浓缩', '法压壶', '摩卡壶',
  '爱乐压', '虹吸壶', '冷萃', '胶囊', '其他'
];
