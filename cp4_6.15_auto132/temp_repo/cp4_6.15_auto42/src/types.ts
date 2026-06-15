export type ExpenseCategory = 'transport' | 'accommodation' | 'food' | 'ticket' | 'other';

export interface Activity {
  id: string;
  tripId: string;
  date: string;
  time: string;
  location: string;
  description: string;
  cost: number;
  category: ExpenseCategory;
  completed: boolean;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  createdAt: string;
}

export interface CategoryTotal {
  category: ExpenseCategory;
  name: string;
  value: number;
  color: string;
}

export interface DailySpending {
  date: string;
  amount: number;
}
