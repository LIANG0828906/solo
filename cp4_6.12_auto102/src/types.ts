export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type EquipmentType = 'weapon' | 'cyberware' | 'armor';

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#b0b0b0',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const STAT_KEYS = ['firepower', 'armor', 'charge', 'durability'] as const;
export type StatKey = typeof STAT_KEYS[number];

export const STAT_LABELS: Record<StatKey, string> = {
  firepower: '火力',
  armor: '护甲',
  charge: '充能',
  durability: '耐久',
};

export interface EquipmentStats {
  firepower: number;
  armor: number;
  charge: number;
  durability: number;
}

export interface Equipment {
  id: string;
  itemName: string;
  type: EquipmentType;
  rarity: Rarity;
  stats: EquipmentStats;
  flavorText: string;
  createdAt: number;
}

export interface Listing {
  id: string;
  equipment: Equipment;
  sellerId: string;
  startPrice: number;
  currentPrice: number;
  highestBidderId: string | null;
  endTime: number;
  duration: number;
  status: 'active' | 'completed';
}

export interface TradeRecord {
  id: string;
  equipment: Equipment;
  finalPrice: number;
  buyerId: string;
  sellerId: string;
  completedAt: number;
}

export interface LogEntry {
  id: string;
  equipment: Equipment;
  mode: 'synth' | 'draw';
  timestamp: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  timestamp: number;
}

export interface FragmentType {
  id: string;
  name: string;
  icon: string;
}

export const FRAGMENT_TYPES: FragmentType[] = [
  { id: 'quantum', name: '量子碎片', icon: '⚛' },
  { id: 'nano', name: '纳米碎片', icon: '◇' },
  { id: 'plasma', name: '等离子碎片', icon: '⚡' },
  { id: 'bio', name: '生化碎片', icon: '🧬' },
  { id: 'dark', name: '暗物质碎片', icon: '✦' },
];

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  weapon: '武器',
  cyberware: '义体',
  armor: '护甲',
};
