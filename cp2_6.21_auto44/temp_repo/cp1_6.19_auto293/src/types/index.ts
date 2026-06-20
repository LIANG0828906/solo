export type SeedType = 'normal' | 'rare' | 'magic';

export interface Seed {
  type: SeedType;
  count: number;
  value: number;
  color: string;
  name: string;
}

export type CropState = 'empty' | 'sprout' | 'growing' | 'mature';

export interface FarmCell {
  state: CropState;
  seedType: SeedType | null;
  plantedAt: number;
}

export type RoomType = 'empty' | 'enemy' | 'chest' | 'start';

export interface DungeonRoom {
  type: RoomType;
  visited: boolean;
  cleared: boolean;
}

export interface Enemy {
  type: string;
  hp: number;
  maxHp: number;
  attack: number;
  color: string;
}

export type GameView = 'farm' | 'dungeon' | 'battle';

export interface PlayerPosition {
  x: number;
  y: number;
}
