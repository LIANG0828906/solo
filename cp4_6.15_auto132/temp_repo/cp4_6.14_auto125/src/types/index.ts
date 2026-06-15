export interface Ingredient {
  id: string;
  name: string;
  amount: number;
}

export interface Recipe {
  id: string;
  name: string;
  yieldCount: number;
  ingredients: Ingredient[];
  price: number;
}

export interface OrderItem {
  recipeId: string;
  recipeName: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  status: 'pending' | 'completed';
  createdAt: string;
  totalAmount: number;
}

export interface Stock {
  id: string;
  name: string;
  currentStock: number;
  safetyLevel: number;
  costPerGram: number;
}

export interface ReportData {
  totalOrders: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
}

export interface CalculationResult {
  ingredients: Record<string, number>;
  totalCost: number;
}
