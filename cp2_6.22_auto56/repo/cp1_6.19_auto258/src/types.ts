export type VipLevel = 'normal' | 'silver' | 'gold';

export interface Guest {
  id: string;
  code: string;
  name: string;
  company: string;
  position: string;
  phone: string;
  vipLevel: VipLevel;
}

export interface LotteryState {
  isActive: boolean;
  currentCode: string;
  winnerId: string | null;
  isComplete: boolean;
}

export interface QaItem {
  id: string;
  content: string;
  timestamp: number;
}

export const AVATAR_COLORS = ['#E67E22', '#2ECC71', '#9B59B6', '#1ABC9C'];

export const VIP_BG: Record<VipLevel, string> = {
  normal: '#ECF0F1',
  silver: '#FDEBD0',
  gold: '#FAD25C',
};

export const VIP_LABEL: Record<VipLevel, string> = {
  normal: '普通',
  silver: '银牌',
  gold: '金牌',
};

export const ROWS = 8;
export const COLS = 12;
export const PAGE_SIZE = 20;
export const DEBOUNCE_MS = 300;
