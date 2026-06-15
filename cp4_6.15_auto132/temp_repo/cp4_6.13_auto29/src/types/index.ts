export type ElementType = 'fire' | 'water' | 'grass';

export type Rarity = 1 | 2 | 3;

export interface PetEgg {
  id: string;
  element: ElementType;
  rarity: Rarity;
  name: string;
  hatchTime: number;
}

export interface Pet {
  id: string;
  name: string;
  element: ElementType;
  rarity: Rarity;
  mood: number;
  skill: string;
  hatchTime: number;
}

export interface HatchParams {
  eggId: string;
  element: ElementType;
  rarity: Rarity;
  temperature: number;
  humidity: number;
}

export interface HatchProgress {
  progress: number;
  eggId: string;
}

export interface HatchResult {
  success: boolean;
  pet?: Pet;
  eggId: string;
}

export interface LogEntry {
  id: string;
  time: string;
  message: string;
}

export type WorkerMessage =
  | { type: 'start'; params: HatchParams }
  | { type: 'stop' }
  | { type: 'progress'; data: HatchProgress }
  | { type: 'complete'; data: HatchResult };
