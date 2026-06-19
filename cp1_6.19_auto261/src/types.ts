export type FurnitureType = 'sofa' | 'coffeeTable' | 'floorLamp' | 'chandelier' | 'bookshelf' | 'carpet';

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface LightParams {
  brightness: number;
  colorTemp: number;
  angle: number;
  on: boolean;
}

export interface LightState {
  [furnitureId: string]: LightParams;
}

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  thumbnail: string;
  state: {
    furniture: FurnitureItem[];
    lights: LightState;
    camera: {
      position: { x: number; y: number; z: number };
      target: { x: number; y: number; z: number };
    };
  };
}

export const FURNITURE_CATALOG: { type: FurnitureType; name: string; color: string; isLight: boolean; defaultSize: { w: number; h: number; d: number } }[] = [
  { type: 'sofa', name: '沙发', color: '#B0C4DE', isLight: false, defaultSize: { w: 100, h: 40, d: 50 } },
  { type: 'coffeeTable', name: '茶几', color: '#D2B48C', isLight: false, defaultSize: { w: 60, h: 25, d: 40 } },
  { type: 'floorLamp', name: '落地灯', color: '#8B7355', isLight: true, defaultSize: { w: 15, h: 120, d: 15 } },
  { type: 'chandelier', name: '吊灯', color: '#C0C0C0', isLight: true, defaultSize: { w: 40, h: 30, d: 40 } },
  { type: 'bookshelf', name: '书架', color: '#A0522D', isLight: false, defaultSize: { w: 80, h: 150, d: 25 } },
  { type: 'carpet', name: '地毯', color: '#DEB887', isLight: false, defaultSize: { w: 150, h: 2, d: 100 } },
];

export const ROOM_SIZE = { width: 500, height: 300, depth: 500 };
