export type BuildingType = 'industrial' | 'residential' | 'commercial' | 'facility';

export type FacilityType = 'school' | 'hospital' | 'culture';

export interface Building {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  type: BuildingType;
}

export interface PublicFacility {
  id: string;
  type: FacilityType;
  position: [number, number, number];
  name: string;
  area: number;
}

export interface GreenArea {
  boundary: [number, number][];
  coverageRate: number;
}

export interface TreeData {
  position: [number, number, number];
  height: number;
  crownRadius: number;
}

export interface SchemeData {
  name: string;
  buildings: Building[];
  facilities: PublicFacility[];
  greenAreas: GreenArea[];
}

export const BUILDING_COLORS: Record<BuildingType, string> = {
  industrial: '#B22222',
  residential: '#F5DEB3',
  commercial: '#87CEEB',
  facility: '#DDA0DD',
};

export const BUILDING_LABELS: Record<BuildingType, string> = {
  industrial: '工业建筑',
  residential: '住宅',
  commercial: '商业',
  facility: '公共设施',
};

export const FACILITY_COLORS: Record<FacilityType, string> = {
  school: '#4169E1',
  hospital: '#DC143C',
  culture: '#FFD700',
};

export const FACILITY_LABELS: Record<FacilityType, string> = {
  school: '学校',
  hospital: '医院',
  culture: '文化中心',
};
