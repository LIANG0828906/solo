export type EquipmentType = 'tool' | 'medical' | 'food' | 'communication';

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  weight: number;
  durability: number;
  icon: string;
  description: string;
}

export type Difficulty = 1 | 2 | 3;

export interface Mission {
  id: string;
  name: string;
  difficulty: Difficulty;
  requiredTypes: EquipmentType[];
  description: string;
  terrain: string;
}

export interface ExpeditionResult {
  success: boolean;
  message: string;
  rewards: string[];
  losses: string[];
  survivalRate: number;
  events: string[];
}

export type PackSlot = Equipment | null;

export interface GameStoreState {
  equipmentList: Equipment[];
  missions: Mission[];
  packSlots: PackSlot[];
  totalWeight: number;
  currentResult: ExpeditionResult | null;
  isExpediting: boolean;
  isOverweight: boolean;
  maxWeight: number;
  maxSlots: number;
}

export interface GameStoreActions {
  addEquipmentToPack: (equipment: Equipment) => boolean;
  removeEquipmentFromPack: (slotIndex: number) => void;
  generateNewMission: () => void;
  startExpedition: () => void;
  setExpeditionResult: (result: ExpeditionResult) => void;
  clearResult: () => void;
  setOverweight: (overweight: boolean) => void;
  clearPack: () => void;
}

export type GameStore = GameStoreState & GameStoreActions;
