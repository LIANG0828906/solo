export type EnergyLevel = 'A' | 'B' | 'C' | 'D' | 'E';

export type SchemeType = 'box' | 'streamline' | 'terraced';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface Building {
  id: string;
  name: string;
  floors: number;
  position: Position;
  dimensions: Dimensions;
  energyLevel: EnergyLevel;
  energyConsumption: number;
  occlusionRelations: string[];
}

export interface SolarResult {
  buildingId: string;
  sunIntensity: number;
  daylightHours: number;
  surfaceBrightness: Record<'east' | 'west' | 'south' | 'north' | 'top', number>;
}

export interface BuildingScheme {
  name: string;
  buildings: Building[];
}

export interface RawBuildingData {
  id: string;
  name: string;
  floors: number;
  position: [number, number, number];
  dimensions: [number, number, number];
  energyLevel: EnergyLevel;
  energyConsumption: number;
  occlusionRelations: string[];
}

const ENERGY_CONSUMPTION_TABLE: Record<EnergyLevel, number> = {
  A: 45,
  B: 80,
  C: 120,
  D: 180,
  E: 260,
};

export function getEnergyColor(level: EnergyLevel): string {
  const colors: Record<EnergyLevel, string> = {
    A: '#00E676',
    B: '#7CFC00',
    C: '#FFEB3B',
    D: '#FF9800',
    E: '#FF5252',
  };
  return colors[level];
}

export function transformAPIData(rawData: RawBuildingData[]): Building[] {
  return rawData.map((raw) => ({
    id: raw.id,
    name: raw.name,
    floors: raw.floors,
    position: {
      x: raw.position[0],
      y: raw.position[1],
      z: raw.position[2],
    },
    dimensions: {
      width: raw.dimensions[0],
      height: raw.dimensions[1],
      depth: raw.dimensions[2],
    },
    energyLevel: raw.energyLevel,
    energyConsumption: raw.energyConsumption ?? ENERGY_CONSUMPTION_TABLE[raw.energyLevel] * raw.floors,
    occlusionRelations: raw.occlusionRelations ?? [],
  }));
}

export function getBuildingById(buildings: Building[], id: string): Building | undefined {
  return buildings.find((b) => b.id === id);
}

function generateRandomEnergyLevel(): EnergyLevel {
  const levels: EnergyLevel[] = ['A', 'B', 'C', 'D', 'E'];
  const weights = [0.15, 0.25, 0.3, 0.2, 0.1];
  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < levels.length; i++) {
    sum += weights[i];
    if (r <= sum) return levels[i];
  }
  return 'C';
}

const BUILDING_NAMES = [
  '晨曦大厦', '星河湾', '云顶阁', '翡翠中心', '鎏金塔',
  '智慧立方', '未来之光', '绿洲广场', '晴空塔', '蔚蓝之城',
  '逸景轩', '汇金中心', '博雅楼', '和谐家园', '时代广场',
];

function createBoxScheme(): Building[] {
  const data: RawBuildingData[] = [];
  const positions: Array<[number, number]> = [
    [-7, -5], [-3, -6], [2, -7], [6, -4],
    [-8, 0], [-2, -1], [3, 1], [7, -1],
    [-6, 5], [-1, 6], [5, 7], [8, 4],
  ];
  for (let i = 0; i < 12; i++) {
    const level = generateRandomEnergyLevel();
    const height = 3 + Math.floor(Math.random() * 8);
    const [px, pz] = positions[i];
    data.push({
      id: `box-${i + 1}`,
      name: BUILDING_NAMES[i],
      floors: height,
      position: [px, height / 2, pz],
      dimensions: [1.6 + Math.random() * 0.6, height, 1.6 + Math.random() * 0.6],
      energyLevel: level,
      energyConsumption: ENERGY_CONSUMPTION_TABLE[level] * height,
      occlusionRelations: [],
    });
  }
  return transformAPIData(data);
}

function createStreamlineScheme(): Building[] {
  const data: RawBuildingData[] = [];
  const curveCenters: Array<[number, number, number]> = [
    [-6, 0, -6], [-2, 0, -3], [2, 0, -5], [6, 0, -2],
    [-7, 0, 1], [-1, 0, 2], [4, 0, 0], [8, 0, 3],
    [-5, 0, 6], [0, 0, 7], [5, 0, 5], [9, 0, 7],
  ];
  for (let i = 0; i < 12; i++) {
    const level = generateRandomEnergyLevel();
    const base = 2 + (i % 4) * 1.5;
    const height = base + Math.floor(Math.random() * 3);
    const [px, , pz] = curveCenters[i];
    data.push({
      id: `stream-${i + 1}`,
      name: BUILDING_NAMES[(i + 4) % 15],
      floors: Math.round(height),
      position: [px, height / 2, pz],
      dimensions: [1.2 + Math.random() * 0.4, height, 2.2 + Math.random() * 0.8],
      energyLevel: level,
      energyConsumption: ENERGY_CONSUMPTION_TABLE[level] * Math.round(height),
      occlusionRelations: [],
    });
  }
  return transformAPIData(data);
}

function createTerracedScheme(): Building[] {
  const data: RawBuildingData[] = [];
  const centerPoints: Array<[number, number]> = [
    [0, -6], [-4, -3], [4, -3],
    [-7, 1], [0, 0], [7, 1],
    [-4, 4], [4, 4],
    [-8, 6], [0, 7], [8, 6],
    [0, 3],
  ];
  for (let i = 0; i < 12; i++) {
    const level = generateRandomEnergyLevel();
    const distFromCenter = Math.sqrt(centerPoints[i][0] ** 2 + centerPoints[i][1] ** 2);
    const baseH = Math.max(2, 10 - distFromCenter * 0.8);
    const height = Math.max(2, baseH + (Math.random() - 0.5) * 2);
    const [px, pz] = centerPoints[i];
    data.push({
      id: `terr-${i + 1}`,
      name: BUILDING_NAMES[(i + 8) % 15],
      floors: Math.round(height),
      position: [px, height / 2, pz],
      dimensions: [1.8 + Math.random() * 0.8, height, 1.8 + Math.random() * 0.8],
      energyLevel: level,
      energyConsumption: ENERGY_CONSUMPTION_TABLE[level] * Math.round(height),
      occlusionRelations: [],
    });
  }
  return transformAPIData(data);
}

export const BUILDING_SCHEMES: Record<SchemeType, BuildingScheme> = {
  box: { name: '方盒式', buildings: createBoxScheme() },
  streamline: { name: '流线式', buildings: createStreamlineScheme() },
  terraced: { name: '阶梯式', buildings: createTerracedScheme() },
};
