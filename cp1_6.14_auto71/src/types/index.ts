export interface Pet {
  id: string;
  name: string;
  breed: string;
  gender: 'male' | 'female';
  age: number;
  avatar: string;
  species: 'dog' | 'cat' | 'other';
  birthday?: string;
  weight?: number;
}

export type RecordType = 'feeding' | 'walking' | 'sleep' | 'other';

export interface FeedingRecord {
  food: string;
  grams: number;
  time: string;
}

export interface WalkingRecord {
  startTime: string;
  duration: number;
  route: string;
}

export interface SleepRecord {
  duration: number;
  note: string;
}

export interface PetRecord {
  id: string;
  type: RecordType;
  date: string;
