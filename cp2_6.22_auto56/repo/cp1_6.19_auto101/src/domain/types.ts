export enum CellType {
  NORMAL = 'normal',
  ENTRANCE = 'entrance',
  EXIT = 'exit',
  MONSTER = 'monster',
  TREASURE = 'treasure',
  EVENT = 'event',
}

export interface Cell {
  x: number;
  y: number;
  type: CellType;
  revealed: boolean;
  monsterId?: string;
}

export interface MapData {
  cells: Cell[][];
  width: number;
  height: number;
}

export interface MonsterData {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  icon: string;
}

export interface TreasureItem {
  name: string;
  type: string;
  attackBonus?: number;
  defenseBonus?: number;
  hpRestore?: number;
  icon: string;
}

export interface EventChoice {
  text: string;
  hpChange: number;
}

export interface EventResult {
  type: 'trap' | 'chest' | 'npc';
  description: string;
  hpChange: number;
  itemFound?: string;
  choices?: EventChoice[];
}
