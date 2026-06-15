export interface Board {
  id: string;
  name: string;
  themeColor: ThemeColor;
  createdAt: number;
  updatedAt: number;
}

export interface Card {
  id: string;
  boardId: string;
  title: string;
  emoji: string;
  color: CardColor;
  x: number;
  y: number;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface Connection {
  id: string;
  boardId: string;
  fromCardId: string;
  toCardId: string;
  createdAt: number;
}

export type ThemeColor =
  | 'dawn-orange'
  | 'forest-green'
  | 'deep-sea-blue'
  | 'sunset-red'
  | 'lavender-purple'
  | 'moonlight-yellow';

export type CardColor =
  | 'coral'
  | 'mint'
  | 'sky'
  | 'lemon'
  | 'lilac'
  | 'peach';

export interface SyncLogEntry {
  id: string;
  action: string;
  detail: string;
  timestamp: number;
  boardId: string;
}

export const THEME_COLORS: Record<ThemeColor, { label: string; hex: string }> = {
  'dawn-orange': { label: '晨曦橙', hex: '#F97316' },
  'forest-green': { label: '森林绿', hex: '#22C55E' },
  'deep-sea-blue': { label: '深海蓝', hex: '#3B82F6' },
  'sunset-red': { label: '落日红', hex: '#EF4444' },
  'lavender-purple': { label: '薰衣紫', hex: '#A855F7' },
  'moonlight-yellow': { label: '月光黄', hex: '#EAB308' },
};

export const CARD_COLORS: Record<CardColor, { label: string; hex: string }> = {
  coral: { label: '珊瑚红', hex: '#FB7185' },
  mint: { label: '薄荷绿', hex: '#6EE7B7' },
  sky: { label: '天空蓝', hex: '#7DD3FC' },
  lemon: { label: '柠檬黄', hex: '#FDE047' },
  lilac: { label: '丁香紫', hex: '#C4B5FD' },
  peach: { label: '蜜桃粉', hex: '#FCA5A5' },
};

export const EMOJI_LIST = [
  '💡', '🔥', '⭐', '🎯', '🚀', '💎', '🌟', '❤️',
  '🎨', '📝', '🔧', '⚡', '🏆', '📌', '🎪', '🌈',
  '🎵', '📸', '🎭', '🔮', '🌊', '🍀', '🌸', '🦋',
  '🍎', '🍊', '🍋', '🍇', '🍒', '🥝', '🍕', '🎉',
  '💪', '👀', '🧠', '🤝', '💬', '📢', '🔑', '🏗️',
  '📦', '🧩', '🎲', '🧲', '🪄', '🛡️', '🗺️', '🧭',
];

export const MAX_CARDS = 50;
export const MAX_CONNECTIONS = 80;
