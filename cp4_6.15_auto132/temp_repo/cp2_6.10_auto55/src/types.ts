export enum UnitType {
  CHARIOT = "chariot",
  INFANTRY = "infantry",
  ARCHER = "archer",
  CAVALRY = "cavalry",
}

export enum FormationType {
  SQUARE = "square",
  GOOSE = "goose",
  ARROW = "arrow",
}

export enum UnitState {
  IDLE = "idle",
  MOVING = "moving",
  ATTACKING = "attacking",
}

export interface Unit {
  id: string;
  type: UnitType;
  x: number;
  z: number;
  targetX?: number;
  targetZ?: number;
  rotation: number;
  state: UnitState;
  isInRiver: boolean;
  isFlashing: boolean;
}

export interface RecordFrame {
  timestamp: number;
  units: Array<{
    id: string;
    x: number;
    z: number;
    rotation: number;
    state: UnitState;
  }>;
}

export interface FormationPosition {
  type: UnitType;
  x: number;
  z: number;
}

export const UNIT_COLORS: Record<UnitType, string> = {
  [UnitType.CHARIOT]: "#6b4e3a",
  [UnitType.INFANTRY]: "#4a4a4a",
  [UnitType.ARCHER]: "#4a5a3a",
  [UnitType.CAVALRY]: "#8b4a2a",
};

export const UNIT_NAMES: Record<UnitType, string> = {
  [UnitType.CHARIOT]: "战车",
  [UnitType.INFANTRY]: "步兵",
  [UnitType.ARCHER]: "弓弩手",
  [UnitType.CAVALRY]: "骑兵",
};

export const FORMATION_NAMES: Record<FormationType, string> = {
  [FormationType.SQUARE]: "方圆阵",
  [FormationType.GOOSE]: "雁行阵",
  [FormationType.ARROW]: "锋矢阵",
};

export const UNIT_COUNTS: Record<UnitType, number> = {
  [UnitType.CHARIOT]: 8,
  [UnitType.INFANTRY]: 12,
  [UnitType.ARCHER]: 6,
  [UnitType.CAVALRY]: 4,
};
