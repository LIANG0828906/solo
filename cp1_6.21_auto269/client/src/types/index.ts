export interface Ingredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string;
  name: string;
  coverImage: string;
  ingredients: Ingredient[];
  steps: string;
  tags: string[];
  cookTime: number;
  createdAt: number;
  isFavorite?: boolean;
}

export interface ShareInfo {
  shareUrl: string;
  qrCodeDataUrl: string;
}

export type CookTimeRange = 'under10' | '10to30' | '30to60' | 'over60' | '';

export const ALL_TAGS = [
  '中式', '西式', '日式', '韩式', '意式', '港式', '川菜',
  '快手菜', '家常菜', '硬菜', '素菜', '荤菜',
  '甜品', '主食', '小吃', '早餐', '下午茶',
  '健康', '简单', '经典', '开胃', '聚餐', '蛋糕'
];

export const COOK_TIME_OPTIONS: { value: CookTimeRange; label: string }[] = [
  { value: 'under10', label: '10分钟以内' },
  { value: '10to30', label: '10-30分钟' },
  { value: '30to60', label: '30-60分钟' },
  { value: 'over60', label: '60分钟以上' }
];
