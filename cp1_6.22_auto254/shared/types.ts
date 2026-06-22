export type DrinkCategory = 'seasonal' | 'classic';

export interface DrinkIngredient {
  ingredientId: string;
  ingredientName: string;
  amount: number;
  unit: string;
}

export interface Drink {
  id: string;
  name: string;
  description: string;
  category: DrinkCategory;
  price: number;
  costPrice: number;
  ingredients: DrinkIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string;
  purchasePrice: number;
  warningThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  drinkId: string;
  drinkName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  totalCost: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  saleDate: string;
  createdAt: string;
}

export interface DailySalesData {
  date: string;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  orderCount: number;
}

export interface IngredientConsumption {
  ingredientId: string;
  ingredientName: string;
  totalUsed: number;
  unit: string;
}

export interface ReportData {
  salesTrend: DailySalesData[];
  ingredientRanking: IngredientConsumption[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateDrinkRequest {
  name: string;
  description: string;
  category: DrinkCategory;
  price: number;
  costPrice: number;
  ingredients: Omit<DrinkIngredient, 'ingredientId'>[];
}

export interface CreateIngredientRequest {
  name: string;
  stock: number;
  unit: string;
  purchasePrice: number;
  warningThreshold: number;
}

export interface CreateSaleRequest {
  items: { drinkId: string; quantity: number }[];
}

export interface DeductStockRequest {
  deductions: { ingredientId: string; amount: number }[];
}

export interface TodaySalesSummary {
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  orderCount: number;
}
