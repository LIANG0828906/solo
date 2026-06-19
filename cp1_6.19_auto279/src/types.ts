export type PartCategory = 'weapon' | 'shield' | 'engine';

export interface Part {
  id: string;
  name: string;
  category: PartCategory;
  value: number;
  icon: string;
  description?: string;
}

export type SlotType = 'weapon' | 'shield' | 'engine';

export interface Slot {
  id: string;
  type: SlotType;
  x: number;
  y: number;
  part: Part | null;
}

export interface Battleship {
  id: string;
  name: string;
  type: 'scout' | 'frigate' | 'battleship' | 'carrier';
  slots: Slot[];
  firepower: number;
  shield: number;
  speed: number;
}

export interface Fleet {
  id: string;
  name: string;
  ships: Battleship[];
  powerRating: number;
}

export type MissionType = 'patrol' | 'expedition' | 'defense';

export interface MissionLog {
  id: string;
  missionType: MissionType;
  fleetName: string;
  success: boolean;
  timestamp: number;
}

export interface GameState {
  currentShip: Battleship;
  fleets: Fleet[];
  missionLogs: MissionLog[];
  availableParts: Part[];
  draggedPart: Part | null;
  setDraggedPart: (part: Part | null) => void;
  placePart: (slotId: string, part: Part) => void;
  removePart: (slotId: string) => void;
  calculateStats: (slots: Slot[]) => { firepower: number; shield: number; speed: number };
  saveFleet: (name: string) => { success: boolean; message?: string };
  deleteFleet: (fleetId: string) => void;
  executeMission: (fleetId: string, missionType: MissionType) => void;
  resetCurrentShip: () => void;
}
