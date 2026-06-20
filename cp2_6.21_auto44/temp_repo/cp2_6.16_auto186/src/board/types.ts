export type CardTag = 'product' | 'tech' | 'design' | 'marketing';
export type CardStatus = 'pending' | 'reviewing' | 'adopted';
export interface Card {
  id: string;
  title: string;
  description: string;
  tag: CardTag;
  valueScore: number;
  status: CardStatus;
  order: number;
  createdAt: string;
}
export const TAG_LABELS: Record<CardTag, string> = {
  product: '产品',
  tech: '技术',
  design: '设计',
  marketing: '市场',
};
export const TAG_COLORS: Record<CardTag, string> = {
  product: '#9B59B6',
  tech: '#3498DB',
  design: '#E91E63',
  marketing: '#F39C12',
};
export const STATUS_LABELS: Record<CardStatus, string> = {
  pending: '待评估',
  reviewing: '待采纳',
  adopted: '已采纳',
};
