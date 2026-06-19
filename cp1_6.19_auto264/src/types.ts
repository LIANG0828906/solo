export interface Plant {
  id: string;
  userId: string;
  name: string;
  variety: string;
  difficulty: number;
  habits: string;
  image?: string;
  status: 'available' | 'pending' | 'exchanged';
  createdAt: string;
  ownerName: string;
}

export interface ExchangeRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromPlantId: string;
  toPlantId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'exchanged';
  createdAt: string;
  exchangedAt?: string;
  fromPlantName?: string;
  toPlantName?: string;
  fromOwnerName?: string;
  toOwnerName?: string;
}

export interface DiaryEntry {
  id: string;
  plantId: string;
  userId: string;
  type: 'watering' | 'fertilizing' | 'pruning' | 'repotting';
  note: string;
  date: string;
  growthValue: number;
}

export interface User {
  id: string;
  name: string;
}
