export enum MaterialType {
  Wood = 'wood',
  Metal = 'metal',
  Ceramic = 'ceramic',
  Plastic = 'plastic',
}

export enum PropertyType {
  Strength = 'strength',
  Density = 'density',
  ThermalConductivity = 'thermalConductivity',
  Flexibility = 'flexibility',
  Cost = 'cost',
}

export interface Ratio {
  material: MaterialType;
  value: number;
}

export interface PropertyValue {
  type: PropertyType;
  value: number;
  label: string;
}

export interface RecipeData {
  id: string;
  name: string;
  ratios: Ratio[];
  properties: PropertyValue[];
  favorited: boolean;
  createdAt: number;
}

export interface RadarPoint {
  x: number;
  y: number;
  value: number;
  label: string;
}

export const MATERIAL_CONFIG: Record<
  MaterialType,
  { label: string; color: string }
> = {
  [MaterialType.Wood]: { label: '木材', color: '#A68B64' },
  [MaterialType.Metal]: { label: '金属', color: '#6C7A89' },
  [MaterialType.Ceramic]: { label: '陶瓷', color: '#E67E22' },
  [MaterialType.Plastic]: { label: '塑料', color: '#3498DB' },
};

export const PROPERTY_CONFIG: Record<
  PropertyType,
  { label: string; color: string }
> = {
  [PropertyType.Strength]: { label: '强度', color: '#E74C3C' },
  [PropertyType.Density]: { label: '密度', color: '#9B59B6' },
  [PropertyType.ThermalConductivity]: { label: '导热性', color: '#F39C12' },
  [PropertyType.Flexibility]: { label: '柔韧性', color: '#2ECC71' },
  [PropertyType.Cost]: { label: '成本', color: '#3498DB' },
};

export const BASE_PROPERTIES: Record<
  MaterialType,
  Record<PropertyType, number>
> = {
  [MaterialType.Wood]: {
    [PropertyType.Strength]: 40,
    [PropertyType.Density]: 35,
    [PropertyType.ThermalConductivity]: 15,
    [PropertyType.Flexibility]: 55,
    [PropertyType.Cost]: 25,
  },
  [MaterialType.Metal]: {
    [PropertyType.Strength]: 90,
    [PropertyType.Density]: 95,
    [PropertyType.ThermalConductivity]: 85,
    [PropertyType.Flexibility]: 15,
    [PropertyType.Cost]: 70,
  },
  [MaterialType.Ceramic]: {
    [PropertyType.Strength]: 75,
    [PropertyType.Density]: 60,
    [PropertyType.ThermalConductivity]: 40,
    [PropertyType.Flexibility]: 5,
    [PropertyType.Cost]: 50,
  },
  [MaterialType.Plastic]: {
    [PropertyType.Strength]: 25,
    [PropertyType.Density]: 15,
    [PropertyType.ThermalConductivity]: 10,
    [PropertyType.Flexibility]: 80,
    [PropertyType.Cost]: 15,
  },
};
