export type ItemCategory = 'food' | 'daily';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  expireDate: string;
  category: ItemCategory;
  initialQuantity: number;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  name: string;
  currentStock: number;
  suggestedStock: number;
  reason: string;
}

export interface StockReport {
  items: ReportItem[];
  generatedAt: string;
  totalSuggestedQuantity: number;
}

export interface AddItemRequest {
  name: string;
  quantity: number;
  expireDate: string;
  category: ItemCategory;
}

export interface UpdateItemRequest {
  name?: string;
  quantity?: number;
  expireDate?: string;
  category?: ItemCategory;
}
