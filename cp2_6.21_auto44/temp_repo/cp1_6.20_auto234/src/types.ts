export type OrderStatus = 'pending' | 'repairing' | 'completed';

export interface Order {
  id: string;
  device_model: string;
  fault_description: string;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Part {
  id: string;
  name: string;
  model: string;
  quantity: number;
  unit_price: number;
}

export interface OrderPart {
  id: string;
  order_id: string;
  part_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  name: string;
  model: string;
}

export interface Stats {
  totalOrders: number;
  avgRepairTime: number;
  totalStockValue: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
