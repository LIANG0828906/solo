import { UtensilsCrossed, Car, ShoppingBag, Gamepad2, HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Category = 'food' | 'transport' | 'shopping' | 'entertainment' | 'other';

export interface ExpenseRecord {
  id: string;
  amount: number;
  category: Category;
  note: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavingsSuggestion {
  id: string;
  title: string;
  description: string;
  estimatedSavings: number;
  category: Category;
}

export interface CategoryStats {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface DailyExpense {
  date: string;
  total: number;
}

export interface HealthScore {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
}

export interface ReportSummary {
  totalExpense: number;
  categoryStats: CategoryStats[];
  dailyExpenses: DailyExpense[];
  healthScore: HealthScore;
  savingsTotal: number;
}

export interface CategoryConfigItem {
  name: string;
  color: string;
  icon: LucideIcon;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfigItem> = {
  food: { name: '餐饮', color: '#ef4444', icon: UtensilsCrossed },
  transport: { name: '交通', color: '#3b82f6', icon: Car },
  shopping: { name: '购物', color: '#a855f7', icon: ShoppingBag },
  entertainment: { name: '娱乐', color: '#f97316', icon: Gamepad2 },
  other: { name: '其他', color: '#6b7280', icon: HelpCircle },
};

export const CATEGORY_LIST: Category[] = ['food', 'transport', 'shopping', 'entertainment', 'other'];

export const QUICK_AMOUNTS: number[] = [10, 20, 50, 100, 200];
