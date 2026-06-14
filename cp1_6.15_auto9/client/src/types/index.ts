export type Category = '餐饮' | '交通' | '购物' | '娱乐' | '医疗' | '教育' | '其他';

export type PaymentMethod = '现金' | '微信' | '支付宝' | '银行卡' | '信用卡';

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  date: string;
  paymentMethod: PaymentMethod;
  description?: string;
}

export interface CategoryAmount {
  category: Category;
  amount: number;
}

export interface CategoryComparison {
  category: Category;
  current: number;
  previous: number;
}

export interface MonthlyStats {
  month: string;
  totalAmount: number;
  categoryBreakdown: CategoryAmount[];
  previousMonthComparison: CategoryComparison[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
}

export interface GoalProgress {
  goalId: string;
  progress: number;
  estimatedCompletionDate: string;
  historicalSavingsRate: number;
}
