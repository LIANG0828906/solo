export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export type Category = 'entertainment' | 'tool' | 'storage' | 'other';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  category: Category;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  subscriptionId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; pieColor: string }> = {
  entertainment: { label: '娱乐', color: '#9333EA', pieColor: '#9333EA' },
  tool: { label: '工具', color: '#3B82F6', pieColor: '#3B82F6' },
  storage: { label: '存储', color: '#22C55E', pieColor: '#22C55E' },
  other: { label: '其他', color: '#9CA3AF', pieColor: '#9CA3AF' },
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: '月付',
  quarterly: '季付',
  yearly: '年付',
};

export const BILLING_CYCLE_MULTIPLIER: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export type NotificationSetting = {
  enabled: boolean;
  soundEnabled: boolean;
  volume: number;
};

export type CalendarValuePiece = Date | null;
export type CalendarValue = CalendarValuePiece | [CalendarValuePiece, CalendarValuePiece];
