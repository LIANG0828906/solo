export type PetSpecies = 'dog' | 'cat' | 'bird' | 'fish' | 'other';
export type RecordType = 'food' | 'water' | 'walk' | 'health';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  age: number;
  avatarColor: string;
  cardGradient: string;
  createdAt: string;
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
