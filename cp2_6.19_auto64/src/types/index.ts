export type ProductType = '精华' | '面霜' | '防晒' | '洁面' | '水乳' | '眼霜' | '面膜' | '其他';

export type ProductStatus = '进行中' | '已用完' | '已过期';

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: ProductType;
  capacity: number;
  usedAmount: number;
  openDate: string;
  shelfLife: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsageLog {
  id: string;
  productId: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface Settings {
  reminderTime: string;
  notificationEnabled: boolean;
  lastReminderDate: string;
}

export interface ProductFormData {
  name: string;
  brand: string;
  type: ProductType;
  capacity: number;
  openDate: string;
  shelfLife: number;
}

export interface UsageChartData {
  date: string;
  amount: number;
}

export type FilterType = ProductType | 'all';
export type FilterStatus = ProductStatus | 'all';
