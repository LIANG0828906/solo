export interface Material {
  id: string;
  name: string;
  category: string;
  brand: string;
  spec: string;
  purchaseDate: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  location: string;
  tags: string[];
  image: string;
  projects: string[];
  lastUsed: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface InventoryRecord {
  id: string;
  materialId: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  note?: string;
}

export interface DailyStock {
  date: string;
  stock: number;
}
