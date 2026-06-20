export type PetSpecies = 'dog' | 'cat' | 'bird' | 'fish' | 'other';
export type RecordType = 'food' | 'water' | 'walk' | 'health';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  age: number;
  ageMonths?: number;
  avatarColor: string;
  cardGradient: string;
  createdAt: string;
}

export function formatAge(years: number, months?: number): string {
  const m = months ?? 0;
  const validMonths = Math.min(Math.max(m, 0), 11);
  if (validMonths === 0) {
    return `${years}岁`;
  }
  return `${years}岁${validMonths}个月`;
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else if (diffWeeks < 5) {
    return `${diffWeeks}周前`;
  } else if (diffMonths < 12) {
    return `${diffMonths}个月前`;
  } else {
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears}年前`;
  }
}

export interface PetRecord {
  id: string;
  petId: string;
  type: RecordType;
  note: string;
  timestamp: string;
  createdAt: string;
}

export interface WeeklyReport {
  petId: string;
  weekStart: string;
  weekEnd: string;
  stats: Record<RecordType, number>;
  comparison: {
    current: Record<RecordType, number>;
    previous: Record<RecordType, number>;
  };
  summary: string;
}

export const SPECIES_LABELS: Record<PetSpecies, string> = {
  dog: '狗',
  cat: '猫',
  bird: '鸟',
  fish: '鱼',
  other: '其他',
};

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  food: '喂食',
  water: '喂水',
  walk: '遛弯',
  health: '健康',
};

export const RECORD_TYPE_ICONS: Record<RecordType, string> = {
  food: '🍖',
  water: '💧',
  walk: '🐾',
  health: '❤️',
};

export const RECORD_TYPE_COLORS: Record<RecordType, string> = {
  food: '#FF9800',
  water: '#2196F3',
  walk: '#4CAF50',
  health: '#F44336',
};

export const CARD_GRADIENTS = [
  'linear-gradient(135deg, #FFE0B2 0%, #FFCC80 100%)',
  'linear-gradient(135deg, #BBDEFB 0%, #90CAF9 100%)',
  'linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%)',
  'linear-gradient(135deg, #F8BBD0 0%, #F48FB1 100%)',
  'linear-gradient(135deg, #E1BEE7 0%, #CE93D8 100%)',
];

export const AVATAR_COLORS = [
  '#FF7043',
  '#42A5F5',
  '#66BB6A',
  '#EC407A',
  '#AB47BC',
  '#FFA726',
  '#26C6DA',
  '#9CCC65',
];
