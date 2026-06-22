export interface Item {
  id: string;
  name: string;
  description: string;
  tags: string[];
  currentHolder: string;
  holderAvatar: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface SwapEvent {
  id: string;
  itemId: string;
  fromHolder: string;
  fromAvatar: string;
  toHolder: string;
  toAvatar: string;
  swapDate: Date;
  note: string;
}

export interface SwapChain {
  item: Item;
  events: SwapEvent[];
}

export interface CommunityStats {
  totalSwaps: number;
  activeItems: number;
  participants: number;
  monthlyTrend: { month: string; count: number }[];
}

export interface Member {
  name: string;
  avatar: string;
}

export const PRESET_TAGS = ['电子', '书籍', '衣物', '家居', '玩具', '工具', '运动', '其他'] as const;

export type TagType = typeof PRESET_TAGS[number];
