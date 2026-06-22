export interface FabricItem {
  fabricId: string;
  metersNeeded: number;
}

export interface Order {
  id: string;
  customerName: string;
  sketchUrl: string;
  fabricItems: FabricItem[];
  status: '设计中' | '生产中' | '已完成';
  createdAt: string;
}

export interface Fabric {
  id: string;
  name: string;
  color: string;
  totalMeters: number;
  supplier: string;
  threshold: number;
}

export interface FabricDetail extends Fabric {
  relatedOrders: Order[];
}

export interface DashboardStats {
  totalOrders: number;
  inProductionOrders: number;
  lowStockFabrics: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
