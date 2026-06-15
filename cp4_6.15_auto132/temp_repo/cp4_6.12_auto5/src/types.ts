export interface Plant {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  stock: number;
  image: string;
  water_cycle_days: number;
  last_watered: string | null;
  last_fertilized: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  plant_id: string;
  customer_name: string;
  phone: string;
  address: string;
  rental_period: '1month' | '3months' | '6months';
  total_price: number;
  status: 'pending' | 'accepted' | 'delivering' | 'renting' | 'returned' | 'completed';
  created_at: string;
  updated_at: string;
  plant_name?: string;
  plant_image?: string;
}

export interface CareRecord {
  id: string;
  plant_id: string;
  type: 'water' | 'fertilize' | 'prune' | 'repot';
  notes: string;
  created_at: string;
  plant_name?: string;
}

export const STATUS_LABELS: Record<Order['status'], string> = {
  pending: '待确认',
  accepted: '已接单',
  delivering: '配送中',
  renting: '租赁中',
  returned: '已归还',
  completed: '已结束',
};

export const STATUS_FLOW: Record<Order['status'], Order['status'] | null> = {
  pending: 'accepted',
  accepted: 'delivering',
  delivering: 'renting',
  renting: 'returned',
  returned: 'completed',
  completed: null,
};

export const CARE_TYPE_LABELS: Record<CareRecord['type'], string> = {
  water: '浇水',
  fertilize: '施肥',
  prune: '修剪',
  repot: '换盆',
};

export const CARE_TYPE_COLORS: Record<CareRecord['type'], string> = {
  water: '#4CAF50',
  fertilize: '#2196F3',
  prune: '#FF9800',
  repot: '#9C27B0',
};

export const RENTAL_PERIOD_LABELS: Record<Order['rental_period'], string> = {
  '1month': '一个月',
  '3months': '三个月',
  '6months': '半年',
};
