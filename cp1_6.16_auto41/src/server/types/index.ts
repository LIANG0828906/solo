export interface PetStats {
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
}

export interface Pet {
  id: string;
  name: string;
  color: string;
  stats: PetStats;
  isSick: boolean;
  createdAt: number;
  lastInteraction: number;
}

export interface InventoryItem {
  id: string;
  type: ItemType;
  quantity: number;
}

export type ItemType = 'energyJuice' | 'magicShampoo' | 'luxuryFood' | 'playToy';

export type InteractionType = 'feed' | 'clean' | 'play';

export interface User {
  id: string;
  pet: Pet;
  friends: string[];
  friendRequests: string[];
  friendliness: number;
  checkInStreak: number;
  lastCheckInDate: string | null;
  backpack: InventoryItem[];
  lastDecayTime: number;
}

export interface WSMessage {
  type: 'stateUpdate' | 'friendUpdate' | 'warning';
  data: unknown;
}

export const ITEM_INFO: Record<ItemType, { name: string; emoji: string; stat: keyof PetStats; value: number }> = {
  energyJuice: { name: '活力果汁', emoji: '🧃', stat: 'energy', value: 20 },
  magicShampoo: { name: '魔法沐浴露', emoji: '🧴', stat: 'cleanliness', value: 20 },
  luxuryFood: { name: '豪华猫罐头', emoji: '🥫', stat: 'hunger', value: 20 },
  playToy: { name: '逗猫棒', emoji: '🎣', stat: 'happiness', value: 20 },
};

export const PET_COLORS = [
  '#FFB6C1',
  '#87CEEB',
  '#98FB98',
  '#DDA0DD',
  '#F0E68C',
  '#FFA07A',
  '#B0C4DE',
  '#FFE4E1',
];
