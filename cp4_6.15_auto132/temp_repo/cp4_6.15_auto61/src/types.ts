export type TransactionType = 'income' | 'expense';

export type CategoryType =
  | '餐饮'
  | '交通'
  | '购物'
  | '娱乐'
  | '医疗'
  | '其他'
  | '工资'
  | '投资'
  | '奖金';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: CategoryType;
  amount: number;
  date: string;
  note: string;
  createdAt: number;
}

export interface Budget {
  category: CategoryType;
  limit: number;
}

export interface CategoryInfo {
  color: string;
  bgColor: string;
  icon: string;
}

export const EXPENSE_CATEGORIES: CategoryType[] = [
  '餐饮',
  '交通',
  '购物',
  '娱乐',
  '医疗',
  '其他',
];

export const INCOME_CATEGORIES: CategoryType[] = ['工资', '投资', '奖金', '其他'];

export const CATEGORY_MAP: Record<CategoryType, CategoryInfo> = {
  餐饮: { color: '#F97316', bgColor: '#FFF7ED', icon: '🍽️' },
  交通: { color: '#3B82F6', bgColor: '#EFF6FF', icon: '🚗' },
  购物: { color: '#EC4899', bgColor: '#FDF2F8', icon: '🛍️' },
  娱乐: { color: '#8B5CF6', bgColor: '#F5F3FF', icon: '🎮' },
  医疗: { color: '#10B981', bgColor: '#ECFDF5', icon: '💊' },
  其他: { color: '#6B7280', bgColor: '#F3F4F6', icon: '📝' },
  工资: { color: '#059669', bgColor: '#ECFDF5', icon: '💰' },
  投资: { color: '#0EA5E9', bgColor: '#E0F2FE', icon: '📈' },
  奖金: { color: '#F59E0B', bgColor: '#FFFBEB', icon: '🏆' },
};

export const DEFAULT_BUDGETS: Budget[] = [
  { category: '餐饮', limit: 2000 },
  { category: '交通', limit: 800 },
  { category: '购物', limit: 1500 },
  { category: '娱乐', limit: 600 },
  { category: '医疗', limit: 500 },
  { category: '其他', limit: 500 },
];
