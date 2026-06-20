export type Rarity = 'common' | 'rare' | 'legendary';

export interface Prize {
  id: string;
  name: string;
  icon: string;
  quantity: number;
  wonCount: number;
  rarity: Rarity;
}

export interface PrizePool {
  id: string;
  name: string;
  prizes: Prize[];
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  avatarColor: string;
}

export interface WinRecord {
  id: string;
  prizeId: string;
  prizeName: string;
  prizeIcon: string;
  prizeRarity: Rarity;
  userId: string;
  userName: string;
  userAvatarColor: string;
  poolId: string;
  timestamp: number;
}

export interface Stats {
  participantCount: number;
  totalPrizes: number;
  wonPrizes: number;
  remainingPrizes: number;
  rarityRates: {
    common: number;
    rare: number;
    legendary: number;
    epic: number;
  };
}
