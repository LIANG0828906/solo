export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type LightRequirement = 'low' | 'medium' | 'high';
export type WaterFrequency = 'daily' | 'everyOtherDay' | 'weekly';
export type PlantStatus = 'available' | 'adopted';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Plant {
  id: string;
  name: string;
  latinName: string;
  difficulty: Difficulty;
  lightRequirement: LightRequirement;
  waterFrequency: WaterFrequency;
  description: string;
  photos: string[];
  status: PlantStatus;
  ownerId: string;
  ownerNickname: string;
  createdAt: string;
}

export interface GrowthRecord {
  id: string;
  plantId: string;
  date: string;
  description: string;
  photo?: string;
}

export interface AdoptionRequest {
  id: string;
  plantId: string;
  plantName: string;
  plantPhoto?: string;
  applicantId: string;
  applicantNickname: string;
  status: RequestStatus;
  createdAt: string;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
}

export type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';
