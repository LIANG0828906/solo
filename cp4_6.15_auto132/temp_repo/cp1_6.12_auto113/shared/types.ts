export interface Card {
  id: string;
  name: string;
  position: string;
  company: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  group: string;
  exchangedAt: number;
  ownerId: string;
}

export interface CreateCardInput {
  name: string;
  position: string;
  company: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl: string;
}

export interface ExchangeRequest {
  fromCardId: string;
  toCardId: string;
}

export type GroupType = 'friends' | 'colleagues' | 'customers' | 'custom';

export const GROUPS: { key: GroupType; label: string }[] = [
  { key: 'friends', label: '朋友' },
  { key: 'colleagues', label: '同事' },
  { key: 'customers', label: '客户' },
  { key: 'custom', label: '自定义' }
];

export interface WebSocketMessage {
  type: 'exchange' | 'notification' | 'ping';
  payload: any;
}
