export type LeatherType = '植鞣革' | '铬鞣革' | '马臀革' | '疯马皮';
export type HardwareType = '黄铜' | '银' | '古铜' | '不锈钢';
export type ProductType = '钱包' | '手提包' | '背包' | '腰带';
export type OrderStatus =
  | '待确认'
  | '已确认'
  | '皮料裁切'
  | '手工缝制'
  | '五金安装'
  | '边油处理'
  | '质检'
  | '待发货'
  | '已发货'
  | '已完成';
export type LeatherGrade = 'A' | 'B' | 'C';
export type ToolStatus = '空闲' | '借用中' | '维修中';

export interface Product {
  id: number;
  name: string;
  type: ProductType;
  description: string;
  basePrice: number;
  thumbnail: string;
  images: string[];
  leatherTypes: LeatherType[];
  areaRange: [number, number];
}

export interface Inventory {
  id: number;
  leatherType: LeatherType;
  color: string;
  colorCode?: string;
  thickness: number;
  availableArea: number;
  grade: LeatherGrade;
  source: string;
  purchaseDate: string;
  status: '可用' | '已用尽';
}

export interface OrderItem {
  productId: number;
  productName: string;
  leatherType: LeatherType;
  thickness: number;
  hardware: HardwareType;
  estimatedArea: [number, number];
  price: number;
  sketchImages: string[];
}

export interface Order {
  id: number;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  estimatedHours?: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: number;
  name: string;
  status: ToolStatus;
  currentBorrower?: string;
  borrowDate?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
}

export interface ToolBorrowRecord {
  id: number;
  toolId: number;
  toolName: string;
  borrower: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
}
