export interface Fabric {
  id: number;
  name: string;
  color: string;
  colorCode: string;
  pattern: string;
  gradient: string;
  pricePerMeter: number;
  stockMeters: number;
  width: number;
  description: string;
  createdAt: string;
}

export interface LayoutCell {
  fabricId: number | null;
}

export interface FabricUsage {
  fabricId: number;
  cellCount: number;
  areaM2: number;
  cost: number;
}

export interface Project {
  id: number;
  name: string;
  widthCm: number;
  heightCm: number;
  gridCols: number;
  gridRows: number;
  layout: LayoutCell[];
  userId: number;
  totalCost: number;
  fabricUsage: FabricUsage[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'customer';
  displayName: string;
  avatarColor: string;
}

export type ColorFilter = 'all' | '红' | '蓝' | '绿' | '黄' | '紫' | '白' | '黑';
export type PatternFilter = 'all' | '纯色' | '条纹' | '碎花' | '格纹' | '几何';
