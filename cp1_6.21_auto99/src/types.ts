export interface Room {
  id: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  furniture: FurnitureDef[];
}

export interface FurnitureDef {
  id: string;
  type: 'sofa' | 'bed' | 'cabinet';
  position: [number, number, number];
  size: [number, number, number];
}

export interface WallConfig {
  type: 'paint' | 'wallpaper';
  color: string;
  patternIndex?: number;
}

export interface FloorConfig {
  type: 'tile' | 'wood';
  color: string;
}

export interface FurnitureConfig {
  type: 'solid-wood' | 'metal' | 'fabric';
  color: string;
}

export interface MaterialConfig {
  wall: WallConfig;
  floor: FloorConfig;
  furniture: FurnitureConfig;
}

export interface MaterialListItem {
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface MaterialList {
  items: MaterialListItem[];
  total: number;
}

export interface SaveRecord {
  id: string;
  roomId: string;
  roomName: string;
  config: MaterialConfig;
  list: MaterialList;
  savedAt: string;
  totalPrice: number;
}

export interface CalculateRequest {
  roomId: string;
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  furnitureCount: number;
  config: MaterialConfig;
}

export interface SaveRequest {
  roomId: string;
  roomName: string;
  config: MaterialConfig;
  list: MaterialList;
}
