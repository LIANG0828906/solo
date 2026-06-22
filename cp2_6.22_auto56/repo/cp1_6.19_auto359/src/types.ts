export type OrderStatus = 'pending' | 'cooking' | 'finishing' | 'completed';

export type StationType = 'wok' | 'grill' | 'cold';

export interface DishItem {
  name: string;
  emoji: string;
  quantity: number;
  station: StationType;
  cookTime: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  status: OrderStatus;
  dishes: DishItem[];
  priority: number;
  assignedStation?: StationType | null;
  createdAt: number;
  estimatedFinishAt: number;
  remainingTime: number;
}

export interface Station {
  type: StationType;
  name: string;
  color: string;
  load: number;
  activeOrders: string[];
  recommendedOrderId?: string;
}

export const STATUS_CONFIG: Record<OrderStatus, { label: string; bgColor: string }> = {
  pending: { label: '待处理', bgColor: '#16213e' },
  cooking: { label: '制作中', bgColor: '#0f3460' },
  finishing: { label: '即将完成', bgColor: '#e94560' },
  completed: { label: '已完成', bgColor: '#00b4d8' },
};
