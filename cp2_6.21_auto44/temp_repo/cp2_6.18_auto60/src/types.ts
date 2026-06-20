export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  imageUrl: string;
  images?: string[];
  makerName: string;
  makerAvatar: string;
  material: string;
  dimensions: string;
  productionCycle: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  productId: string;
  buyerName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
}

export type Category = '全部' | '陶瓷' | '编织' | '木雕';
