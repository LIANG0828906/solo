export type StallType = 'food' | 'handmade' | 'secondhand' | 'cultural';
export type ItemStatus = 'on_sale' | 'sold';

export interface Activity {
  id: string;
  name: string;
  date: string;
  totalStalls: number;
  gridColumns: number;
  gridRows: number;
  createdAt: string;
}

export interface Stall {
  id: string;
  activityId: string;
  stallNumber: number;
  gridX: number;
  gridY: number;
  ownerName: string | null;
  type: StallType | null;
  assigned: boolean;
  itemCount?: number;
}

export interface Item {
  id: string;
  stallId: string;
  name: string;
  price: number;
  status: ItemStatus;
}

export interface SearchResult {
  type: 'stall' | 'item';
  stallId: string;
  stallNumber: number;
  ownerName: string | null;
  stallType: StallType | null;
  gridX: number;
  gridY: number;
  matchedItem: string | null;
}

export const STALL_TYPE_LABELS: Record<StallType, string> = {
  food: '食品',
  handmade: '手工',
  secondhand: '二手',
  cultural: '文创',
};

export const STALL_TYPE_COLORS: Record<StallType, string> = {
  food: '#FF8C42',
  handmade: '#4B61D1',
  secondhand: '#6BAA4F',
  cultural: '#D94F8B',
};

export const STALL_TYPE_BG: Record<StallType, string> = {
  food: 'bg-stall-food',
  handmade: 'bg-stall-handmade',
  secondhand: 'bg-stall-secondhand',
  cultural: 'bg-stall-cultural',
};

export const STALL_TYPE_BORDER: Record<StallType, string> = {
  food: 'border-stall-food',
  handmade: 'border-stall-handmade',
  secondhand: 'border-stall-secondhand',
  cultural: 'border-stall-cultural',
};

export const STALL_TYPE_TEXT: Record<StallType, string> = {
  food: 'text-stall-food',
  handmade: 'text-stall-handmade',
  secondhand: 'text-stall-secondhand',
  cultural: 'text-stall-cultural',
};
