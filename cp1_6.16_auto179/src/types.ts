export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  month: string;
  used?: number;
}

export interface MonthlySummary {
  income: number;
  expense: number;
}

export interface TrendData {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
}

export const EXPENSE_CATEGORIES = [
  '餐饮',
  '交通',
  '购物',
  '娱乐',
  '住房',
  '医疗',
  '教育',
  '其他',
];

export const INCOME_CATEGORIES = ['工资', '奖金', '投资', '兼职', '其他'];
