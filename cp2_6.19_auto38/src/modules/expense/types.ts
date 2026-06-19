export type ExpenseCategory = '交通' | '住宿' | '餐饮' | '景点' | '购物';

export interface Expense {
  id: string;
  tripId: string;
  category: ExpenseCategory;
  amount: number;
  originalAmount: number;
  originalCurrency: string;
  note: string;
  timestamp: string;
}

export type ExpenseFormData = Omit<Expense, 'id' | 'amount'>;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['交通', '住宿', '餐饮', '景点', '购物'];

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  '交通': '✈️',
  '住宿': '🏨',
  '餐饮': '🍽️',
  '景点': '🏛️',
  '购物': '🛍️',
};

export const CATEGORY_CLASS_MAP: Record<ExpenseCategory, string> = {
  '交通': 'category-transport',
  '住宿': 'category-accommodation',
  '餐饮': 'category-food',
  '景点': 'category-attraction',
  '购物': 'category-shopping',
};
