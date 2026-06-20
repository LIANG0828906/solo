import axios from 'axios';

export type ChestType = 'iron_rune' | 'crystal_seal' | 'shadow_curse';

export type OpenMethod = 'magic_resonance' | 'mechanical_pick' | 'element_infusion';

export type ElementType = 'fire' | 'ice' | 'thunder' | 'shadow' | 'holy';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Fragment {
  type: ElementType;
  amount: number;
}

export interface Inscription {
  id: string;
  name: string;
  rarity: Rarity;
  type: ElementType;
  level: number;
  effect: string;
  bonusStats: Record<string, number>;
  equippedSlot: number | null;
}

export interface RewardItem {
  name: string;
  type: string;
  rarity: Rarity;
}

export type AnimationType =
  | 'success_normal'
  | 'success_rare'
  | 'success_legendary'
  | 'fail_trap'
  | 'fail_destroy';

export interface OpenResult {
  success: boolean;
  message: string;
  chestType: ChestType;
  openMethod: OpenMethod;
  damageTaken?: number;
  timestamp: string;
  animation_type?: AnimationType;
  rewards: {
    fragments: Fragment[];
    inscriptions?: Inscription[];
    items?: RewardItem[];
    reputation?: number;
    gold?: number;
  };
}

export interface HistoryRecord {
  id: string;
  chestType: ChestType;
  openMethod: OpenMethod;
  success: boolean;
  timestamp: string;
  rewardsCount: number;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const treasureApi = {
  openChest: async (
    chestType: ChestType,
    openMethod: OpenMethod,
    inscriptions: (Inscription | null)[]
  ): Promise<OpenResult> => {
    const equippedInscriptions = inscriptions
      .filter((i): i is Inscription => i !== null)
      .map((i) => ({ type: i.type, level: i.level }));

    const response = await api.post<any>('/open-chest', {
      chest_type: chestType,
      open_method: openMethod,
      inscriptions: equippedInscriptions,
    });

    const data = response.data;

    return {
      success: data.success,
      message: data.message,
      chestType: chestType,
      openMethod: openMethod,
      damageTaken: data.damage || 0,
      timestamp: new Date().toISOString(),
      animation_type: data.animation_type,
      rewards: {
        fragments: (data.fragments || []).map((f: any) => ({
          type: f.type as ElementType,
          amount: f.amount || f.count || 1,
        })),
        inscriptions: data.inscriptions?.map((ins: any) => ({
          id: crypto.randomUUID(),
          name: ins.name,
          rarity: ins.rarity as Rarity,
          type: ins.type as ElementType,
          level: ins.level || 1,
          effect: ins.effect || ins.description || '',
          bonusStats: ins.bonusStats || {},
          equippedSlot: null,
        })),
        items: data.items || [],
        reputation: data.reputation || 0,
        gold: data.gold || 0,
      },
    };
  },

  getFragments: async (): Promise<Fragment[]> => {
    const response = await api.get<Fragment[]>('/fragments');
    return response.data;
  },
};
