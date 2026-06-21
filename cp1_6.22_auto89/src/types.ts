export enum BuildingType {
  RESIDENTIAL = 'residential',
  OFFICE = 'office',
  HOTEL = 'hotel',
  TV_TOWER = 'tv_tower',
  CHURCH = 'church',
  MONUMENT = 'monument'
}

export interface BuildingParams {
  id: string;
  type: BuildingType;
  position: { x: number; y: number; z: number };
  size: { w: number; h: number; d: number };
  rotationY: number;
  color: string;
}

export interface SceneState {
  buildings: BuildingParams[];
  selectedId: string | null;
  timeOfDay: number;
}

export type HistoryActionType = 'add' | 'remove' | 'modify' | 'duplicate';

export interface HistoryAction {
  type: HistoryActionType;
  before?: BuildingParams;
  after?: BuildingParams;
}

export interface BuildingTypeInfo {
  type: BuildingType;
  name: string;
  icon: string;
}

export const MORANDI_COLORS: string[] = [
  '#E8E4DE',
  '#D4C5B5',
  '#B8B5A8',
  '#A8B5A0',
  '#9BB0C1',
  '#C4B7A6',
  '#D4A5A5',
  '#E5C4C4',
  '#C9B1D4',
  '#F0D9B5',
  '#B8C9D4',
  '#D4C9B0'
];

export const BUILDING_TYPE_INFO: BuildingTypeInfo[] = [
  { type: BuildingType.RESIDENTIAL, name: '住宅楼', icon: '🏠' },
  { type: BuildingType.OFFICE, name: '写字楼', icon: '🏢' },
  { type: BuildingType.HOTEL, name: '酒店', icon: '🏨' },
  { type: BuildingType.TV_TOWER, name: '电视塔', icon: '🗼' },
  { type: BuildingType.CHURCH, name: '教堂', icon: '⛪' },
  { type: BuildingType.MONUMENT, name: '纪念碑', icon: '🗿' }
];
