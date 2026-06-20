// 核心类型定义
// 供所有模块引用，数据流向：types.ts -> context -> components -> pages

export type ResourceType = 'station' | 'meeting_room' | 'discussion_area' | 'terrace';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  capacity?: number;
  color: string;
}

export interface User {
  id: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
}

export interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  note?: string;
  createdAt: Date;
}

export interface BlockedPeriod {
  id: string;
  date: string;
  reason: string;
  isAllDay: boolean;
}

export type FilterType = ResourceType | 'all';

export interface AppState {
  resources: Resource[];
  reservations: Reservation[];
  blockedPeriods: BlockedPeriod[];
  currentUser: User | null;
  filterType: FilterType;
  searchQuery: string;
}

export type AppAction =
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'ADD_RESOURCE'; payload: Resource }
  | { type: 'DELETE_RESOURCE'; payload: string }
  | { type: 'ADD_RESERVATION'; payload: Reservation }
  | { type: 'DELETE_RESERVATION'; payload: string }
  | { type: 'ADD_BLOCKED_PERIOD'; payload: BlockedPeriod }
  | { type: 'DELETE_BLOCKED_PERIOD'; payload: string }
  | { type: 'SET_FILTER_TYPE'; payload: FilterType }
  | { type: 'SET_SEARCH_QUERY'; payload: string };

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  station: '#4CAF50',
  meeting_room: '#2196F3',
  discussion_area: '#FF9800',
  terrace: '#9C27B0',
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  station: '工位',
  meeting_room: '会议室',
  discussion_area: '讨论区',
  terrace: '露台座位',
};
