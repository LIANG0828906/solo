export type RoomType = 'living' | 'bedroom' | 'kitchen' | 'study';

export type MaterialCategory = 
  | 'sofa' 
  | 'table' 
  | 'lamp' 
  | 'carpet' 
  | 'decoration'
  | 'bed'
  | 'chair'
  | 'storage';

export interface MaterialItem {
  id: string;
  name: string;
  category: MaterialCategory;
  width: number;
  height: number;
  depth: number;
  colors: string[];
  materials: string[];
  thumbnail: string;
  topViewSvg: string;
  color: string;
}

export interface PlacedItem {
  id: string;
  materialId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
}

export interface RoomLayout {
  type: RoomType;
  name: string;
  width: number;
  height: number;
  walls: { x: number; y: number; width: number; height: number }[];
  doors: { x: number; y: number; width: number; height: number }[];
  windows: { x: number; y: number; width: number; height: number }[];
}

export interface FloorPlan {
  id: string;
  name: string;
  roomType: RoomType;
  layout: RoomLayout;
  placedItems: PlacedItem[];
  createdAt: number;
  updatedAt: number;
}

export interface InspirationEntry {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  floorPlan: FloorPlan;
  materials: string[];
  createdAt: number;
  updatedAt: number;
}
