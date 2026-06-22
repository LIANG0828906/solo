import type { SchemeData, Building, PublicFacility, GreenArea, BuildingType } from '../types';
import { BUILDING_COLORS } from '../types';

const MAX_BUILDINGS = 150;
const MAX_FACILITIES = 20;

function createBuilding(
  id: string,
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
  type: BuildingType
): Building {
  return {
    id,
    position: [x, height / 2, z],
    size: [width, height, depth],
    color: BUILDING_COLORS[type],
    type,
  };
}

function createFacility(
  id: string,
  type: 'school' | 'hospital' | 'culture',
  x: number,
  z: number,
  name: string,
  area: number
): PublicFacility {
  return {
    id,
    type,
    position: [x, 0.5, z],
    name,
    area,
  };
}

const beforeBuildings: Building[] = (() => {
  const buildings: Building[] = [];
  let id = 0;
  for (let row = 0; row < 8 && buildings.length < MAX_BUILDINGS; row++) {
    for (let col = 0; col < 10 && buildings.length < MAX_BUILDINGS; col++) {
      const x = -18 + col * 4 + (Math.random() - 0.5) * 0.5;
      const z = -14 + row * 3.5 + (Math.random() - 0.5) * 0.5;
      const w = 2 + Math.random() * 1.5;
      const d = 2 + Math.random() * 1;
      const h = 2 + Math.random() * 4;
      buildings.push(createBuilding(`b-${id++}`, x, z, w, d, h, 'industrial'));
    }
  }
  return buildings;
})();

const beforeFacilities: PublicFacility[] = [
  createFacility('f-1', 'school', -10, 8, '旧厂区子弟小学', 800),
];

const beforeGreenAreas: GreenArea[] = [
  {
    boundary: [[12, -12], [18, -12], [18, 12], [12, 12]],
    coverageRate: 0.05,
  },
];

const schemeABuildings: Building[] = (() => {
  const buildings: Building[] = [];
  let id = 0;
  for (let row = 0; row < 6 && buildings.length < MAX_BUILDINGS; row++) {
    for (let col = 0; col < 8 && buildings.length < MAX_BUILDINGS; col++) {
      const x = -16 + col * 4.2;
      const z = -12 + row * 4;
      const w = 2.5;
      const d = 2.5;
      const h = 6 + Math.random() * 6;
      buildings.push(createBuilding(`a-${id++}`, x, z, w, d, h, 'residential'));
    }
  }
  for (let i = 0; i < 6 && buildings.length < MAX_BUILDINGS; i++) {
    buildings.push(
      createBuilding(`a-com-${id++}`, 8 + i * 0.1, -8 + i * 2.5, 4, 3, 10 + i, 'commercial')
    );
  }
  return buildings;
})();

const schemeAFacilities: PublicFacility[] = [
  createFacility('fa-1', 'school', -10, 10, '新城第一小学', 2500),
  createFacility('fa-2', 'hospital', 10, -10, '社区医院', 1800),
  createFacility('fa-3', 'culture', 0, 12, '文化活动中心', 3200),
];

const schemeAGreenAreas: GreenArea[] = [
  {
    boundary: [[-20, -18], [-8, -18], [-8, -8], [-20, -8]],
    coverageRate: 0.6,
  },
  {
    boundary: [[12, -12], [20, -12], [20, 12], [12, 12]],
    coverageRate: 0.7,
  },
  {
    boundary: [[-4, 4], [4, 4], [4, -4], [-4, -4]],
    coverageRate: 0.8,
  },
];

const schemeBBuildings: Building[] = (() => {
  const buildings: Building[] = [];
  let id = 0;
  for (let row = 0; row < 5 && buildings.length < MAX_BUILDINGS; row++) {
    for (let col = 0; col < 10 && buildings.length < MAX_BUILDINGS; col++) {
      const x = -18 + col * 3.8;
      const z = -10 + row * 4.2;
      const w = 2.2;
      const d = 2.8;
      const h = 4 + Math.random() * 8;
      const type: BuildingType = col < 5 ? 'residential' : 'commercial';
      buildings.push(createBuilding(`b-${id++}`, x, z, w, d, h, type));
    }
  }
  buildings.push(createBuilding(`b-fac-${id++}`, -14, 10, 5, 5, 4, 'facility'));
  buildings.push(createBuilding(`b-fac-${id++}`, 14, 10, 5, 5, 4, 'facility'));
  return buildings;
})();

const schemeBFacilities: PublicFacility[] = [
  createFacility('fb-1', 'school', -14, 10, '国际双语学校', 4000),
  createFacility('fb-2', 'hospital', 14, 10, '综合医疗中心', 5500),
  createFacility('fb-3', 'culture', -14, -14, '艺术博物馆', 3500),
  createFacility('fb-4', 'culture', 14, -14, '科技展览馆', 3000),
];

const schemeBGreenAreas: GreenArea[] = [
  {
    boundary: [[-22, -20], [22, -20], [22, -16], [-22, -16]],
    coverageRate: 0.85,
  },
  {
    boundary: [[-22, 16], [22, 16], [22, 20], [-22, 20]],
    coverageRate: 0.85,
  },
  {
    boundary: [[-6, -10], [6, -10], [6, 10], [-6, 10]],
    coverageRate: 0.9,
  },
  {
    boundary: [[-22, -6], [-16, -6], [-16, 6], [-22, 6]],
    coverageRate: 0.6,
  },
  {
    boundary: [[16, -6], [22, -6], [22, 6], [16, 6]],
    coverageRate: 0.6,
  },
];

const schemes: SchemeData[] = [
  {
    name: '改造前',
    buildings: beforeBuildings.slice(0, MAX_BUILDINGS),
    facilities: beforeFacilities.slice(0, MAX_FACILITIES),
    greenAreas: beforeGreenAreas,
  },
  {
    name: '方案A',
    buildings: schemeABuildings.slice(0, MAX_BUILDINGS),
    facilities: schemeAFacilities.slice(0, MAX_FACILITIES),
    greenAreas: schemeAGreenAreas,
  },
  {
    name: '方案B',
    buildings: schemeBBuildings.slice(0, MAX_BUILDINGS),
    facilities: schemeBFacilities.slice(0, MAX_FACILITIES),
    greenAreas: schemeBGreenAreas,
  },
];

export function getSchemeCount(): number {
  return schemes.length;
}

export function getScheme(index: number): SchemeData {
  const clamped = Math.max(0, Math.min(index, schemes.length - 1));
  return schemes[clamped];
}

export function getSchemeName(index: number): string {
  return getScheme(index).name;
}

export function getAllSchemeNames(): string[] {
  return schemes.map((s) => s.name);
}
