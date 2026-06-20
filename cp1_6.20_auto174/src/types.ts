export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  costPrice: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface PricingRule {
  id: string;
  productId: string;
  type: 'daily' | 'flash_sale' | 'member';
  price: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface SalesRecord {
  date: string;
  productId: string;
  quantity: number;
}

export interface StoreData {
  products: Product[];
  pricingRules: PricingRule[];
  sales: SalesRecord[];
}
