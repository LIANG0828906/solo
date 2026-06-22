export enum MechanismType {
  PressurePlate = 'PressurePlate',
  LaserEmitter = 'LaserEmitter',
  MovingPlatform = 'MovingPlatform',
  Portal = 'Portal',
}

export enum TriggerType {
  Continuous = 'Continuous',
  Pulse = 'Pulse',
}

export interface MechanismProp {
  id: string;
  type: MechanismType;
  position: [number, number, number];
  rotation: [number, number, number];
  activated: boolean;
  name: string;
  pressureThreshold: number;
  laserColor: string;
  laserRadius: number;
  moveAxis: 'x' | 'y' | 'z';
  moveRange: number;
  moveSpeed: number;
  portalTarget: [number, number, number];
  currentOffset: number;
}

export interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  triggerType: TriggerType;
}

export interface TriggerHistoryEntry {
  propId: string;
  timestamp: number;
}

export interface GameState {
  propStates: Record<string, { activated: boolean; currentOffset: number }>;
  playerPosition: [number, number, number];
  triggerHistory: TriggerHistoryEntry[];
}

export type EditorMode = 'editor' | 'run';

export const MECHANISM_COLORS: Record<MechanismType, { inactive: string; active: string }> = {
  [MechanismType.PressurePlate]: { inactive: '#555555', active: '#4488ff' },
  [MechanismType.LaserEmitter]: { inactive: '#555555', active: '#ff4444' },
  [MechanismType.MovingPlatform]: { inactive: '#555555', active: '#44ff44' },
  [MechanismType.Portal]: { inactive: '#555555', active: '#aa44ff' },
};

export const MECHANISM_LABELS: Record<MechanismType, string> = {
  [MechanismType.PressurePlate]: '压力板',
  [MechanismType.LaserEmitter]: '激光发射器',
  [MechanismType.MovingPlatform]: '移动平台',
  [MechanismType.Portal]: '传送门',
};

export function createDefaultProp(type: MechanismType, id: string): MechanismProp {
  return {
    id,
    type,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    activated: false,
    name: `${MECHANISM_LABELS[type]}_${id.slice(0, 4)}`,
    pressureThreshold: 1,
    laserColor: '#ff0000',
    laserRadius: 0.5,
    moveAxis: 'y',
    moveRange: 3,
    moveSpeed: 1,
    portalTarget: [0, 0, 0],
    currentOffset: 0,
  };
}
